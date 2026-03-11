"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  FileText,
  Table,
  X,
  Rocket,
  Calendar,
  MapPin,
  FileType,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

const steps = [
  { number: 1, label: "Project Details" },
  { number: 2, label: "Upload Files" },
  { number: 3, label: "Review & Launch" },
];

const jurisdictions = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming",
];

const petitionTypes = [
  "Initiative",
  "Referendum",
  "Recall",
  "Candidate Nomination",
  "Charter Amendment",
  "Other",
];

interface PendingFile {
  file: File;
  name: string;
  size: string;
  type: string;
  progress: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function NewProjectPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 state
  const [name, setName] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [petitionType, setPetitionType] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");

  // Step 2 state
  const [petitionFiles, setPetitionFiles] = useState<PendingFile[]>([]);
  const [voterFiles, setVoterFiles] = useState<PendingFile[]>([]);
  const [dragOverPetition, setDragOverPetition] = useState(false);
  const [dragOverVoter, setDragOverVoter] = useState(false);
  const petitionInputRef = useRef<HTMLInputElement>(null);
  const voterInputRef = useRef<HTMLInputElement>(null);

  // Launch state
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const addFiles = useCallback(
    (files: FileList | null, zone: "petition" | "voter") => {
      if (!files) return;
      const newFiles: PendingFile[] = Array.from(files).map((f) => ({
        file: f,
        name: f.name,
        size: formatFileSize(f.size),
        type: f.name.split(".").pop()?.toUpperCase() || "FILE",
        progress: 0,
      }));
      if (zone === "petition") {
        setPetitionFiles((prev) => [...prev, ...newFiles]);
      } else {
        setVoterFiles((prev) => [...prev, ...newFiles]);
      }
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, zone: "petition" | "voter") => {
      e.preventDefault();
      if (zone === "petition") setDragOverPetition(false);
      else setDragOverVoter(false);
      addFiles(e.dataTransfer.files, zone);
    },
    [addFiles]
  );

