import { cn } from "@/lib/utils";
import type { SelfImprovementModule } from "@/types";

interface Props {
  modules: SelfImprovementModule[];
}

const STATUS_CONFIG = {
  available: { label: "Available", color: "text-muted-foreground", dot: "bg-muted-foreground/50" },
  integrating: { label: "Integrating...", color: "text-amber-400", dot: "bg-amber-400 animate-pulse" },
  active: { label: "Active", color: "text-green-400", dot: "bg-green-400" },
};

export default function SelfImprovementPanel({ modules }: Props) {
  const activeCount = modules.filter((m) => m.status === "active").length;

  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-sm">Self-Improvement Modules</div>
        <div className="text-xs font-mono text-primary">{activeCount}/{modules.length} active</div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-purple rounded-full transition-all duration-700"
          style={{ width: `${(activeCount / Math.max(modules.length, 1)) * 100}%` }}
        />
      </div>

      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
        {modules.map((mod) => {
          const cfg = STATUS_CONFIG[mod.status];
          return (
            <div
              key={mod.id}
              className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/30 border border-border/40"
            >
              <span className={cn("w-2 h-2 rounded-full mt-1 flex-shrink-0", cfg.dot)} />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">{mod.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{mod.description}</div>
              </div>
              <div className={cn("text-xs font-mono flex-shrink-0 mt-0.5", cfg.color)}>
                {cfg.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-muted-foreground text-center border-t border-border/40 pt-3">
        System auto-integrates new capabilities on demand
      </div>
    </div>
  );
}
