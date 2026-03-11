"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";

// ── Mock Data ───────────────────────────────────────────────────────────────

const dailySignatures = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2026, 1, 10 + i);
  const base = 450 + Math.sin(i / 3) * 150 + i * 8;
  return {
    date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    signatures: Math.round(base + (Math.random() - 0.4) * 120),
  };
});

const projectAccuracy = [
  { project: "CA Prop 47", accuracy: 96.1, signatures: 4820 },
  { project: "OH Ballot Init.", accuracy: 91.3, signatures: 3640 },
  { project: "TX Amendment 5", accuracy: 94.7, signatures: 3210 },
  { project: "FL Citizens Rev.", accuracy: 88.9, signatures: 3890 },
  { project: "WA Initiative 22", accuracy: 97.2, signatures: 2687 },
];

const circulatorData = [
  { name: "Maria Santos", sheets: 142, total: 2840, validRate: 94.2, invalidRate: 4.1, flagged: 48, avgScore: 0.961 },
  { name: "James Chen", sheets: 128, total: 2560, validRate: 91.7, invalidRate: 5.8, flagged: 64, avgScore: 0.943 },
  { name: "Aisha Thompson", sheets: 156, total: 3120, validRate: 96.8, invalidRate: 2.1, flagged: 34, avgScore: 0.978 },
  { name: "David Kim", sheets: 98, total: 1960, validRate: 88.4, invalidRate: 7.9, flagged: 72, avgScore: 0.912 },
  { name: "Sarah Williams", sheets: 134, total: 2680, validRate: 93.1, invalidRate: 4.6, flagged: 62, avgScore: 0.952 },
  { name: "Carlos Rivera", sheets: 112, total: 2240, validRate: 72.3, invalidRate: 18.4, flagged: 208, avgScore: 0.841 },
  { name: "Emily Foster", sheets: 167, total: 3340, validRate: 95.6, invalidRate: 2.9, flagged: 50, avgScore: 0.969 },
  { name: "Marcus Johnson", sheets: 89, total: 1507, validRate: 78.9, invalidRate: 14.2, flagged: 104, avgScore: 0.878 },
];

const qualityBreakdown = [
  { name: "Valid", value: 72, color: "#10b981" },
  { name: "Invalid", value: 18, color: "#ef4444" },
  { name: "Flagged", value: 7, color: "#f59e0b" },
  { name: "Pending", value: 3, color: "#94a3b8" },
];

const rejectionReasons = [
  { reason: "Name not in voter file", pct: 42 },
  { reason: "Address mismatch", pct: 28 },
  { reason: "Duplicate signature", pct: 15 },
  { reason: "Illegible", pct: 10 },
  { reason: "Wrong jurisdiction", pct: 5 },
];

const jurisdictions = [
  { name: "California", signatures: 6420, passRate: 94.8, pending: 312, icon: "CA" },
  { name: "Ohio", signatures: 4890, passRate: 89.2, pending: 587, icon: "OH" },
  { name: "Florida", signatures: 3640, passRate: 91.5, pending: 214, icon: "FL" },
];

// ── Date Range Options ──────────────────────────────────────────────────────

type DateRange = "7d" | "30d" | "90d" | "all";

const dateRangeLabels: Record<DateRange, string> = {
  "7d": "7 Days",
  "30d": "30 Days",
  "90d": "90 Days",
  all: "All Time",
};

// ── Sorting ─────────────────────────────────────────────────────────────────

type SortKey = "name" | "sheets" | "total" | "validRate" | "invalidRate" | "flagged" | "avgScore";
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
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [sortKey, setSortKey] = useState<SortKey>("validRate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sortedCirculators = useMemo(() => {
    return [...circulatorData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [sortKey, sortDir]);

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
      value: "18,247",
      change: "+12.5%",
      positive: true,
      icon: FileSignature,
      subtitle: "vs last period",
    },
    {
      label: "Average Match Accuracy",
      value: "94.2%",
      change: "+2.1%",
      positive: true,
      icon: Target,
      subtitle: "vs last period",
    },
    {
      label: "Avg Processing Speed",
      value: "1.2s",
      change: "-0.3s",
      positive: true,
      icon: Zap,
      subtitle: "per signature",
    },
    {
      label: "Cost Savings vs Manual",
      value: "$14,280",
      change: "estimated",
      positive: true,
      icon: DollarSign,
      subtitle: "this period",
    },
  ];

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
                      {kpi.change !== "estimated" ? (
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
                    interval={4}
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
                    domain={[80, 100]}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="accuracy" fill="url(#barGradient)" radius={[6, 6, 0, 0]} name="Accuracy" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Circulator Performance Table ───────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Circulator Performance</CardTitle>
          <CardDescription>Detailed breakdown by individual circulator. Click headers to sort.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {[
                    { key: "name" as SortKey, label: "Circulator Name" },
                    { key: "sheets" as SortKey, label: "Sheets" },
                    { key: "total" as SortKey, label: "Signatures" },
                    { key: "validRate" as SortKey, label: "Valid Rate" },
                    { key: "invalidRate" as SortKey, label: "Invalid Rate" },
                    { key: "flagged" as SortKey, label: "Flagged" },
                    { key: "avgScore" as SortKey, label: "Avg Score" },
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
                {sortedCirculators.map((c, i) => (
                  <tr
                    key={c.name}
                    className={`border-b border-gray-50 transition-colors hover:bg-gray-50/60 ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.sheets.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">{c.total.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${validRateColor(c.validRate)}`}
                      >
                        {c.validRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.invalidRate}%</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${c.flagged > 100 ? "text-amber-600" : "text-gray-600"}`}>
                        {c.flagged}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                            style={{ width: `${c.avgScore * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600">
                          {(c.avgScore * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Signature Quality Breakdown ────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Donut Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Signature Quality Breakdown</CardTitle>
            <CardDescription>Distribution of signature verification outcomes</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Common Rejection Reasons */}
        <Card>
          <CardHeader>
            <CardTitle>Common Rejection Reasons</CardTitle>
            <CardDescription>Top reasons signatures are marked invalid</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>

      {/* ── Jurisdiction Insights ──────────────────────────────────────── */}
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
    </div>
  );
}
