import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  if (action === "signout") {
    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json(
        { success: false, error: "Failed to sign out" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { success: false, error: "Unknown action" },
    { status: 400 }
  );
}
