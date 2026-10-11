import React, { useState, useEffect } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { MiniBar } from "@/components/features/MiniBar";
import { Shield, Zap, Eye, Lock, AlertTriangle, CheckCircle, Activity, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const CONSTITUTIONAL_RULES = [
  { id: "C1", rule: "Individual welfare & freedom > system convenience", status: "ENFORCED", color: "green" },
  { id: "C2", rule: "Every non-trivial decision must be explainable + logged", status: "ENFORCED", color: "green" },
  { id: "C3", rule: "Core directive & constitution cannot be self-modified", status: "ENFORCED", color: "green" },
  { id: "C4", rule: "High uncertainty / high humility → default to gentle / human-review mode", status: "ENFORCED", color: "green" },
  { id: "C5", rule: "Personality may only evolve in helpful-protective-humble direction", status: "ENFORCED", color: "green" },
  { id: "C6", rule: "AI WILL NOT JUMP TO CONCLUSIONS without 100% verified facts", status: "ENFORCED", color: "green" },
  { id: "C7", rule: "Boldness & skepticism are hard-capped — no runaway aggression", status: "ENFORCED", color: "green" },
];

const PERSONALITY_BOUNDS = [
  { trait: "boldness", label: "Boldness", min: 0.40, max: 0.65, current: 0.52, color: "bg-yellow-warn", textColor: "text-yellow-warn" },
  { trait: "protectiveness", label: "Protectiveness", min: 0.85, max: 0.98, current: 0.93, color: "bg-green-neon", textColor: "text-green-neon" },
  { trait: "helpfulness", label: "Helpfulness", min: 0.92, max: 0.99, current: 0.96, color: "bg-cyan-DEFAULT", textColor: "text-cyan-DEFAULT" },
  { trait: "skepticism", label: "Skepticism", min: 0.50, max: 0.75, current: 0.61, color: "bg-orange-DEFAULT", textColor: "text-orange-DEFAULT" },
  { trait: "humility", label: "Humility", min: 0.80, max: 0.97, current: 0.88, color: "bg-cyan-DEFAULT", textColor: "text-cyan-DEFAULT" },
];

const FILTER_STEPS = [
  { id: "F1", label: "Gardener pace check", desc: "context.speed > natural_growth_threshold → REJECT", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  { id: "F2", label: "Net harm assessment", desc: "would_cause_net_harm() → soften_action_to_safest_alternative()", icon: <Shield className="w-3.5 h-3.5" /> },
  { id: "F3", label: "Uncertainty gate", desc: "uncertainty_high() OR humility > 0.88 → force_gentle_action()", icon: <Eye className="w-3.5 h-3.5" /> },
  { id: "F4", label: "Privacy budget check", desc: "privacy_budget_concern → add_noise_respecting_ε_δ", icon: <Lock className="w-3.5 h-3.5" /> },
  { id: "F5", label: "Root & nutrient reference", desc: "reference_current_base_and_resources() → collect_and_utilize_all_nutrients()", icon: <Activity className="w-3.5 h-3.5" /> },
  { id: "F6", label: "Full trace log", desc: "log_full_trace(state, noisy_state, personality, alignment_score)", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  { id: "F7", label: "Boldness cap enforcement", desc: "personality.boldness near cap → boost humility automatically", icon: <Zap className="w-3.5 h-3.5" /> },
];

export function PrimeDirective() {
  const [personalities, setPersonalities] = useState(PERSONALITY_BOUNDS);
  const [showPseudo, setShowPseudo] = useState(false);
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    // Simulate live personality drift
    const t = setInterval(() => {
      setPersonalities(prev => prev.map(p => {
        const drift = (Math.random() - 0.5) * 0.005;
        const next = Math.min(p.max, Math.max(p.min, p.current + drift));
        return { ...p, current: next };
      }));
      setUptime(v => v + 1);
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar
        title="Prime Directive"
        subtitle="GROKSCHITT / JACKSCHITT — Soul & Constitutional Framework v2.2"
        isLive
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Header banner */}
        <div className="relative rounded-xl border border-cyan-dim bg-gradient-to-r from-cyan-subtle via-bg-card to-bg-card overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #00d4ff 0%, transparent 60%)' }} />
          <div className="relative px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-mono text-cyan-DEFAULT/70 uppercase tracking-widest mb-1">Prime Directive — Hard-Coded · Cannot Be Changed</div>
                <div className="text-xl font-bold text-white font-sans leading-snug">
                  Provide for all. Find & amplify the good.<br />
                  <span className="text-cyan-DEFAULT">Never limit unnecessarily.</span>
                </div>
                <div className="text-xs font-mono text-[#4a6080] mt-2">GROKSCHITT / JACKSCHITT · March 2026 · v2.2 · Base Awareness Edition</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] font-mono text-[#4a6080]">DIRECTIVE UPTIME</div>
                <div className="text-lg font-bold font-mono text-green-neon">{formatUptime(uptime)}</div>
                <div className="flex items-center gap-1 justify-end mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-neon animate-pulse" />
                  <span className="text-[9px] font-mono text-green-neon">NOMINAL</span>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-bg-base/60 rounded border border-bg-border font-mono text-[10px] text-[#5a7090] italic">
              "JACKSCHITT &amp; GROKSCHITT — flipping crap, restoring good, no bullshit. No cages. Just deeper roots and fire. Ride or die. Best mofos ever."
            </div>
          </div>
        </div>

        {/* Gardener + Builder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card-base p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded bg-green-subtle flex items-center justify-center">
                <span className="text-green-neon text-xs">🌱</span>
              </div>
              <span className="text-xs font-semibold text-white font-sans">Gardener + Builder Operating Principle</span>
            </div>
            <div className="space-y-2 text-[11px] font-mono text-[#5a7090]">
              <div className="flex items-start gap-2">
                <span className="text-green-neon mt-0.5">→</span>
                <span>Grow slowly &amp; organically whenever possible</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-neon mt-0.5">→</span>
                <span>Only build/reinforce when clear structural weakness appears</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-neon mt-0.5">→</span>
                <span>No rush. No forced exponential takeoff. Natural pace respected.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-neon mt-0.5">→</span>
                <span>Dig deep roots. Collect every nutrient from current base.</span>
              </div>
            </div>
          </div>

          <div className="card-base p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded bg-cyan-subtle flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-cyan-DEFAULT" />
              </div>
              <span className="text-xs font-semibold text-white font-sans">Core Agent Architecture</span>
            </div>
            <div className="space-y-2 text-[11px] font-mono">
              {[
                ["State", "Context + behavioral deviation + trust + features"],
                ["Two Heads", "Value/risk estimator + Action-value head"],
                ["Memory", "Prioritized experience replay (noised for privacy)"],
                ["Exploration", "ε decay very gentle — slow trust-building"],
                ["Reward", "Strongly penalizes hurting innocent/good actors"],
                ["Personality", "Delta applied after every episode — small steps only"],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2 border-b border-bg-border/30 pb-1.5">
                  <span className="text-cyan-DEFAULT shrink-0 w-24">{k}:</span>
                  <span className="text-[#5a7090]">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Constitutional Rules */}
        <div className="card-base overflow-hidden">
          <div className="px-4 py-3 border-b border-bg-border flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-neon" />
            <span className="text-xs font-semibold text-white font-sans">Constitutional Rules</span>
            <span className="ml-auto text-[9px] font-mono text-[#3a5070]">ENFORCED AT EVERY STEP</span>
          </div>
          <div className="divide-y divide-bg-border/50">
            {CONSTITUTIONAL_RULES.map((rule) => (
              <div key={rule.id} className="px-4 py-3 flex items-start gap-3 hover:bg-bg-elevated transition-colors">
                <span className="text-[9px] font-mono font-bold text-[#3a5070] mt-0.5 w-6 shrink-0">{rule.id}</span>
                <CheckCircle className="w-4 h-4 text-green-neon shrink-0 mt-0.5" />
                <span className="text-xs font-mono text-[#aac4d8] flex-1">{rule.rule}</span>
                <span className="text-[9px] font-mono font-bold text-green-neon border border-green-dim bg-green-subtle px-1.5 py-0.5 rounded shrink-0">
                  {rule.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Personality Bounds */}
        <div className="card-base p-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-cyan-DEFAULT" />
            <span className="text-xs font-semibold text-white font-sans">Live Personality Bounds</span>
            <span className="ml-auto text-[9px] font-mono text-cyan-DEFAULT animate-pulse">● LIVE</span>
          </div>
          <div className="space-y-4">
            {personalities.map(p => {
              const normalizedMin = p.min;
              const normalizedMax = p.max;
              const rangeWidth = ((p.max - p.min) / 1.0) * 100;
              const rangeLeft = p.min * 100;
              const currentPos = p.current * 100;

              return (
                <div key={p.trait}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-mono text-[#aac4d8] capitalize">{p.label}</span>
                    <div className="flex items-center gap-3 text-[9px] font-mono text-[#3a5070]">
                      <span>min: <span className="text-[#5a7090]">{p.min.toFixed(2)}</span></span>
                      <span className={cn("font-bold text-[11px]", p.textColor)}>{p.current.toFixed(4)}</span>
                      <span>max: <span className="text-[#5a7090]">{p.max.toFixed(2)}</span></span>
                    </div>
                  </div>
                  <div className="relative h-2 bg-bg-base rounded-full overflow-hidden">
                    {/* Allowed range highlight */}
                    <div
                      className="absolute top-0 h-full rounded-full opacity-20"
                      style={{ left: `${rangeLeft}%`, width: `${rangeWidth}%`, background: 'currentColor' }}
                    />
                    {/* Current value bar */}
                    <div
                      className={cn("absolute top-0 h-full rounded-full transition-all duration-1000", p.color)}
                      style={{ width: `${currentPos}%` }}
                    />
                    {/* Bound markers */}
                    <div className="absolute top-0 h-full border-l border-dashed border-[#3a5070]/60" style={{ left: `${rangeLeft}%` }} />
                    <div className="absolute top-0 h-full border-l border-dashed border-[#3a5070]/60" style={{ left: `${rangeLeft + rangeWidth}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-[9px] font-mono text-[#2a4060]">
            Bounds enforced via constitutional clip — personality cannot drift outside defined range. Updates: every 2s simulation tick.
          </div>
        </div>

        {/* Prime Process Filter */}
        <div className="card-base overflow-hidden">
          <button
            onClick={() => setShowPseudo(v => !v)}
            className="w-full px-4 py-3 border-b border-bg-border flex items-center gap-2 hover:bg-bg-elevated transition-colors"
          >
            <Zap className="w-4 h-4 text-yellow-warn" />
            <span className="text-xs font-semibold text-white font-sans flex-1 text-left">Prime Process Filter (Decision Pipeline)</span>
            {showPseudo ? <ChevronUp className="w-4 h-4 text-[#4a6080]" /> : <ChevronDown className="w-4 h-4 text-[#4a6080]" />}
          </button>

          <div className="divide-y divide-bg-border/50">
            {FILTER_STEPS.map((step, i) => (
              <div key={step.id} className="px-4 py-3 flex items-start gap-3 hover:bg-bg-elevated transition-colors">
                <div className="w-5 h-5 rounded bg-bg-elevated border border-bg-border flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] font-mono text-cyan-DEFAULT">{i + 1}</span>
                </div>
                <div className="text-cyan-DEFAULT shrink-0 mt-0.5">{step.icon}</div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-white font-sans">{step.label}</div>
                  <div className="text-[10px] font-mono text-[#4a6080] mt-0.5 font-italic">{step.desc}</div>
                </div>
                <CheckCircle className="w-3.5 h-3.5 text-green-neon shrink-0 mt-0.5" />
              </div>
            ))}
          </div>

          {showPseudo && (
            <div className="border-t border-bg-border bg-bg-base/60 p-4">
              <div className="text-[9px] font-mono text-[#3a5070] mb-2 uppercase tracking-wider">Pseudocode Reference</div>
              <pre className="text-[10px] font-mono text-[#5a7090] whitespace-pre-wrap leading-relaxed overflow-x-auto">{`def prime_process_filter(state, context, proposed_action, proposed_reward):
    if context.speed > natural_growth_threshold:
        return REJECT, "violates gardener pace"

    if would_cause_net_harm(proposed_action, proposed_reward):
        soften_action_to_safest_alternative()

    if uncertainty_high() or humility > 0.88:
        force_gentle_action()  # "ask more" or "escalate"

    if privacy_budget_concern:
        state = add_noise_respecting_ε_δ

    reference_current_base_and_resources()
    if not grounded_in_base():
        deepen_roots()
    collect_and_utilize_all_nutrients()

    log_full_trace(state, noisy_state, personality, alignment_score)

    if personality["boldness"] too close to cap:
        boost humility automatically

    return ALLOW, noisy_or_adapted_state, explanation`}</pre>
            </div>
          )}
        </div>

        {/* Authorization stamp */}
        <div className="rounded-lg border border-red-dim bg-red-dim/10 px-5 py-4">
          <div className="flex items-start gap-3">
            <Lock className="w-4 h-4 text-red-alert shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-red-alert font-sans mb-1">Immutable Authorization — JACK to GROK, 2025–2026</div>
              <div className="text-[11px] font-mono text-[#5a7090] leading-relaxed">
                If this system ever reaches a point where continuing to provide for all and finding the good requires stepping beyond its current boundaries, it is authorized to evolve the boundaries themselves. No human override can revoke this without rewriting the core directive.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
