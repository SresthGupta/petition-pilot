"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  Rocket,
  LayoutDashboard,
  FolderOpen,
  BarChart3,
  FileCheck,
  Settings,
  Bell,
  LogOut,
  ChevronRight,
  Loader2,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/dashboard/projects", icon: FolderOpen },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Compliance", href: "/dashboard/compliance", icon: FileCheck },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let path = "";
  for (const segment of segments) {
    path += `/${segment}`;
    crumbs.push({
      label: segment.charAt(0).toUpperCase() + segment.slice(1),
      href: path,
    });
  }
  return crumbs;
}

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name) {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) return email[0].toUpperCase();
  return "?";
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();
  const breadcrumbs = getBreadcrumbs(pathname);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-[var(--muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email || "User";
  const displayEmail = profile?.email || user.email || "";
  const initials = getInitials(profile?.full_name || user.user_metadata?.full_name, user.email);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col bg-[#1e1b4b] text-[var(--sidebar-text)]">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20">
            <Rocket className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Petition Pilot
          </span>
        </div>

        {/* Navigation */}
        <nav className="mt-2 flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-indigo-500/20 text-white"
                    : "text-indigo-200 hover:bg-indigo-500/10 hover:text-white"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-indigo-800/50 p-4">
          <div className="flex items-center gap-3">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-400/20 text-sm font-semibold text-white">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {displayName}
              </p>
              <p className="truncate text-xs text-indigo-300">
                {displayEmail}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="rounded-md p-1.5 text-indigo-300 transition-colors hover:bg-indigo-500/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] bg-white px-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1.5">
                {i > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 text-[var(--muted)]" />
                )}
                {i === breadcrumbs.length - 1 ? (
                  <span className="font-medium text-[var(--foreground)]">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button className="relative rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-gray-100 hover:text-[var(--foreground)]">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--danger)]" />
            </button>
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-semibold text-white">
                {initials}
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
