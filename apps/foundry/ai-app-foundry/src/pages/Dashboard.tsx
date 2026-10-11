import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";
import AppCard from "@/components/features/AppCard";
import RevenueTracker from "@/components/features/RevenueTracker";
import MarketingEngine from "@/components/features/MarketingEngine";
import SelfImprovementPanel from "@/components/features/SelfImprovementPanel";
import { formatCurrency } from "@/lib/utils";

export default function Dashboard() {
  const store = useAppStore();
  const navigate = useNavigate();

  const liveApps = store.apps.filter((a) => a.status === "live");
  const buildingApps = store.apps.filter((a) => a.status === "building" || a.status === "deployed");

  const totalAnnualRevenue = store.totalRevenue * 12;
  const portfolioGrowth = store.apps.reduce((acc, a) => acc + a.growthRate, 0) / Math.max(store.apps.length, 1);

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">App Portfolio</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {store.apps.length} apps · {liveApps.length} live · {buildingApps.length} in pipeline
          </p>
        </div>
        <button
          onClick={() => navigate("/command")}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all duration-200 glow-cyan"
        >
          ⚡ Build New App
        </button>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Portfolio MRR", value: formatCurrency(store.totalRevenue), sub: "monthly recurring", color: "text-primary" },
          { label: "Annual Run Rate", value: formatCurrency(totalAnnualRevenue), sub: "projected", color: "text-foreground" },
          { label: "Colossal Earnings", value: formatCurrency(store.colossalEarnings), sub: "this month", color: "text-purple" },
          { label: "Avg Growth Rate", value: `+${(portfolioGrowth * 100).toFixed(0)}%`, sub: "year over year", color: "text-green-400" },
        ].map((kpi) => (
          <div key={kpi.label} className="glass-panel rounded-xl p-4">
            <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">{kpi.label}</div>
            <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — App cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Apps */}
          {liveApps.length > 0 && (
            <div>
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 pulse-dot" />
                Live ({liveApps.length})
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {liveApps.map((app, i) => (
                  <AppCard key={app.id} app={app} featured={i === 0} />
                ))}
              </div>
            </div>
          )}

          {/* Building */}
          {buildingApps.length > 0 && (
            <div>
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                In Pipeline ({buildingApps.length})
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {buildingApps.map((app) => (
                  <AppCard key={app.id} app={app} />
                ))}
              </div>
            </div>
          )}

          {/* Marketing */}
          <div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
              📣 Marketing Engine
            </div>
            <div className="glass-panel rounded-xl p-5">
              <MarketingEngine apps={store.apps} />
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          <RevenueTracker
            apps={store.apps}
            totalRevenue={store.totalRevenue}
            colossalEarnings={store.colossalEarnings}
          />

          <div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
              🧠 Self-Improvement
            </div>
            <SelfImprovementPanel modules={store.modules} />
          </div>

          {/* Buyout CTA */}
          <div className="glass-panel rounded-xl p-5 border border-purple/20 bg-gradient-to-br from-purple/5 to-transparent">
            <div className="text-sm font-bold text-foreground mb-1">💰 Buyout Center</div>
            <div className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Buy out Colossal's revenue stake at any time. Own 100% of your revenue forever.
            </div>
            <button
              onClick={() => navigate("/buyout")}
              className="w-full py-2 rounded-lg border border-purple/40 text-purple text-sm font-medium hover:bg-purple/10 transition-all duration-200"
              style={{ color: "hsl(var(--purple))" }}
            >
              View Valuation →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
