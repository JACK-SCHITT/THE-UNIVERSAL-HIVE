import React from "react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  delta?: string;
  deltaPositive?: boolean;
  accent?: "cyan" | "green" | "red" | "yellow" | "orange";
  icon?: React.ReactNode;
  glow?: boolean;
}

const accentMap = {
  cyan: { value: "text-cyan-DEFAULT", bg: "bg-cyan-subtle", border: "border-cyan-dim", glow: "glow-cyan" },
  green: { value: "text-green-neon", bg: "bg-green-subtle", border: "border-green-dim", glow: "glow-green" },
  red: { value: "text-red-alert", bg: "bg-red-dim/10", border: "border-red-dim", glow: "glow-red" },
  yellow: { value: "text-yellow-warn", bg: "bg-yellow-dim/20", border: "border-yellow-dim", glow: "glow-yellow" },
  orange: { value: "text-orange-alert", bg: "bg-orange-400/10", border: "border-orange-400/30", glow: "" },
};

export function KPICard({ label, value, sub, delta, deltaPositive, accent = "cyan", icon, glow }: KPICardProps) {
  const a = accentMap[accent];
  return (
    <div className={cn(
      "card-base p-4 flex flex-col gap-2 relative overflow-hidden transition-all duration-200 hover:border-opacity-60",
      a.border,
      glow && a.glow
    )}>
      {/* Background gradient */}
      <div className={cn("absolute inset-0 opacity-5 pointer-events-none", a.bg)} />

      <div className="flex items-start justify-between relative">
        <span className="text-[10px] font-mono text-[#4a6080] uppercase tracking-widest">{label}</span>
        {icon && <span className={cn("opacity-60", a.value)}>{icon}</span>}
      </div>

      <div className={cn("text-2xl font-bold font-sans tracking-tight relative", a.value)}>{value}</div>

      <div className="flex items-center gap-2 relative">
        {sub && <span className="text-[11px] text-[#3a5070] font-mono">{sub}</span>}
        {delta && (
          <span className={cn("text-[10px] font-mono font-medium px-1.5 py-0.5 rounded",
            deltaPositive ? "text-green-neon bg-green-subtle" : "text-red-alert bg-red-dim/20"
          )}>
            {deltaPositive ? "▲" : "▼"} {delta}
          </span>
        )}
      </div>
    </div>
  );
}
