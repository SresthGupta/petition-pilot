"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  DollarSign,
  FileSignature,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  BarChart3,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { Tables } from "@/lib/supabase/types";

// ── Date Range Options ──────────────────────────────────────────────────────

type DateRange = "7d" | "30d" | "90d" | "all";

const dateRangeLabels: Record<DateRange, string> = {
  "7d": "7 Days",
  "30d": "30 Days",
  "90d": "90 Days",
  all: "All Time",
};

function getDateCutoff(range: DateRange): Date | null {
  if (range === "all") return null;
  const now = new Date();
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

// ── Sorting ─────────────────────────────────────────────────────────────────

type SortKey = "name" | "total" | "verified" | "invalid" | "flagged" | "accuracy";
type SortDir = "asc" | "desc";

// ── Custom Tooltip ──────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg">
      <p className="mb-1 text-xs font-medium text-gray-500">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [sortKey, setSortKey] = useState<SortKey>("accuracy");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [loading, setLoading] = useState(true);

  const [projects, setProjects] = useState<Tables<"projects">[]>([]);
  const [signatures, setSignatures] = useState<Tables<"signatures">[]>([]);
  const [activityLog, setActivityLog] = useState<Tables<"activity_log">[]>([]);

  // Fetch data
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function fetchData() {
      setLoading(true);

      // Fetch projects
      const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user!.id) as { data: Tables<"projects">[] | null };

      if (cancelled) return;
      const userProjects = projectsData ?? [];
      setProjects(userProjects);

      if (userProjects.length === 0) {
        setSignatures([]);
        setActivityLog([]);
        setLoading(false);
        return;
      }

      const projectIds = userProjects.map((p) => p.id);

      // Fetch signatures and activity in parallel
      const [sigResult, actResult] = await Promise.all([
        supabase
          .from("signatures")
          .select("*")
          .in("project_id", projectIds) as unknown as { data: Tables<"signatures">[] | null; error: { message: string } | null },
        supabase
          .from("activity_log")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false }) as unknown as { data: Tables<"activity_log">[] | null; error: { message: string } | null },
      ]);

      if (cancelled) return;
      if (sigResult.error) console.error("Failed to fetch signatures:", sigResult.error.message);
      if (actResult.error) console.error("Failed to fetch activity log:", actResult.error.message);
      setSignatures(sigResult.data ?? []);
      setActivityLog(actResult.data ?? []);
      setLoading(false);
    }

    fetchData();
    return () => { cancelled = true; };
  }, [user, supabase]);

  // Filter signatures by date range
  const filteredSignatures = useMemo(() => {
    const cutoff = getDateCutoff(dateRange);
    if (!cutoff) return signatures;
    return signatures.filter((s) => new Date(s.created_at) >= cutoff);
  }, [signatures, dateRange]);

  // ── Computed Metrics ──────────────────────────────────────────────────────

  const totalSignatures = filteredSignatures.length;

  const verifiedCount = filteredSignatures.filter((s) => s.status === "verified").length;
  const invalidCount = filteredSignatures.filter((s) => s.status === "invalid").length;
  const flaggedCount = filteredSignatures.filter((s) => s.status === "flagged").length;
  const pendingCount = filteredSignatures.filter((s) => s.status === "pending").length;

  const matchAccuracy =
    verifiedCount + invalidCount > 0
      ? ((verifiedCount / (verifiedCount + invalidCount)) * 100).toFixed(1)
      : "N/A";

  // Processing speed from activity log
  const processingSpeed = useMemo(() => {
    const verifyActions = activityLog.filter(
      (a) => a.action.toLowerCase().includes("verif")
    );
    if (verifyActions.length < 2) return "N/A";
    const times = verifyActions.map((a) => new Date(a.created_at).getTime()).sort();
    const avgGap = (times[times.length - 1] - times[0]) / (times.length - 1);
    const seconds = avgGap / 1000;
    return seconds < 60 ? `${seconds.toFixed(1)}s` : `${(seconds / 60).toFixed(1)}m`;
  }, [activityLog]);

  const costSavings = totalSignatures * 0.15;

  // ── Chart Data ────────────────────────────────────────────────────────────

  // Signatures over time
  const dailySignatures = useMemo(() => {
    const dateMap: Record<string, number> = {};
    filteredSignatures.forEach((s) => {
      const day = new Date(s.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      dateMap[day] = (dateMap[day] || 0) + 1;
    });
    return Object.entries(dateMap)
      .map(([date, signatures]) => ({ date, signatures }))
      .sort((a, b) => {
        // Sort chronologically using the current year as fallback
        const year = new Date().getFullYear();
        const dateA = new Date(a.date + ", " + year);
        const dateB = new Date(b.date + ", " + year);
        return dateA.getTime() - dateB.getTime();
      });
  }, [filteredSignatures]);

  // Accuracy by project
  const projectAccuracy = useMemo(() => {
    const projectMap = new Map(projects.map((p) => [p.id, p]));
    const grouped: Record<string, { verified: number; invalid: number; total: number; name: string }> = {};
    filteredSignatures.forEach((s) => {
      const proj = projectMap.get(s.project_id);
      const name = proj?.name ?? "Unknown";
      if (!grouped[s.project_id]) {
        grouped[s.project_id] = { verified: 0, invalid: 0, total: 0, name };
      }
      grouped[s.project_id].total++;
      if (s.status === "verified") grouped[s.project_id].verified++;
      if (s.status === "invalid") grouped[s.project_id].invalid++;
    });
    return Object.values(grouped)
      .map((g) => ({
        project: g.name.length > 18 ? g.name.slice(0, 16) + "..." : g.name,
        accuracy:
          g.verified + g.invalid > 0
            ? Number(((g.verified / (g.verified + g.invalid)) * 100).toFixed(1))
            : 0,
        signatures: g.total,
      }))
      .filter((p) => p.signatures > 0);
  }, [filteredSignatures, projects]);

  // Quality breakdown
  const qualityBreakdown = useMemo(() => {
    if (totalSignatures === 0) return [];
    return [
      { name: "Valid", value: Number(((verifiedCount / totalSignatures) * 100).toFixed(1)), color: "#10b981" },
      { name: "Invalid", value: Number(((invalidCount / totalSignatures) * 100).toFixed(1)), color: "#ef4444" },
      { name: "Flagged", value: Number(((flaggedCount / totalSignatures) * 100).toFixed(1)), color: "#f59e0b" },
      { name: "Pending", value: Number(((pendingCount / totalSignatures) * 100).toFixed(1)), color: "#94a3b8" },
    ];
  }, [totalSignatures, verifiedCount, invalidCount, flaggedCount, pendingCount]);

  // Rejection reasons
  const rejectionReasons = useMemo(() => {
    const flagged = filteredSignatures.filter((s) => s.flagged_reason);
    if (flagged.length === 0) return [];
    const reasonMap: Record<string, number> = {};
    flagged.forEach((s) => {
      const reason = s.flagged_reason || "Unknown";
      reasonMap[reason] = (reasonMap[reason] || 0) + 1;
    });
    const total = flagged.length;
    return Object.entries(reasonMap)
      .map(([reason, count]) => ({
        reason,
        pct: Number(((count / total) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5);
  }, [filteredSignatures]);

  // Jurisdiction insights from project states
  const jurisdictions = useMemo(() => {
    const stateMap: Record<string, { signatures: number; verified: number; invalid: number; pending: number }> = {};
    const projectStateMap = new Map(projects.map((p) => [p.id, p.state]));

    filteredSignatures.forEach((s) => {
      const state = projectStateMap.get(s.project_id) ?? "Unknown";
      if (!stateMap[state]) {
        stateMap[state] = { signatures: 0, verified: 0, invalid: 0, pending: 0 };
      }
      stateMap[state].signatures++;
      if (s.status === "verified") stateMap[state].verified++;
      if (s.status === "invalid") stateMap[state].invalid++;
      if (s.status === "pending") stateMap[state].pending++;
    });

    return Object.entries(stateMap).map(([name, data]) => ({
      name,
      icon: name.slice(0, 2).toUpperCase(),
      signatures: data.signatures,
      passRate:
        data.verified + data.invalid > 0
          ? Number(((data.verified / (data.verified + data.invalid)) * 100).toFixed(1))
          : 0,
      pending: data.pending,
    }));
  }, [filteredSignatures, projects]);

  // Project-level data for circulator-like table (per-project breakdown)
  const projectBreakdown = useMemo(() => {
    const projectMap = new Map(projects.map((p) => [p.id, p]));
    const grouped: Record<string, { name: string; total: number; verified: number; invalid: number; flagged: number }> = {};

    filteredSignatures.forEach((s) => {
      const proj = projectMap.get(s.project_id);
      const name = proj?.name ?? "Unknown";
      if (!grouped[s.project_id]) {
        grouped[s.project_id] = { name, total: 0, verified: 0, invalid: 0, flagged: 0 };
      }
      grouped[s.project_id].total++;
      if (s.status === "verified") grouped[s.project_id].verified++;
      if (s.status === "invalid") grouped[s.project_id].invalid++;
      if (s.status === "flagged") grouped[s.project_id].flagged++;
    });

    return Object.values(grouped).map((g) => ({
      name: g.name,
      total: g.total,
      verified: g.verified,
      invalid: g.invalid,
      flagged: g.flagged,
      accuracy: g.verified + g.invalid > 0 ? Number(((g.verified / (g.verified + g.invalid)) * 100).toFixed(1)) : 0,
    }));
  }, [filteredSignatures, projects]);

  const sortedProjects = useMemo(() => {
    return [...projectBreakdown].sort((a, b) => {
      const aVal = a[sortKey as keyof typeof a];
      const bVal = b[sortKey as keyof typeof b];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [projectBreakdown, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 text-gray-400" />;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 inline h-3.5 w-3.5 text-indigo-500" />
    ) : (
      <ArrowDown className="ml-1 inline h-3.5 w-3.5 text-indigo-500" />
    );
  }

  function validRateColor(rate: number) {
    if (rate >= 90) return "text-emerald-600 bg-emerald-50";
    if (rate >= 75) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  }

  // ── KPI Data ──────────────────────────────────────────────────────────────

  const kpis = [
    {
      label: "Total Signatures Processed",
      value: totalSignatures.toLocaleString(),
      change: totalSignatures > 0 ? `${projects.length} project${projects.length !== 1 ? "s" : ""}` : "No data",
      positive: true,
      icon: FileSignature,
      subtitle: "in period",
    },
    {
      label: "Average Match Accuracy",
      value: matchAccuracy === "N/A" ? "N/A" : `${matchAccuracy}%`,
      change: matchAccuracy === "N/A" ? "no data" : "estimated",
      positive: true,
      icon: Target,
      subtitle: "verified / (verified + invalid)",
    },
    {
      label: "Avg Processing Speed",
      value: processingSpeed,
      change: "estimated",
      positive: true,
      icon: Zap,
      subtitle: "between verifications",
    },
    {
      label: "Cost Savings vs Manual",
      value: `$${costSavings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      change: "estimated",
      positive: true,
      icon: DollarSign,
      subtitle: "@ $0.15/signature",
    },
  ];

  // ── Loading State ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="ml-3 text-sm text-gray-500">Loading analytics...</span>
      </div>
    );
  }

  // ── Empty State ───────────────────────────────────────────────────────────

  if (projects.length === 0 || totalSignatures === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor signature processing performance and quality metrics.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-24">
          <BarChart3 className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-700">No analytics data yet</h3>
          <p className="mt-2 max-w-sm text-center text-sm text-gray-500">
            Start verifying signatures to see analytics. Create a project, upload petition sheets, and verify signatures to populate this dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor signature processing performance and quality metrics.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          {(Object.keys(dateRangeLabels) as DateRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                dateRange === range
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {dateRangeLabels[range]}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">{kpi.label}</p>
                    <p className="text-3xl font-bold tracking-tight text-gray-900">
                      {kpi.value}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {kpi.change !== "estimated" && kpi.change !== "no data" ? (
                        <>
                          <span
                            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                              kpi.positive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {kpi.positive ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {kpi.change}
                          </span>
                          <span className="text-xs text-gray-400">{kpi.subtitle}</span>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">{kpi.subtitle}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                    <Icon className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
                {/* Decorative gradient line at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 opacity-60" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Charts Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Signatures Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Signatures Processed Over Time</CardTitle>
            <CardDescription>Daily signature count for the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {dailySignatures.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailySignatures} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="sigGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                      interval={Math.max(0, Math.floor(dailySignatures.length / 7))}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="signatures"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      fill="url(#sigGradient)"
                      dot={false}
                      activeDot={{ r: 5, fill: "#4f46e5", stroke: "#fff", strokeWidth: 2 }}
                      name="Signatures"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  No signature data for this period
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Accuracy by Project */}
        <Card>
          <CardHeader>
            <CardTitle>Verification Accuracy by Project</CardTitle>
            <CardDescription>Accuracy percentage per active project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {projectAccuracy.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectAccuracy} margin={{ top: 5, right: 10, left: -10, bottom: 0 }} barSize={36}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity={1} />
                        <stop offset="100%" stopColor="#818cf8" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="project"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `${v}%`}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="accuracy" fill="url(#barGradient)" radius={[6, 6, 0, 0]} name="Accuracy" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  No verified signatures yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Project Performance Table ───────────────────────────────── */}
      {sortedProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Project Performance</CardTitle>
            <CardDescription>Detailed breakdown by project. Click headers to sort.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {[
                      { key: "name" as SortKey, label: "Project Name" },
                      { key: "total" as SortKey, label: "Signatures" },
                      { key: "verified" as SortKey, label: "Verified" },
                      { key: "invalid" as SortKey, label: "Invalid" },
                      { key: "flagged" as SortKey, label: "Flagged" },
                      { key: "accuracy" as SortKey, label: "Accuracy" },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className="cursor-pointer whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600 transition-colors hover:text-gray-900 select-none"
                      >
                        {col.label}
                        <SortIcon column={col.key} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedProjects.map((p, i) => (
                    <tr
                      key={p.name}
                      className={`border-b border-gray-50 transition-colors hover:bg-gray-50/60 ${
                        i % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                      <td className="px-4 py-3 text-gray-600">{p.total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-600">{p.verified.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-600">{p.invalid.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${p.flagged > 100 ? "text-amber-600" : "text-gray-600"}`}>
                          {p.flagged}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${validRateColor(p.accuracy)}`}
                          >
                            {p.accuracy}%
                          </span>
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                              style={{ width: `${p.accuracy}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Signature Quality Breakdown ────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Donut Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Signature Quality Breakdown</CardTitle>
            <CardDescription>Distribution of signature verification outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            {qualityBreakdown.length > 0 ? (
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <div className="h-[240px] w-[240px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={qualityBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {qualityBreakdown.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-3">
                  {qualityBreakdown.map((item) => {
                    const icons: Record<string, React.ReactNode> = {
                      Valid: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
                      Invalid: <XCircle className="h-4 w-4 text-red-500" />,
                      Flagged: <AlertTriangle className="h-4 w-4 text-amber-500" />,
                      Pending: <Clock className="h-4 w-4 text-gray-400" />,
                    };
                    return (
                      <div key={item.name} className="flex items-center gap-3">
                        {icons[item.name]}
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-8">
                            <span className="text-sm font-medium text-gray-700">{item.name}</span>
                            <span className="text-sm font-bold text-gray-900">{item.value}%</span>
                          </div>
                          <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${item.value}%`, backgroundColor: item.color }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex h-[240px] items-center justify-center text-sm text-gray-400">
                No data to display
              </div>
            )}
          </CardContent>
        </Card>

        {/* Common Rejection Reasons */}
        <Card>
          <CardHeader>
            <CardTitle>Common Rejection Reasons</CardTitle>
            <CardDescription>Top reasons signatures are marked invalid or flagged</CardDescription>
          </CardHeader>
          <CardContent>
            {rejectionReasons.length > 0 ? (
              <div className="space-y-4">
                {rejectionReasons.map((item, i) => (
                  <div key={item.reason} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{item.reason}</span>
                      <span className="text-sm font-bold text-gray-900">{item.pct}%</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${item.pct}%`,
                          background:
                            i === 0
                              ? "linear-gradient(90deg, #ef4444, #f87171)"
                              : i === 1
                              ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                              : i === 2
                              ? "linear-gradient(90deg, #8b5cf6, #a78bfa)"
                              : i === 3
                              ? "linear-gradient(90deg, #06b6d4, #67e8f9)"
                              : "linear-gradient(90deg, #94a3b8, #cbd5e1)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-gray-400">
                No flagged signatures yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Jurisdiction Insights ──────────────────────────────────────── */}
      {jurisdictions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-indigo-500" />
              <div>
                <CardTitle>Jurisdiction Insights</CardTitle>
                <CardDescription>Signature verification metrics by jurisdiction</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {jurisdictions.map((j) => (
                <div
                  key={j.name}
                  className="group relative overflow-hidden rounded-xl border border-gray-100 bg-gradient-to-br from-white to-gray-50/50 p-5 transition-all duration-200 hover:border-indigo-200 hover:shadow-md"
                >
                  {/* State badge */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-sm font-bold text-indigo-600 transition-colors group-hover:bg-indigo-100">
                        {j.icon}
                      </div>
                      <span className="text-base font-semibold text-gray-900">{j.name}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Signatures</span>
                      <span className="text-sm font-bold text-gray-900">{j.signatures.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Pass Rate</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          j.passRate >= 90
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {j.passRate}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Pending Review</span>
                      <span className="text-sm font-medium text-gray-600">{j.pending.toLocaleString()}</span>
                    </div>

                    {/* Mini progress bar */}
                    <div className="pt-1">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                          style={{ width: `${j.passRate}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subtle decorative corner */}
                  <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-indigo-500/5 transition-all duration-300 group-hover:bg-indigo-500/10" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
