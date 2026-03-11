import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Tables, InsertTables } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ExtractedSignature {
  lineNumber: number;
  name: string;
  address: string;
  date: string | null;
}

/**
 * Call Gemini 3.1 Flash Lite Preview to extract signatures from a petition sheet image.
 * Returns structured JSON with name, address, date for each signature line.
 */
async function extractSignaturesWithGemini(
  imageBuffer: Buffer,
  mimeType: string
): Promise<{ signatures: ExtractedSignature[]; rawText: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const base64Image = imageBuffer.toString("base64");

  const requestBody = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image,
            },
          },
          {
            text: `You are an expert at reading petition sheets and extracting signature data. Analyze this petition sheet image and extract every signature entry you can find.

For each signature line, extract:
- lineNumber: the line/row number on the sheet
- name: the signer's printed name (best guess from handwriting)
- address: the signer's address
- date: the date signed (MM/DD/YYYY format if visible, or null)

Return ONLY valid JSON in this exact format, no markdown, no code fences:
{"signatures":[{"lineNumber":1,"name":"John Smith","address":"123 Main St, Springfield, IL","date":"03/01/2026"}],"rawText":"<paste the raw text you can read from the image here>"}

If the image is blank, unreadable, or not a petition sheet, return:
{"signatures":[],"rawText":""}

Be thorough. Extract every line that has any writing, even if partially illegible. For illegible parts, give your best guess with a note like "[illegible]" appended.`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();

  const textContent =
    result?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

  try {
    const parsed = JSON.parse(textContent);
    return {
      signatures: Array.isArray(parsed.signatures) ? parsed.signatures : [],
      rawText: parsed.rawText || "",
    };
  } catch {
    // If Gemini returned non-JSON, try to salvage it
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        signatures: Array.isArray(parsed.signatures) ? parsed.signatures : [],
        rawText: parsed.rawText || "",
      };
    }
    throw new Error("Failed to parse Gemini response as JSON");
  }
}

/**
 * Determine MIME type from file path extension.
 */
function getMimeType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    pdf: "application/pdf",
    tiff: "image/tiff",
    tif: "image/tiff",
    bmp: "image/bmp",
  };
  return mimeMap[ext || ""] || "image/png";
}

export async function POST(request: NextRequest) {
  try {
    let sheetId: string;
    try {
      ({ sheetId } = await request.json());
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

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

    // Convert blob to buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = getMimeType(sheet.file_path);

    // Run OCR via Gemini 3.1 Flash Lite
    let extractedData: { signatures: ExtractedSignature[]; rawText: string };
    try {
      extractedData = await extractSignaturesWithGemini(buffer, mimeType);
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

    // Create signature records in the database
    const signatureInserts: InsertTables<"signatures">[] =
      extractedData.signatures.map((sig) => ({
        project_id: sheet.project_id,
        sheet_id: sheetId as string,
        line_number: sig.lineNumber,
        extracted_name: sig.name,
        extracted_address: sig.address,
        extracted_date: sig.date,
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
          {
            success: false,
            error: `Failed to save signatures: ${insertError.message}`,
          },
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
        ocr_raw_text: extractedData.rawText,
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
        total_signatures: count ?? extractedData.signatures.length,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sheet.project_id);

    return NextResponse.json({
      success: true,
      sheetId,
      rawText: extractedData.rawText,
      extractedCount: extractedData.signatures.length,
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
