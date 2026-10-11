import React, { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Zap, Activity, Shield, Server, FileCheck,
  ChevronRight, Settings, LogOut, User, Crown, ExternalLink, BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const NAV = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", sub: "Overview" },
  { to: "/transactions", icon: Zap, label: "Transactions", sub: "Live Feed" },
  { to: "/agent", icon: Activity, label: "RL Agent", sub: "Policy State" },
  { to: "/privacy", icon: Shield, label: "Privacy Layer", sub: "LDP · Federated" },
  { to: "/models", icon: Server, label: "Model Health", sub: "Ensemble + RL" },
  { to: "/compliance", icon: FileCheck, label: "Compliance", sub: "GLBA · PCI · GDPR" },
];

const PLAN_BADGE: Record<string, { label: string; class: string }> = {
  free: { label: 'FREE', class: 'text-[#4a6080] border-bg-border' },
  pro: { label: 'PRO', class: 'text-yellow-warn border-yellow-dim' },
  enterprise: { label: 'ENT', class: 'text-cyan-DEFAULT border-cyan-dim' },
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const planBadge = user ? (PLAN_BADGE[user.plan] || PLAN_BADGE.free) : null;

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-bg-card border-r border-bg-border h-screen sticky top-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-bg-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-gradient-to-br from-cyan-DEFAULT to-green-neon flex items-center justify-center">
            <Shield className="w-4 h-4 text-bg-base" />
          </div>
          <div>
            <div className="font-bold text-sm text-white font-sans tracking-tight">NeuralShield</div>
            <div className="text-[10px] text-[#4a6080] font-mono">RL FRAUD ENGINE v2.4.1</div>
          </div>
        </div>
      </div>

      {/* Status pill */}
      <div className="px-4 py-3 border-b border-bg-border">
        <div className="flex items-center gap-2 bg-green-subtle rounded px-2 py-1.5">
          <span className="status-dot bg-green-neon" />
          <span className="text-[11px] text-green-neon font-mono">CIRCUIT NOMINAL</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label, sub }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md group transition-all duration-150",
                isActive
                  ? "bg-cyan-subtle border border-cyan-dim text-cyan-DEFAULT"
                  : "text-[#5a7090] hover:text-[#aac4d8] hover:bg-bg-elevated"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-cyan-DEFAULT" : "text-[#3a5070] group-hover:text-[#5a8090]")} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold font-sans leading-none">{label}</div>
                  <div className={cn("text-[9px] mt-0.5 font-mono", isActive ? "text-cyan-DEFAULT/60" : "text-[#2a4060]")}>{sub}</div>
                </div>
                {isActive && <ChevronRight className="w-3 h-3 text-cyan-DEFAULT/50" />}
              </>
            )}
          </NavLink>
        ))}

        {/* Admin link */}
        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md group transition-all duration-150 mt-1",
                isActive
                  ? "bg-yellow-dim/20 border border-yellow-dim text-yellow-warn"
                  : "text-[#5a7090] hover:text-yellow-warn hover:bg-yellow-dim/10"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Settings className={cn("w-4 h-4 shrink-0", isActive ? "text-yellow-warn" : "text-[#3a5070] group-hover:text-yellow-warn")} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold font-sans leading-none">Admin Panel</div>
                  <div className={cn("text-[9px] mt-0.5 font-mono", isActive ? "text-yellow-warn/60" : "text-[#2a4060]")}>Plans · Users</div>
                </div>
              </>
            )}
          </NavLink>
        )}

        {/* Prime Directive link */}
        <NavLink
          to="/prime-directive"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md group transition-all duration-150 mt-1",
              isActive
                ? "bg-cyan-subtle border border-cyan-dim text-cyan-DEFAULT"
                : "text-[#5a7090] hover:text-cyan-DEFAULT hover:bg-bg-elevated"
            )
          }
        >
          {({ isActive }) => (
            <>
              <BookOpen className={cn("w-4 h-4 shrink-0", isActive ? "text-cyan-DEFAULT" : "text-[#3a5070] group-hover:text-cyan-DEFAULT")} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold font-sans leading-none">Prime Directive</div>
                <div className={cn("text-[9px] mt-0.5 font-mono", isActive ? "text-cyan-DEFAULT/60" : "text-[#2a4060]")}>Soul & Constitution</div>
              </div>
            </>
          )}
        </NavLink>

        {/* Settings link */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md group transition-all duration-150 mt-1",
              isActive
                ? "bg-cyan-subtle border border-cyan-dim text-cyan-DEFAULT"
                : "text-[#5a7090] hover:text-cyan-DEFAULT hover:bg-bg-elevated"
            )
          }
        >
          {({ isActive }) => (
            <>
              <Settings className={cn("w-4 h-4 shrink-0", isActive ? "text-cyan-DEFAULT" : "text-[#3a5070] group-hover:text-cyan-DEFAULT")} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold font-sans leading-none">Settings</div>
                <div className={cn("text-[9px] mt-0.5 font-mono", isActive ? "text-cyan-DEFAULT/60" : "text-[#2a4060]")}>Account & Security</div>
              </div>
            </>
          )}
        </NavLink>

        {/* Pricing link */}
        <Link
          to="/pricing"
          className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md group transition-all duration-150 text-[#5a7090] hover:text-cyan-DEFAULT hover:bg-bg-elevated mt-1"
        >
          <Crown className="w-4 h-4 shrink-0 text-[#3a5070] group-hover:text-cyan-DEFAULT" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold font-sans leading-none">Pricing</div>
            <div className="text-[9px] mt-0.5 font-mono text-[#2a4060]">Plans & Billing</div>
          </div>
          <ExternalLink className="w-3 h-3 text-[#2a4060] group-hover:text-cyan-DEFAULT/50" />
        </Link>
      </nav>

      {/* User section */}
      <div className="border-t border-bg-border">
        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(v => !v)}
              className="w-full px-4 py-3 flex items-center gap-2.5 hover:bg-bg-elevated transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-DEFAULT/30 to-green-neon/30 border border-cyan-dim flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-cyan-DEFAULT" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white font-sans truncate">{user.username}</div>
                <div className="text-[9px] font-mono text-[#4a6080] truncate">{user.email}</div>
              </div>
              <span className={cn("text-[9px] font-mono font-bold border rounded px-1 py-0.5 shrink-0", planBadge?.class)}>
                {planBadge?.label}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute bottom-full left-2 right-2 mb-1 bg-bg-card border border-bg-border rounded-lg shadow-xl overflow-hidden z-50">
                <div className="px-3 py-2 border-b border-bg-border">
                  <div className="text-[10px] font-mono text-[#4a6080]">Signed in as</div>
                  <div className="text-xs text-white font-mono truncate">{user.email}</div>
                </div>
                <Link
                  to="/pricing"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-[#aac4d8] hover:bg-bg-elevated hover:text-cyan-DEFAULT transition-colors"
                >
                  <Crown className="w-3.5 h-3.5" /> Manage Plan
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-[#4a6080] hover:bg-red-dim/20 hover:text-red-alert transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-3 flex gap-2">
            <Link to="/login" className="flex-1 text-center py-1.5 text-[10px] font-mono font-bold border border-bg-border rounded text-[#4a6080] hover:border-cyan-dim hover:text-cyan-DEFAULT transition-all">
              SIGN IN
            </Link>
            <Link to="/register" className="flex-1 text-center py-1.5 text-[10px] font-mono font-bold bg-cyan-DEFAULT text-bg-base rounded hover:bg-cyan-DEFAULT/90 transition-all">
              SIGN UP
            </Link>
          </div>
        )}

        <div className="px-4 py-2 border-t border-bg-border">
          <div className="text-[10px] text-[#2a4060] font-mono leading-relaxed">
            <div>ENV: PRODUCTION</div>
            <div>SHADOW_MODE: OFF</div>
            <div>TRAFFIC_SPLIT: 78%</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
