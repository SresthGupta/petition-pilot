import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Tables, InsertTables } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const maxDuration = 30;

// Common column name variations to normalize
const COLUMN_MAP: Record<string, string> = {
  full_name: "full_name",
  fullname: "full_name",
  name: "full_name",
  voter_name: "full_name",
  votername: "full_name",
  "voter name": "full_name",
  "full name": "full_name",
  first_name: "first_name",
  firstname: "first_name",
  "first name": "first_name",
  last_name: "last_name",
  lastname: "last_name",
  "last name": "last_name",
  address: "address",
  street_address: "address",
  streetaddress: "address",
  "street address": "address",
  addr: "address",
  residence_address: "address",
  "residence address": "address",
  city: "city",
  residence_city: "city",
  "residence city": "city",
  state: "state",
  residence_state: "state",
  "residence state": "state",
  st: "state",
  zip: "zip",
  zipcode: "zip",
  zip_code: "zip",
  "zip code": "zip",
  postal_code: "zip",
  "postal code": "zip",
  party: "party",
  party_affiliation: "party",
  "party affiliation": "party",
  political_party: "party",
  "political party": "party",
  registration_date: "registration_date",
  registrationdate: "registration_date",
  "registration date": "registration_date",
  reg_date: "registration_date",
  "reg date": "registration_date",
  date_registered: "registration_date",
  voter_id: "voter_id_number",
  voterid: "voter_id_number",
  voter_id_number: "voter_id_number",
  "voter id": "voter_id_number",
  id_number: "voter_id_number",
};

function normalizeColumnName(col: string): string | null {
  const normalized = col.toLowerCase().trim().replace(/[\s_-]+/g, "_");
  return COLUMN_MAP[normalized] || COLUMN_MAP[col.toLowerCase().trim()] || null;
}

/**
 * Parse an Excel file (.xlsx, .xls) into an array of row objects.
 */
function parseExcelToRows(buffer: ArrayBuffer): Record<string, string>[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) return [];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
    defval: "",
    raw: false,
  });

  // Convert all values to strings
  return rows.map((row) => {
    const stringRow: Record<string, string> = {};
    for (const [key, val] of Object.entries(row)) {
      stringRow[key] = String(val ?? "").trim();
    }
    return stringRow;
  });
}

/**
 * Parse a CSV file into an array of row objects.
 */
function parseCsvToRows(text: string): { rows: Record<string, string>[]; headers: string[] } {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    throw new Error(`CSV parsing failed: ${parsed.errors[0]?.message || "Unknown parse error"}`);
  }

  return { rows: parsed.data, headers: parsed.meta.fields || [] };
}

function isExcelFile(fileName: string): boolean {
  const ext = fileName.toLowerCase().split(".").pop();
  return ext === "xlsx" || ext === "xls" || ext === "xlsb" || ext === "xlsm";
}