  const removeFile = (zone: "petition" | "voter", index: number) => {
    if (zone === "petition") {
      setPetitionFiles((prev) => prev.filter((_, i) => i !== index));
    } else {
      setVoterFiles((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const canProceed = () => {
    if (currentStep === 1) return name && jurisdiction && petitionType;
    if (currentStep === 2) return true;
    return true;
  };

  const updateFileProgress = (
    zone: "petition" | "voter",
    index: number,
    progress: number
  ) => {
    const setter = zone === "petition" ? setPetitionFiles : setVoterFiles;
    setter((prev) =>
      prev.map((f, i) => (i === index ? { ...f, progress } : f))
    );
  };

  const handleLaunch = async () => {
    if (!user) return;
    setLaunching(true);
    setLaunchError(null);

    try {
      // 1. Create the project in the DB
      const { data: project, error: insertError } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name,
          state: jurisdiction,
          petition_type: petitionType,
          description: description || null,
          deadline: deadline || null,
          status: "active" as const,
        } as any)
        .select()
        .single() as { data: Tables<"projects"> | null; error: any };

      if (insertError || !project) {
        throw new Error(insertError?.message || "Failed to create project");
      }

      // 2. Upload petition sheets to storage and create DB records
      for (let i = 0; i < petitionFiles.length; i++) {
        const pf = petitionFiles[i];
        const storagePath = `${user.id}/${project.id}/${pf.file.name}`;

        updateFileProgress("petition", i, 30);

        const { error: uploadError } = await supabase.storage
          .from("petition-sheets")
          .upload(storagePath, pf.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(
            `Failed to upload petition sheet "${pf.name}": ${uploadError.message}`
          );
        }

        updateFileProgress("petition", i, 70);

        const { error: recordError } = await supabase
          .from("petition_sheets")
          .insert({
            project_id: project.id,
            file_name: pf.file.name,
            file_path: storagePath,
            file_size: pf.file.size,
            mime_type: pf.file.type || "application/octet-stream",
            sheet_number: i + 1,
            ocr_status: "pending" as const,
          } as any);

        if (recordError) {
          throw new Error(
            `Failed to save petition sheet record: ${recordError.message}`
          );
        }

        updateFileProgress("petition", i, 100);
      }

      // 3. Upload voter files to storage and create DB records
      for (let i = 0; i < voterFiles.length; i++) {
        const vf = voterFiles[i];
        const storagePath = `${user.id}/${project.id}/${vf.file.name}`;

        updateFileProgress("voter", i, 30);

        const { error: uploadError } = await supabase.storage
          .from("voter-files")
          .upload(storagePath, vf.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(
            `Failed to upload voter file "${vf.name}": ${uploadError.message}`
          );
        }

        updateFileProgress("voter", i, 70);

        const { error: recordError } = await supabase
          .from("voter_files")
          .insert({
            project_id: project.id,
            file_name: vf.file.name,
            file_path: storagePath,
            file_size: vf.file.size,
            record_count: 0,
            parsed_status: "pending" as const,
          } as any);

        if (recordError) {
          throw new Error(
            `Failed to save voter file record: ${recordError.message}`
          );
        }

        updateFileProgress("voter", i, 100);
      }

      // 4. Redirect to project detail page
      router.push(`/dashboard/projects/${project.id}`);
    } catch (err: unknown) {
      setLaunchError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      setLaunching(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-[var(--border)] bg-white px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10";

  const labelClass =
    "block text-sm font-medium text-[var(--foreground)] mb-1.5";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Hidden file inputs */}
      <input
        ref={petitionInputRef}
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif"
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files, "petition");
          e.target.value = "";
        }}
      />
      <input
        ref={voterInputRef}
        type="file"
        multiple
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files, "voter");
          e.target.value = "";
        }}
      />

      {/* Back button */}
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Create New Project
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Set up a new petition verification project in a few steps.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {steps.map((step, i) => (
          <div key={step.number} className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2.5 flex-1">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  currentStep > step.number
                    ? "bg-[var(--success)] text-white"
                    : currentStep === step.number
                    ? "bg-[var(--primary)] text-white"
                    : "bg-gray-100 text-[var(--muted)]"
                }`}
              >
                {currentStep > step.number ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`text-sm font-medium whitespace-nowrap ${
                  currentStep >= step.number
                    ? "text-[var(--foreground)]"
                    : "text-[var(--muted)]"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 rounded-full transition-colors ${
                  currentStep > step.number
                    ? "bg-[var(--success)]"
                    : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error banner */}
      {launchError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-[var(--danger)]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>{launchError}</div>
        </div>
      )}

      {/* Step content */}
      <div className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
        {/* Step 1: Project Details */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <label className={labelClass}>
                <span className="flex items-center gap-1.5">
                  <FileType className="h-4 w-4 text-[var(--muted)]" />
                  Project Name
                </span>
              </label>
              <input
                type="text"
                placeholder="e.g., City Council Recall - District 5"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[var(--muted)]" />
                  Jurisdiction / State
                </span>
              </label>
              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className={inputClass}
              >
                <option value="">Select a state...</option>
                {jurisdictions.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>
                <span className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-[var(--muted)]" />
                  Petition Type
                </span>
              </label>
              <select
                value={petitionType}
                onChange={(e) => setPetitionType(e.target.value)}
                className={inputClass}
              >
                <option value="">Select type...</option>
                {petitionTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-[var(--muted)]" />
                  Filing Deadline
                </span>
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-[var(--muted)]">Optional</p>
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                placeholder="Brief description of this petition project..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-[var(--muted)]">Optional</p>
            </div>
          </div>
        )}

        {/* Step 2: Upload Files */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Petition sheets upload */}
            <div>
              <label className={labelClass}>Petition Sheets</label>
              <p className="mb-3 text-xs text-[var(--muted)]">
                Upload scanned petition sheets as PDF or image files.
              </p>
              <div
                onClick={() => petitionInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverPetition(true);
                }}
                onDragLeave={() => setDragOverPetition(false)}
                onDrop={(e) => handleDrop(e, "petition")}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                  dragOverPetition
                    ? "border-[var(--primary)] bg-indigo-50"
                    : "border-[var(--border)] hover:border-[var(--primary-light)] hover:bg-gray-50"
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
                    <Upload className="h-5 w-5 text-[var(--primary)]" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-[var(--foreground)]">
                    Click to upload or drag and drop
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    PDF, PNG, JPG, TIFF (max 50MB per file)
                  </p>
                </div>
              </div>
              {/* File list */}
              {petitionFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {petitionFiles.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-gray-50 px-4 py-2.5"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--foreground)]">
                          {file.name}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {file.type} &middot; {file.size}
                        </p>
                        {file.progress > 0 && file.progress < 100 && (
                          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-full rounded-full bg-[var(--primary)] transition-all"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                      {!launching && (
                        <button
                          onClick={() => removeFile("petition", i)}
                          className="shrink-0 rounded-md p-1 text-[var(--muted)] hover:bg-gray-200 hover:text-[var(--danger)]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      {file.progress === 100 && (
                        <Check className="h-4 w-4 shrink-0 text-[var(--success)]" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Voter file upload */}
            <div>
              <label className={labelClass}>Voter File</label>
              <p className="mb-3 text-xs text-[var(--muted)]">
                Upload the registered voter file for signature matching.
              </p>
              <div
                onClick={() => voterInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverVoter(true);
                }}
                onDragLeave={() => setDragOverVoter(false)}
                onDrop={(e) => handleDrop(e, "voter")}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                  dragOverVoter
                    ? "border-[var(--accent)] bg-cyan-50"
                    : "border-[var(--border)] hover:border-[var(--accent-light)] hover:bg-gray-50"
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50">
                    <Table className="h-5 w-5 text-[var(--accent)]" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-[var(--foreground)]">
                    Click to upload or drag and drop
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    CSV, XLSX, XLS (max 200MB)
                  </p>
                </div>
              </div>
              {voterFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {voterFiles.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-gray-50 px-4 py-2.5"
                    >
                      <Table className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--foreground)]">
                          {file.name}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {file.type} &middot; {file.size}
                        </p>
                        {file.progress > 0 && file.progress < 100 && (
                          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-full rounded-full bg-[var(--accent)] transition-all"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                      {!launching && (
                        <button
                          onClick={() => removeFile("voter", i)}
                          className="shrink-0 rounded-md p-1 text-[var(--muted)] hover:bg-gray-200 hover:text-[var(--danger)]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      {file.progress === 100 && (
                        <Check className="h-4 w-4 shrink-0 text-[var(--success)]" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Review & Launch */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-[var(--foreground)]">
                Project Summary
              </h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Review the details below before launching.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                  Project Name
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
                  {name || "Untitled Project"}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                  Jurisdiction
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
                  {jurisdiction || "Not set"}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                  Petition Type
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
                  {petitionType || "Not set"}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                  Deadline
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
                  {deadline
                    ? new Date(deadline + "T00:00:00").toLocaleDateString(
                        "en-US",
                        { month: "long", day: "numeric", year: "numeric" }
                      )
                    : "Not set"}
                </p>
              </div>
            </div>

            {description && (
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                  Description
                </p>
                <p className="mt-1 text-sm text-[var(--foreground)]">
                  {description}
                </p>
              </div>
            )}

            {/* Uploaded files summary */}
            <div className="space-y-3">
              <div className="rounded-lg border border-[var(--border)] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[var(--primary)]" />
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      Petition Sheets
                    </span>
                  </div>
                  <span className="text-sm text-[var(--muted)]">
                    {petitionFiles.length} file
                    {petitionFiles.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {petitionFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {petitionFiles.map((f, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-indigo-50 px-2 py-1 text-xs text-[var(--primary)]"
                      >
                        {f.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-lg border border-[var(--border)] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Table className="h-4 w-4 text-[var(--accent)]" />
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      Voter File
                    </span>
                  </div>
                  <span className="text-sm text-[var(--muted)]">
                    {voterFiles.length} file
                    {voterFiles.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {voterFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {voterFiles.map((f, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-cyan-50 px-2 py-1 text-xs text-[var(--accent)]"
                      >
                        {f.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Estimated processing */}
            <div className="rounded-lg bg-gradient-to-r from-indigo-50 to-cyan-50 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                  <Rocket className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    Estimated Processing Time
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {petitionFiles.length > 0
                      ? `~${Math.max(petitionFiles.length * 3, 5)} minutes for ${petitionFiles.length} sheet${petitionFiles.length !== 1 ? "s" : ""}`
                      : "Upload petition sheets to get an estimate"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
          disabled={currentStep === 1 || launching}
          className={`inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium transition-colors ${
            currentStep === 1 || launching
              ? "cursor-not-allowed text-gray-300"
              : "text-[var(--foreground)] hover:bg-gray-50"
          }`}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {currentStep < 3 ? (
          <button
            onClick={() => setCurrentStep((s) => Math.min(3, s + 1))}
            disabled={!canProceed()}
            className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors ${
              canProceed()
                ? "bg-[var(--primary)] hover:bg-[var(--primary-dark)]"
                : "cursor-not-allowed bg-gray-300"
            }`}
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleLaunch}
            disabled={launching}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--success)] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-600 disabled:opacity-60"
          >
            {launching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Launching...
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4" />
                Launch Project
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
