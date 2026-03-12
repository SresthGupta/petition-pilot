"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  Lock,
  Bell,
  Key,
  Users,
  Trash2,
  Mail,
  BarChart3,
  AlertTriangle,
  Shield,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

function Toggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
        enabled ? "bg-indigo-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
        type === "success"
          ? "bg-emerald-600 text-white"
          : "bg-red-600 text-white"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <XCircle className="h-4 w-4" />
      )}
      {message}
    </div>
  );
}

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const supabase = createClient();

  // Profile
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [signatureAlerts, setSignatureAlerts] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Load real profile data
  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      setEmail(profile.email || "");
      setOrganization(profile.organization || "");
    } else if (user) {
      setName(user.user_metadata?.full_name || "");
      setEmail(user.email || "");
    }
  }, [profile, user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: name,
          organization: organization,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;
      await refreshProfile();
      setToast({ message: "Profile updated successfully", type: "success" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      setToast({ message, type: "error" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword) {
      setToast({ message: "Please enter a new password", type: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast({ message: "Passwords do not match", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      setToast({ message: "Password must be at least 6 characters", type: "error" });
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      setConfirmPassword("");
      setToast({ message: "Password updated successfully", type: "success" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update password";
      setToast({ message, type: "error" });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account, team, and preferences
        </p>
      </div>

      {/* Profile Section */}
      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
          <User className="h-5 w-5 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">Profile</h2>
        </div>
        <div className="space-y-4 p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Full name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="mt-1.5 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-400">
              Email cannot be changed here. Contact support if needed.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Organization
            </label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </section>

      {/* Password Section */}
      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
          <Lock className="h-5 w-5 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">
            Change Password
          </h2>
        </div>
        <div className="space-y-4 p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              New password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={handleChangePassword}
              disabled={savingPassword}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {savingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
              Update Password
            </button>
          </div>
        </div>
      </section>

      {/* Notification Preferences */}
      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
          <Bell className="h-5 w-5 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">
            Notification Preferences
          </h2>
          <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            Coming Soon
          </span>
        </div>
        <div className="divide-y divide-gray-100">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Email notifications
                </p>
                <p className="text-xs text-gray-500">
                  Receive updates about your projects via email
                </p>
              </div>
            </div>
            <Toggle
              enabled={emailNotifications}
              onToggle={() => setEmailNotifications(!emailNotifications)}
            />
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Weekly reports
                </p>
                <p className="text-xs text-gray-500">
                  Get a summary of verification activity each week
                </p>
              </div>
            </div>
            <Toggle
              enabled={weeklyReports}
              onToggle={() => setWeeklyReports(!weeklyReports)}
            />
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Signature alerts
                </p>
                <p className="text-xs text-gray-500">
                  Notify when flagged signatures exceed threshold
                </p>
              </div>
            </div>
            <Toggle
              enabled={signatureAlerts}
              onToggle={() => setSignatureAlerts(!signatureAlerts)}
            />
          </div>
        </div>
      </section>

      {/* API Keys */}
      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
          <Key className="h-5 w-5 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">API Keys</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-500">
            API access will be available on Professional and Enterprise plans. Stay tuned.
          </p>
        </div>
      </section>

      {/* Team Members */}
      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-gray-400" />
            <h2 className="text-base font-semibold text-gray-900">
              Team Members
            </h2>
          </div>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            Coming Soon
          </span>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-500">
            Team collaboration features are coming soon. You&apos;ll be able to invite team members and assign roles.
          </p>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="rounded-xl border border-red-200 bg-white">
        <div className="flex items-center gap-3 border-b border-red-100 px-6 py-4">
          <Shield className="h-5 w-5 text-red-400" />
          <h2 className="text-base font-semibold text-red-900">Danger Zone</h2>
        </div>
        <div className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm font-medium text-gray-900">Delete account</p>
            <p className="text-xs text-gray-500">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>
          </div>
          <a
            href="mailto:hello@petitionpilot.com?subject=Account%20Deletion%20Request"
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Request Deletion
          </a>
        </div>
      </section>
    </div>
  );
}
