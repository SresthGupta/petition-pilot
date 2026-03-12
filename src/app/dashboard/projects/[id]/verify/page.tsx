"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Fuse from "fuse.js";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { Tables } from "@/lib/supabase/types";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
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
  Loader2,
  FileText,
  Upload,
  Maximize2,
  Minimize2,
  Type,
  RotateCcw,
  Pencil,
} from "lucide-react";

// ---------- Types ----------

type VerificationStatus = "verified" | "invalid" | "flagged" | "pending" | "skipped";

type SignatureWithSheet = Tables<"signatures"> & {
  petition_sheets: { file_name: string } | null;
};

interface VoterMatch {
  voter: Tables<"voters">;
  confidence: number;
}

// ---------- Helpers ----------

const statusConfig: Record<
  VerificationStatus,
  { label: string; bg: string; text: string; border: string; dot: string; icon: typeof CheckCircle2 }
> = {
  verified: { label: "Verified", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", icon: CheckCircle2 },
  invalid:  { label: "Invalid",  bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     dot: "bg-red-500",     icon: XCircle },
  flagged:  { label: "Flagged",  bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-500",   icon: AlertTriangle },
  pending:  { label: "Pending",  bg: "bg-gray-50",    text: "text-gray-500",     border: "border-gray-200",    dot: "bg-gray-400",    icon: Clock },
  skipped:  { label: "Skipped",  bg: "bg-slate-50",   text: "text-slate-500",    border: "border-slate-200",   dot: "bg-slate-400",   icon: SkipForward },
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
  const params = useParams();
  const projectId = params.id as string;
  const { user } = useAuth();
  const supabase = createClient();

  // Data state
  const [project, setProject] = useState<Tables<"projects"> | null>(null);
  const [signatures, setSignatures] = useState<SignatureWithSheet[]>([]);
  const [sheets, setSheets] = useState<Tables<"petition_sheets">[]>([]);
  const [voters, setVoters] = useState<Tables<"voters">[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedMatchIndex, setSelectedMatchIndex] = useState<number | null>(null);
  const [matches, setMatches] = useState<VoterMatch[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [actionFlash, setActionFlash] = useState<string | null>(null);
  const [ocrRunning, setOcrRunning] = useState<string | null>(null); // sheet ID being processed
  const [verifyingAction, setVerifyingAction] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedAddress, setEditedAddress] = useState("");
  const [pdfImageUrl, setPdfImageUrl] = useState<string | null>(null);
  const pdfCacheRef = useRef<{ sheetId: string; url: string } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isSearchFocused = useRef(false);
  const [startTime] = useState(Date.now());
  const [actionsCount, setActionsCount] = useState(0);

  const current = signatures[currentIndex] ?? null;

  // Sync editable fields when current signature changes
  useEffect(() => {
    if (current) {
      setEditedName(current.extracted_name || "");
      setEditedAddress(current.extracted_address || "");
    }
  }, [current?.id, current?.extracted_name, current?.extracted_address]);

  // Fuse.js instance for client-side manual search
  const fuseRef = useRef<Fuse<Tables<"voters">> | null>(null);
  useEffect(() => {
    if (voters.length > 0) {
      fuseRef.current = new Fuse(voters, {
        keys: ["full_name", "address"],
        threshold: 0.4,
        includeScore: true,
        shouldSort: true,
        minMatchCharLength: 2,
      });
    }
  }, [voters]);

  // ---------- Data Fetching ----------

  const fetchProject = useCallback(async () => {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();
    if (data) setProject(data as unknown as Tables<"projects">);
  }, [supabase, projectId]);

  const fetchSignatures = useCallback(async () => {
    const { data } = await supabase
      .from("signatures")
      .select("*, petition_sheets(file_name)")
      .eq("project_id", projectId)
      .order("sheet_id")
      .order("line_number");
    if (data) {
      const typed = data as unknown as SignatureWithSheet[];
      setSignatures(typed);
      // Start at the first pending signature
      const firstPending = typed.findIndex((s) => s.status === "pending");
      if (firstPending >= 0) setCurrentIndex(firstPending);
    }
  }, [supabase, projectId]);

  const fetchSheets = useCallback(async () => {
    const { data } = await supabase
      .from("petition_sheets")
      .select("*")
      .eq("project_id", projectId)
      .order("sheet_number");
    if (data) setSheets(data as unknown as Tables<"petition_sheets">[]);
  }, [supabase, projectId]);

  const fetchVoters = useCallback(async () => {
    const { data } = await supabase
      .from("voters")
      .select("*")
      .eq("project_id", projectId);
    if (data) setVoters(data as unknown as Tables<"voters">[]);
  }, [supabase, projectId]);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      await Promise.all([fetchProject(), fetchSignatures(), fetchSheets(), fetchVoters()]);
      setLoading(false);
    }
    loadAll();
  }, [fetchProject, fetchSignatures, fetchSheets, fetchVoters]);

  // ---------- Voter Matching ----------

  const fetchMatches = useCallback(
    async (signatureId: string, overrideName?: string, overrideAddress?: string) => {
      setMatchesLoading(true);
      setSelectedMatchIndex(null);
      try {
        const body: Record<string, string> = { projectId, signatureId };
        if (overrideName !== undefined) body.overrideName = overrideName;
        if (overrideAddress !== undefined) body.overrideAddress = overrideAddress;

        const res = await fetch("/api/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (data.success && data.matches) {
          setMatches(
            data.matches.map((m: { voter: Tables<"voters">; confidence: number }) => ({
              voter: m.voter,
              confidence: m.confidence,
            }))
          );
        } else {
          setMatches([]);
        }
      } catch {
        setMatches([]);
      }
      setMatchesLoading(false);
    },
    [projectId]
  );

  // Fetch matches when current signature changes
  useEffect(() => {
    if (current && voters.length > 0) {
      fetchMatches(current.id);
    } else {
      setMatches([]);
    }
  }, [current?.id, voters.length, fetchMatches]);

  // ---------- Actions ----------

  const flash = useCallback((label: string) => {
    setActionFlash(label);
    setTimeout(() => setActionFlash(null), 600);
  }, []);

  const markStatus = useCallback(
    async (status: VerificationStatus) => {
      if (!current || verifyingAction) return;

      const labels: Record<VerificationStatus, string> = {
        verified: "Verified",
        invalid: "Invalid",
        flagged: "Flagged",
        pending: "Skipped",
        skipped: "Skipped",
      };
      flash(labels[status]);

      // Determine the matched voter info
      const activeMatchIdx = selectedMatchIndex;
      const activeMatch =
        activeMatchIdx !== null
          ? matches[activeMatchIdx]
          : matches[0] ?? null;

      setVerifyingAction(true);
      try {
        const action = status === "pending" ? "skipped" : status;
        const res = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signatureId: current.id,
            action,
            matchedVoter: activeMatch
              ? {
                  name: activeMatch.voter.full_name,
                  address: activeMatch.voter.address,
                  party: activeMatch.voter.party,
                }
              : undefined,
            matchedVoterId: activeMatch?.voter.id ?? undefined,
            confidence: activeMatch?.confidence ?? undefined,
          }),
        });

        const result = await res.json();

        if (!res.ok || !result.success) {
          flash("red");
          setVerifyingAction(false);
          return;
        }

        // Update local state
        setSignatures((prev) =>
          prev.map((s) =>
            s.id === current.id
              ? {
                  ...s,
                  status: status === "pending" ? "skipped" : status,
                  verified_by: user?.id ?? null,
                  verified_at: new Date().toISOString(),
                  matched_voter_id: activeMatch?.voter.id ?? null,
                  matched_voter_name: activeMatch?.voter.full_name ?? null,
                  matched_voter_address: activeMatch?.voter.address ?? null,
                  matched_voter_party: activeMatch?.voter.party ?? null,
                  match_confidence: activeMatch?.confidence ?? null,
                  match_method: activeMatch ? "manual" : null,
                }
              : s
          )
        );
        setActionsCount((c) => c + 1);

        // Also refresh project counts
        fetchProject();
      } catch {
        flash("red");
      }
      setVerifyingAction(false);

      // Auto-advance after a short delay
      setTimeout(() => {
        setCurrentIndex((prev) => Math.min(prev + 1, signatures.length - 1));
        setSelectedMatchIndex(null);
        setSearchQuery("");
      }, 350);
    },
    [current, signatures.length, flash, matches, selectedMatchIndex, user?.id, verifyingAction, fetchProject]
  );

  const goTo = useCallback(
    (idx: number) => {
      setCurrentIndex(Math.max(0, Math.min(idx, signatures.length - 1)));
      setSelectedMatchIndex(null);
      setSearchQuery("");
    },
    [signatures.length]
  );

  // ---------- OCR ----------

  const [ocrError, setOcrError] = useState<string | null>(null);

  const runOcr = useCallback(
    async (sheetId: string) => {
      setOcrRunning(sheetId);
      setOcrError(null);
      try {
        // Reset sheet status to pending so the API can re-process it
        await supabase
          .from("petition_sheets")
          .update({ ocr_status: "pending" as const })
          .eq("id", sheetId);

        const res = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetId }),
        });
        const data = await res.json();
        if (data.success) {
          await Promise.all([fetchSignatures(), fetchSheets()]);
        } else {
          setOcrError(data.error || "OCR failed. Click the button to retry.");
          await fetchSheets(); // refresh to show "failed" status
        }
      } catch {
        setOcrError("OCR request failed. Click the button to retry.");
        await fetchSheets();
      }
      setOcrRunning(null);
    },
    [fetchSignatures, fetchSheets, supabase]
  );

  // ---------- Keyboard Shortcuts ----------

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isSearchFocused.current) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      switch (e.key.toLowerCase()) {
        case "v":
          markStatus("verified");
          break;
        case "x":
          markStatus("invalid");
          break;
        case "s":
          markStatus("pending");
          break;
        case "f":
          markStatus("flagged");
          break;
        case "r":
          if (current) fetchMatches(current.id, editedName, editedAddress);
          break;
        case "arrowright":
          goTo(currentIndex + 1);
          break;
        case "arrowleft":
          goTo(currentIndex - 1);
          break;
        case "/":
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentIndex, markStatus, goTo, current, fetchMatches, editedName, editedAddress]);

  // ---------- Manual Search ----------

  const searchResults =
    searchQuery.length >= 2 && fuseRef.current
      ? fuseRef.current
          .search(searchQuery)
          .slice(0, 5)
          .map((r) => ({ voter: r.item, confidence: Math.round((1 - (r.score ?? 1)) * 100) }))
      : [];

  // ---------- Computed Stats ----------

  const verified = signatures.filter((s) => s.status === "verified").length;
  const invalid = signatures.filter((s) => s.status === "invalid").length;
  const flagged = signatures.filter((s) => s.status === "flagged").length;
  const pending = signatures.filter((s) => s.status === "pending").length;
  const totalProcessed = verified + invalid + flagged;
  const totalSignatures = project?.total_signatures ?? signatures.length;

  // Average speed
  const elapsed = (Date.now() - startTime) / 1000;
  const avgSpeed = actionsCount > 0 ? (elapsed / actionsCount).toFixed(1) : "--";

  // Sheet info for current signature
  const currentSheet = current
    ? sheets.find((sh) => sh.id === current.sheet_id)
    : null;
  const currentSheetNumber = currentSheet?.sheet_number ?? 1;

  // Pending OCR sheets
  const pendingOcrSheets = sheets.filter(
    (sh) => sh.ocr_status === "pending" || sh.ocr_status === "failed"
  );

  // Best match and alternatives
  const bestMatch = matches.length > 0 ? matches[0] : null;
  const alternativeMatches = matches.slice(1);
  const activeMatch =
    selectedMatchIndex !== null ? matches[selectedMatchIndex] : bestMatch;

  // ---------- Petition sheet image URL ----------

  const sheetImageUrl = currentSheet
    ? (() => {
        const { data } = supabase.storage
          .from("petition-sheets")
          .getPublicUrl(currentSheet.file_path);
        return data?.publicUrl ?? null;
      })()
    : null;

  // Render PDF sheets to image for cropping (cached per sheet)
  const isPdf = currentSheet ? /\.pdf$/i.test(currentSheet.file_name) : false;
  const currentSheetId = currentSheet?.id ?? null;
  useEffect(() => {
    if (!isPdf || !sheetImageUrl || !currentSheetId) {
      setPdfImageUrl(null);
      return;
    }
    // Cache hit: reuse already-rendered image for this sheet
    if (pdfCacheRef.current?.sheetId === currentSheetId) {
      setPdfImageUrl(pdfCacheRef.current.url);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
        const pdf = await pdfjsLib.getDocument({ url: sheetImageUrl, disableAutoFetch: true, disableStream: false }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvas, viewport }).promise;
        if (!cancelled) {
          canvas.toBlob((blob) => {
            if (blob && !cancelled) {
              // Revoke old cached URL if it's for a different sheet
              if (pdfCacheRef.current && pdfCacheRef.current.sheetId !== currentSheetId) {
                URL.revokeObjectURL(pdfCacheRef.current.url);
              }
              const url = URL.createObjectURL(blob);
              pdfCacheRef.current = { sheetId: currentSheetId, url };
              setPdfImageUrl(url);
            }
          }, "image/jpeg", 0.85);
        }
        pdf.destroy();
      } catch {
        if (!cancelled) setPdfImageUrl(null);
      }
    })();
    return () => { cancelled = true; };
  }, [isPdf, sheetImageUrl, currentSheetId]);

  // Unified image URL: rendered PDF image or direct image URL
  const displayImageUrl = isPdf ? pdfImageUrl : sheetImageUrl;

  // ---------- Loading State ----------

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm text-gray-500">Loading verification data...</p>
        </div>
      </div>
    );
  }

  // ---------- Empty State ----------

  if (signatures.length === 0) {
    return (
      <div className="flex h-full flex-col -m-6">
        {/* Top bar */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/projects/${projectId}`}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <div className="h-5 w-px bg-gray-200" />
            <span className="text-sm font-semibold text-gray-900">{project?.name ?? "Project"}</span>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="max-w-md text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
              <FileText className="h-8 w-8 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">No Signatures Found</h2>
            <p className="text-sm text-gray-500">
              Upload petition sheets and run OCR to extract signatures, or the sheets haven&apos;t been processed yet.
            </p>

            {pendingOcrSheets.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {pendingOcrSheets.length} sheet{pendingOcrSheets.length > 1 ? "s" : ""} {pendingOcrSheets.some((s) => s.ocr_status === "failed") ? "need OCR (includes failed)" : "awaiting OCR"}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {pendingOcrSheets.map((sheet) => (
                    <button
                      key={sheet.id}
                      onClick={() => runOcr(sheet.id)}
                      disabled={ocrRunning !== null}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors ${
                        sheet.ocr_status === "failed"
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-indigo-600 hover:bg-indigo-700"
                      }`}
                    >
                      {ocrRunning === sheet.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : sheet.ocr_status === "failed" ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {sheet.ocr_status === "failed" ? "Retry" : "Run"} OCR - Sheet #{sheet.sheet_number}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {ocrError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {ocrError}
              </div>
            )}

            {sheets.length === 0 && (
              <Link
                href={`/dashboard/projects/${projectId}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                <Upload className="h-4 w-4" />
                Upload Petition Sheets
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------- Main Render ----------

  return (
    <div className="flex h-full flex-col -m-6 overflow-hidden">
      {/* ====== TOP BAR ====== */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/projects/${projectId}`}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="h-5 w-px bg-gray-200" />
          <span className="text-sm font-semibold text-gray-900">{project?.name ?? "Project"}</span>
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
            Sheet {currentSheetNumber} of {sheets.length}
          </span>
        </div>

        <div className="flex items-center gap-6">
          {/* Progress bar */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Eye className="h-3.5 w-3.5" />
              <span>
                {totalProcessed} of {totalSignatures}
              </span>
            </div>
            <div className="h-1.5 w-32 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500"
                style={{ width: `${totalSignatures > 0 ? (totalProcessed / totalSignatures) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Speed */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-500">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span>~{avgSpeed} sec/sig</span>
          </div>

          {/* OCR button for pending sheets */}
          {pendingOcrSheets.length > 0 && (
            <button
              onClick={() => runOcr(pendingOcrSheets[0].id)}
              disabled={ocrRunning !== null}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {ocrRunning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
              {pendingOcrSheets[0]?.ocr_status === "failed" ? "Retry" : "Run"} OCR ({pendingOcrSheets.length})
            </button>
          )}

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
                <p className="text-sm font-semibold text-gray-900">
                  {currentSheet?.file_name ?? `Petition Sheet #${currentSheetNumber}`}
                </p>
                <p className="text-[11px] text-gray-400">
                  {currentSheet?.ocr_status === "completed"
                    ? "OCR Completed"
                    : currentSheet?.ocr_status === "processing"
                    ? "Processing..."
                    : "Pending OCR"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {(["verified", "invalid", "flagged", "pending", "skipped"] as VerificationStatus[]).map((st) => {
                const count = signatures.filter((s) => s.status === st).length;
                if (count === 0 && st === "skipped") return null;
                const cfg = statusConfig[st];
                return (
                  <span
                    key={st}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.bg} ${cfg.text}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                    {count}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Image + Extracted Text Section */}
          {current && (
            <div className="border-b border-gray-200 bg-white overflow-y-auto" style={{ maxHeight: imageExpanded ? "70vh" : "45vh" }}>
              {/* Image: Handwritten petition entry */}
              <div className="border-b border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Image</h3>
                    <p className="text-xs text-gray-500">Handwritten text of the given signature.</p>
                  </div>
                  {displayImageUrl && (
                    <button
                      onClick={() => setImageExpanded(!imageExpanded)}
                      className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
                      title={imageExpanded ? "Collapse image" : "Expand image"}
                    >
                      {imageExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </button>
                  )}
                </div>

                {displayImageUrl ? (
                  (() => {
                    // Calculate crop position based on line number
                    const sigsOnSheet = signatures.filter((s) => s.sheet_id === current.sheet_id);
                    const totalLines = Math.max(sigsOnSheet.length, current.line_number ?? 1);
                    const lineNum = current.line_number ?? 1;
                    // Petition sheets: ~12% header, rows fill the rest evenly
                    const headerPct = 12;
                    const bodyPct = 100 - headerPct;
                    const rowHeight = bodyPct / totalLines;
                    // Center on the current row
                    const yPct = Math.min(Math.max(headerPct + (lineNum - 0.5) * rowHeight, 0), 100);

                    return (
                      <div className="space-y-2">
                        {/* Cropped view of the actual petition entry row */}
                        <div
                          className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50 relative cursor-pointer"
                          style={{ height: imageExpanded ? "200px" : "120px" }}
                          onClick={() => setImageExpanded(!imageExpanded)}
                          title="Click to expand/collapse"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={displayImageUrl}
                            alt={`Entry row ${lineNum} on sheet ${currentSheetNumber}`}
                            className="w-full absolute left-0"
                            style={{
                              height: `${totalLines * (imageExpanded ? 200 : 120)}px`,
                              minHeight: "400px",
                              objectFit: "cover",
                              objectPosition: `center ${yPct}%`,
                              top: "50%",
                              transform: "translateY(-50%)",
                            }}
                          />
                          {/* Line indicator badge */}
                          <div className="absolute top-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                            Line {lineNum}
                          </div>
                        </div>

                        {/* Full sheet toggle */}
                        <details className="group">
                          <summary className="cursor-pointer text-[11px] font-medium text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            View full petition sheet
                          </summary>
                          <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden max-h-[500px] overflow-y-auto">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={displayImageUrl}
                              alt={`Petition sheet ${currentSheetNumber}`}
                              className="w-full object-contain"
                            />
                          </div>
                        </details>
                      </div>
                    );
                  })()
                ) : isPdf && !pdfImageUrl ? (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                    <Loader2 className="mx-auto h-10 w-10 text-gray-300 animate-spin" />
                    <p className="mt-2 text-sm text-gray-400">Rendering PDF...</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                    <FileText className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-400">
                      {currentSheet ? "No preview available" : "No sheet uploaded"}
                    </p>
                  </div>
                )}
              </div>

              {/* Extracted Text: Editable fields */}
              <div className="p-4">
                <div className="mb-3">
                  <h3 className="text-base font-bold text-gray-900">Extracted Text</h3>
                  <p className="text-xs text-gray-500">
                    Generated by OCR. Modify the text manually below to re-generate best matches if it appears off.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Editable Name */}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onFocus={() => { isSearchFocused.current = true; }}
                        onBlur={() => { isSearchFocused.current = false; }}
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-[10px] font-bold text-gray-400">
                        N
                      </div>
                    </div>
                  </div>

                  {/* Editable Address */}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Address</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editedAddress}
                        onChange={(e) => setEditedAddress(e.target.value)}
                        onFocus={() => { isSearchFocused.current = true; }}
                        onBlur={() => { isSearchFocused.current = false; }}
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-[10px] font-bold text-gray-400">
                        A
                      </div>
                    </div>
                  </div>

                  {current.extracted_date && (
                    <div>
                      <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Date Signed</label>
                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600">
                        {current.extracted_date}
                      </div>
                    </div>
                  )}

                  {/* Regenerate Best Matches button */}
                  <button
                    onClick={() => {
                      if (current) {
                        fetchMatches(current.id, editedName, editedAddress);
                      }
                    }}
                    disabled={matchesLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 transition-all"
                  >
                    {matchesLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                    Regenerate Best Matches
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-indigo-500/50 text-[10px] font-bold">
                      R
                    </div>
                  </button>

                  {/* Show edit indicator if text was modified */}
                  {(editedName !== (current.extracted_name || "") || editedAddress !== (current.extracted_address || "")) && (
                    <p className="flex items-center gap-1.5 text-[11px] text-amber-600">
                      <Pencil className="h-3 w-3" />
                      Text has been modified from original OCR. Click Regenerate to update matches.
                    </p>
                  )}
                </div>

                {/* Raw OCR text snippet if available */}
                {currentSheet?.ocr_raw_text && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-[11px] font-medium text-indigo-500 hover:text-indigo-600 transition-colors">
                      View full OCR output for this sheet
                    </summary>
                    <pre className="mt-1.5 max-h-32 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-[11px] leading-relaxed text-gray-600 whitespace-pre-wrap font-mono">
                      {currentSheet.ocr_raw_text}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          )}

          {/* Signature rows */}
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
                const cfg = statusConfig[sig.status as VerificationStatus] ?? statusConfig.pending;
                const StatusIcon = cfg.icon;
                return (
                  <button
                    key={sig.id}
                    onClick={() => goTo(idx)}
                    className={`
                      grid w-full grid-cols-[48px_1fr_1fr_100px] gap-0 items-center px-4 py-2.5 text-left text-sm
                      border-b border-gray-50 transition-all duration-200 group relative
                      ${
                        isActive
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
                      {sig.line_number}
                    </span>

                    {/* Name */}
                    <span
                      className={`font-serif italic truncate ${isActive ? "text-gray-900 font-semibold" : "text-gray-700"}`}
                      style={{ fontFamily: "'Georgia', 'Times New Roman', serif", letterSpacing: "0.01em" }}
                    >
                      {sig.extracted_name}
                    </span>

                    {/* Address */}
                    <span className={`text-xs truncate ${isActive ? "text-gray-700" : "text-gray-500"}`}>
                      {sig.extracted_address}
                    </span>

                    {/* Status badge */}
                    <span className="flex justify-end">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${cfg.bg} ${cfg.text} ${cfg.border}`}
                      >
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
            {current ? (
              <>
                {/* Currently selected signature (compact) */}
                <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-white px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Georgia', serif" }}>
                      {editedName || current.extracted_name}
                    </p>
                    <span className="text-xs text-gray-400">#{current.line_number}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">{editedAddress || current.extracted_address}</p>
                </div>

                {/* Previously Matched Voter (shown when navigating back to a verified signature) */}
                {current && current.matched_voter_name && current.status !== "pending" && (
                  <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                        Matched Voter
                      </h3>
                      {current.match_confidence != null && (
                        <span className={`ml-auto text-sm font-black ${confidenceColor(current.match_confidence)}`}>
                          {current.match_confidence}%
                        </span>
                      )}
                    </div>
                    {current.match_confidence != null && (
                      <div className="mb-3 h-1.5 w-full rounded-full bg-emerald-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${confidenceBarColor(current.match_confidence)}`}
                          style={{ width: `${current.match_confidence}%` }}
                        />
                      </div>
                    )}
                    <p className="text-sm font-semibold text-gray-900">{current.matched_voter_name}</p>
                    {current.matched_voter_address && (
                      <p className="mt-1 text-xs text-gray-600 flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        {current.matched_voter_address}
                      </p>
                    )}
                    {current.matched_voter_party && (
                      <p className="mt-1 text-xs text-gray-600 flex items-center gap-1.5">
                        <User className="h-3 w-3 text-gray-400" />
                        {current.matched_voter_party}
                      </p>
                    )}
                    <p className="mt-2 text-[11px] text-emerald-600/70">
                      {current.matched_voter_address ? "Matched by name + address" : "Matched by name only"}
                      {current.verified_at && ` · ${new Date(current.verified_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`}
                    </p>
                  </div>
                )}

                {/* AI Best Match */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    <h3 className="text-sm font-bold text-gray-900">Best Match</h3>
                    {matchesLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
                  </div>

                  {matchesLoading ? (
                    <div className="rounded-xl border border-gray-200 p-6 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-indigo-400" />
                      <p className="mt-2 text-xs text-gray-400">Finding matches...</p>
                    </div>
                  ) : bestMatch ? (
                    <div
                      className={`rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer ${
                        selectedMatchIndex === null || selectedMatchIndex === 0
                          ? `${confidenceBg(bestMatch.confidence)} ring-2 ring-indigo-400/30`
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedMatchIndex(null)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{bestMatch.voter.full_name}</p>
                            <span className={`text-lg font-black ${confidenceColor(bestMatch.confidence)}`}>
                              {bestMatch.confidence}%
                            </span>
                          </div>
                          {/* Confidence bar */}
                          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${confidenceBarColor(bestMatch.confidence)}`}
                              style={{ width: `${bestMatch.confidence}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span>
                            {bestMatch.voter.address}
                            {bestMatch.voter.city ? `, ${bestMatch.voter.city}` : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <User className="h-3 w-3 text-gray-400" />
                          <span>{bestMatch.voter.party || "Unknown"}</span>
                        </div>
                        {bestMatch.voter.registration_date && (
                          <div className="flex items-center gap-1.5 text-gray-600 col-span-2">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span>Registered {bestMatch.voter.registration_date}</span>
                          </div>
                        )}
                      </div>

                      {(selectedMatchIndex === null || selectedMatchIndex === 0) && (
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
                  ) : voters.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center">
                      <p className="text-sm text-gray-500">No voter file uploaded yet.</p>
                      <p className="mt-1 text-xs text-gray-400">
                        Upload a voter file to enable automatic matching.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center">
                      <p className="text-sm text-gray-500">No matches found.</p>
                      <p className="mt-1 text-xs text-gray-400">Try manual search below.</p>
                    </div>
                  )}
                </div>

                {/* Alternative Matches */}
                {alternativeMatches.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                      Alternative Matches
                    </h3>
                    <div className="space-y-2">
                      {alternativeMatches.map((alt, idx) => {
                        const matchIdx = idx + 1; // offset by 1 since bestMatch is index 0
                        return (
                          <button
                            key={alt.voter.id}
                            onClick={() => setSelectedMatchIndex(matchIdx)}
                            className={`w-full rounded-lg border p-3 text-left transition-all duration-200 ${
                              selectedMatchIndex === matchIdx
                                ? `${confidenceBg(alt.confidence)} ring-2 ring-indigo-400/30`
                                : "border-gray-150 bg-white hover:border-gray-300 hover:shadow-sm"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900">{alt.voter.full_name}</span>
                              <span className={`text-sm font-black ${confidenceColor(alt.confidence)}`}>
                                {alt.confidence}%
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-gray-500 flex items-center gap-1">
                              <MapPin className="h-2.5 w-2.5" />
                              {alt.voter.address}
                              {alt.voter.city ? `, ${alt.voter.city}` : ""}
                            </p>
                            <div className="mt-1.5 flex items-center gap-3 text-[11px] text-gray-400">
                              <span>{alt.voter.party || "Unknown"}</span>
                              {alt.voter.registration_date && <span>Reg. {alt.voter.registration_date}</span>}
                            </div>
                            {selectedMatchIndex === matchIdx && (
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
                        );
                      })}
                    </div>
                  </div>
                )}

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
                      onFocus={() => {
                        isSearchFocused.current = true;
                      }}
                      onBlur={() => {
                        isSearchFocused.current = false;
                      }}
                      placeholder="Search voter file by name or address..."
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                    <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                      /
                    </kbd>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="mt-2 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
                      {searchResults.map((result) => (
                        <button
                          key={result.voter.id}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
                          onClick={() => {
                            // Add this voter as a manual match and verify
                            setSearchQuery("");
                            setMatches((prev) => [
                              { voter: result.voter, confidence: result.confidence },
                              ...prev,
                            ]);
                            setSelectedMatchIndex(0);
                          }}
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">{result.voter.full_name}</p>
                            <p className="text-[11px] text-gray-500">
                              {result.voter.address}
                              {result.voter.city ? `, ${result.voter.city}` : ""}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs font-bold ${confidenceColor(result.confidence)}`}>
                              {result.confidence}%
                            </span>
                            <p className="text-[11px] text-gray-400">{result.voter.party || ""}</p>
                          </div>
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
                      disabled={verifyingAction}
                      className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 transition-all"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Valid
                      <kbd className="ml-1 rounded border border-emerald-400/50 bg-emerald-500/30 px-1 py-0.5 text-[10px]">
                        V
                      </kbd>
                    </button>
                    <button
                      onClick={() => markStatus("invalid")}
                      disabled={verifyingAction}
                      className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 active:bg-red-800 disabled:opacity-50 transition-all"
                    >
                      <XCircle className="h-4 w-4" />
                      Invalid
                      <kbd className="ml-1 rounded border border-red-400/50 bg-red-500/30 px-1 py-0.5 text-[10px]">
                        X
                      </kbd>
                    </button>
                    <button
                      onClick={() => markStatus("pending")}
                      disabled={verifyingAction}
                      className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 transition-all"
                    >
                      <SkipForward className="h-4 w-4" />
                      Skip
                      <kbd className="ml-1 rounded border border-gray-200 bg-gray-100 px-1 py-0.5 text-[10px] text-gray-400">
                        S
                      </kbd>
                    </button>
                    <button
                      onClick={() => markStatus("flagged")}
                      disabled={verifyingAction}
                      className="flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 active:bg-amber-700 disabled:opacity-50 transition-all"
                    >
                      <Flag className="h-4 w-4" />
                      Flag
                      <kbd className="ml-1 rounded border border-amber-300/50 bg-amber-400/30 px-1 py-0.5 text-[10px]">
                        F
                      </kbd>
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
                    <div className="flex justify-between">
                      <span>Mark Valid</span>
                      <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px]">
                        V
                      </kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Mark Invalid</span>
                      <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px]">
                        X
                      </kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Skip</span>
                      <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px]">
                        S
                      </kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Flag for Review</span>
                      <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px]">
                        F
                      </kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Next Signature</span>
                      <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px]">
                        &rarr;
                      </kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Previous Signature</span>
                      <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px]">
                        &larr;
                      </kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Search Voter File</span>
                      <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px]">
                        /
                      </kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Regenerate Matches</span>
                      <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px]">
                        R
                      </kbd>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                No signature selected
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
              ${actionFlash === "red" ? "bg-red-600 text-white" : ""}
            `}
          >
            {actionFlash === "red" ? "Error" : actionFlash}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes flash {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          20% {
            opacity: 1;
            transform: scale(1.05);
          }
          80% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1) translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}
