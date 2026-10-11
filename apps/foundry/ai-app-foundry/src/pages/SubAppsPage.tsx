import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// ── Types ────────────────────────────────────────────────────────────────────
interface SubApp {
  id: string;
  name: string;
  description: string;
  niche: string;
  track: string;
  status: string;
  monthly_revenue: number;
  logo_emoji: string;
  launch_url: string;
  platforms: string[];
  app_idea: string;
  build_fee: number;
  rev_share_year1: number;
  created_at: string;
}

interface AiAppPlan {
  name: string;
  description: string;
  niche: string;
  logo_emoji: string;
  platforms: string[];
  monetization: string;
  mvp_features: string[];
  tech_stack: string;
}

// ── Niches ───────────────────────────────────────────────────────────────────
const NICHES = [
  "SaaS", "E-commerce", "Marketplace", "Social", "Finance", "Health",
  "Education", "Entertainment", "Productivity", "Security", "AI/ML",
  "Gaming", "Real Estate", "Travel", "Food & Delivery", "Fitness",
];

const TRACK_OPTIONS = [
  { value: "regular", label: "Regular — $100", desc: "Build + host + launch · 25% rev-share Y1" },
  { value: "pro", label: "Pro — $150+", desc: "All above + Marketer Agent + SEO/ASO campaigns" },
];

const STATUS_COLORS: Record<string, string> = {
  ideation: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  building: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  testing: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  deployed: "text-green-400 bg-green-500/10 border-green-500/30",
  live: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  paused: "text-white/40 bg-white/5 border-white/15",
};

function getSessionId(): string {
  let id = sessionStorage.getItem("openclaw_session");
  if (!id) { id = `session_${Date.now()}`; sessionStorage.setItem("openclaw_session", id); }
  return id;
}

