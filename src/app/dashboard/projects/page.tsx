"use client";

import { useState } from "react";
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
} from "lucide-react";

const allProjects = [
  {
    id: "1",
    name: "City Council Recall - District 5",
    signatures: 2340,
    goal: 3000,
    status: "In Progress" as const,
    date: "Feb 14, 2026",
    description: "Recall petition for District 5 council member",
  },
  {
    id: "2",
    name: "School Board Initiative 2026",
    signatures: 5120,
    goal: 5000,
    status: "Completed" as const,
    date: "Jan 28, 2026",
    description: "Education funding ballot initiative",
  },
  {
    id: "3",
    name: "Parks Bond Measure",
    signatures: 1204,
    goal: 4000,
    status: "In Progress" as const,
    date: "Mar 2, 2026",
    description: "Parks and recreation infrastructure bond",
  },
  {
    id: "4",
    name: "Rent Control Amendment",
    signatures: 0,
    goal: 6000,
    status: "Draft" as const,
    date: "Mar 9, 2026",
    description: "Citywide rent stabilization amendment",
  },
  {
    id: "5",
    name: "Transit Expansion Measure",
    signatures: 3872,
    goal: 4500,
    status: "In Progress" as const,
    date: "Dec 15, 2025",
    description: "Public transit expansion funding measure",
  },
  {
    id: "6",
    name: "Water Conservation Act",
    signatures: 7600,
    goal: 7500,
    status: "Completed" as const,
    date: "Nov 3, 2025",
    description: "Statewide water usage reduction initiative",
  },
];

const statusConfig = {
  "In Progress": "bg-yellow-100 text-yellow-800",
  Completed: "bg-green-100 text-green-800",
  Draft: "bg-gray-100 text-gray-600",
};

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filtered = allProjects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
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

      {/* Project grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((project) => {
          const progress =
            project.goal > 0
              ? Math.min(
                  Math.round((project.signatures / project.goal) * 100),
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
                    setOpenMenu(openMenu === project.id ? null : project.id);
                  }}
                  className="rounded-md p-1 text-[var(--muted)] opacity-0 transition-all group-hover:opacity-100 hover:bg-gray-100 hover:text-[var(--foreground)]"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {openMenu === project.id && (
                  <div className="absolute right-0 top-8 w-40 rounded-lg border border-[var(--border)] bg-white py-1 shadow-lg">
                    <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-gray-50">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-gray-50">
                      <Copy className="h-3.5 w-3.5" /> Duplicate
                    </button>
                    <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--danger)] hover:bg-red-50">
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
                  {project.description}
                </p>

                {/* Meta row */}
                <div className="mt-4 flex items-center gap-4 text-xs text-[var(--muted)]">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {project.signatures.toLocaleString()} signatures
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {project.date}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                    <span>Progress</span>
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
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig[project.status]}`}
                  >
                    {project.status}
                  </span>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
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
