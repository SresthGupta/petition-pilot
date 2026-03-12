"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FileCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Shield,
  Scale,
  FileText,
  Info,
  ChevronDown,
  Eye,
  FilePlus,
  Table,
  Stamp,
  Building2,
  Loader2,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { Tables } from "@/lib/supabase/types";
import {
  exportToCSV,
  exportToPDF,
  exportProjectReport,
  exportAffidavitTemplate,
  exportCountyClerkSubmission,
} from "@/lib/export";

/* ------------------------------------------------------------------ */
/*  Jurisdiction Rules (real state requirements)                       */
/* ------------------------------------------------------------------ */

type JurisdictionKey =
  | "california"
  | "new_york"
  | "texas"
  | "florida"
  | "ohio";

const jurisdictionRules: Record<
  JurisdictionKey,
  {
    label: string;
    signatureThreshold: string;
    circulatorRequirements: string;
    filingDeadline: string;
    notarization: string;
    duplicatePolicy: string;
  }
> = {
  california: {
    label: "California",
    signatureThreshold: "5% of votes cast in last gubernatorial election",
    circulatorRequirements:
      "Must be 18+, registered voter not required. Must include circulator affidavit with printed name, residence address, and signature.",
    filingDeadline:
      "160 days from approval of petition title and summary by Attorney General",
    notarization:
      "Circulator declaration under penalty of perjury; no notary required",
    duplicatePolicy:
      "First valid signature counts; duplicates across sheets are removed during verification",
  },
  new_york: {
    label: "New York",
    signatureThreshold:
      "5% of enrolled voters of the party in the district (statewide: ~15,000)",
    circulatorRequirements:
      "Must be registered voter in the district. Must sign witness statement on each sheet.",
    filingDeadline:
      "Designating petitions: between 36th and 30th day before primary",
    notarization:
      "Notarization required for each petition sheet witness statement",
    duplicatePolicy:
      "Signer may only sign one petition per office; all subsequent signatures void",
  },
  texas: {
    label: "Texas",
    signatureThreshold:
      "10% of votes cast for governor in the most recent election in that jurisdiction",
    circulatorRequirements:
      "Must be registered voter in the jurisdiction. Circulator affidavit required.",
    filingDeadline: "Varies by election type; typically 60\u201390 days before filing",
    notarization:
      "Circulator must sign affidavit before a notary public",
    duplicatePolicy:
      "Only first signature counts; duplicates invalidated at verification",
  },
  florida: {
    label: "Florida",
    signatureThreshold:
      "8% of votes cast in the last presidential election in the district",
    circulatorRequirements:
      "Paid circulators must register with the Division of Elections. Volunteer circulators have no registration requirement.",
    filingDeadline:
      "Must submit to county supervisor of elections by February 1 of election year",
    notarization:
      "No notarization required; circulator must sign certification on each sheet",
    duplicatePolicy:
      "Duplicate signatures across petition forms are flagged and only the earliest is counted",
  },
  ohio: {
    label: "Ohio",
    signatureThreshold:
      "10% of votes cast for governor in the last election; must include signatures from at least 44 of 88 counties",
    circulatorRequirements:
      "Must be Ohio resident and at least 18. Must complete circulator statement with address.",
    filingDeadline:
      "125 days before the general election for initiated statutes",
    notarization:
      "Circulator statement must be notarized",
    duplicatePolicy:
      "Signers who sign more than once have only the first signature counted; remainder are struck",
  },
};

