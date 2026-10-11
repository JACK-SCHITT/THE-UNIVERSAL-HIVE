import { formatCurrency } from "@/lib/utils";
import type { ColossalApp } from "@/types";

interface Props {
  apps: ColossalApp[];
  totalRevenue: number;
  colossalEarnings: number;
}

export default function RevenueTracker({ apps, totalRevenue, colossalEarnings }: Props) {
  const liveApps = apps.filter((a) => a.status === "live");
  const buildingApps = apps.filter((a) => a.status === "building" || a.status === "deployed");

  return (
    <div className="glass-panel rounded-xl p-5">
      <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">
        Revenue Overview
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-3">
          <div className="text-xs text-muted-foreground mb-1">Portfolio MRR</div>
          <div className="text-xl font-bold text-primary">{formatCurrency(totalRevenue)}</div>
          <div className="text-xs text-muted-foreground mt-0.5">across {liveApps.length} live apps</div>
        </div>
        <div className="bg-gradient-to-br from-purple/10 to-purple/5 border border-purple/20 rounded-xl p-3">
          <div className="text-xs text-muted-foreground mb-1">Colossal Earnings</div>
          <div className="text-xl font-bold" style={{ color: "hsl(var(--purple))" }}>
            {formatCurrency(colossalEarnings)}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">this month</div>
        </div>
      </div>

      {/* App breakdown */}
      <div className="space-y-2">
        {apps.slice(0, 4).map((app) => (
          <div key={app.id} className="flex items-center gap-3 py-1.5">
            <span className="text-base">{app.logoEmoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-foreground truncate">{app.name}</div>
              <div className="h-1 bg-muted rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-primary/60 rounded-full"
                  style={{
                    width: totalRevenue > 0
                      ? `${Math.min((app.monthlyRevenue / totalRevenue) * 100, 100)}%`
                      : "0%",
                    transition: "width 0.8s ease",
                  }}
                />
              </div>
            </div>
            <div className="text-xs font-mono text-right flex-shrink-0">
              <div className="text-foreground">{app.monthlyRevenue > 0 ? formatCurrency(app.monthlyRevenue) : "Building"}</div>
              <div className="text-muted-foreground">{app.track}</div>
            </div>
          </div>
        ))}
      </div>

      {buildingApps.length > 0 && (
        <div className="mt-4 p-2.5 bg-amber-400/5 border border-amber-400/20 rounded-lg">
          <div className="text-xs text-amber-400 font-mono">
            {buildingApps.length} app{buildingApps.length > 1 ? "s" : ""} in pipeline
          </div>
        </div>
      )}
    </div>
  );
}