export async function POST(request: NextRequest) {
  try {
    let voterFileId: string;
    try {
      ({ voterFileId } = await request.json());
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    if (!voterFileId) {
      return NextResponse.json(
        { success: false, error: "voterFileId is required" },
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

    // Fetch the voter file record
    const { data: vfData, error: fileError } = await supabase
      .from("voter_files")
      .select("*")
      .eq("id", voterFileId)
      .single();

    const voterFile = vfData as Tables<"voter_files"> | null;

    if (fileError || !voterFile) {
      return NextResponse.json(
        { success: false, error: "Voter file not found" },
        { status: 404 }
      );
    }

    // Update status to processing
    await supabase
      .from("voter_files")
      .update({ parsed_status: "processing" as const })
      .eq("id", voterFileId);

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("voter-files")
      .download(voterFile.file_path);

    if (downloadError || !fileData) {
      await supabase
        .from("voter_files")
        .update({ parsed_status: "failed" as const })
        .eq("id", voterFileId);
      return NextResponse.json(
        { success: false, error: "Failed to download file from storage" },
        { status: 500 }
      );
    }

    // Parse the file based on type (Excel or CSV)
    let rows: Record<string, string>[];
    let headers: string[];

    try {
      if (isExcelFile(voterFile.file_name)) {
        const buffer = await fileData.arrayBuffer();
        rows = parseExcelToRows(buffer);
        headers = rows.length > 0 ? Object.keys(rows[0]) : [];
      } else {
        const text = await fileData.text();
        const csvResult = parseCsvToRows(text);
        rows = csvResult.rows;
        headers = csvResult.headers;
      }
    } catch (parseError) {
      await supabase
        .from("voter_files")
        .update({ parsed_status: "failed" as const })
        .eq("id", voterFileId);
      return NextResponse.json(
        {
          success: false,
          error: `File parsing failed: ${parseError instanceof Error ? parseError.message : "Unknown error"}. Supported formats: CSV, XLSX, XLS.`,
        },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      await supabase
        .from("voter_files")
        .update({ parsed_status: "failed" as const })
        .eq("id", voterFileId);
      return NextResponse.json(
        { success: false, error: "File is empty or has no data rows" },
        { status: 400 }
      );
    }

    // Build column mapping from headers
    const columnMapping: Record<string, string> = {};
    for (const header of headers) {
      const mapped = normalizeColumnName(header);
      if (mapped) {
        columnMapping[header] = mapped;
      }
    }

    // Check for first_name + last_name combo (merge into full_name)
    const mappedFields = new Set(Object.values(columnMapping));
    const hasFirstLast = mappedFields.has("first_name") && mappedFields.has("last_name");

    if (!mappedFields.has("full_name") && !hasFirstLast) {
      await supabase
        .from("voter_files")
        .update({ parsed_status: "failed" as const })
        .eq("id", voterFileId);
      return NextResponse.json(
        {
          success: false,
          error: `Could not find a name column. Headers found: ${headers.join(", ")}. Expected one of: name, full_name, voter_name, or first_name + last_name.`,
        },
        { status: 400 }
      );
    }

    // Transform rows into voter records
    const voterInserts: InsertTables<"voters">[] = [];

    for (const row of rows) {
      const mapped: Record<string, string> = {};
      for (const [csvCol, dbCol] of Object.entries(columnMapping)) {
        if (row[csvCol]) {
          mapped[dbCol] = row[csvCol].trim();
        }
      }

      // Handle first_name + last_name -> full_name
      if (!mapped.full_name && mapped.first_name) {
        mapped.full_name = [mapped.first_name, mapped.last_name]
          .filter(Boolean)
          .join(" ");
      }

      if (!mapped.full_name) continue;

      voterInserts.push({
        voter_file_id: voterFileId,
        project_id: voterFile.project_id,
        full_name: mapped.full_name,
        address: mapped.address || "",
        city: mapped.city || null,
        state: mapped.state || null,
        zip: mapped.zip || null,
        party: mapped.party || null,
        registration_date: mapped.registration_date || null,
        voter_id_number: mapped.voter_id_number || null,
      });
    }

    // Insert in batches of 500
    const BATCH_SIZE = 500;
    let totalInserted = 0;

    for (let i = 0; i < voterInserts.length; i += BATCH_SIZE) {
      const batch = voterInserts.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await supabase
        .from("voters")
        .insert(batch);

      if (insertError) {
        await supabase
          .from("voter_files")
          .update({ parsed_status: "failed" as const })
          .eq("id", voterFileId);
        return NextResponse.json(
          {
            success: false,
            error: `Failed to insert voters at batch ${Math.floor(i / BATCH_SIZE) + 1}: ${insertError.message}`,
            insertedSoFar: totalInserted,
          },
          { status: 500 }
        );
      }
      totalInserted += batch.length;
    }

    // Update voter file with results
    await supabase
      .from("voter_files")
      .update({
        record_count: totalInserted,
        parsed_status: "completed" as const,
      })
      .eq("id", voterFileId);

    return NextResponse.json({
      success: true,
      voterFileId,
      recordCount: totalInserted,
      totalRows: rows.length,
      skippedRows: rows.length - totalInserted,
      columnMapping,
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
