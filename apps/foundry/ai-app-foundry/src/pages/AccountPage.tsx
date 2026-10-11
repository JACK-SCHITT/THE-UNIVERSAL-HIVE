import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import openclawAvatar from "@/assets/openclaw-avatar.png";

interface Subscription {
  id: string;
  plan_slug: string;
  status: string;
  amount_paid: number;
  created_at: string;
  plan?: {
    name: string;
    rev_share_year1: number;
    rev_share_lifetime: number;
    features: string[];
  };
}

interface App {
  id: string;
  name: string;
  status: string;
  monthly_revenue: number;
  niche: string;
  logo_emoji: string;
  build_fee: number;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: "text-green-400 bg-green-400/10 border-green-400/30",
  pending: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  cancelled: "text-red-400 bg-red-400/10 border-red-400/30",
  refunded: "text-muted-foreground bg-muted/30 border-border",
};

export default function AccountPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    console.log("[Account] Fetching data for user:", user?.id);

    // Fetch subscriptions with plan details
    const { data: subs, error: subsErr } = await supabase
      .from("user_subscriptions")
      .select(`
        id, plan_slug, status, amount_paid, created_at,
        subscription_plans(name, rev_share_year1, rev_share_lifetime, features)
      `)
      .order("created_at", { ascending: false });

    if (subsErr) {
      console.error("[Account] Subs error:", subsErr);
    } else {
      const mapped = (subs || []).map((s: unknown) => {
        const sub = s as Record<string, unknown>;
        const plan = sub.subscription_plans as Record<string, unknown> | null;
        return {
          id: sub.id as string,
          plan_slug: sub.plan_slug as string,
          status: sub.status as string,
          amount_paid: sub.amount_paid as number,
          created_at: sub.created_at as string,
          plan: plan
            ? {
                name: plan.name as string,
                rev_share_year1: plan.rev_share_year1 as number,
                rev_share_lifetime: plan.rev_share_lifetime as number,
                features: plan.features as string[],
              }
            : undefined,
        };
      });
      setSubscriptions(mapped);
    }

    // Fetch user apps
    const { data: userApps, error: appsErr } = await supabase
      .from("user_apps")
      .select("id, name, status, monthly_revenue, niche, logo_emoji, build_fee, created_at")
      .order("created_at", { ascending: false });

    if (appsErr) {
      console.error("[Account] Apps error:", appsErr);
    } else {
      setApps((userApps || []) as App[]);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleCopyShareLink = (appId: string) => {
    const url = `${window.location.origin}/app/${appId}`;
    navigator.clipboard.writeText(url);
    toast.success("Shareable link copied!");
  };

  const totalPaid = subscriptions.reduce((acc, s) => acc + (s.amount_paid || 0), 0);
  const activeSubscriptions = subscriptions.filter((s) => s.status === "active");
  const totalMonthlyRevenue = apps.reduce((acc, a) => acc + (a.monthly_revenue || 0), 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background grid-bg flex items-center justify-center">
        <div className="text-muted-foreground font-mono animate-pulse">Loading account...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="glass-panel rounded-2xl p-6 border border-border/60 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <img
                src={openclawAvatar}
                alt="Avatar"
                className="w-14 h-14 rounded-full border-2 border-primary/40"
                style={{ boxShadow: "0 0 20px hsla(195,100%,50%,0.3)" }}
              />
              <div>
                <div className="font-bold text-foreground text-lg">{user?.username}</div>
                <div className="text-muted-foreground text-sm">{user?.email}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
                  <span className="text-xs text-green-400 font-mono">Active Account</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate("/pricing")}
                className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-all"
              >
                Upgrade Plan
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-red-500/40 transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Paid", value: formatCurrency(totalPaid), color: "text-primary" },
            { label: "Active Plans", value: String(activeSubscriptions.length), color: "text-green-400" },
            { label: "Total Apps", value: String(apps.length), color: "text-foreground" },
            { label: "Portfolio MRR", value: formatCurrency(totalMonthlyRevenue), color: "text-purple-400" },
          ].map((kpi) => (
            <div key={kpi.label} className="glass-panel rounded-xl p-4 border border-border/50">
              <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">{kpi.label}</div>
              <div className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Subscriptions */}
        <section className="mb-8">
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4 flex items-center justify-between">
            <span>Subscriptions & Payments</span>
            {subscriptions.length === 0 && (
              <button
                onClick={() => navigate("/pricing")}
                className="text-primary hover:underline text-xs"
              >
                Get a plan →
              </button>
            )}
          </div>

          {subscriptions.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center border border-border/40">
              <div className="text-3xl mb-3">💳</div>
              <div className="text-muted-foreground text-sm mb-4">No subscriptions yet.</div>
              <button
                onClick={() => navigate("/pricing")}
                className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all glow-cyan"
              >
                View Plans
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {subscriptions.map((sub) => {
                const statusClass = STATUS_COLORS[sub.status] || STATUS_COLORS.pending;
                const isPro = sub.plan_slug === "pro";
                return (
                  <div
                    key={sub.id}
                    className="glass-panel rounded-xl p-5 border border-border/50"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${
                          isPro
                            ? "text-purple-400 bg-purple-400/10 border-purple-400/30"
                            : "text-primary bg-primary/10 border-primary/30"
                        }`}>
                          {(sub.plan?.name || sub.plan_slug).toUpperCase()}
                        </div>
                        <div className={`px-2 py-0.5 rounded-full border text-xs font-mono ${statusClass}`}>
                          {sub.status}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-right">
                          <div className="text-foreground font-bold">
                            {sub.amount_paid ? formatCurrency(sub.amount_paid) : "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(sub.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {sub.plan && (
                      <div className="mt-4 pt-4 border-t border-border/40 grid sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="text-primary">📈</span>
                          Year 1: {Math.round(sub.plan.rev_share_year1 * 100)}% success stake
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-primary">♾️</span>
                          Lifetime: {Math.round(sub.plan.rev_share_lifetime * 100)}% royalty
                        </div>
                      </div>
                    )}

                    {/* Buyout button */}
                    {sub.status === "active" && (
                      <div className="mt-3">
                        <button
                          onClick={() => navigate("/buyout")}
                          className="text-xs text-purple-400 hover:text-purple-300 hover:underline transition-colors font-mono"
                        >
                          💰 View 10-Year Buyout Valuation →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Apps */}
        <section className="mb-8">
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4 flex items-center justify-between">
            <span>Your Apps</span>
            <button
              onClick={() => navigate("/command")}
              className="text-primary hover:underline text-xs"
            >
              + Build New App
            </button>
          </div>

          {apps.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center border border-border/40">
              <div className="text-3xl mb-3">🚀</div>
              <div className="text-muted-foreground text-sm mb-4">No apps yet. Tell OpenClaw your idea.</div>
              <button
                onClick={() => navigate("/command")}
                className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all glow-cyan"
              >
                ⚡ Build an App
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {apps.map((app) => (
                <div
                  key={app.id}
                  className="glass-panel rounded-xl p-4 border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-xl border border-border/60">
                      {app.logo_emoji || "🚀"}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">{app.name}</div>
                      <div className="text-xs text-muted-foreground">{app.niche}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {app.monthly_revenue > 0 && (
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-400">
                          {formatCurrency(app.monthly_revenue)}/mo
                        </div>
                        <div className="text-xs text-muted-foreground">MRR</div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopyShareLink(app.id)}
                        className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
                        title="Copy shareable link"
                      >
                        📤 Share
                      </button>
                      <button
                        onClick={() => window.open(`/app/${app.id}`, "_blank")}
                        className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs hover:bg-primary/20 transition-all"
                      >
                        View →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Danger zone */}
        <div className="glass-panel rounded-2xl p-5 border border-border/30">
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
            Account Settings
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate("/legal")}
              className="px-4 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-all"
            >
              View Terms of Service
            </button>
            <button
              onClick={() => navigate("/pricing")}
              className="px-4 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-all"
            >
              Manage Plans
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg border border-red-500/30 text-xs text-red-400 hover:bg-red-500/10 transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