// ── AppCard ──────────────────────────────────────────────────────────────────
function SubAppCard({ app, onBuild, onDelete }: {
  app: SubApp;
  onBuild: (app: SubApp) => void;
  onDelete: (id: string) => void;
}) {
  const statusClass = STATUS_COLORS[app.status] || STATUS_COLORS.ideation;
  const shareUrl = `${window.location.origin}/app/${app.id}`;

  return (
    <div className="glass-panel rounded-xl p-4 border border-border hover:border-primary/30 transition-all group">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl flex-shrink-0">
          {app.logo_emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-bold text-sm text-foreground truncate">{app.name}</h3>
            <span className={`px-1.5 py-0.5 rounded text-xs border font-mono flex-shrink-0 ${statusClass}`}>
              {app.status}
            </span>
          </div>
          <div className="text-xs text-muted-foreground truncate">{app.description}</div>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="px-2 py-0.5 rounded bg-primary/5 border border-primary/15 text-xs text-primary/70">{app.niche}</span>
        <span className="px-2 py-0.5 rounded bg-secondary text-xs text-muted-foreground">{app.track}</span>
        {app.platforms.map((p) => (
          <span key={p} className="px-2 py-0.5 rounded bg-muted/30 text-xs text-muted-foreground">{p}</span>
        ))}
      </div>

      {/* Revenue */}
      <div className="grid grid-cols-3 gap-2 mb-3 p-2 rounded-lg bg-muted/20 border border-border/40">
        <div className="text-center">
          <div className="text-xs text-muted-foreground">MRR</div>
          <div className="font-bold text-sm text-foreground">${app.monthly_revenue.toFixed(0)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Track</div>
          <div className="font-bold text-sm text-primary capitalize">{app.track}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Rev Share</div>
          <div className="font-bold text-sm text-foreground">{(app.rev_share_year1 * 100).toFixed(0)}%</div>
        </div>
      </div>

      {/* App idea */}
      {app.app_idea && (
        <div className="text-xs text-muted-foreground/60 mb-3 line-clamp-2 leading-relaxed">{app.app_idea}</div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onBuild(app)}
          className="flex-1 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-all"
        >
          🏗️ Build
        </button>
        <button
          onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Share link copied!"); }}
          className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground transition-all"
          title="Copy share link"
        >
          🔗
        </button>
        {app.launch_url && (
          <a
            href={app.launch_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs hover:bg-green-500/20 transition-all"
          >
            🚀
          </a>
        )}
        <button
          onClick={() => onDelete(app.id)}
          className="px-3 py-1.5 rounded-lg bg-red-500/5 border border-red-500/20 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 text-xs transition-all opacity-0 group-hover:opacity-100"
          title="Delete app"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function SubAppsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [apps, setApps] = useState<SubApp[]>([]);
  const [appsLoaded, setAppsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [isAiPlanning, setIsAiPlanning] = useState(false);
  const [aiPlan, setAiPlan] = useState<AiAppPlan | null>(null);

  // Form state
  const [ideaPrompt, setIdeaPrompt] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [niche, setNiche] = useState("SaaS");
  const [track, setTrack] = useState("regular");
  const [logoEmoji, setLogoEmoji] = useState("🚀");
  const [platforms, setPlatforms] = useState<string[]>(["web"]);
  const [appIdea, setAppIdea] = useState("");
  const [step, setStep] = useState<"idea" | "plan" | "create">("idea");

  const loadApps = useCallback(async () => {
    if (appsLoaded) return;
    setIsLoading(true);
    try {
      let q = supabase.from("user_apps").select("*").order("created_at", { ascending: false });
      if (user) q = q.eq("user_id", user.id);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      setApps(data || []);
    } catch (err) {
      toast.error(`Failed to load apps: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
      setAppsLoaded(true);
    }
  }, [user, appsLoaded]);

  // Load on mount
  useState(() => {
    loadApps();
  });

  const handleAiPlan = useCallback(async () => {
    if (!ideaPrompt.trim()) { toast.error("Describe your app idea first"); return; }
    setIsAiPlanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("openclaw-ai", {
        body: {
          messages: [{
            role: "user",
            content: `Plan a sub-app for the Colossal AI App Foundry. User's idea: "${ideaPrompt}"

Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "name": "Short app name",
  "description": "One sentence description",
  "niche": "One of: SaaS/E-commerce/Marketplace/Social/Finance/Health/Education/Entertainment/Productivity/Security/AI-ML/Gaming",
  "logo_emoji": "Single emoji",
  "platforms": ["web", "mobile"],
  "monetization": "How it makes money",
  "mvp_features": ["Feature 1", "Feature 2", "Feature 3"],
  "tech_stack": "React + Supabase + Stripe"
}`,
          }],
          userId: user?.id || null,
          sessionId: getSessionId(),
        },
      });

      if (error) {
        let msg = error.message;
        if (error instanceof FunctionsHttpError) {
          try { msg = (await error.context?.text()) || msg; } catch {}
        }
        throw new Error(msg);
      }

      const raw = data?.content || "{}";
      // Extract JSON
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("AI returned no JSON plan");
      const plan: AiAppPlan = JSON.parse(jsonMatch[0]);

      setAiPlan(plan);
      setName(plan.name || "");
      setDescription(plan.description || "");
      setNiche(plan.niche || "SaaS");
      setLogoEmoji(plan.logo_emoji || "🚀");
      setPlatforms(plan.platforms || ["web"]);
      setAppIdea(ideaPrompt);
      setStep("plan");
    } catch (err) {
      toast.error(`AI planning failed: ${(err as Error).message}`);
    } finally {
      setIsAiPlanning(false);
    }
  }, [ideaPrompt, user]);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) { toast.error("App name is required"); return; }
    setIsLoading(true);
    try {
      const insertData: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim(),
        niche,
        track,
        status: "ideation",
        monthly_revenue: 0,
        logo_emoji: logoEmoji,
        platforms,
        app_idea: appIdea,
        build_fee: track === "regular" ? 100 : 150,
        rev_share_year1: 0.25,
        rev_share_lifetime: 0.10,
      };
      if (user?.id) insertData.user_id = user.id;

      const { data, error } = await supabase.from("user_apps").insert(insertData).select().single();
      if (error) throw new Error(error.message);

      setApps((prev) => [data as SubApp, ...prev]);
      toast.success(`${logoEmoji} ${name} created!`);
      setShowCreator(false);
      resetForm();
    } catch (err) {
      toast.error(`Failed to create app: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, [name, description, niche, track, logoEmoji, platforms, appIdea, user]);

  const resetForm = () => {
    setIdeaPrompt(""); setName(""); setDescription(""); setNiche("SaaS");
    setTrack("regular"); setLogoEmoji("🚀"); setPlatforms(["web"]);
    setAppIdea(""); setAiPlan(null); setStep("idea");
  };

  const handleBuild = useCallback((app: SubApp) => {
    navigate(`/terminal?build=${encodeURIComponent(app.app_idea || app.description)}`);
  }, [navigate]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Remove this app from the foundry?")) return;
    setApps((prev) => prev.filter((a) => a.id !== id));
    toast.success("App removed");
  }, []);

  const togglePlatform = (p: string) => {
    setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col">
      {/* Hero */}
      <div className="border-b border-border bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-xs font-mono text-primary/60 uppercase tracking-widest mb-1">
                Colossal AI · Sub-Apps Foundry
              </div>
              <h1 className="text-2xl font-black text-foreground mb-1">
                Sub-Apps Creator
              </h1>
              <p className="text-muted-foreground text-sm max-w-xl">
                The AI designs, plans, and builds every sub-app. Describe an idea → AI generates the full blueprint → One click sends it to the Terminal App Builder.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-center">
                <div className="text-2xl font-black text-foreground">{apps.length}</div>
                <div className="text-xs text-muted-foreground">Apps</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-primary">${apps.reduce((s, a) => s + a.monthly_revenue, 0).toFixed(0)}</div>
                <div className="text-xs text-muted-foreground">Total MRR</div>
              </div>
              <button
                onClick={() => { setShowCreator(true); setStep("idea"); }}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-all"
              >
                + New Sub-App
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-6">
        {/* Creator modal */}
        {showCreator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="font-bold text-foreground">Create Sub-App</h2>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">
                    Step {step === "idea" ? "1" : step === "plan" ? "2" : "3"}/3 — {step === "idea" ? "Describe Idea" : step === "plan" ? "Review AI Plan" : "Configure & Launch"}
                  </div>
                </div>
                <button onClick={() => { setShowCreator(false); resetForm(); }} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {/* Step 1: Idea */}
                {step === "idea" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        What app do you want to build?
                      </label>
                      <textarea
                        value={ideaPrompt}
                        onChange={(e) => setIdeaPrompt(e.target.value)}
                        placeholder="e.g. A subscription app that sends daily AI-generated fitness plans with progress tracking, meal suggestions, and motivational coaching..."
                        rows={5}
                        className="w-full bg-secondary border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none text-sm"
                      />
                    </div>
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
                      <div className="font-semibold text-primary mb-1">⚡ AI Planning Mode</div>
                      OpenClaw Prime will analyze your idea and generate: app name, description, niche classification, platform targets, monetization strategy, MVP features, and tech stack.
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleAiPlan}
                        disabled={isAiPlanning || !ideaPrompt.trim()}
                        className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-all"
                      >
                        {isAiPlanning ? "⏳ AI Planning..." : "⚡ Let AI Plan It"}
                      </button>
                      <button
                        onClick={() => setStep("create")}
                        className="px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground transition-all"
                      >
                        Manual →
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: AI Plan review */}
                {step === "plan" && aiPlan && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                      <span className="text-3xl">{aiPlan.logo_emoji}</span>
                      <div>
                        <div className="font-bold text-foreground text-lg">{aiPlan.name}</div>
                        <div className="text-sm text-muted-foreground">{aiPlan.description}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-secondary border border-border">
                        <div className="text-xs text-muted-foreground mb-1">Niche</div>
                        <div className="font-semibold text-foreground text-sm">{aiPlan.niche}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-secondary border border-border">
                        <div className="text-xs text-muted-foreground mb-1">Platforms</div>
                        <div className="font-semibold text-foreground text-sm">{aiPlan.platforms.join(", ")}</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-secondary border border-border">
                      <div className="text-xs text-muted-foreground mb-1">Monetization</div>
                      <div className="text-sm text-foreground">{aiPlan.monetization}</div>
                    </div>

                    <div className="p-3 rounded-xl bg-secondary border border-border">
                      <div className="text-xs text-muted-foreground mb-2">MVP Features</div>
                      <ul className="space-y-1">
                        {aiPlan.mvp_features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-secondary border border-border">
                      <div className="text-xs text-muted-foreground mb-1">Tech Stack</div>
                      <div className="text-sm text-foreground font-mono">{aiPlan.tech_stack}</div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep("create")}
                        className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all"
                      >
                        ✓ Use This Plan →
                      </button>
                      <button
                        onClick={() => setStep("idea")}
                        className="px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground transition-all"
                      >
                        ← Redo
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Configure */}
                {step === "create" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1.5">Emoji</label>
                        <input
                          value={logoEmoji}
                          onChange={(e) => setLogoEmoji(e.target.value.slice(0, 2))}
                          className="w-full bg-secondary border border-border rounded-lg p-2 text-center text-2xl focus:outline-none focus:border-primary/40"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1.5">App Name *</label>
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="My App"
                          className="w-full bg-secondary border border-border rounded-lg p-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Description</label>
                      <input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What does this app do?"
                        className="w-full bg-secondary border border-border rounded-lg p-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Niche</label>
                      <div className="flex flex-wrap gap-1.5">
                        {NICHES.map((n) => (
                          <button
                            key={n}
                            onClick={() => setNiche(n)}
                            className={`px-2.5 py-1 rounded-lg text-xs border transition-all ${
                              niche === n
                                ? "bg-primary/10 border-primary/30 text-primary"
                                : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Track</label>
                      <div className="space-y-2">
                        {TRACK_OPTIONS.map((t) => (
                          <button
                            key={t.value}
                            onClick={() => setTrack(t.value)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                              track === t.value
                                ? "bg-primary/10 border-primary/30"
                                : "bg-secondary border-border hover:border-border/80"
                            }`}
                          >
                            <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${track === t.value ? "bg-primary border-primary" : "border-muted-foreground/30"}`} />
                            <div>
                              <div className="font-semibold text-foreground text-sm">{t.label}</div>
                              <div className="text-xs text-muted-foreground">{t.desc}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Platforms</label>
                      <div className="flex flex-wrap gap-1.5">
                        {["web", "ios", "android", "desktop", "api"].map((p) => (
                          <button
                            key={p}
                            onClick={() => togglePlatform(p)}
                            className={`px-2.5 py-1 rounded-lg text-xs border transition-all capitalize ${
                              platforms.includes(p)
                                ? "bg-primary/10 border-primary/30 text-primary"
                                : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleCreate}
                        disabled={isLoading || !name.trim()}
                        className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-all"
                      >
                        {isLoading ? "⏳ Creating..." : `${logoEmoji} Create Sub-App`}
                      </button>
                      <button
                        onClick={() => setStep(aiPlan ? "plan" : "idea")}
                        className="px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground transition-all"
                      >
                        ← Back
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Apps grid */}
        {isLoading && !apps.length ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-muted-foreground text-sm">Loading apps...</div>
          </div>
        ) : apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-xl font-bold text-foreground mb-2">No Sub-Apps Yet</h2>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              Describe any app idea and the AI will plan it, design it, and prepare it for the Code Agent to build.
            </p>
            <button
              onClick={() => setShowCreator(true)}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all"
            >
              + Create Your First App
            </button>
          </div>
        ) : (
          <>
            {/* Filter bar */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <div className="text-sm text-muted-foreground font-mono">{apps.length} app{apps.length !== 1 ? "s" : ""} in foundry</div>
              <div className="flex-1" />
              <button
                onClick={() => loadApps()}
                className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground transition-all"
              >
                ↺ Refresh
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {apps.map((app) => (
                <SubAppCard key={app.id} app={app} onBuild={handleBuild} onDelete={handleDelete} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
