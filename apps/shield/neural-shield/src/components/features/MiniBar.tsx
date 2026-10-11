import React from "react";
import { cn } from "@/lib/utils";

interface MiniBarProps {
  value: number;
  max?: number;
  color?: string;
  height?: number;
  label?: string;
  showValue?: boolean;
}

export function MiniBar({ value, max = 1, color = "bg-cyan-DEFAULT", height = 4, label, showValue }: MiniBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2 w-full">
      {label && <span className="text-[10px] font-mono text-[#4a6080] w-20 shrink-0 truncate">{label}</span>}
      <div className="flex-1 bg-bg-elevated rounded-full overflow-hidden" style={{ height }}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showValue && <span className="text-[10px] font-mono text-[#5a7090] w-10 text-right shrink-0">{pct.toFixed(0)}%</span>}
    </div>
  );
}