// State name to key mapping
const stateNameToKey: Record<string, JurisdictionKey> = {
  california: "california",
  ca: "california",
  "new york": "new_york",
  ny: "new_york",
  texas: "texas",
  tx: "texas",
  florida: "florida",
  fl: "florida",
  ohio: "ohio",
  oh: "ohio",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CompliancePage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [selectedState, setSelectedState] = useState<JurisdictionKey | "">("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  const [projects, setProjects] = useState<Tables<"projects">[]>([]);
  const [signatures, setSignatures] = useState<Tables<"signatures">[]>([]);

  // Fetch data
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function fetchData() {
      setLoading(true);

      const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user!.id) as { data: Tables<"projects">[] | null };

      if (cancelled) return;
      const userProjects = projectsData ?? [];
      setProjects(userProjects);

      if (userProjects.length === 0) {
        setSignatures([]);
        setLoading(false);
        return;
      }

      const projectIds = userProjects.map((p) => p.id);

      const { data: sigsData, error: sigsError } = await supabase
        .from("signatures")
        .select("*")
        .in("project_id", projectIds) as unknown as { data: Tables<"signatures">[] | null; error: { message: string } | null };

      if (cancelled) return;
      if (sigsError) console.error("Failed to fetch signatures:", sigsError.message);
      setSignatures(sigsData ?? []);
      setLoading(false);
    }

    fetchData();
    return () => { cancelled = true; };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Compliance Checks ───────────────────────────────────────────────────

  const complianceChecks = useMemo(() => {
    if (projects.length === 0) return [];

    const checks: Array<{
      icon: typeof CheckCircle;
      color: string;
      bg: string;
      border: string;
      label: string;
      detail: string;
      status: "pass" | "warn" | "info" | "fail";
    }> = [];

    // 1. Duplicate signature scan
    const nameMap: Record<string, string[]> = {};
    signatures.forEach((s) => {
      const normalized = s.extracted_name.trim().toLowerCase();
      if (!nameMap[normalized]) nameMap[normalized] = [];
      nameMap[normalized].push(s.project_id);
    });
    const crossProjectDups = Object.entries(nameMap).filter(
      ([, projectIds]) => new Set(projectIds).size > 1
    );
    if (crossProjectDups.length === 0) {
      checks.push({
        icon: CheckCircle,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        label: "Duplicate Signature Scan",
        detail: "No cross-petition duplicates found",
        status: "pass",
      });
    } else {
      checks.push({
        icon: AlertTriangle,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        label: "Duplicate Signature Scan",
        detail: `${crossProjectDups.length} potential cross-petition duplicate${crossProjectDups.length !== 1 ? "s" : ""} detected`,
        status: "warn",
      });
    }

    // 2. Signature threshold check per project
    projects.forEach((p) => {
      const verified = p.verified_count;
      const total = p.total_signatures;
      if (total > 0 && verified >= total * 0.8) {
        checks.push({
          icon: CheckCircle,
          color: "text-emerald-600",
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          label: `Signature Threshold - ${p.name}`,
          detail: `${verified.toLocaleString()} verified of ${total.toLocaleString()} total (${Math.round((verified / total) * 100)}%)`,
          status: "pass",
        });
      } else if (total > 0) {
        checks.push({
          icon: AlertTriangle,
          color: "text-amber-600",
          bg: "bg-amber-50",
          border: "border-amber-200",
          label: `Signature Threshold - ${p.name}`,
          detail: `${verified.toLocaleString()} verified of ${total.toLocaleString()} total (${Math.round((verified / total) * 100)}%) - below 80% threshold`,
          status: "warn",
        });
      }
    });

    // 3. Deadline checks
    projects.forEach((p) => {
      if (p.deadline) {
        const deadlineDate = new Date(p.deadline);
        const now = new Date();
        const daysRemaining = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysRemaining < 0) {
          checks.push({
            icon: XCircle,
            color: "text-red-600",
            bg: "bg-red-50",
            border: "border-red-200",
            label: `Filing Deadline - ${p.name}`,
            detail: `Deadline passed ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? "s" : ""} ago (${deadlineDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})`,
            status: "fail",
          });
        } else if (daysRemaining <= 14) {
          checks.push({
            icon: AlertTriangle,
            color: "text-amber-600",
            bg: "bg-amber-50",
            border: "border-amber-200",
            label: `Filing Deadline - ${p.name}`,
            detail: `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining (${deadlineDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})`,
            status: "warn",
          });
        } else {
          checks.push({
            icon: Info,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-200",
            label: `Filing Deadline - ${p.name}`,
            detail: `${daysRemaining} days remaining (${deadlineDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})`,
            status: "info",
          });
        }
      }
    });

    // 4. Flagged signatures check
    const flaggedTotal = signatures.filter((s) => s.status === "flagged").length;
    if (flaggedTotal > 0) {
      checks.push({
        icon: AlertTriangle,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        label: "Flagged Signatures",
        detail: `${flaggedTotal} signature${flaggedTotal !== 1 ? "s" : ""} flagged for manual review`,
        status: "warn",
      });
    }

    return checks;
  }, [projects, signatures]);

  // ── Duplicate Detection ─────────────────────────────────────────────────

  const duplicateEntries = useMemo(() => {
    const projectMap = new Map(projects.map((p) => [p.id, p.name]));
    const nameMap: Record<string, Array<{ projectId: string; date: string; sigId: string }>> = {};

    signatures.forEach((s) => {
      const normalized = s.extracted_name.trim().toLowerCase();
      if (!nameMap[normalized]) nameMap[normalized] = [];
      nameMap[normalized].push({
        projectId: s.project_id,
        date: s.created_at,
        sigId: s.id,
      });
    });

    const duplicates: Array<{
      name: string;
      firstProject: string;
      firstDate: string;
      dupProject: string;
      dupDate: string;
      status: "Flagged" | "Resolved";
    }> = [];

    for (const [name, occurrences] of Object.entries(nameMap)) {
      if (occurrences.length < 2) continue;

      // Check if the occurrences span multiple projects
      const uniqueProjects = new Set(occurrences.map((o) => o.projectId));
      if (uniqueProjects.size < 2) continue;

      // Sort by date
      const sorted = [...occurrences].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const first = sorted[0];

      // For each subsequent occurrence in a different project, add a duplicate entry
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].projectId !== first.projectId) {
          // Check if the duplicate signature is flagged in the DB
          const dupSig = signatures.find((s) => s.id === sorted[i].sigId);
          const isFlagged = dupSig?.status === "flagged" || dupSig?.status === "invalid";

          duplicates.push({
            name: name
              .split(" ")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" "),
            firstProject: projectMap.get(first.projectId) ?? "Unknown",
            firstDate: new Date(first.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            dupProject: projectMap.get(sorted[i].projectId) ?? "Unknown",
            dupDate: new Date(sorted[i].date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            status: isFlagged ? "Flagged" : "Resolved",
          });
          break; // One dup entry per name
        }
      }
    }

    return duplicates;
  }, [signatures, projects]);

  // ── Generated Reports ─────────────────────────────────────────────────

  const generatedReports = useMemo(() => {
    const reports: Array<{
      id: string;
      name: string;
      project: string;
      date: string;
      format: string;
      status: string;
      projectObj?: Tables<"projects">;
    }> = [];

    projects.forEach((p) => {
      reports.push({
        id: `validation-${p.id}`,
        name: "Signature Validation Summary",
        project: p.name,
        date: new Date(p.updated_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        format: "PDF",
        status: "Ready",
        projectObj: p,
      });
    });

    if (duplicateEntries.length > 0) {
      reports.push({
        id: "duplicates",
        name: "Duplicate Detection Report",
        project: "All Active Projects",
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        format: "PDF",
        status: "Ready",
      });
    }

    return reports;
  }, [projects, duplicateEntries]);

  // ── Active project states for jurisdiction context ───────────────────

  const activeStates = useMemo(() => {
    return [...new Set(projects.map((p) => p.state.toLowerCase()))];
  }, [projects]);

  const rules = selectedState ? jurisdictionRules[selectedState] : null;

  // ── Export Handlers ─────────────────────────────────────────────────────

  async function handleExport(exportType: string) {
    setExporting(exportType);
    try {
      const firstProject = projects[0];

      if (exportType === "CSV Data Export") {
        const csvData = signatures.map((s) => {
          const proj = projects.find((p) => p.id === s.project_id);
          return {
            project: proj?.name ?? "Unknown",
            state: proj?.state ?? "",
            name: s.extracted_name,
            address: s.extracted_address,
            date_signed: s.extracted_date ?? "",
            status: s.status,
            match_confidence: s.match_confidence != null ? (s.match_confidence * 100).toFixed(0) + "%" : "",
            flagged_reason: s.flagged_reason ?? "",
            verified_at: s.verified_at ?? "",
            created_at: s.created_at,
          };
        });
        await exportToCSV(csvData, "signature_data_export");
      } else if (exportType === "PDF Report") {
        if (firstProject) {
          const projSigs = signatures.filter((s) => s.project_id === firstProject.id);
          await exportProjectReport(firstProject, projSigs);
        } else {
          await exportToPDF(
            "Compliance Summary Report",
            ["Metric", "Value"],
            [
              ["Total Projects", String(projects.length)],
              ["Total Signatures", String(signatures.length)],
              ["Duplicates Found", String(duplicateEntries.length)],
            ],
            "compliance_summary"
          );
        }
      } else if (exportType === "Legal Affidavit Template") {
        if (firstProject) {
          const sigCount = signatures.filter(
            (s) => s.project_id === firstProject.id && s.status === "verified"
          ).length;
          await exportAffidavitTemplate(firstProject, sigCount);
        }
      } else if (exportType === "County Clerk Submission") {
        if (firstProject) {
          const projSigs = signatures.filter((s) => s.project_id === firstProject.id);
          await exportCountyClerkSubmission(firstProject, projSigs);
        }
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(null);
    }
  }

  async function handleReportDownload(report: (typeof generatedReports)[0]) {
    setExporting(report.id);
    try {
      if (report.projectObj) {
        const projSigs = signatures.filter(
          (s) => s.project_id === report.projectObj!.id
        );
        await exportProjectReport(report.projectObj, projSigs);
      } else if (report.id === "duplicates") {
        await exportToPDF(
          "Duplicate Detection Report",
          ["Signer Name", "First Project", "First Date", "Duplicate Project", "Dup Date", "Status"],
          duplicateEntries.map((d) => [
            d.name,
            d.firstProject,
            d.firstDate,
            d.dupProject,
            d.dupDate,
            d.status,
          ]),
          "duplicate_detection_report"
        );
      }
    } catch (err) {
      console.error("Report download failed:", err);
    } finally {
      setExporting(null);
    }
  }

  // ── Export Options Config ─────────────────────────────────────────────

  const exportOptions = [
    {
      icon: FileText,
      label: "PDF Report",
      description: "Official filing format with full compliance summary",
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      icon: Table,
      label: "CSV Data Export",
      description: "Raw signature and verification data for analysis",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      icon: Stamp,
      label: "Legal Affidavit Template",
      description: "Pre-filled circulator affidavit for notarization",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      icon: Building2,
      label: "County Clerk Submission",
      description: "Formatted package for county clerk filing requirements",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  // ── Loading ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="ml-3 text-sm text-gray-500">Loading compliance data...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Compliance Reports
          </h1>
          <p className="mt-1 text-[var(--muted)]">
            Automated compliance reporting with jurisdiction-specific rules
          </p>
        </div>
        <button
          onClick={() => handleExport("PDF Report")}
          disabled={exporting !== null}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus className="h-4 w-4" />}
          Generate New Report
        </button>
      </div>

      {/* ---- Active Compliance Checks ---- */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Active Compliance Checks
        </h2>
        {complianceChecks.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {complianceChecks.map((check, idx) => {
              const Icon = check.icon;
              return (
                <div
                  key={`${check.label}-${idx}`}
                  className={`flex items-start gap-3 rounded-xl border ${check.border} ${check.bg} p-4`}
                >
                  <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${check.color}`} />
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${check.color}`}>
                      {check.label}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-700">
                      {check.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <Shield className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">
              No projects yet. Create a project and start verifying signatures to see compliance checks.
            </p>
          </div>
        )}
      </section>

      {/* ---- Generated Reports ---- */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Generated Reports
        </h2>
        {generatedReports.length > 0 ? (
          <div className="mt-4 space-y-3">
            {generatedReports.map((report) => (
              <div
                key={report.id}
                className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                    <FileCheck className="h-5 w-5 text-[var(--primary)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--foreground)]">
                      {report.name}
                    </p>
                    <p className="mt-0.5 text-sm text-[var(--muted)]">
                      {report.project} &middot; Updated {report.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                    {report.format} {report.status}
                  </span>
                  <button
                    onClick={() => handleReportDownload(report)}
                    disabled={exporting === report.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50"
                  >
                    {exporting === report.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <FileCheck className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">
              No reports available. Verify some signatures to generate compliance reports.
            </p>
          </div>
        )}
      </section>

      {/* ---- Jurisdiction Rules Engine ---- */}
      <section>
        <div className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
              <Scale className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Jurisdiction Rules Engine
              </h2>
              <p className="text-sm text-[var(--muted)]">
                Select a state to view petition compliance requirements
                {activeStates.length > 0 && (
                  <span className="ml-1 text-indigo-600">
                    (Your projects: {activeStates.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(", ")})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="relative mt-5 max-w-xs">
            <select
              value={selectedState}
              onChange={(e) =>
                setSelectedState(e.target.value as JurisdictionKey | "")
              }
              className="w-full appearance-none rounded-lg border border-[var(--border)] bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-[var(--foreground)] shadow-sm transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Select a state...</option>
              {Object.entries(jurisdictionRules).map(([key, val]) => {
                const isActive = activeStates.some(
                  (s) => stateNameToKey[s] === key || s === val.label.toLowerCase()
                );
                return (
                  <option key={key} value={key}>
                    {val.label}{isActive ? " (active project)" : ""}
                  </option>
                );
              })}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          </div>

          {rules && (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Required Signatures",
                  value: rules.signatureThreshold,
                  icon: FileCheck,
                },
                {
                  title: "Circulator Requirements",
                  value: rules.circulatorRequirements,
                  icon: Shield,
                },
                {
                  title: "Filing Deadline Rules",
                  value: rules.filingDeadline,
                  icon: Clock,
                },
                {
                  title: "Notarization Requirements",
                  value: rules.notarization,
                  icon: Stamp,
                },
                {
                  title: "Duplicate Signature Policy",
                  value: rules.duplicatePolicy,
                  icon: AlertTriangle,
                },
              ].map((rule) => {
                const RuleIcon = rule.icon;
                return (
                  <div
                    key={rule.title}
                    className="rounded-lg border border-gray-100 bg-gray-50 p-4"
                  >
                    <div className="flex items-center gap-2">
                      <RuleIcon className="h-4 w-4 text-[var(--primary)]" />
                      <h4 className="text-sm font-semibold text-[var(--foreground)]">
                        {rule.title}
                      </h4>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                      {rule.value}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ---- Duplicate Signature Detection ---- */}
      <section>
        <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-[var(--border)] p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Shield className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Duplicate Signature Detection
              </h2>
              <p className="text-sm text-[var(--muted)]">
                Cross-project duplicate scanning to prevent petition
                invalidation
              </p>
            </div>
          </div>

          {duplicateEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-gray-50 text-left">
                    <th className="px-6 py-3 font-semibold text-[var(--foreground)]">
                      Signer Name
                    </th>
                    <th className="px-6 py-3 font-semibold text-[var(--foreground)]">
                      First Appearance
                    </th>
                    <th className="px-6 py-3 font-semibold text-[var(--foreground)]">
                      Duplicate Appearance
                    </th>
                    <th className="px-6 py-3 font-semibold text-[var(--foreground)]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {duplicateEntries.map((entry, i) => (
                    <tr
                      key={i}
                      className="border-b border-[var(--border)] last:border-0 transition-colors hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-medium text-[var(--foreground)]">
                        {entry.name}
                      </td>
                      <td className="px-6 py-4 text-[var(--muted)]">
                        {entry.firstProject}
                        <br />
                        <span className="text-xs">{entry.firstDate}</span>
                      </td>
                      <td className="px-6 py-4 text-[var(--muted)]">
                        {entry.dupProject}
                        <br />
                        <span className="text-xs">{entry.dupDate}</span>
                      </td>
                      <td className="px-6 py-4">
                        {entry.status === "Flagged" ? (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                            Flagged
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                            Resolved
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <CheckCircle className="mx-auto h-8 w-8 text-emerald-400" />
              <p className="mt-2 text-sm text-gray-500">
                {signatures.length > 0
                  ? "No cross-project duplicate signatures detected."
                  : "No signatures to scan yet. Verify signatures across multiple projects to enable duplicate detection."}
              </p>
            </div>
          )}

          <div className="border-t border-[var(--border)] bg-blue-50 px-6 py-4">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <p className="text-sm text-blue-800">
                This feature scans across ALL your active projects to prevent
                duplicate signatures that could invalidate petitions.
                {signatures.length > 0 && (
                  <span className="ml-1 font-medium">
                    Scanned {signatures.length.toLocaleString()} signatures across {projects.length} project{projects.length !== 1 ? "s" : ""}.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Export Options ---- */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Export Options
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {exportOptions.map((opt) => {
            const Icon = opt.icon;
            const isExporting = exporting === opt.label;
            const disabled = exporting !== null || (projects.length === 0 && opt.label !== "CSV Data Export");
            return (
              <div
                key={opt.label}
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
                  onClick={() => handleExport(opt.label)}
                  disabled={disabled}
                  className="mt-4 w-full rounded-lg border border-[var(--border)] bg-white py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Generating...
                    </span>
                  ) : (
                    "Generate"
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
