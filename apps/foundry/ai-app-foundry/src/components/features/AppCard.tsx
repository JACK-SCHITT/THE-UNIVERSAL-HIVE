import { cn, formatCurrency } from "@/lib/utils";
import type { ColossalApp } from "@/types";
import { useNavigate } from "react-router-dom";

interface Props {
  app: ColossalApp;
  featured?: boolean;
}

const STATUS_CONFIG = {
  ideation: { label: "Ideation", color: "text-muted-foreground", bg: "bg-muted/50" },
  building: { label: "Building", color: "text-amber-400", bg: "bg-amber-400/10" },
  deployed: { label: "Deployed", color: "text-blue-400", bg: "bg-blue-400/10" },
  live: { label: "Live", color: "text-green-400", bg: "bg-green-400/10" },
  archived: { label: "Archived", color: "text-muted-foreground", bg: "bg-muted/30" },
};

const PLATFORM_ICONS = { web: "🌐", ios: "🍎", android: "🤖" };

export default function AppCard({ app, featured = false }: Props) {
  const navigate = useNavigate();
  const status = STATUS_CONFIG[app.status];
  const colossalCut = app.monthlyRevenue * (app.status === "live" ? app.revShareLifetime : app.revShareYear1);

  return (
    <div
      className={cn(
        "agent-card rounded-xl p-5 cursor-pointer transition-all duration-300",
        featured && "border-primary/30 glow-cyan"
      )}
      onClick={() => navigate("/buyout")}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate("/buyout")}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-xl border border-border/60">
            {app.logoEmoji}
          </div>
          <div>
            <div className="font-semibold text-foreground leading-tight">{app.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{app.niche}</div>
          </div>
        </div>
        <div className={cn("text-xs font-mono px-2 py-0.5 rounded-full border", status.bg, status.color, "border-current/20")}>
          {status.label}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{app.description}</p>

      {/* Revenue */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-muted/30 rounded-lg p-2.5">
          <div className="text-xs text-muted-foreground mb-0.5">Monthly Revenue</div>
          <div className="font-bold text-foreground text-sm">
            {app.monthlyRevenue > 0 ? formatCurrency(app.monthlyRevenue) : "—"}
          </div>
        </div>
        <div className="bg-muted/30 rounded-lg p-2.5">
          <div className="text-xs text-muted-foreground mb-0.5">Colossal Cut</div>
          <div className="font-bold text-primary text-sm">
            {colossalCut > 0 ? formatCurrency(colossalCut) : "—"}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {app.platforms.map((p) => (
            <span key={p} className="text-xs" title={p}>
              {PLATFORM_ICONS[p]}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-xs font-mono px-2 py-0.5 rounded border",
              app.track === "pro"
                ? "text-purple border-purple/30 bg-purple/10"
                : "text-muted-foreground border-border bg-muted/30"
            )}
          >
            {app.track.toUpperCase()}
          </span>
          {app.growthRate > 0 && (
            <span className="text-xs text-green-400 font-mono">
              +{(app.growthRate * 100).toFixed(0)}%/yr
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
