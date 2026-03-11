"use client";

import { useState } from "react";
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
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const complianceChecks = [
  {
    icon: CheckCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    label: "Duplicate Signature Scan",
    detail: "No cross-petition duplicates found",
    status: "pass" as const,
  },
  {
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "Circulator Registration Check",
    detail: "2 circulators pending verification",
    status: "warn" as const,
  },
  {
    icon: CheckCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    label: "Signature Threshold Met",
    detail: "2,340 / 2,000 required signatures (117%)",
    status: "pass" as const,
  },
  {
    icon: Info,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    label: "Filing Deadline",
    detail: "18 days remaining (March 29, 2026)",
    status: "info" as const,
  },
];

const generatedReports = [
  {
    id: 1,
    name: "Signature Validation Summary",
    project: "City Council Recall",
    date: "Mar 10, 2026",
    format: "PDF",
    status: "Ready",
  },
  {
    id: 2,
    name: "Circulator Compliance Report",
    project: "City Council Recall",
    date: "Mar 9, 2026",
    format: "PDF",
    status: "Ready",
  },
  {
    id: 3,
    name: "Duplicate Detection Report",
    project: "All Active Projects",
    date: "Mar 8, 2026",
    format: "PDF",
    status: "Ready",
  },
  {
    id: 4,
    name: "Jurisdiction Requirements Audit",
    project: "All Projects",
    date: "Mar 5, 2026",
    format: "PDF",
    status: "Ready",
  },
];

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

const duplicateEntries = [
  {
    name: "Maria Gonzalez",
    firstProject: "City Council Recall",
    firstDate: "Feb 14, 2026",
    dupProject: "Parks Bond Measure",
    dupDate: "Mar 2, 2026",
    status: "Flagged" as const,
  },
  {
    name: "James R. Thompson",
    firstProject: "School Board Initiative",
    firstDate: "Jan 22, 2026",
    dupProject: "City Council Recall",
    dupDate: "Feb 28, 2026",
    status: "Resolved" as const,
  },
  {
    name: "Li Wei Chen",
    firstProject: "Parks Bond Measure",
    firstDate: "Feb 5, 2026",
    dupProject: "School Board Initiative",
    dupDate: "Mar 1, 2026",
    status: "Flagged" as const,
  },
  {
    name: "Patricia A. Davis",
    firstProject: "City Council Recall",
    firstDate: "Feb 18, 2026",
    dupProject: "Parks Bond Measure",
    dupDate: "Mar 6, 2026",
    status: "Resolved" as const,
  },
  {
    name: "Robert Kim",
    firstProject: "School Board Initiative",
    firstDate: "Jan 30, 2026",
    dupProject: "City Council Recall",
    dupDate: "Mar 8, 2026",
    status: "Flagged" as const,
  },
];

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

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CompliancePage() {
  const [selectedState, setSelectedState] = useState<JurisdictionKey | "">("");

  const rules = selectedState ? jurisdictionRules[selectedState] : null;

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
        <button className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)]">
          <FilePlus className="h-4 w-4" />
          Generate New Report
        </button>
      </div>

      {/* ---- Active Compliance Checks ---- */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Active Compliance Checks
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {complianceChecks.map((check) => {
            const Icon = check.icon;
            return (
              <div
                key={check.label}
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
      </section>

      {/* ---- Generated Reports ---- */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Generated Reports
        </h2>
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
                    {report.project} &middot; Generated {report.date}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:shrink-0">
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  {report.format} {report.status}
                </span>
                <button className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-gray-50">
                  <Eye className="h-3.5 w-3.5" />
                  View
                </button>
                <button className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-dark)]">
                  <Download className="h-3.5 w-3.5" />
                  Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>
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
              {Object.entries(jurisdictionRules).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
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

          <div className="border-t border-[var(--border)] bg-blue-50 px-6 py-4">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <p className="text-sm text-blue-800">
                This feature scans across ALL your active projects to prevent
                duplicate signatures that could invalidate petitions.
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
                <button className="mt-4 w-full rounded-lg border border-[var(--border)] bg-white py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-gray-50">
                  Generate
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
