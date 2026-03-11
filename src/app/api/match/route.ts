import { NextRequest, NextResponse } from "next/server";
import Fuse from "fuse.js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";

export async function POST(request: NextRequest) {
  try {
    const { projectId, signatureId } = await request.json();

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

    // Configure separate Fuse instances for name and address matching
    const nameFuse = new Fuse(voters, {
      keys: ["full_name"],
      threshold: 0.4,
      includeScore: true,
      shouldSort: true,
      minMatchCharLength: 2,
    });

    const addressFuse = new Fuse(voters, {
      keys: ["address"],
      threshold: 0.5,
      includeScore: true,
      shouldSort: true,
      minMatchCharLength: 2,
    });

    // Search name and address separately, then combine scores
    const nameQuery = signature.extracted_name || "";
    const addressQuery = signature.extracted_address || "";

    const nameResults = nameQuery ? nameFuse.search(nameQuery) : [];
    const addressResults = addressQuery ? addressFuse.search(addressQuery) : [];

    // Build a score map: voter id -> { nameScore, addressScore }
    const scoreMap = new Map<string, { nameScore: number; addressScore: number; voter: Tables<"voters"> }>();

    for (const r of nameResults) {
      scoreMap.set(r.item.id, {
        nameScore: r.score ?? 1,
        addressScore: 1,
        voter: r.item,
      });
    }

    for (const r of addressResults) {
      const existing = scoreMap.get(r.item.id);
      if (existing) {
        existing.addressScore = r.score ?? 1;
      } else {
        scoreMap.set(r.item.id, {
          nameScore: 1,
          addressScore: r.score ?? 1,
          voter: r.item,
        });
      }
    }

    // Compute combined score: weight name 70%, address 30%
    const combined = Array.from(scoreMap.values())
      .map((entry) => ({
        voter: entry.voter,
        combinedScore: entry.nameScore * 0.7 + entry.addressScore * 0.3,
      }))
      .sort((a, b) => a.combinedScore - b.combinedScore)
      .slice(0, 5);

    const matches = combined.map((entry) => ({
      voter: entry.voter,
      confidence: Math.round((1 - entry.combinedScore) * 100),
      fuseScore: entry.combinedScore,
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
