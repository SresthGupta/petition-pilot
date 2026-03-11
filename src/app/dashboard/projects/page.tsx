"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  MoreHorizontal,
  Calendar,
  Users,
  Pencil,
  Trash2,
  Copy,
  AlertTriangle,
  FolderOpen,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

type Project = Tables<"projects">;

const statusConfig: Record<string, string> = {
  active: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  draft: "bg-gray-100 text-gray-600",
  archived: "bg-blue-100 text-blue-800",
};

const statusLabels: Record<string, string> = {
  active: "In Progress",
  completed: "Completed",
  draft: "Draft",
  archived: "Archived",
};

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const supabase = createClient();

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setProjects((data ?? []) as typeof projects);
    }
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDelete = async (projectId: string) => {
    setDeleting(true);
    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    }
    setDeleting(false);
    setDeleteConfirm(null);
    setOpenMenu(null);
  };

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Close menus on outside click
  useEffect(() => {
    const handler = () => setOpenMenu(null);
    if (openMenu) {
      document.addEventListener("click", handler);
      return () => document.removeEventListener("click", handler);
    }
  }, [openMenu]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-5 w-5 text-[var(--danger)]" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--foreground)]">
                  Delete Project
                </h3>
                <p className="text-sm text-[var(--muted)]">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="rounded-lg bg-[var(--danger)] px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Projects
          </h1>
          <p className="mt-1 text-[var(--muted)]">
            Manage your petition verification projects.
          </p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)]"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      {/* Search / Filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-white py-2.5 pl-10 pr-4 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
          />
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm"
            >
              <div className="h-5 w-3/4 rounded bg-gray-200" />
              <div className="mt-2 h-4 w-1/2 rounded bg-gray-100" />
              <div className="mt-4 flex gap-4">
                <div className="h-3 w-20 rounded bg-gray-100" />
                <div className="h-3 w-24 rounded bg-gray-100" />
              </div>
              <div className="mt-4 h-2 w-full rounded-full bg-gray-100" />
              <div className="mt-4 h-5 w-20 rounded-full bg-gray-100" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && projects.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <FolderOpen className="h-7 w-7 text-[var(--muted)]" />
          </div>
          <h3 className="mt-4 font-semibold text-[var(--foreground)]">
            No projects yet
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Create your first petition verification project to get started.
          </p>
          <Link
            href="/dashboard/projects/new"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)]"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </div>
      )}

      {/* Project grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => {
            const progress =
              project.total_signatures > 0
                ? Math.min(
                    Math.round(
                      (project.verified_count / project.total_signatures) * 100
                    ),
                    100
                  )
                : 0;

            return (
              <div
                key={project.id}
                className="group relative rounded-xl border border-[var(--border)] bg-white shadow-sm transition-all hover:shadow-md hover:border-[var(--primary-light)]"
              >
                {/* Actions dropdown */}
                <div className="absolute right-4 top-4 z-10">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setOpenMenu(
                        openMenu === project.id ? null : project.id
                      );
                    }}
                    className="rounded-md p-1 text-[var(--muted)] opacity-0 transition-all group-hover:opacity-100 hover:bg-gray-100 hover:text-[var(--foreground)]"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {openMenu === project.id && (
                    <div
                      className="absolute right-0 top-8 w-40 rounded-lg border border-[var(--border)] bg-white py-1 shadow-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-gray-50"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                      <button
                        onClick={() => {
                          setDeleteConfirm(project.id);
                          setOpenMenu(null);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--danger)] hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>

                <Link
                  href={`/dashboard/projects/${project.id}`}
                  className="block p-5"
                  onClick={() => setOpenMenu(null)}
                >
                  <div className="flex items-start justify-between pr-8">
                    <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors leading-snug">
                      {project.name}
                    </h3>
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {project.description || `${project.petition_type} - ${project.state}`}
                  </p>

                  {/* Meta row */}
                  <div className="mt-4 flex items-center gap-4 text-xs text-[var(--muted)]">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {project.total_signatures.toLocaleString()} signatures
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(project.created_at).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" }
                      )}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                      <span>Verified</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="mt-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusConfig[project.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {statusLabels[project.status] ?? project.status}
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* No search results (but projects exist) */}
      {!loading && projects.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Search className="h-7 w-7 text-[var(--muted)]" />
          </div>
          <h3 className="mt-4 font-semibold text-[var(--foreground)]">
            No projects found
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Try adjusting your search terms.
          </p>
        </div>
      )}
    </div>
  );
}
