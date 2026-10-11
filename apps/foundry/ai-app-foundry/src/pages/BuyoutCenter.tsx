import { useState } from "react";
import { useAppStore } from "@/stores/appStore";
import { calculateBuyout } from "@/lib/buyoutCalculator";
import { formatCurrency, formatLargeNumber } from "@/lib/utils";
import type { ColossalApp } from "@/types";
import { toast } from "sonner";
import { NICHE_MULTIPLIERS } from "@/constants";

export default function BuyoutCenter() {
  const store = useAppStore();
  const liveApps = store.apps.filter((a) => a.status === "live" && a.monthlyRevenue > 0);
  const [selectedApp, setSelectedApp] = useState<ColossalApp>(liveApps[0] ?? store.apps[0]);
  const [buyoutInitiated, setBuyoutInitiated] = useState<string | null>(null);

  if (!selectedApp) {
    return (
      <div className="max-w-screen-xl mx-auto px-6 py-24 text-center">
        <div className="text-6xl mb-4">💰</div>
        <div className="text-xl font-bold mb-2">No Live Apps Yet</div>
        <div className="text-muted-foreground">Build and launch an app to access the Buyout Center.</div>
      </div>
    );
  }

  const proj = calculateBuyout(
    selectedApp.id,
    selectedApp.monthlyRevenue,
    selectedApp.growthRate,
    selectedApp.niche
  );

  const handleBuyout = () => {
    if (buyoutInitiated === selectedApp.id) {
      toast.success(`Buyout request submitted for ${selectedApp.name}. Payment link incoming.`);
      return;
    }
    setBuyoutInitiated(selectedApp.id);
    toast("Buyout valuation confirmed. Review the terms and confirm payment.", { duration: 5000 });
  };

  const maxBar = Math.max(...proj.yearlyBreakdown.map((y) => y.revenue));

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Buyout Center</h1>
        <p className="text-muted-foreground text-sm mt-1">
          AI-calculated 10-year valuation. Buy out Colossal's stake. Own 100% forever.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* App Selector */}
        <div className="lg:col-span-1 space-y-4">
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">Select App</div>
          {liveApps.map((app) => (
            <button
              key={app.id}
              onClick={() => setSelectedApp(app)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                selectedApp.id === app.id
                  ? "border-primary/40 bg-primary/5 glow-cyan"
                  : "border-border bg-secondary/30 hover:border-primary/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{app.logoEmoji}</span>
                <div>
                  <div className="font-semibold text-sm text-foreground">{app.name}</div>
                  <div className="text-xs text-muted-foreground">{app.niche} · {formatCurrency(app.monthlyRevenue)}/mo</div>
                </div>
              </div>
            </button>
          ))}

          {/* Methodology */}
          <div className="glass-panel rounded-xl p-4 text-xs text-muted-foreground space-y-2 leading-relaxed">
            <div className="font-semibold text-foreground text-sm mb-2">How It's Calculated</div>
            <div>① Current MRR × 12 = Annual Revenue</div>
            <div>② Annual Revenue × (1 + growth)^year for 10 years</div>
            <div>③ Sum of 10-year projection</div>
            <div>④ Buyout Price = 10% of that total</div>
            <div className="pt-1 text-muted-foreground/70 border-t border-border">
              Niche multiplier ({selectedApp.niche}): {NICHE_MULTIPLIERS[selectedApp.niche] ?? 5.5}x
            </div>
          </div>
        </div>

        {/* Valuation Panel */}
        <div className="lg:col-span-2 space-y-5">
          {/* Key Numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: "Current MRR", value: formatCurrency(proj.currentMRR), sub: "monthly" },
              { label: "Annual Revenue", value: formatCurrency(proj.annualRevenue), sub: "current run rate" },
              { label: "Growth Rate", value: `+${(proj.growthRate * 100).toFixed(0)}%`, sub: "year over year" },
              { label: "10-Year Projection", value: formatLargeNumber(proj.projected10Year), sub: "total gross revenue" },
              { label: "Colossal's 10yr Share", value: formatLargeNumber(proj.colossalShare), sub: "10% lifetime stake" },
              { label: "Buyout Price", value: formatLargeNumber(proj.buyoutPrice), sub: "own 100% forever", highlight: true },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-xl p-4 border ${
                  item.highlight
                    ? "bg-gradient-to-br from-purple/10 to-purple/5 border-purple/30"
                    : "glass-panel border-border/60"
                }`}
              >
                <div className="text-xs text-muted-foreground font-mono mb-1">{item.label}</div>
                <div
                  className={`text-xl font-bold ${item.highlight ? "" : "text-foreground"}`}
                  style={item.highlight ? { color: "hsl(var(--purple))" } : {}}
                >
                  {item.value}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{item.sub}</div>
              </div>
            ))}
          </div>

          {/* 10-Year Chart */}
          <div className="glass-panel rounded-xl p-5">
            <div className="text-sm font-semibold mb-4">10-Year Revenue Projection</div>
            <div className="flex items-end gap-2 h-32">
              {proj.yearlyBreakdown.map((year) => (
                <div key={year.year} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-xs font-mono text-muted-foreground/60">
                    {formatLargeNumber(year.revenue).replace("$", "")}
                  </div>
                  <div
                    className="w-full rounded-t-sm bg-gradient-to-t from-primary/80 to-primary/40 transition-all duration-700"
                    style={{ height: `${(year.revenue / maxBar) * 100}px`, minHeight: "4px" }}
                  />
                  <div className="text-xs text-muted-foreground font-mono">Y{year.year}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Buyout CTA */}
          <div className="glass-panel rounded-xl p-6 border border-purple/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="font-bold text-foreground text-lg">Buy Out Colossal's Stake</div>
                <div className="text-muted-foreground text-sm mt-1">
                  One-time payment of{" "}
                  <strong style={{ color: "hsl(var(--purple))" }}>{formatLargeNumber(proj.buyoutPrice)}</strong>{" "}
                  — then 100% of all future revenue is yours.
                </div>
              </div>
              <button
                onClick={handleBuyout}
                className="flex-shrink-0 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200"
                style={{
                  background: "hsl(var(--purple))",
                  color: "white",
                  boxShadow: "0 0 20px hsla(270,100%,65%,0.3)",
                }}
              >
                {buyoutInitiated === selectedApp.id ? "✓ Confirm Payment" : "Initiate Buyout"}
              </button>
            </div>

            {buyoutInitiated === selectedApp.id && (
              <div className="mt-4 p-3 rounded-lg bg-green-400/10 border border-green-400/30 text-xs text-green-400">
                Buyout initiated. OpenClaw is generating your payment link and transfer documents. You'll receive an email within 24 hours.
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Valuation is AI-calculated using Discounted Cash Flow methodology. Per ToS Section C.
          </div>
        </div>
      </div>
    </div>
  );
}
