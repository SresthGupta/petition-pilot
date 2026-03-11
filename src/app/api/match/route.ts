import { NextRequest, NextResponse } from "next/server";
import Fuse from "fuse.js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";

/**
 * Normalize a name for comparison: lowercase, remove punctuation, collapse whitespace.
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.,\-']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalize an address for comparison: lowercase, expand common abbreviations.
 */
function normalizeAddress(addr: string): string {
  return addr
    .toLowerCase()
    .replace(/\bst\b\.?/g, "street")
    .replace(/\bave\b\.?/g, "avenue")
    .replace(/\bblvd\b\.?/g, "boulevard")
    .replace(/\bdr\b\.?/g, "drive")
    .replace(/\brd\b\.?/g, "road")
    .replace(/\bln\b\.?/g, "lane")
    .replace(/\bct\b\.?/g, "court")
    .replace(/\bpl\b\.?/g, "place")
    .replace(/\bapt\b\.?/g, "apartment")
    .replace(/\bste\b\.?/g, "suite")
    .replace(/[.,#\-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Compute name similarity score (0-100) using multiple signals.
 */
function computeNameScore(extracted: string, voter: string): number {
  const a = normalizeName(extracted);
  const b = normalizeName(voter);

  if (a === b) return 100;

  // One contains the other (handles middle name differences)
  if (a.includes(b) || b.includes(a)) return 92;

  const aParts = a.split(" ").filter(Boolean);
  const bParts = b.split(" ").filter(Boolean);

  // First + last name match (ignore middle names)
  if (
    aParts.length >= 2 &&
    bParts.length >= 2 &&
    aParts[0] === bParts[0] &&
    aParts[aParts.length - 1] === bParts[bParts.length - 1]
  ) {
    return 95;
  }

  // Last name match + first name initial match
  if (
    aParts.length >= 2 &&
    bParts.length >= 2 &&
    aParts[aParts.length - 1] === bParts[bParts.length - 1] &&
    aParts[0][0] === bParts[0][0]
  ) {
    return 78;
  }

  // Token overlap (Jaccard)
  const aSet = new Set(aParts);
  const bSet = new Set(bParts);
  const intersection = [...aSet].filter((t) => bSet.has(t));
  const union = new Set([...aSet, ...bSet]);
  const jaccardScore = (intersection.length / union.size) * 100;

  // Levenshtein similarity
  const editDist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  const editScore = maxLen > 0 ? (1 - editDist / maxLen) * 100 : 0;

  return Math.max(jaccardScore, editScore);
}

/**
 * Compute address similarity score (0-100).
 */
function computeAddressScore(extracted: string, voter: string): number {
  if (!extracted || !voter) return 0;

  const a = normalizeAddress(extracted);
  const b = normalizeAddress(voter);

  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 90;

  // House number check
  const aNum = a.match(/^(\d+)/)?.[1];
  const bNum = b.match(/^(\d+)/)?.[1];
  if (aNum && bNum && aNum !== bNum) return 15;

  // Token overlap
  const aParts = a.split(" ").filter(Boolean);
  const bParts = b.split(" ").filter(Boolean);
  const aSet = new Set(aParts);
  const bSet = new Set(bParts);
  const intersection = [...aSet].filter((t) => bSet.has(t));
  const union = new Set([...aSet, ...bSet]);

  return Math.round((intersection.length / union.size) * 100);
}

/**
 * Compute overall confidence combining name and address scores.
 */
function computeConfidence(
  nameScore: number,
  addressScore: number,
  hasAddress: boolean
): { confidence: number; method: string } {
  if (hasAddress && addressScore > 0) {
    // Name 65%, address 35%
    const raw = nameScore * 0.65 + addressScore * 0.35;

    // Bonus for strong corroboration
    const bonus = nameScore >= 85 && addressScore >= 70 ? 5 : 0;

    // Penalty if name matches but address doesn't (possible different person, same name)
    const penalty = nameScore >= 85 && addressScore < 30 ? 15 : 0;

    const confidence = Math.min(99, Math.max(0, Math.round(raw + bonus - penalty)));
    return { confidence, method: "name+address" };
  }

  // Name only, cap at 85 since we can't corroborate
  const confidence = Math.min(85, Math.round(nameScore * 0.9));
  return { confidence, method: "name-only" };
}

/**
 * Levenshtein distance.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export async function POST(request: NextRequest) {
  try {
    let projectId: string, signatureId: string;
    try {
      ({ projectId, signatureId } = await request.json());
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    if (!projectId || !signatureId) {
      return NextResponse.json(
        { success: false, error: "projectId and signatureId are required" },
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

    // Fetch the signature
    const { data: sigData, error: sigError } = await supabase
      .from("signatures")
      .select("*")
      .eq("id", signatureId)
      .single();

    const signature = sigData as Tables<"signatures"> | null;

    if (sigError || !signature) {
      return NextResponse.json(
        { success: false, error: "Signature not found" },
        { status: 404 }
      );
    }

    // Fetch all voters for the project
    const { data: voterData, error: voterError } = await supabase
      .from("voters")
      .select("*")
      .eq("project_id", projectId);

    const voters = (voterData as Tables<"voters">[]) || [];

    if (voterError) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch voters: ${voterError.message}` },
        { status: 500 }
      );
    }

    if (voters.length === 0) {
      return NextResponse.json({
        success: true,
        matches: [],
        message: "No voters loaded for this project. Upload and parse a voter file first.",
      });
    }

    const extractedName = signature.extracted_name || "";
    const extractedAddress = signature.extracted_address || "";
    const hasAddress = !!extractedAddress && extractedAddress !== "Unable to extract";

    // Step 1: Use Fuse.js to get name candidates (broad search)
    const nameFuse = new Fuse(voters, {
      keys: ["full_name"],
      threshold: 0.5,
      includeScore: true,
      shouldSort: true,
      minMatchCharLength: 2,
    });

    const fuseCandidates = extractedName ? nameFuse.search(extractedName).slice(0, 20) : [];

    // Step 2: Score each candidate with multi-signal scoring
    const scored = fuseCandidates.map((result) => {
      const voter = result.item;
      const nameScore = computeNameScore(extractedName, voter.full_name);
      const addressScore = hasAddress
        ? computeAddressScore(extractedAddress, voter.address || "")
        : 0;
      const { confidence, method } = computeConfidence(nameScore, addressScore, hasAddress);

      return { voter, confidence, nameScore, addressScore, matchMethod: method };
    });

    // Sort by confidence descending, take top 5 above 20%
    scored.sort((a, b) => b.confidence - a.confidence);
    const topMatches = scored.slice(0, 5).filter((m) => m.confidence >= 20);

    const matches = topMatches.map((m) => ({
      voter: m.voter,
      confidence: m.confidence,
      nameScore: m.nameScore,
      addressScore: m.addressScore,
      matchMethod: m.matchMethod,
    }));

    const bestMatch = matches.length > 0 ? matches[0] : null;

    return NextResponse.json({
      success: true,
      signatureId,
      extractedName: signature.extracted_name,
      extractedAddress: signature.extracted_address,
      bestMatch,
      matches,
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
