import React from "react";
import { Bell, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title: string;
  subtitle?: string;
  isLive?: boolean;
  tps?: number;
  actions?: React.ReactNode;
}

export function TopBar({ title, subtitle, isLive = true, tps, actions }: TopBarProps) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <header className="h-12 border-b border-bg-border bg-bg-card/80 backdrop-blur flex items-center px-6 gap-4 shrink-0 sticky top-0 z-20">
      <div className="flex-1">
        <span className="font-semibold text-sm text-white font-sans">{title}</span>
        {subtitle && <span className="ml-2 text-xs text-[#4a6080] font-mono">{subtitle}</span>}
      </div>

      <div className="flex items-center gap-4">
        {tps !== undefined && (
          <div className="text-xs font-mono text-[#4a6080]">
            <span className="text-cyan-DEFAULT font-bold">{(2847 + tps * 10).toLocaleString()}</span>
            <span className="ml-1">TXN/s</span>
          </div>
        )}

        <div className={cn("flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded border",
          isLive
            ? "text-green-neon border-green-dim bg-green-subtle"
            : "text-[#4a6080] border-bg-border"
        )}>
          {isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span>{isLive ? "LIVE" : "PAUSED"}</span>
        </div>

        <div className="text-xs font-mono text-[#2a4060]">
          <span className="text-[#3a5070]">{dateStr}</span>
          <span className="ml-1 text-[#4a6080]">{timeStr}</span>
        </div>

        <button className="relative text-[#3a5070] hover:text-cyan-DEFAULT transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-alert border border-bg-base" />
        </button>

        {actions}
      </div>
    </header>
  );
}
