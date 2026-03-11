import { NextRequest, NextResponse } from "next/server";
import { createWorker } from "tesseract.js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Tables, InsertTables } from "@/lib/supabase/types";

// Force Node.js runtime (Tesseract.js requires WASM + filesystem access)
export const runtime = "nodejs";
export const maxDuration = 60;

interface ExtractedLine {
  lineNumber: number;
  name: string;
  address: string;
  date: string | null;
}

/**
 * Parse OCR raw text into structured signature lines.
 * Petition sheets typically have numbered lines with name, address, and date columns.
 */
function parseOcrText(rawText: string): ExtractedLine[] {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const extracted: ExtractedLine[] = [];

  const lineNumberPattern = /^(\d{1,2})[.):\s]+(.+)/;
  const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*$/;
  const addressPattern = /(\d+\s+(?:[NSEW]\.?\s+)?[A-Za-z]+(?:\s+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Ln|Lane|Way|Ct|Court|Pl|Place|Cir|Circle|Ter|Terrace|Pk|Pkwy|Parkway|Hwy|Highway)\.?)(?:[,\s]+(?:Apt|Unit|Suite|Ste|#)\s*\w+)?.*)/i;

  let currentLineNumber = 0;

  for (const line of lines) {
    if (line.length < 5) continue;
    if (/^(name|address|date|signature|printed|sign here)/i.test(line)) continue;

    currentLineNumber++;
    let remaining = line;
    let lineNum = currentLineNumber;

    const numMatch = remaining.match(lineNumberPattern);
    if (numMatch) {
      lineNum = parseInt(numMatch[1], 10);
      remaining = numMatch[2].trim();
    }

    let date: string | null = null;
    const dateMatch = remaining.match(datePattern);
    if (dateMatch) {
      date = dateMatch[1];
      remaining = remaining.replace(datePattern, "").trim();
    }

    let name = remaining;
    let address = "";

    const addrMatch = remaining.match(addressPattern);
    if (addrMatch) {
      const addrIndex = remaining.indexOf(addrMatch[1]);
      name = remaining.substring(0, addrIndex).trim();
      address = addrMatch[1].trim();
    } else {
      const parts = remaining.split(/\s{3,}|\t+/);
      if (parts.length >= 2) {
        name = parts[0].trim();
        address = parts.slice(1).join(", ").trim();
      }
    }

    name = name.replace(/[,;]+$/, "").replace(/\s+/g, " ").trim();
    address = address.replace(/[,;]+$/, "").replace(/\s+/g, " ").trim();

    if (name.length >= 2) {
      extracted.push({
        lineNumber: lineNum,
        name,
        address: address || "Unable to extract",
        date,
      });
    }
  }

  return extracted;
}

export async function POST(request: NextRequest) {
  try {
    const { sheetId } = await request.json();

    if (!sheetId) {
      return NextResponse.json(
        { success: false, error: "sheetId is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch the petition sheet
    const { data: sheetData, error: sheetError } = await supabase
      .from("petition_sheets")
      .select("*")
      .eq("id", sheetId)
      .single();

    const sheet = sheetData as Tables<"petition_sheets"> | null;

    if (sheetError || !sheet) {
      return NextResponse.json(
        { success: false, error: "Petition sheet not found" },
        { status: 404 }
      );
    }

    // Update status to processing
    await supabase
      .from("petition_sheets")
      .update({ ocr_status: "processing" as const })
      .eq("id", sheetId);

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("petition-sheets")
      .download(sheet.file_path);

    if (downloadError || !fileData) {
      await supabase
        .from("petition_sheets")
        .update({ ocr_status: "failed" as const })
        .eq("id", sheetId);
      return NextResponse.json(
        { success: false, error: "Failed to download file from storage" },
        { status: 500 }
      );
    }

    // Convert blob to buffer for Tesseract
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Run OCR
    let rawText: string;
    try {
      const worker = await createWorker("eng");
      const {
        data: { text },
      } = await worker.recognize(buffer);
      rawText = text;
      await worker.terminate();
    } catch (ocrError) {
      await supabase
        .from("petition_sheets")
        .update({ ocr_status: "failed" as const })
        .eq("id", sheetId);
      return NextResponse.json(
        {
          success: false,
          error: `OCR processing failed: ${ocrError instanceof Error ? ocrError.message : "Unknown error"}`,
        },
        { status: 500 }
      );
    }

    // Parse the OCR output into structured lines
    const extractedLines = parseOcrText(rawText);

    // Create signature records in the database
    const signatureInserts: InsertTables<"signatures">[] = extractedLines.map((line) => ({
      project_id: sheet.project_id,
      sheet_id: sheetId as string,
      line_number: line.lineNumber,
      extracted_name: line.name,
      extracted_address: line.address,
      extracted_date: line.date,
      status: "pending" as const,
    }));

    let signatures: Tables<"signatures">[] = [];
    if (signatureInserts.length > 0) {
      const { data: insertedSigs, error: insertError } = await supabase
        .from("signatures")
        .insert(signatureInserts)
        .select();

      if (insertError) {
        await supabase
          .from("petition_sheets")
          .update({ ocr_status: "failed" as const })
          .eq("id", sheetId);
        return NextResponse.json(
          { success: false, error: `Failed to save signatures: ${insertError.message}` },
          { status: 500 }
        );
      }
      signatures = (insertedSigs as Tables<"signatures">[]) || [];
    }

    // Update the petition sheet with OCR results
    await supabase
      .from("petition_sheets")
      .update({
        ocr_status: "completed" as const,
        ocr_raw_text: rawText,
      })
      .eq("id", sheetId);

    // Update the project's total_signatures count
    const { count } = await supabase
      .from("signatures")
      .select("*", { count: "exact", head: true })
      .eq("project_id", sheet.project_id);

    await supabase
      .from("projects")
      .update({
        total_signatures: count ?? extractedLines.length,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sheet.project_id);

    return NextResponse.json({
      success: true,
      sheetId,
      rawText,
      extractedCount: extractedLines.length,
      signatures,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: `Unexpected error: ${err instanceof Error ? err.message : "Unknown"}`,
      },
      { status: 500 }
    );
  }
}
