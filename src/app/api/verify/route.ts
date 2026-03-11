import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Tables, UpdateTables } from "@/lib/supabase/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { signatureId, action, matchedVoter, confidence } = body;

    if (!signatureId || !action) {
      return NextResponse.json(
        { success: false, error: "signatureId and action are required" },
        { status: 400 }
      );
    }

    const validActions = ["verified", "invalid", "flagged", "skipped"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid action. Must be one of: ${validActions.join(", ")}`,
        },
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

    // Fetch existing signature
    const { data: existingSigData, error: fetchError } = await supabase
      .from("signatures")
      .select("*")
      .eq("id", signatureId)
      .single();

    const existingSig = existingSigData as Tables<"signatures"> | null;

    if (fetchError || !existingSig) {
      return NextResponse.json(
        { success: false, error: "Signature not found" },
        { status: 404 }
      );
    }

    const previousStatus = existingSig.status;
    const projectId = existingSig.project_id;

    // Map action to signature status
    const statusMap: Record<string, "verified" | "invalid" | "flagged" | "pending" | "skipped"> = {
      verified: "verified",
      invalid: "invalid",
      flagged: "flagged",
      skipped: "skipped",
    };
    const newStatus = statusMap[action];

    // Build the update payload
    const updatePayload: UpdateTables<"signatures"> = {
      status: newStatus,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (matchedVoter) {
      updatePayload.matched_voter_name = matchedVoter.name || null;
      updatePayload.matched_voter_address = matchedVoter.address || null;
      updatePayload.matched_voter_party = matchedVoter.party || null;
      updatePayload.match_confidence = confidence ?? null;
      updatePayload.match_method = "manual";
    }

    // Update the signature record
    const { data: updatedSigData, error: updateError } = await supabase
      .from("signatures")
      .update(updatePayload)
      .eq("id", signatureId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: `Failed to update signature: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Update project aggregate counts
    const { data: projectData } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    const project = projectData as Tables<"projects"> | null;

    if (project) {
      const updates: Partial<{ verified_count: number; invalid_count: number; flagged_count: number; updated_at: string }> = {
        updated_at: new Date().toISOString(),
      };

      let vc = project.verified_count;
      let ic = project.invalid_count;
      let fc = project.flagged_count;

      // Decrement previous status count
      if (previousStatus === "verified") vc = Math.max(0, vc - 1);
      else if (previousStatus === "invalid") ic = Math.max(0, ic - 1);
      else if (previousStatus === "flagged") fc = Math.max(0, fc - 1);

      // Increment new status count
      if (newStatus === "verified") vc += 1;
      else if (newStatus === "invalid") ic += 1;
      else if (newStatus === "flagged") fc += 1;

      updates.verified_count = vc;
      updates.invalid_count = ic;
      updates.flagged_count = fc;

      await supabase
        .from("projects")
        .update(updates)
        .eq("id", projectId);
    }

    // Create activity log entry
    await supabase.from("activity_log").insert({
      user_id: user.id,
      project_id: projectId,
      action: `signature_${action}`,
      details: `Signature #${existingSig.line_number} (${existingSig.extracted_name}) marked as ${action}`,
      metadata: {
        signature_id: signatureId,
        previous_status: previousStatus,
        new_status: newStatus,
        matched_voter: matchedVoter || null,
        confidence: confidence || null,
      },
    });

    return NextResponse.json({
      success: true,
      signature: updatedSigData,
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
