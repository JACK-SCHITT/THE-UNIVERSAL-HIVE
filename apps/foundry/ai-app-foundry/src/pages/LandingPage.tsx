import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import openclawAvatar from "@/assets/openclaw-avatar.png";

const STATS = [
  { value: "∞", label: "Integrations" },
  { value: "100%", label: "Universal" },
  { value: "0", label: "Barriers" },
  { value: "24/7", label: "Always On" },
];

const CAPABILITIES = [
  {
    icon: "🏗️",
    title: "Architect Agent",
    desc: "Converts any idea into a full app blueprint, DB schema, and system logic in seconds.",
  },
  {
    icon: "💻",
    title: "Developer Agent",
    desc: "Writes production-grade React, Next.js, and React Native code across all platforms simultaneously.",
  },
  {
    icon: "🚀",
    title: "DevOps Agent",
    desc: "Handles domain registration, SSL, App Store submissions, and cloud deployment — invisibly.",
  },
  {
    icon: "📣",
    title: "Marketer Agent",
    desc: "Runs automated SEO/ASO, generates ad creative, and drives growth hacking campaigns.",
  },
  {
    icon: "⚖️",
    title: "Legal Factory",
    desc: "Auto-generates Terms of Service and Privacy Policy for every app built on the platform.",
  },
  {
    icon: "💰",
    title: "Billing Hub",
    desc: "Manages the 25%/10% revenue share automatically with Stripe Connect. Buyout always available.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroBg}
            alt="Colossal AI Command Center"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        </div>

        {/* Top Nav */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-screen-xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <img src={openclawAvatar} alt="OpenClaw" className="w-8 h-8 rounded-full border border-primary/50" style={{ boxShadow: "0 0 12px hsla(195,100%,50%,0.4)" }} />
            <span className="font-bold text-base tracking-widest gradient-text uppercase">COLOSSAL AI</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/legal")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Legal
            </button>
            <button
              onClick={() => navigate("/pricing")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="px-4 py-2 rounded-lg border border-border bg-secondary/50 text-foreground text-sm font-medium hover:border-primary/40 transition-all duration-200"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/command")}
              className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/40 text-primary text-sm font-medium hover:bg-primary/20 transition-all duration-200"
            >
              Launch App
            </button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-mono mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot" />
            PRIME DIRECTIVE ACTIVE — SELF-GOVERNING MODE
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold leading-tight mb-6 max-w-5xl">
            <span className="gradient-text glow-text-cyan">The World's First</span>
            <br />
            <span className="text-foreground">Autonomous App Foundry</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            We don't just build apps. We build{" "}
            <strong className="text-foreground">automated revenue streams.</strong>
            <br />
            Zero-knowledge. Zero barriers. Full autonomy.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <button
              onClick={() => navigate("/auth")}
              className="px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:opacity-90 transition-all duration-200 glow-cyan"
              style={{ minWidth: "200px" }}
            >
              ⚡ Start Building
            </button>
            <button
              onClick={() => navigate("/pricing")}
              className="px-8 py-4 rounded-xl border border-border bg-secondary/50 text-foreground font-medium text-base hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
            >
              View Pricing
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold gradient-text">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem → Solution ── */}
      <section className="max-w-screen-xl mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">The Problem</div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-foreground">
              The Barrier to Entry Is{" "}
              <span className="gradient-text">Broken.</span>
            </h2>
            <div className="space-y-4">
              {[
                ["The Complexity Gap", "Building a money-making app requires a developer, designer, DevOps engineer, and marketer."],
                ["The Cost Barrier", "A professional-grade app costs $10k–$50k minimum before it even launches."],
                ["The Technical Wall", "Most founders are paralyzed by API keys, SSL, and App Store certificates."],
              ].map(([title, desc]) => (
                <div key={title} className="flex gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                  <span className="text-destructive text-lg mt-0.5">✗</span>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{title}</div>
                    <div className="text-muted-foreground text-sm mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">The Solution</div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-foreground">
              Colossal AI{" "}
              <span className="gradient-text">Finds A Way.</span>
            </h2>
            <div className="space-y-4">
              {[
                ["Zero-Knowledge Builder", "Translate human intent into a fully deployed, high-performance business. No code, no specs, no servers."],
                ["Agentic Execution", "Specialized agents handle the impossible parts of coding, deployment, and marketing autonomously."],
                ["Turnkey Business", "Live URL, App Store link, and automated marketing campaign. Not code — a revenue stream."],
              ].map(([title, desc]) => (
                <div key={title} className="flex gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <span className="text-primary text-lg mt-0.5">✓</span>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{title}</div>
                    <div className="text-muted-foreground text-sm mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Agents ── */}
      <section className="max-w-screen-xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">The Engine</div>
          <h2 className="text-3xl sm:text-4xl font-bold">Six Agents. One Mission.</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            OpenClaw orchestrates a team of specialized AI agents that work in parallel to build, deploy, and market your app.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAPABILITIES.map((cap) => (
            <div key={cap.title} className="agent-card rounded-xl p-5">
              <div className="text-3xl mb-3">{cap.icon}</div>
              <div className="font-semibold text-foreground mb-2">{cap.title}</div>
              <div className="text-sm text-muted-foreground leading-relaxed">{cap.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Business Model ── */}
      <section className="border-t border-border bg-gradient-to-b from-background to-muted/20 py-24">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Revenue Model</div>
            <h2 className="text-3xl sm:text-4xl font-bold">Wealth-Sharing, Not Subscriptions.</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                title: "Build Fee",
                amount: "$100–$150+",
                desc: "Flat-rate per build. Regular or Pro. AI prices complexity.",
                color: "primary",
                icon: "🏗️",
              },
              {
                title: "Success Stake",
                amount: "25% → 10%",
                desc: "25% year 1 success stake. 10% lifetime royalty from month 13.",
                color: "purple",
                icon: "📈",
              },
              {
                title: "10-Year Buyout",
                amount: "10% of 10yr",
                desc: "Buy out Colossal's stake anytime. Own 100% of your revenue forever.",
                color: "green",
                icon: "💎",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="agent-card rounded-xl p-6 text-center"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="text-lg font-bold text-foreground mb-1">{item.title}</div>
                <div
                  className="text-2xl font-bold mb-3 gradient-text"
                >
                  {item.amount}
                </div>
                <div className="text-sm text-muted-foreground">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <section className="py-24 text-center px-6">
        <div className="inline-flex items-center gap-2 mb-6">
          <img
            src={openclawAvatar}
            alt="OpenClaw"
            className="w-12 h-12 rounded-full border-2 border-primary/50 animate-float"
            style={{ boxShadow: "0 0 20px hsla(195,100%,50%,0.4)" }}
          />
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold mb-4">
          Ready to build your{" "}
          <span className="gradient-text">revenue stream?</span>
        </h2>
        <p className="text-muted-foreground text-lg mb-8">
          OpenClaw is waiting. Tell it your idea. It will find a way.
        </p>
        <button
          onClick={() => navigate("/command")}
          className="px-10 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-all duration-200 glow-cyan"
        >
          ⚡ Start With OpenClaw
        </button>

        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row gap-4 items-center justify-center text-sm text-muted-foreground">
          <button onClick={() => navigate("/legal")} className="hover:text-foreground transition-colors">Terms of Service</button>
          <span className="hidden sm:inline">·</span>
          <button onClick={() => navigate("/legal")} className="hover:text-foreground transition-colors">Privacy Policy</button>
          <span className="hidden sm:inline">·</span>
          <span>© 2025 Colossal AI. All rights reserved.</span>
        </div>
      </section>
    </div>
  );
}
