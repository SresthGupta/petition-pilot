"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  ExternalLink,
  FileText,
  UserCheck,
  Download,
  AlertTriangle,
  Loader2,
  Table,
  Stamp,
  Building2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import {
  exportToCSV,
  exportProjectReport,
  exportAffidavitTemplate,
  exportCountyClerkSubmission,
} from "@/lib/export";

type Project = Tables<"projects">;
type Signature = Tables<"signatures">;
type PetitionSheet = Tables<"petition_sheets">;

const statusConfig: Record<string, string> = {
  active: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  draft: "bg-gray-100 text-gray-600",
  archived: "bg-blue-100 text-blue-800",
};

const statusLabels: Record<string, string> = {
  active: "In Progress",
  completed: "Completed",
  draft: "Draft",
  archived: "Archived",
};

const tabs = [
  { key: "overview", label: "Overview", icon: FileText },
  { key: "signatures", label: "Signatures", icon: Users },
  { key: "circulators", label: "Circulators", icon: UserCheck },
  { key: "export", label: "Export", icon: Download },
];

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const id = params.id as string;

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [sheets, setSheets] = useState<PetitionSheet[]>([]);
  const [notFound, setNotFound] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user || !id) return;
    setLoading(true);

    // Fetch project
    const { data: projectData, error: projectError } = (await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single()) as { data: Project | null; error: any };

    if (projectError || !projectData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    // Verify ownership
    if (projectData.user_id !== user.id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setProject(projectData);

    // Fetch signatures and sheets in parallel
    const [sigResult, sheetResult] = await Promise.all([
      supabase
        .from("signatures")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("petition_sheets")
        .select("*")
        .eq("project_id", id)
        .order("sheet_number", { ascending: true }),
    ]);

    setSignatures((sigResult.data ?? []) as unknown as Signature[]);
    setSheets((sheetResult.data ?? []) as unknown as PetitionSheet[]);
    setLoading(false);
  }, [user, id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute stats from real signature data
  const totalSigs = project?.total_signatures ?? signatures.length;
  const verifiedCount =
    project?.verified_count ??
    signatures.filter((s) => s.status === "verified").length;
  const invalidCount =
    project?.invalid_count ??
    signatures.filter((s) => s.status === "invalid").length;
  const flaggedCount =
    project?.flagged_count ??
    signatures.filter((s) => s.status === "flagged").length;
  const pendingCount = signatures.filter(
    (s) => s.status === "pending"
  ).length;

  const verifiedPct =
    totalSigs > 0 ? Math.round((verifiedCount / totalSigs) * 100) : 0;

  // Loading state
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
        <div className="space-y-3">
          <div className="h-8 w-80 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-48 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm"
            >
              <div className="h-4 w-20 rounded bg-gray-100" />
              <div className="mt-4 h-8 w-16 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 404 state
  if (notFound || !project) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-7 w-7 text-[var(--danger)]" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[var(--foreground)]">
            Project Not Found
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            The project you are looking for does not exist or you do not have
            access.
          </p>
          <Link
            href="/dashboard/projects"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const overviewStats = [
    {
      label: "Total Signatures",
      value: totalSigs.toLocaleString(),
      icon: Users,
      color: "text-[var(--primary)]",
      bg: "bg-indigo-50",
    },
    {
      label: "Verified",
      value: verifiedCount.toLocaleString(),
      icon: CheckCircle2,
      color: "text-[var(--success)]",
      bg: "bg-emerald-50",
    },
    {
      label: "Invalid",
      value: invalidCount.toLocaleString(),
      icon: XCircle,
      color: "text-[var(--danger)]",
      bg: "bg-red-50",
    },
    {
      label: "Pending",
      value: pendingCount.toLocaleString(),
      icon: Clock,
      color: "text-[var(--warning)]",
      bg: "bg-amber-50",
    },
  ];

  const dateRange = project.deadline
    ? `${new Date(project.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} - ${new Date(project.deadline + "T00:00:00").toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric", year: "numeric" }
      )}`
    : `Created ${new Date(project.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Back button */}
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      {/* Project header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              {project.name}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                statusConfig[project.status] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {statusLabels[project.status] ?? project.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">{dateRange}</p>
          {project.description && (
            <p className="mt-1 text-sm text-[var(--muted)]">
              {project.description}
            </p>
          )}
        </div>
        <Link
          href={`/dashboard/projects/${id}/verify`}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)]"
        >
          <ExternalLink className="h-4 w-4" />
          Open Verification Interface
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-[var(--border)]">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-[var(--primary)] text-[var(--primary)]"
                    : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)] hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {overviewStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--muted)]">
                      {stat.label}
                    </span>
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}
                    >
                      <Icon className={`h-[18px] w-[18px] ${stat.color}`} />
                    </div>
                  </div>
                  <p className="mt-3 text-3xl font-bold text-[var(--foreground)]">
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[var(--foreground)]">
                Verification Progress
              </h3>
              <span className="text-sm font-medium text-[var(--primary)]">
                {verifiedPct}%
              </span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all"
                style={{ width: `${verifiedPct}%` }}
              />
            </div>
            <div className="mt-3 flex gap-6 text-xs text-[var(--muted)]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
                Verified: {verifiedCount.toLocaleString()}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--danger)]" />
                Invalid: {invalidCount.toLocaleString()}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--warning)]" />
                Pending: {pendingCount.toLocaleString()}
              </span>
              {flaggedCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-orange-400" />
                  Flagged: {flaggedCount.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Petition sheets */}
          <div className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-[var(--foreground)]">
              Petition Sheets
            </h3>
            {sheets.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--muted)]">
                No petition sheets uploaded yet.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-[var(--border)]">
                {sheets.map((sheet) => {
                  const ocrStatusConfig: Record<string, { label: string; color: string }> = {
                    pending: { label: "Pending OCR", color: "bg-gray-100 text-gray-600" },
                    processing: { label: "Processing", color: "bg-yellow-100 text-yellow-800" },
                    completed: { label: "Completed", color: "bg-green-100 text-green-800" },
                    failed: { label: "Failed", color: "bg-red-100 text-red-800" },
                  };
                  const ocrInfo = ocrStatusConfig[sheet.ocr_status] ?? ocrStatusConfig.pending;

                  return (
                    <div key={sheet.id} className="flex items-center gap-4 py-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                        <FileText className="h-4 w-4 text-[var(--primary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--foreground)]">
                          Sheet #{sheet.sheet_number}: {sheet.file_name}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {(sheet.file_size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${ocrInfo.color}`}
                      >
                        {ocrInfo.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Project info */}
          <div className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-[var(--foreground)]">
              Project Details
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[var(--muted)]">State</span>
                <p className="font-medium text-[var(--foreground)]">
                  {project.state}
                </p>
              </div>
              <div>
                <span className="text-[var(--muted)]">Petition Type</span>
                <p className="font-medium text-[var(--foreground)]">
                  {project.petition_type}
                </p>
              </div>
              <div>
                <span className="text-[var(--muted)]">Created</span>
                <p className="font-medium text-[var(--foreground)]">
                  {new Date(project.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <span className="text-[var(--muted)]">Deadline</span>
                <p className="font-medium text-[var(--foreground)]">
                  {project.deadline
                    ? new Date(
                        project.deadline + "T00:00:00"
                      ).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "None"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "signatures" && (
        <div>
          {signatures.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users className="h-12 w-12 text-[var(--muted)]/40" />
              <h3 className="mt-4 font-semibold text-[var(--foreground)]">
                No Signatures Yet
              </h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Upload and process petition sheets to see extracted signatures
                here.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">
                      Address
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">
                      Confidence
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {signatures.slice(0, 50).map((sig) => {
                    const sigStatusConfig: Record<string, string> = {
                      verified: "bg-green-100 text-green-800",
                      invalid: "bg-red-100 text-red-800",
                      flagged: "bg-orange-100 text-orange-800",
                      pending: "bg-gray-100 text-gray-600",
                      skipped: "bg-blue-100 text-blue-800",
                    };
                    return (
                      <tr key={sig.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                          {sig.extracted_name}
                        </td>
                        <td className="px-4 py-3 text-[var(--muted)]">
                          {sig.extracted_address}
                        </td>
                        <td className="px-4 py-3 text-[var(--muted)]">
                          {sig.extracted_date || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              sigStatusConfig[sig.status] ?? "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {sig.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted)]">
                          {sig.match_confidence != null
                            ? `${Math.round(sig.match_confidence * 100)}%`
                            : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {signatures.length > 50 && (
                <div className="border-t border-[var(--border)] bg-gray-50 px-4 py-3 text-center text-xs text-[var(--muted)]">
                  Showing 50 of {signatures.length.toLocaleString()} signatures
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "circulators" && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <UserCheck className="h-12 w-12 text-[var(--muted)]/40" />
          <h3 className="mt-4 font-semibold text-[var(--foreground)]">
            Circulators Management
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Track petition circulators and their sheet assignments coming soon.
          </p>
        </div>
      )}

      {activeTab === "export" && (
        <ExportTab
          project={project}
          signatures={signatures}
          exporting={exporting}
          setExporting={setExporting}
        />
      )}
    </div>
  );
}

/* ── Export Tab Component ──────────────────────────────────────────────── */

function ExportTab({
  project,
  signatures,
  exporting,
  setExporting,
}: {
  project: Project;
  signatures: Signature[];
  exporting: string | null;
  setExporting: (v: string | null) => void;
}) {
  async function handleExport(type: string) {
    setExporting(type);
    try {
      if (type === "csv") {
        const csvData = signatures.map((s) => ({
          name: s.extracted_name,
          address: s.extracted_address,
          date_signed: s.extracted_date ?? "",
          status: s.status,
          match_confidence:
            s.match_confidence != null
              ? (s.match_confidence * 100).toFixed(0) + "%"
              : "",
          matched_name: s.matched_voter_name ?? "",
          matched_address: s.matched_voter_address ?? "",
          flagged_reason: s.flagged_reason ?? "",
          verified_at: s.verified_at ?? "",
          created_at: s.created_at,
        }));
        await exportToCSV(
          csvData,
          `${project.name.replace(/\s+/g, "_")}_signatures`
        );
      } else if (type === "pdf") {
        await exportProjectReport(project, signatures);
      } else if (type === "affidavit") {
        const verifiedCount = signatures.filter(
          (s) => s.status === "verified"
        ).length;
        await exportAffidavitTemplate(project, verifiedCount);
      } else if (type === "clerk") {
        await exportCountyClerkSubmission(project, signatures);
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(null);
    }
  }

  const exportOptions = [
    {
      key: "pdf",
      icon: FileText,
      label: "Full PDF Report",
      description: "Project summary with all signature details",
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      key: "csv",
      icon: Table,
      label: "CSV Data Export",
      description: "Raw signature data for spreadsheet analysis",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      key: "affidavit",
      icon: Stamp,
      label: "Legal Affidavit",
      description: "Pre-filled circulator affidavit template",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      key: "clerk",
      icon: Building2,
      label: "County Clerk Filing",
      description: `Formatted for ${project.state} county clerk office`,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {exportOptions.map((opt) => {
          const Icon = opt.icon;
          const isExporting = exporting === opt.key;
          return (
            <div
              key={opt.key}
              className="flex flex-col justify-between rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div>
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${opt.bg}`}
                >
                  <Icon className={`h-5 w-5 ${opt.color}`} />
                </div>
                <h3 className="mt-3 font-semibold text-[var(--foreground)]">
                  {opt.label}
                </h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {opt.description}
                </p>
              </div>
              <button
                onClick={() => handleExport(opt.key)}
                disabled={exporting !== null}
                className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-white py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {signatures.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-blue-50 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <p className="text-sm text-blue-800">
              Export includes {signatures.length.toLocaleString()} signatures (
              {signatures.filter((s) => s.status === "verified").length.toLocaleString()}{" "}
              verified,{" "}
              {signatures.filter((s) => s.status === "invalid").length.toLocaleString()}{" "}
              invalid,{" "}
              {signatures.filter((s) => s.status === "flagged").length.toLocaleString()}{" "}
              flagged). County clerk filing only includes verified signatures.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
