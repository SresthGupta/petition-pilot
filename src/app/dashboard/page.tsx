"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
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
  Plus,
  Loader2,
} from "lucide-react";

type Project = Tables<"projects">;
type ActivityLog = Tables<"activity_log">;

const ACTION_ICON_MAP: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  verified: { icon: CheckCircle2, color: "text-[var(--success)]", bg: "bg-emerald-50" },
  uploaded: { icon: FileText, color: "text-[var(--primary)]", bg: "bg-indigo-50" },
  flagged: { icon: AlertCircle, color: "text-[var(--warning)]", bg: "bg-amber-50" },
  created: { icon: UserPlus, color: "text-[var(--accent)]", bg: "bg-cyan-50" },
};
const DEFAULT_ICON = { icon: Clock, color: "text-[var(--muted)]", bg: "bg-gray-50" };

function getStatusBadge(status: Project["status"]) {
  switch (status) {
    case "active":
      return { label: "Active", className: "bg-yellow-100 text-yellow-800" };
    case "completed":
      return { label: "Completed", className: "bg-green-100 text-green-800" };
    case "draft":
      return { label: "Draft", className: "bg-gray-100 text-gray-600" };
    case "archived":
      return { label: "Archived", className: "bg-gray-100 text-gray-500" };
    default:
      return { label: status, className: "bg-gray-100 text-gray-600" };
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(dateStr).toLocaleDateString();
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 rounded bg-gray-200" />
        <div className="h-9 w-9 rounded-lg bg-gray-100" />
      </div>
      <div className="mt-3 h-8 w-20 rounded bg-gray-200" />
      <div className="mt-2 h-3 w-28 rounded bg-gray-100" />
    </div>
  );
}

function SkeletonProject() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-5 w-48 rounded bg-gray-200" />
          <div className="mt-2 h-3 w-24 rounded bg-gray-100" />
        </div>
        <div className="h-5 w-16 rounded-full bg-gray-100" />
      </div>
      <div className="mt-4">
        <div className="h-2 rounded-full bg-gray-100" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    async function fetchData() {
      setLoadingData(true);
      const [projectsRes, activityRes] = await Promise.all([
        supabase
          .from("projects")
          .select("*")
          .eq("user_id", user!.id)
          .order("updated_at", { ascending: false }),
        supabase
          .from("activity_log")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      if (projectsRes.data) setProjects(projectsRes.data as typeof projects);
      if (activityRes.data) setActivities(activityRes.data as typeof activities);
      setLoadingData(false);
    }

    fetchData();
  }, [user]);

  // Compute real stats from projects data
  const totalSignatures = projects.reduce((sum, p) => sum + p.total_signatures, 0);
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const totalVerified = projects.reduce((sum, p) => sum + p.verified_count, 0);
  const verificationRate =
    totalSignatures > 0 ? ((totalVerified / totalSignatures) * 100).toFixed(1) : "0.0";
  const totalFlagged = projects.reduce((sum, p) => sum + p.flagged_count, 0);

  const stats = [
    {
      label: "Total Signatures",
      value: totalSignatures.toLocaleString(),
      icon: Users,
      change: `${activeProjects} active project${activeProjects === 1 ? "" : "s"}`,
      color: "text-[var(--primary)]",
      bg: "bg-indigo-50",
    },
    {
      label: "Active Projects",
      value: activeProjects.toString(),
      icon: FolderOpen,
      change: `${projects.length} total`,
      color: "text-[var(--accent)]",
      bg: "bg-cyan-50",
    },
    {
      label: "Verification Rate",
      value: `${verificationRate}%`,
      icon: ShieldCheck,
      change: `${totalVerified.toLocaleString()} verified`,
      color: "text-[var(--success)]",
      bg: "bg-emerald-50",
    },
    {
      label: "Flagged Signatures",
      value: totalFlagged.toLocaleString(),
      icon: Zap,
      change: "need review",
      color: "text-[var(--warning)]",
      bg: "bg-amber-50",
    },
  ];

  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";
  const recentProjects = projects.slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Welcome back, {displayName}
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Here&apos;s an overview of your petition verification activity.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {loadingData
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : stats.map((stat) => {
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
            {loadingData ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonProject key={i} />)
            ) : recentProjects.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-[var(--border)] bg-white p-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
                  <FolderOpen className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-[var(--foreground)]">
                  No projects yet
                </h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Create your first petition project to start verifying signatures.
                </p>
                <Link
                  href="/dashboard/projects/new"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  New Project
                </Link>
              </div>
            ) : (
              recentProjects.map((project) => {
                const badge = getStatusBadge(project.status);
                const verifiedPct =
                  project.total_signatures > 0
                    ? Math.round(
                        (project.verified_count / project.total_signatures) * 100
                      )
                    : 0;
                return (
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
                          {project.total_signatures.toLocaleString()} signatures
                        </p>
                      </div>
                      <span
                        className={`ml-3 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                        <span>Verified</span>
                        <span>{verifiedPct}%</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all"
                          style={{ width: `${verifiedPct}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Recent Activity
          </h2>
          <div className="mt-4 space-y-1">
            {loadingData ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg p-3 animate-pulse">
                  <div className="mt-0.5 h-8 w-8 rounded-lg bg-gray-100" />
                  <div className="flex-1">
                    <div className="h-4 w-full rounded bg-gray-200" />
                    <div className="mt-1 h-3 w-20 rounded bg-gray-100" />
                  </div>
                </div>
              ))
            ) : activities.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--border)] p-6 text-center">
                <Clock className="mx-auto h-6 w-6 text-gray-300" />
                <p className="mt-2 text-sm text-[var(--muted)]">No activity yet</p>
              </div>
            ) : (
              activities.map((item) => {
                const iconInfo =
                  ACTION_ICON_MAP[item.action] ||
                  Object.entries(ACTION_ICON_MAP).find(([key]) =>
                    item.action.toLowerCase().includes(key)
                  )?.[1] ||
                  DEFAULT_ICON;
                const Icon = iconInfo.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50"
                  >
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconInfo.bg}`}
                    >
                      <Icon className={`h-4 w-4 ${iconInfo.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[var(--foreground)] leading-snug">
                        {item.details || item.action}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--muted)]">
                        {timeAgo(item.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
