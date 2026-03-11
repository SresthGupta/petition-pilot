"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Save,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  SkipForward,
  Flag,
  Zap,
  Clock,
  User,
  MapPin,
  Calendar,
  Shield,
  Sparkles,
  Keyboard,
  Eye,
} from "lucide-react";

// ---------- Types ----------

type VerificationStatus = "verified" | "invalid" | "flagged" | "pending";

interface VoterMatch {
  name: string;
  address: string;
  party: string;
  registrationDate: string;
  confidence: number;
}

interface MockSignature {
  id: number;
  lineNumber: number;
  name: string;
  address: string;
  status: VerificationStatus;
  bestMatch: VoterMatch;
  alternativeMatches: VoterMatch[];
}

// ---------- Mock Data ----------

const MOCK_SIGNATURES: MockSignature[] = [
  {
    id: 1, lineNumber: 1,
    name: "Margaret A. Thompson",
    address: "4521 Elm St, Apt 3B",
    status: "verified",
    bestMatch: { name: "Margaret Ann Thompson", address: "4521 Elm Street, Apt 3B, District 5", party: "Democrat", registrationDate: "2018-03-14", confidence: 97 },
    alternativeMatches: [
      { name: "Margaret A. Tompson", address: "452 Elm St, District 5", party: "Democrat", registrationDate: "2020-06-01", confidence: 72 },
      { name: "Margret Thompson", address: "4521 Elm St, District 3", party: "Independent", registrationDate: "2019-11-20", confidence: 65 },
      { name: "M. Thompson", address: "4500 Elm St, District 5", party: "Democrat", registrationDate: "2022-01-10", confidence: 51 },
    ],
  },
  {
    id: 2, lineNumber: 2,
    name: "Robert J. Chen",
    address: "891 Oak Ave",
    status: "verified",
    bestMatch: { name: "Robert James Chen", address: "891 Oak Avenue, District 5", party: "Republican", registrationDate: "2016-09-22", confidence: 95 },
    alternativeMatches: [
      { name: "Robert Chen", address: "893 Oak Ave, District 5", party: "Democrat", registrationDate: "2021-04-15", confidence: 78 },
      { name: "R.J. Chen", address: "891 Oak Ave, District 2", party: "Republican", registrationDate: "2017-08-30", confidence: 68 },
      { name: "Robert G. Chen", address: "890 Oak Ave, District 5", party: "Independent", registrationDate: "2019-02-14", confidence: 55 },
    ],
  },
  {
    id: 3, lineNumber: 3,
    name: "Lisa M. Kowalski",
    address: "2200 Pine Rd, Unit 7",
    status: "verified",
    bestMatch: { name: "Lisa Marie Kowalski", address: "2200 Pine Road, Unit 7, District 5", party: "Democrat", registrationDate: "2015-01-08", confidence: 98 },
    alternativeMatches: [
      { name: "Lisa Kowalski", address: "2200 Pine Rd, District 5", party: "Democrat", registrationDate: "2020-10-12", confidence: 82 },
      { name: "L. Kowalski", address: "2202 Pine Rd, District 5", party: "Independent", registrationDate: "2018-07-19", confidence: 60 },
      { name: "Lisa M. Kowalsky", address: "2200 Pine Rd, District 4", party: "Democrat", registrationDate: "2021-03-25", confidence: 48 },
    ],
  },
  {
    id: 4, lineNumber: 4,
    name: "David Hernandez",
    address: "776 Maple Dr",
    status: "invalid",
    bestMatch: { name: "David R. Hernandez", address: "776 Maple Drive, District 5", party: "Democrat", registrationDate: "2019-05-11", confidence: 88 },
    alternativeMatches: [
      { name: "David Hernandez", address: "778 Maple Dr, District 3", party: "Republican", registrationDate: "2017-12-03", confidence: 74 },
      { name: "D. Hernandez", address: "776 Maple Dr, District 5", party: "Democrat", registrationDate: "2022-08-17", confidence: 62 },
      { name: "David L. Hernandez", address: "770 Maple Dr, District 5", party: "Independent", registrationDate: "2020-02-28", confidence: 50 },
    ],
  },
  {
    id: 5, lineNumber: 5,
    name: "Sarah B. O'Neill",
    address: "1450 Birch Ln",
    status: "flagged",
    bestMatch: { name: "Sarah Beth O'Neill", address: "1450 Birch Lane, District 5", party: "Independent", registrationDate: "2020-11-03", confidence: 76 },
    alternativeMatches: [
      { name: "Sarah O'Neil", address: "1450 Birch Ln, District 5", party: "Democrat", registrationDate: "2018-06-14", confidence: 71 },
      { name: "S. O'Neill", address: "1452 Birch Ln, District 5", party: "Independent", registrationDate: "2019-09-07", confidence: 58 },
      { name: "Sarah B. Oneill", address: "1450 Birch Lane, District 2", party: "Republican", registrationDate: "2021-01-22", confidence: 45 },
    ],
  },
  {
    id: 6, lineNumber: 6,
    name: "James W. Patterson",
    address: "3300 Cedar Blvd",
    status: "verified",
    bestMatch: { name: "James William Patterson", address: "3300 Cedar Boulevard, District 5", party: "Republican", registrationDate: "2014-07-19", confidence: 94 },
    alternativeMatches: [
      { name: "James Patterson", address: "3300 Cedar Blvd, District 5", party: "Democrat", registrationDate: "2020-03-11", confidence: 80 },
      { name: "J.W. Patterson", address: "3302 Cedar Blvd, District 5", party: "Republican", registrationDate: "2016-12-05", confidence: 66 },
      { name: "James W. Paterson", address: "3300 Cedar Blvd, District 4", party: "Independent", registrationDate: "2019-08-23", confidence: 52 },
    ],
  },
  {
    id: 7, lineNumber: 7,
    name: "Anita Patel",
    address: "550 Walnut Ct",
    status: "pending",
    bestMatch: { name: "Anita R. Patel", address: "550 Walnut Court, District 5", party: "Democrat", registrationDate: "2017-04-28", confidence: 92 },
    alternativeMatches: [
      { name: "Anita Patel", address: "552 Walnut Ct, District 5", party: "Democrat", registrationDate: "2021-07-09", confidence: 76 },
      { name: "A. Patel", address: "550 Walnut Ct, District 2", party: "Independent", registrationDate: "2018-11-15", confidence: 54 },
      { name: "Anita S. Patel", address: "550 Walnut Ct, District 5", party: "Republican", registrationDate: "2022-05-03", confidence: 49 },
    ],
  },
  {
    id: 8, lineNumber: 8,
    name: "William F. Brooks",
    address: "1875 Spruce Way",
    status: "pending",
    bestMatch: { name: "William Franklin Brooks", address: "1875 Spruce Way, District 5", party: "Democrat", registrationDate: "2013-10-15", confidence: 91 },
    alternativeMatches: [
      { name: "William Brooks", address: "1875 Spruce Way, District 5", party: "Republican", registrationDate: "2019-02-20", confidence: 79 },
      { name: "W.F. Brooks", address: "1877 Spruce Way, District 5", party: "Democrat", registrationDate: "2020-09-08", confidence: 63 },
      { name: "Will Brooks", address: "1875 Spruce Way, District 3", party: "Independent", registrationDate: "2021-06-14", confidence: 47 },
    ],
  },
  {
    id: 9, lineNumber: 9,
    name: "Elena V. Ruiz",
    address: "420 Chestnut Pl",
    status: "pending",
    bestMatch: { name: "Elena Victoria Ruiz", address: "420 Chestnut Place, District 5", party: "Democrat", registrationDate: "2018-08-07", confidence: 89 },
    alternativeMatches: [
      { name: "Elena Ruiz", address: "420 Chestnut Pl, District 5", party: "Democrat", registrationDate: "2020-12-01", confidence: 75 },
      { name: "E.V. Ruiz", address: "422 Chestnut Pl, District 5", party: "Independent", registrationDate: "2017-05-22", confidence: 59 },
      { name: "Elena V. Ruiz", address: "420 Chestnut Pl, District 1", party: "Republican", registrationDate: "2022-03-18", confidence: 44 },
    ],
  },
  {
    id: 10, lineNumber: 10,
    name: "Thomas K. Murphy",
    address: "990 Ash St, Apt 12",
    status: "pending",
    bestMatch: { name: "Thomas Kevin Murphy", address: "990 Ash Street, Apt 12, District 5", party: "Republican", registrationDate: "2016-02-29", confidence: 93 },
    alternativeMatches: [
      { name: "Thomas Murphy", address: "990 Ash St, District 5", party: "Democrat", registrationDate: "2019-07-16", confidence: 77 },
      { name: "T.K. Murphy", address: "990 Ash St, Apt 12, District 5", party: "Republican", registrationDate: "2021-11-04", confidence: 64 },
      { name: "Tom Murphy", address: "992 Ash St, District 5", party: "Independent", registrationDate: "2020-04-22", confidence: 50 },
    ],
  },
];

