import React, { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { authService } from "@/lib/authService";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { User, Lock, Crown, Shield, AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PLAN_INFO = {
  free: { label: "Free", color: "text-[#4a6080]", border: "border-bg-border", bg: "bg-bg-elevated" },
  pro: { label: "Pro", color: "text-yellow-warn", border: "border-yellow-dim", bg: "bg-yellow-dim/10" },
  enterprise: { label: "Enterprise", color: "text-cyan-DEFAULT", border: "border-cyan-dim", bg: "bg-cyan-subtle" },
};

export function Settings() {
  const { user, refreshProfile } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [savingUsername, setSavingUsername] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  const handleSaveUsername = async () => {
    if (!username.trim() || username.trim().length < 2) {
      toast.error("Username must be at least 2 characters.");
      return;
    }
    setSavingUsername(true);
    const { error } = await supabase
      .from('profiles')
      .update({ username: username.trim(), updated_at: new Date().toISOString() })
      .eq('id', user!.id);

    if (error) {
      toast.error("Failed to update username.");
    } else {
      toast.success("Username updated.");
      await refreshProfile();
    }
    setSavingUsername(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message || "Failed to update password.");
    } else {
      toast.success("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setSavingPassword(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== "DELETE") {
      toast.error('Type DELETE to confirm.');
      return;
    }
    toast.error("Account deletion requires admin support. Contact support@neuralshield.ai");
    setShowDeleteConfirm(false);
    setDeleteText("");
  };

  const planInfo = PLAN_INFO[user?.plan || 'free'];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar title="Account Settings" subtitle="Profile · Security · Billing" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Profile */}
          <div className="card-base overflow-hidden">
            <div className="px-4 py-3 border-b border-bg-border flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-DEFAULT" />
              <span className="text-xs font-semibold text-white font-sans">Profile Information</span>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-[#4a6080] uppercase tracking-wider mb-1.5">Email</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded border border-bg-border bg-bg-base text-xs font-mono text-[#5a7090]">
                  <span className="flex-1">{user?.email}</span>
                  <Lock className="w-3 h-3 text-[#3a5070]" />
                </div>
                <div className="text-[9px] font-mono text-[#2a4060] mt-1">Email cannot be changed. Contact support if needed.</div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#4a6080] uppercase tracking-wider mb-1.5">Username</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="flex-1 px-3 py-2 rounded border border-bg-border bg-bg-base text-xs font-mono text-white focus:outline-none focus:border-cyan-dim transition-colors"
                    placeholder="Enter username"
                  />
                  <button
                    onClick={handleSaveUsername}
                    disabled={savingUsername || username === user?.username}
                    className="px-4 py-2 rounded bg-cyan-DEFAULT text-bg-base text-xs font-mono font-bold hover:bg-cyan-DEFAULT/90 transition-all disabled:opacity-40"
                  >
                    {savingUsername ? "SAVING..." : "SAVE"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#4a6080] uppercase tracking-wider mb-1.5">Role</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded border border-bg-border bg-bg-base text-xs font-mono">
                  <Shield className="w-3.5 h-3.5 text-cyan-DEFAULT" />
                  <span className={cn("font-bold uppercase", user?.role === 'admin' ? "text-yellow-warn" : "text-[#5a7090]")}>
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="card-base overflow-hidden">
            <div className="px-4 py-3 border-b border-bg-border flex items-center gap-2">
              <Lock className="w-4 h-4 text-yellow-warn" />
              <span className="text-xs font-semibold text-white font-sans">Security — Change Password</span>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-[#4a6080] uppercase tracking-wider mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-bg-border bg-bg-base text-xs font-mono text-white focus:outline-none focus:border-cyan-dim transition-colors"
                  placeholder="Min 8 characters"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[#4a6080] uppercase tracking-wider mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-bg-border bg-bg-base text-xs font-mono text-white focus:outline-none focus:border-cyan-dim transition-colors"
                  placeholder="Repeat new password"
                />
              </div>
              {newPassword && confirmPassword && (
                <div className={cn("flex items-center gap-1.5 text-[10px] font-mono", newPassword === confirmPassword ? "text-green-neon" : "text-red-alert")}>
                  {newPassword === confirmPassword ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {newPassword === confirmPassword ? "Passwords match" : "Passwords do not match"}
                </div>
              )}
              <button
                onClick={handleChangePassword}
                disabled={savingPassword || !newPassword || !confirmPassword}
                className="px-4 py-2 rounded border border-yellow-dim text-yellow-warn text-xs font-mono font-bold hover:bg-yellow-dim/20 transition-all disabled:opacity-40"
              >
                {savingPassword ? "UPDATING..." : "UPDATE PASSWORD"}
              </button>
            </div>
          </div>

          {/* Plan & Billing */}
          <div className="card-base overflow-hidden">
            <div className="px-4 py-3 border-b border-bg-border flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-warn" />
              <span className="text-xs font-semibold text-white font-sans">Plan & Billing</span>
            </div>
            <div className="p-4">
              <div className={cn("flex items-center gap-3 p-3 rounded border mb-4", planInfo.border, planInfo.bg)}>
                <Crown className={cn("w-5 h-5", planInfo.color)} />
                <div className="flex-1">
                  <div className={cn("text-sm font-bold font-sans", planInfo.color)}>{planInfo.label} Plan</div>
                  <div className="text-[10px] font-mono text-[#4a6080] mt-0.5">
                    {user?.plan === 'free' ? 'Upgrade to unlock real-time RL control and admin features.' :
                     user?.plan === 'pro' ? 'Full access — real-time RL control, admin panel, compliance tools.' :
                     'Enterprise deployment — dedicated infrastructure and custom SLA.'}
                  </div>
                </div>
                <span className={cn("text-[10px] font-mono font-bold border rounded px-2 py-1", planInfo.border, planInfo.color)}>
                  {planInfo.label.toUpperCase()}
                </span>
              </div>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 px-4 py-2 rounded bg-cyan-DEFAULT text-bg-base text-xs font-mono font-bold hover:bg-cyan-DEFAULT/90 transition-all"
              >
                <Crown className="w-3.5 h-3.5" />
                {user?.plan === 'free' ? 'Upgrade Plan' : 'Manage Billing'}
              </Link>
            </div>
          </div>

          {/* Danger zone */}
          <div className="card-base overflow-hidden border-red-dim/40">
            <div className="px-4 py-3 border-b border-red-dim/40 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-alert" />
              <span className="text-xs font-semibold text-red-alert font-sans">Danger Zone</span>
            </div>
            <div className="p-4">
              {!showDeleteConfirm ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white font-sans">Delete Account</div>
                    <div className="text-[10px] font-mono text-[#4a6080] mt-0.5">Permanently remove your account and all data. This cannot be undone.</div>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3 py-1.5 rounded border border-red-dim text-red-alert text-[10px] font-mono font-bold hover:bg-red-dim/20 transition-all"
                  >
                    DELETE
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs font-mono text-red-alert">Type <strong>DELETE</strong> to confirm account deletion:</div>
                  <input
                    type="text"
                    value={deleteText}
                    onChange={e => setDeleteText(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-red-dim bg-bg-base text-xs font-mono text-white focus:outline-none"
                    placeholder="DELETE"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => { setShowDeleteConfirm(false); setDeleteText(""); }} className="px-3 py-1.5 rounded border border-bg-border text-[#4a6080] text-[10px] font-mono hover:border-cyan-dim transition-all">
                      CANCEL
                    </button>
                    <button onClick={handleDeleteAccount} className="px-3 py-1.5 rounded bg-red-dim/30 border border-red-dim text-red-alert text-[10px] font-mono font-bold hover:bg-red-dim/50 transition-all">
                      CONFIRM DELETE
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
