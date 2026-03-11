"use client";

import Link from "next/link";
import {
  Users,
  FolderOpen,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  UserPlus,
} from "lucide-react";

const stats = [
  {
    label: "Total Signatures",
    value: "12,847",
    icon: Users,
    change: "+842 this week",
    color: "text-[var(--primary)]",
    bg: "bg-indigo-50",
  },
  {
    label: "Active Projects",
    value: "3",
    icon: FolderOpen,
    change: "1 completed recently",
    color: "text-[var(--accent)]",
    bg: "bg-cyan-50",
  },
  {
    label: "Verification Rate",
    value: "94.2%",
    icon: ShieldCheck,
    change: "+2.1% from last month",
    color: "text-[var(--success)]",
    bg: "bg-emerald-50",
  },
  {
    label: "Avg Processing Time",
    value: "1.2s",
    icon: Zap,
    change: "per signature",
    color: "text-[var(--warning)]",
    bg: "bg-amber-50",
  },
];

const projects = [
  {
    id: "1",
    name: "City Council Recall - District 5",
    signatures: 2340,
    verified: 89,
    status: "In Progress",
    statusColor: "bg-yellow-100 text-yellow-800",
  },
  {
    id: "2",
    name: "School Board Initiative 2026",
    signatures: 5120,
    verified: 96,
    status: "Completed",
    statusColor: "bg-green-100 text-green-800",
  },
  {
    id: "3",
    name: "Parks Bond Measure",
    signatures: 1204,
    verified: 72,
    status: "In Progress",
    statusColor: "bg-yellow-100 text-yellow-800",
  },
];

const activity = [
  {
    icon: CheckCircle2,
    color: "text-[var(--success)]",
    bg: "bg-emerald-50",
    text: "128 signatures verified for City Council Recall",
    time: "12 minutes ago",
  },
  {
    icon: FileText,
    color: "text-[var(--primary)]",
    bg: "bg-indigo-50",
    text: "New petition sheet uploaded to Parks Bond Measure",
    time: "1 hour ago",
  },
  {
    icon: AlertCircle,
    color: "text-[var(--warning)]",
    bg: "bg-amber-50",
    text: "14 signatures flagged for manual review",
    time: "2 hours ago",
  },
  {
    icon: UserPlus,
    color: "text-[var(--accent)]",
    bg: "bg-cyan-50",
    text: "Voter file updated for School Board Initiative",
    time: "5 hours ago",
  },
  {
    icon: Clock,
    color: "text-[var(--muted)]",
    bg: "bg-gray-50",
    text: "Compliance report generated for District 5 Recall",
    time: "Yesterday at 4:32 PM",
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Welcome back, Demo User
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Here&apos;s an overview of your petition verification activity.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
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
              <p className="mt-1 text-xs text-[var(--muted)]">{stat.change}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Recent Projects
            </h2>
            <Link
              href="/dashboard/projects"
              className="flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors"
            >
              View all
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="group block rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-[var(--primary-light)]"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                      {project.name}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {project.signatures.toLocaleString()} signatures
                    </p>
                  </div>
                  <span
                    className={`ml-3 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${project.statusColor}`}
                  >
                    {project.status}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                    <span>Verified</span>
                    <span>{project.verified}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all"
                      style={{ width: `${project.verified}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Recent Activity
          </h2>
          <div className="mt-4 space-y-1">
            {activity.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50"
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.bg}`}
                  >
                    <Icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[var(--foreground)] leading-snug">
                      {item.text}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      {item.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