const VOTER_FILE: VoterMatch[] = [
  ...MOCK_SIGNATURES.map((s) => s.bestMatch),
  ...MOCK_SIGNATURES.flatMap((s) => s.alternativeMatches),
];

// ---------- Helpers ----------

const statusConfig: Record<VerificationStatus, { label: string; bg: string; text: string; border: string; dot: string; icon: typeof CheckCircle2 }> = {
  verified: { label: "Verified", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", icon: CheckCircle2 },
  invalid:  { label: "Invalid",  bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     dot: "bg-red-500",     icon: XCircle },
  flagged:  { label: "Flagged",  bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-500",   icon: AlertTriangle },
  pending:  { label: "Pending",  bg: "bg-gray-50",    text: "text-gray-500",     border: "border-gray-200",    dot: "bg-gray-400",    icon: Clock },
};

function confidenceColor(c: number) {
  if (c >= 90) return "text-emerald-600";
  if (c >= 75) return "text-amber-600";
  return "text-red-500";
}

function confidenceBg(c: number) {
  if (c >= 90) return "bg-emerald-50 border-emerald-200";
  if (c >= 75) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

function confidenceBarColor(c: number) {
  if (c >= 90) return "bg-emerald-500";
  if (c >= 75) return "bg-amber-500";
  return "bg-red-400";
}

// ---------- Component ----------

export default function VerifyPage() {
  const [signatures, setSignatures] = useState<MockSignature[]>(MOCK_SIGNATURES);
  const [currentIndex, setCurrentIndex] = useState(6); // Start at first pending (index 6, signature 7)
  const [selectedMatchIndex, setSelectedMatchIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [actionFlash, setActionFlash] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isSearchFocused = useRef(false);

  const current = signatures[currentIndex];
  const activeMatch = selectedMatchIndex !== null ? current.alternativeMatches[selectedMatchIndex] : current.bestMatch;

  // Stats
  const verified = signatures.filter((s) => s.status === "verified").length;
  const invalid = signatures.filter((s) => s.status === "invalid").length;
  const flagged = signatures.filter((s) => s.status === "flagged").length;
  const pending = signatures.filter((s) => s.status === "pending").length;
  const totalProcessed = verified + invalid + flagged;

  // Simulated totals for the project
  const totalSignatures = 89;
  const signaturesVerified = totalProcessed + 37; // pretend 37 were done before
  const sheetNumber = 3;
  const totalSheets = 12;

  const flash = useCallback((label: string) => {
    setActionFlash(label);
    setTimeout(() => setActionFlash(null), 600);
  }, []);

  const markStatus = useCallback((status: VerificationStatus) => {
    setSignatures((prev) =>
      prev.map((s, i) => (i === currentIndex ? { ...s, status } : s))
    );
    const labels: Record<VerificationStatus, string> = { verified: "Verified", invalid: "Invalid", flagged: "Flagged", pending: "Skipped" };
    flash(labels[status]);
    // Auto-advance after a short delay
    setTimeout(() => {
      setCurrentIndex((prev) => Math.min(prev + 1, signatures.length - 1));
      setSelectedMatchIndex(null);
      setSearchQuery("");
    }, 350);
  }, [currentIndex, signatures.length, flash]);

  const goTo = useCallback((idx: number) => {
    setCurrentIndex(Math.max(0, Math.min(idx, signatures.length - 1)));
    setSelectedMatchIndex(null);
    setSearchQuery("");
  }, [signatures.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isSearchFocused.current) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      switch (e.key.toLowerCase()) {
        case "v": markStatus("verified"); break;
        case "x": markStatus("invalid"); break;
        case "s": markStatus("pending"); break;
        case "f": markStatus("flagged"); break;
        case "arrowright": goTo(currentIndex + 1); break;
        case "arrowleft": goTo(currentIndex - 1); break;
        case "/":
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentIndex, markStatus, goTo]);

  // Filtered search results
  const searchResults = searchQuery.length >= 2
    ? VOTER_FILE.filter(
        (v) =>
          v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.address.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <div className="flex h-full flex-col -m-6 overflow-hidden">
      {/* ====== TOP BAR ====== */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/projects"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="h-5 w-px bg-gray-200" />
          <span className="text-sm font-semibold text-gray-900">City Council Recall - District 5</span>
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
            Sheet {sheetNumber} of {totalSheets}
          </span>
        </div>

        <div className="flex items-center gap-6">
          {/* Progress bar */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Eye className="h-3.5 w-3.5" />
              <span>{signaturesVerified} of {totalSignatures}</span>
            </div>
            <div className="h-1.5 w-32 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500"
                style={{ width: `${(signaturesVerified / totalSignatures) * 100}%` }}
              />
            </div>
          </div>

          {/* Speed */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-500">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span>~4.2 sec/sig</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
              <Save className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* ====== MAIN SPLIT ====== */}
      <div className="flex flex-1 overflow-hidden">
        {/* ---------- LEFT PANEL (60%) ---------- */}
        <div className="flex w-[60%] flex-col border-r border-gray-200 bg-gray-50/50">
          {/* Sheet header */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-white/80 px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50">
                <Shield className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Petition Sheet #{sheetNumber}</p>
                <p className="text-[11px] text-gray-400">Scanned 2026-03-10 at 2:34 PM</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {(["verified", "invalid", "flagged", "pending"] as VerificationStatus[]).map((st) => {
                const count = signatures.filter((s) => s.status === st).length;
                const cfg = statusConfig[st];
                return (
                  <span key={st} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.bg} ${cfg.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                    {count}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Signature rows (scanned document area) */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              {/* Column headers */}
              <div className="grid grid-cols-[48px_1fr_1fr_100px] gap-0 border-b border-gray-100 bg-gray-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                <span>#</span>
                <span>Signature / Printed Name</span>
                <span>Address</span>
                <span className="text-right">Status</span>
              </div>

              {signatures.map((sig, idx) => {
                const isActive = idx === currentIndex;
                const cfg = statusConfig[sig.status];
                const StatusIcon = cfg.icon;
                return (
                  <button
                    key={sig.id}
                    onClick={() => goTo(idx)}
                    className={`
                      grid w-full grid-cols-[48px_1fr_1fr_100px] gap-0 items-center px-4 py-3.5 text-left text-sm
                      border-b border-gray-50 transition-all duration-200 group relative
                      ${isActive
                        ? "bg-indigo-50/80 ring-2 ring-inset ring-indigo-400/50"
                        : "hover:bg-gray-50/80"
                      }
                    `}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-500 rounded-r-full" />
                    )}

                    {/* Line number */}
                    <span className={`font-mono text-xs ${isActive ? "text-indigo-600 font-bold" : "text-gray-400"}`}>
                      {sig.lineNumber}
                    </span>

                    {/* Name - styled to look handwritten */}
                    <span
                      className={`font-serif italic ${isActive ? "text-gray-900 font-semibold" : "text-gray-700"}`}
                      style={{ fontFamily: "'Georgia', 'Times New Roman', serif", letterSpacing: "0.01em" }}
                    >
                      {sig.name}
                    </span>

                    {/* Address */}
                    <span className={`text-xs ${isActive ? "text-gray-700" : "text-gray-500"}`}>
                      {sig.address}
                    </span>

                    {/* Status badge */}
                    <span className="flex justify-end">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        <StatusIcon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ---------- RIGHT PANEL (40%) ---------- */}
        <div className="flex w-[40%] flex-col overflow-y-auto bg-white">
          <div className="flex-1 space-y-4 p-5">
            {/* Currently selected signature */}
            <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
                  Selected Signature
                </p>
                <span className="text-xs text-gray-400">#{current.lineNumber}</span>
              </div>
              <p className="mt-2 text-lg font-bold text-gray-900" style={{ fontFamily: "'Georgia', serif" }}>
                {current.name}
              </p>
              <p className="mt-0.5 text-sm text-gray-500">{current.address}</p>
              <div className="mt-2">
                {(() => {
                  const cfg = statusConfig[current.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {cfg.label}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* AI Best Match */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-gray-900">AI Best Match</h3>
              </div>
              <div
                className={`rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer ${
                  selectedMatchIndex === null
                    ? `${confidenceBg(current.bestMatch.confidence)} ring-2 ring-indigo-400/30`
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
                onClick={() => setSelectedMatchIndex(null)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{current.bestMatch.name}</p>
                      <span className={`text-lg font-black ${confidenceColor(current.bestMatch.confidence)}`}>
                        {current.bestMatch.confidence}%
                      </span>
                    </div>
                    {/* Confidence bar */}
                    <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${confidenceBarColor(current.bestMatch.confidence)}`}
                        style={{ width: `${current.bestMatch.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <span>{current.bestMatch.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <User className="h-3 w-3 text-gray-400" />
                    <span>{current.bestMatch.party}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 col-span-2">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span>Registered {current.bestMatch.registrationDate}</span>
                  </div>
                </div>

                {selectedMatchIndex === null && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markStatus("verified");
                    }}
                    className="mt-3 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Confirm Match
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Alternative Matches */}
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                Alternative Matches
              </h3>
              <div className="space-y-2">
                {current.alternativeMatches.map((alt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedMatchIndex(idx)}
                    className={`w-full rounded-lg border p-3 text-left transition-all duration-200 ${
                      selectedMatchIndex === idx
                        ? `${confidenceBg(alt.confidence)} ring-2 ring-indigo-400/30`
                        : "border-gray-150 bg-white hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{alt.name}</span>
                      <span className={`text-sm font-black ${confidenceColor(alt.confidence)}`}>
                        {alt.confidence}%
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-gray-500 flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />
                      {alt.address}
                    </p>
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-gray-400">
                      <span>{alt.party}</span>
                      <span>Reg. {alt.registrationDate}</span>
                    </div>
                    {selectedMatchIndex === idx && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markStatus("verified");
                        }}
                        className="mt-2 w-full rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Confirm This Match
                        </span>
                      </button>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Search */}
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                Manual Search
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { isSearchFocused.current = true; }}
                  onBlur={() => { isSearchFocused.current = false; }}
                  placeholder="Search voter file by name or address..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                  /
                </kbd>
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
                  {searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
                      onClick={() => {
                        setSearchQuery("");
                        // In real app, this would select as match
                      }}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{result.name}</p>
                        <p className="text-[11px] text-gray-500">{result.address}</p>
                      </div>
                      <span className="text-[11px] text-gray-400">{result.party}</span>
                    </button>
                  ))}
                </div>
              )}
              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <p className="mt-2 text-center text-xs text-gray-400 py-3">No matching voters found</p>
              )}
            </div>

            {/* Action Buttons */}
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => markStatus("verified")}
                  className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 transition-all"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Valid
                  <kbd className="ml-1 rounded border border-emerald-400/50 bg-emerald-500/30 px-1 py-0.5 text-[10px]">V</kbd>
                </button>
                <button
                  onClick={() => markStatus("invalid")}
                  className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 active:bg-red-800 transition-all"
                >
                  <XCircle className="h-4 w-4" />
                  Invalid
                  <kbd className="ml-1 rounded border border-red-400/50 bg-red-500/30 px-1 py-0.5 text-[10px]">X</kbd>
                </button>
                <button
                  onClick={() => markStatus("pending")}
                  className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-all"
                >
                  <SkipForward className="h-4 w-4" />
                  Skip
                  <kbd className="ml-1 rounded border border-gray-200 bg-gray-100 px-1 py-0.5 text-[10px] text-gray-400">S</kbd>
                </button>
                <button
                  onClick={() => markStatus("flagged")}
                  className="flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 active:bg-amber-700 transition-all"
                >
                  <Flag className="h-4 w-4" />
                  Flag
                  <kbd className="ml-1 rounded border border-amber-300/50 bg-amber-400/30 px-1 py-0.5 text-[10px]">F</kbd>
                </button>
              </div>
            </div>

            {/* Keyboard shortcuts */}
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-200 py-2 text-[11px] text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors"
            >
              <Keyboard className="h-3 w-3" />
              {showShortcuts ? "Hide" : "Show"} Keyboard Shortcuts
            </button>
            {showShortcuts && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-500 space-y-1.5">
                <div className="flex justify-between"><span>Mark Valid</span><kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px]">V</kbd></div>
                <div className="flex justify-between"><span>Mark Invalid</span><kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px]">X</kbd></div>
                <div className="flex justify-between"><span>Skip</span><kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px]">S</kbd></div>
                <div className="flex justify-between"><span>Flag for Review</span><kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px]">F</kbd></div>
                <div className="flex justify-between"><span>Next Signature</span><kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px]">&rarr;</kbd></div>
                <div className="flex justify-between"><span>Previous Signature</span><kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px]">&larr;</kbd></div>
                <div className="flex justify-between"><span>Search Voter File</span><kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px]">/</kbd></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ====== BOTTOM BAR ====== */}
      <div className="flex h-12 shrink-0 items-center justify-between border-t border-gray-200 bg-white px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => goTo(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </button>
          <button
            onClick={() => goTo(currentIndex + 1)}
            disabled={currentIndex === signatures.length - 1}
            className="flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <span className="text-xs font-medium text-gray-500">
          Signature <span className="text-gray-900">{currentIndex + 1}</span> of {signatures.length}
        </span>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-gray-500">Verified:</span>
            <span className="font-semibold text-gray-900">{verified}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-gray-500">Invalid:</span>
            <span className="font-semibold text-gray-900">{invalid}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-gray-500">Flagged:</span>
            <span className="font-semibold text-gray-900">{flagged}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-gray-400" />
            <span className="text-gray-500">Remaining:</span>
            <span className="font-semibold text-gray-900">{pending}</span>
          </span>
        </div>
      </div>

      {/* ====== ACTION FLASH OVERLAY ====== */}
      {actionFlash && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <div
            className={`
              rounded-2xl px-8 py-4 text-2xl font-black shadow-2xl animate-[flash_0.6s_ease-out_forwards]
              ${actionFlash === "Verified" ? "bg-emerald-500 text-white" : ""}
              ${actionFlash === "Invalid" ? "bg-red-500 text-white" : ""}
              ${actionFlash === "Flagged" ? "bg-amber-500 text-white" : ""}
              ${actionFlash === "Skipped" ? "bg-gray-400 text-white" : ""}
            `}
          >
            {actionFlash}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes flash {
          0% { opacity: 0; transform: scale(0.8); }
          20% { opacity: 1; transform: scale(1.05); }
          80% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1) translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
