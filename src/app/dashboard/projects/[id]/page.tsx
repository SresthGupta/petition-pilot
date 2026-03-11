"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
} from "lucide-react";

const projectsData: Record<
  string,
  {
    name: string;
    status: string;
    statusColor: string;
    dateRange: string;
    total: number;
    verified: number;
    invalid: number;
    pending: number;
  }
> = {
  "1": {
    name: "City Council Recall - District 5",
    status: "In Progress",
    statusColor: "bg-yellow-100 text-yellow-800",
    dateRange: "Feb 14 - Apr 14, 2026",
    total: 2340,
    verified: 2083,
    invalid: 117,
    pending: 140,
  },
  "2": {
    name: "School Board Initiative 2026",
    status: "Completed",
    statusColor: "bg-green-100 text-green-800",
    dateRange: "Jan 28 - Mar 1, 2026",
    total: 5120,
    verified: 4915,
    invalid: 164,
    pending: 41,
  },
  "3": {
    name: "Parks Bond Measure",
    status: "In Progress",
    statusColor: "bg-yellow-100 text-yellow-800",
    dateRange: "Mar 2 - May 30, 2026",
    total: 1204,
    verified: 867,
    invalid: 96,
    pending: 241,
  },
};

const tabs = [
  { key: "overview", label: "Overview", icon: FileText },
  { key: "signatures", label: "Signatures", icon: Users },
  { key: "circulators", label: "Circulators", icon: UserCheck },
  { key: "export", label: "Export", icon: Download },
];

const recentActivity = [
  {
    action: "Batch verified",
    detail: "64 signatures from Sheet #12",
    time: "8 min ago",
    status: "success" as const,
  },
  {
    action: "Flagged",
    detail: "3 duplicate entries in Sheet #11",
    time: "22 min ago",
    status: "warning" as const,
  },
  {
    action: "Uploaded",
    detail: "Sheet #14 (42 signatures)",
    time: "1 hour ago",
    status: "info" as const,
  },
  {
    action: "Rejected",
    detail: "7 unreadable signatures in Sheet #10",
    time: "2 hours ago",
    status: "error" as const,
  },
  {
    action: "Batch verified",
    detail: "128 signatures from Sheet #9",
    time: "3 hours ago",
    status: "success" as const,
  },
];

const statusStyles = {
  success: "bg-emerald-50 text-[var(--success)]",
  warning: "bg-amber-50 text-[var(--warning)]",
  error: "bg-red-50 text-[var(--danger)]",
  info: "bg-indigo-50 text-[var(--primary)]",
};

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");

  const project = projectsData[id] || {
    name: "Unknown Project",
    status: "Draft",
    statusColor: "bg-gray-100 text-gray-600",
    dateRange: "N/A",
    total: 0,
    verified: 0,
    invalid: 0,
    pending: 0,
  };

  const verifiedPct =
    project.total > 0
      ? Math.round((project.verified / project.total) * 100)
      : 0;

  const overviewStats = [
    {
      label: "Total Signatures",
      value: project.total.toLocaleString(),
      icon: Users,
      color: "text-[var(--primary)]",
      bg: "bg-indigo-50",
    },
    {
      label: "Verified",
      value: project.verified.toLocaleString(),
      icon: CheckCircle2,
      color: "text-[var(--success)]",
      bg: "bg-emerald-50",
    },
    {
      label: "Invalid",
      value: project.invalid.toLocaleString(),
      icon: XCircle,
      color: "text-[var(--danger)]",
      bg: "bg-red-50",
    },
    {
      label: "Pending",
      value: project.pending.toLocaleString(),
      icon: Clock,
      color: "text-[var(--warning)]",
      bg: "bg-amber-50",
    },
  ];

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
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${project.statusColor}`}
            >
              {project.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {project.dateRange}
          </p>
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
                Verified: {project.verified.toLocaleString()}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--danger)]" />
                Invalid: {project.invalid.toLocaleString()}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--warning)]" />
                Pending: {project.pending.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Recent activity */}
          <div className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-[var(--foreground)]">
              Recent Verification Activity
            </h3>
            <div className="mt-4 divide-y divide-[var(--border)]">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-center gap-4 py-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${statusStyles[item.status]}`}
                  >
                    {item.status === "success" && (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {item.status === "warning" && (
                      <Clock className="h-4 w-4" />
                    )}
                    {item.status === "error" && (
                      <XCircle className="h-4 w-4" />
                    )}
                    {item.status === "info" && (
                      <FileText className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--foreground)]">
                      <span className="font-medium">{item.action}</span>{" "}
                      {item.detail}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-[var(--muted)]">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "signatures" && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="h-12 w-12 text-[var(--muted)]/40" />
          <h3 className="mt-4 font-semibold text-[var(--foreground)]">
            Signatures Table
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Full signature list with search, filter, and bulk actions coming
            soon.
          </p>
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
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Download className="h-12 w-12 text-[var(--muted)]/40" />
          <h3 className="mt-4 font-semibold text-[var(--foreground)]">
            Export &amp; Reports
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Generate compliance reports and export data in multiple formats
            coming soon.
          </p>
        </div>
      )}
    </div>
  );
}
