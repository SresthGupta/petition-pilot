import { NextRequest, NextResponse } from "next/server";

const mockProjects = [
  {
    id: "proj_001",
    name: "Ohio Ballot Initiative 2026",
    state: "OH",
    status: "active",
    totalSignatures: 12450,
    verifiedSignatures: 9823,
    flaggedSignatures: 312,
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-03-10T14:30:00Z",
  },
  {
    id: "proj_002",
    name: "TX-14 Congressional Petition",
    state: "TX",
    status: "active",
    totalSignatures: 8200,
    verifiedSignatures: 6540,
    flaggedSignatures: 187,
    createdAt: "2026-02-01T09:00:00Z",
    updatedAt: "2026-03-09T16:45:00Z",
  },
  {
    id: "proj_003",
    name: "California Prop 42",
    state: "CA",
    status: "completed",
    totalSignatures: 45000,
    verifiedSignatures: 41200,
    flaggedSignatures: 1580,
    createdAt: "2025-11-20T08:00:00Z",
    updatedAt: "2026-02-28T12:00:00Z",
  },
];

export async function GET() {
  // TODO: Replace with database query (e.g. Prisma, Drizzle)
  return NextResponse.json({
    success: true,
    projects: mockProjects,
    total: mockProjects.length,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, state, description } = body;

  if (!name || !state) {
    return NextResponse.json(
      { success: false, error: "Project name and state are required" },
      { status: 400 }
    );
  }

  // TODO: Replace with database insert
  const newProject = {
    id: `proj_${Date.now()}`,
    name,
    state,
    description: description || "",
    status: "active",
    totalSignatures: 0,
    verifiedSignatures: 0,
    flaggedSignatures: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json(
    { success: true, project: newProject },
    { status: 201 }
  );
}
