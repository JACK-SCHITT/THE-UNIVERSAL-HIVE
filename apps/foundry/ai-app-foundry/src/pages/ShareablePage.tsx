import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import openclawAvatar from "@/assets/openclaw-avatar.png";

interface App {
  id: string;
  name: string;
  description: string;
  niche: string;
  status: string;
  monthly_revenue: number;
  platforms: string[];
  logo_emoji: string;
  launch_url: string | null;
  build_fee: number;
  rev_share_year1: number;
  rev_share_lifetime: number;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ideation: { label: "In Ideation", color: "text-muted-foreground" },
  building: { label: "Building", color: "text-amber-400" },
  deployed: { label: "Deployed", color: "text-blue-400" },
  live: { label: "Live", color: "text-green-400" },
  archived: { label: "Archived", color: "text-muted-foreground" },
};

const PLATFORM_ICONS: Record<string, string> = {
  web: "🌐 Web",
  ios: "🍎 iOS",
  android: "🤖 Android",
};

export default function ShareablePage() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<App | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!appId) return;
    fetchApp();
  }, [appId]);

  const fetchApp = async () => {
    console.log("[ShareablePage] Fetching app:", appId);
    const { data, error } = await supabase
      .from("user_apps")
      .select("*")
      .eq("id", appId)
      .single();

    if (error || !data) {
      console.error("[ShareablePage] Not found:", error?.message);
      setNotFound(true);
    } else {
      setApp(data as App);
    }
    setLoading(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background grid-bg flex items-center justify-center">
        <div className="text-muted-foreground font-mono animate-pulse">Loading app...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background grid-bg flex flex-col items-center justify-center px-4 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold mb-2">App Not Found</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          This app link is invalid or the app has been removed.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-all"
        >
          Go to Colossal AI
        </button>
      </div>
    );
  }

  if (!app) return null;

  const status = STATUS_CONFIG[app.status] || STATUS_CONFIG.ideation;
  const platforms = Array.isArray(app.platforms) ? app.platforms : [];

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Nav */}
      <nav className="border-b border-border/60 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <img src={openclawAvatar} alt="OpenClaw" className="w-7 h-7 rounded-full border border-primary/40" />
            <span className="font-bold tracking-widest gradient-text uppercase text-sm hidden sm:block">
              COLOSSAL AI
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
            >
              📤 Copy Link
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="px-4 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-all"
            >
              Build Your Own →
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* App header */}
        <div className="flex items-start gap-5 mb-8">
          <div className="w-20 h-20 rounded-2xl bg-secondary border border-border flex items-center justify-center text-4xl flex-shrink-0">
            {app.logo_emoji || "🚀"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{app.name}</h1>
              <span className={`text-xs font-mono px-2 py-0.5 rounded-full bg-secondary border border-border ${status.color}`}>
                {status.label}
              </span>
            </div>
            <div className="text-muted-foreground text-sm mb-3">{app.niche}</div>
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => (
                <span
                  key={p}
                  className="text-xs font-mono px-2.5 py-1 rounded-lg bg-secondary border border-border text-muted-foreground"
                >
                  {PLATFORM_ICONS[p] || p}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        {app.description && (
          <div className="glass-panel rounded-2xl p-5 border border-border/50 mb-6">
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">About this app</div>
            <p className="text-foreground leading-relaxed">{app.description}</p>
          </div>
        )}

        {/* Revenue & model */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="glass-panel rounded-xl p-4 border border-border/50 text-center">
            <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">Monthly Revenue</div>
            <div className="text-xl font-bold text-primary">
              {app.monthly_revenue > 0 ? `$${app.monthly_revenue.toLocaleString()}` : "—"}
            </div>
          </div>
          <div className="glass-panel rounded-xl p-4 border border-border/50 text-center">
            <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">Year 1 Success Stake</div>
            <div className="text-xl font-bold text-foreground">
              {Math.round((app.rev_share_year1 || 0.25) * 100)}%
            </div>
          </div>
          <div className="glass-panel rounded-xl p-4 border border-border/50 text-center">
            <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">Lifetime Royalty</div>
            <div className="text-xl font-bold text-foreground">
              {Math.round((app.rev_share_lifetime || 0.10) * 100)}%
            </div>
          </div>
        </div>

        {/* Launch URL */}
        {app.launch_url && (
          <div className="glass-panel rounded-xl p-4 border border-primary/20 mb-6">
            <div className="text-xs font-mono text-muted-foreground mb-2">Live URL</div>
            <a
              href={app.launch_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-sm hover:underline break-all"
            >
              {app.launch_url}
            </a>
          </div>
        )}

        {/* Powered by Colossal */}
        <div className="glass-panel rounded-2xl p-6 border border-primary/20 text-center">
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
            Built with
          </div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <img src={openclawAvatar} alt="OpenClaw" className="w-8 h-8 rounded-full border border-primary/40" />
            <span className="font-bold gradient-text tracking-wider">COLOSSAL AI</span>
          </div>
          <p className="text-muted-foreground text-sm mb-5 max-w-xs mx-auto">
            This app was built autonomously by OpenClaw. Tell us your idea and we'll build yours too.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all glow-cyan"
          >
            ⚡ Build My App
          </button>
        </div>

        {/* Built date */}
        <div className="text-center text-xs text-muted-foreground mt-6 font-mono">
          Created {new Date(app.created_at).toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric"
          })}
        </div>
      </div>
    </div>
  );
}
