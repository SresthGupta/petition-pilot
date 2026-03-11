import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: "Email and password are required" },
      { status: 400 }
    );
  }

  // TODO: Replace with real authentication (e.g. NextAuth, Clerk, or custom JWT)
  return NextResponse.json({
    success: true,
    token: "mock-jwt-token",
    user: {
      id: "usr_demo_001",
      name: "Demo User",
      email,
      organization: "Campaign for Progress",
      role: "admin",
    },
  });
}
