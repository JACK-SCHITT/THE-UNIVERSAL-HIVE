
import React, { useState, useEffect } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { MiniBar } from "@/components/features/MiniBar";
import { KPICard } from "@/components/features/KPICard";
import { generateAgentState, formatPercent } from "@/lib/mockData";
import { AgentState } from "@/types";
import {
  LineChart, Line, AreaChart, Area, ResponsiveContainer,
  Tooltip, XAxis, YAxis, CartesianGrid, ReferenceLine
} from "recharts";
import { Activity, Cpu, AlertTriangle, CheckCircle, Zap, Lock, Crown } from "lucide-react";
import { persistAgentSnapshot } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const CB_COLORS = {
  NOMINAL: { text: "text-green-neon", bg: "bg-green-subtle", border: "border-green-dim", dot: "bg-green-neon" },
  WARNING: { text: "text-yellow-warn", bg: "bg-yellow-dim/20", border: "border-yellow-dim", dot: "bg-yellow-warn" },
  TRIPPED: { text: "text-red-alert", bg: "bg-red-dim/20", border: "border-red-dim", dot: "bg-red-alert" },
};

export function RLAgent() {
  const { user } = useAuth();
  const isPro = user?.plan === 'pro' || user?.plan === 'enterprise' || user?.role === 'admin';
  const [agent, setAgent] = useState<AgentState>(generateAgentState());
  const [overrideActive, setOverrideActive] = useState(false);
  const [explorationRate, setExplorationRate] = useState(50);
  const [blockThreshold, setBlockThreshold] = useState(75);

  useEffect(() => {
    let snapshotCounter = 0;
    const t = setInterval(() => {
      setAgent(prev => {
        const newReward = (Math.random() - 0.3) * 20 + prev.rewardHistory[prev.rewardHistory.length - 1];
        const newTrust = Math.min(0.99, Math.max(0.5, prev.trustEvolution[prev.trustEvolution.length - 1] + (Math.random() - 0.45) * 0.02));
        const next = {
          ...prev,
          episode: prev.episode + 1,
          totalReward: prev.totalReward + (Math.random() * 35 - 5),
          epsilon: Math.max(0.05, prev.epsilon - 0.0001),
          policyEntropy: 0.3 + Math.random() * 0.3,
          tdError: 0.04 + Math.random() * 0.1,
          replayBufferSize: Math.min(500000, prev.replayBufferSize + Math.floor(Math.random() * 60)),
          rewardHistory: [...prev.rewardHistory.slice(1), newReward],
          trustEvolution: [...prev.trustEvolution.slice(1), newTrust],
          fprLast1h: 0.001 + Math.random() * 0.003,
          fraudEscapeRate: 0.002 + Math.random() * 0.005,
          avgConfidence: 0.8 + Math.random() * 0.15,
          lastUpdate: new Date(),
        };
        // Persist snapshot every 10 ticks (~30s)
        snapshotCounter++;
        if (snapshotCounter % 10 === 0) {
          console.log('[agent] persisting snapshot to Supabase, episode:', next.episode);
          persistAgentSnapshot(next);
        }
        return next;
      });
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const rewardData = agent.rewardHistory.map((v, i) => ({ i, v }));
  const trustData = agent.trustEvolution.map((v, i) => ({ i, v }));
  const cbColors = CB_COLORS[agent.circuitBreakerStatus];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar title="RL Agent Monitor" subtitle="Actor-Critic PPO · Online Adaptation" isLive />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Circuit Breaker */}
        <div className={cn("rounded-lg border px-5 py-4 flex items-center gap-4", cbColors.border, cbColors.bg)}>
          <div className={cn("w-3 h-3 rounded-full", cbColors.dot, "animate-pulse")} />
          <div className="flex-1">
            <div className={cn("text-sm font-bold font-sans", cbColors.text)}>
              CIRCUIT BREAKER — {agent.circuitBreakerStatus}
            </div>
            <div className="text-[11px] font-mono text-[#4a6080] mt-0.5">
              FPR(1h): {formatPercent(agent.fprLast1h, 2)} · Fraud Escape: {formatPercent(agent.fraudEscapeRate, 2)} · Threshold: FPR &gt; 2% or EscapeRate &gt; 1%
            </div>
          </div>
          {agent.circuitBreakerStatus === "NOMINAL"
            ? <CheckCircle className="w-5 h-5 text-green-neon" />
            : <AlertTriangle className="w-5 h-5 text-yellow-warn" />
          }
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Episode" value={agent.episode.toLocaleString()} sub="training steps" accent="cyan" icon={<Activity className="w-4 h-4" />} />
          <KPICard label="Exploration ε" value={agent.epsilon.toFixed(4)} sub="epsilon-greedy" delta="decaying" deltaPositive={true} accent="yellow" />
          <KPICard label="Policy Entropy" value={agent.policyEntropy.toFixed(3)} sub="uncertainty measure" accent="orange" icon={<Cpu className="w-4 h-4" />} />
          <KPICard label="TD Error" value={agent.tdError.toFixed(4)} sub="bellman residual" accent="cyan" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card-base p-4">
            <div className="text-xs font-semibold text-white font-sans mb-1">Reward History</div>
            <div className="text-[10px] font-mono text-[#4a6080] mb-4">rolling 48 steps · economic units</div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={rewardData}>
                <defs>
                  <linearGradient id="rwGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00ff88" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e2d45" strokeDasharray="3 3" />
                <XAxis dataKey="i" hide />
                <YAxis tick={{ fill: "#3a5070", fontSize: 9, fontFamily: "JetBrains Mono" }} />
                <Tooltip contentStyle={{ background: "#0d1424", border: "1px solid #1e2d45", borderRadius: 6, fontSize: 11, fontFamily: "JetBrains Mono" }} itemStyle={{ color: "#00ff88" }} formatter={(v: number) => [v.toFixed(2), "Reward"]} />
                <ReferenceLine y={0} stroke="#1e2d45" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="v" stroke="#00ff88" strokeWidth={1.5} fill="url(#rwGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card-base p-4">
            <div className="text-xs font-semibold text-white font-sans mb-1">Trust Evolution</div>
            <div className="text-[10px] font-mono text-[#4a6080] mb-4">personality.trust · bounded [0.5, 0.99]</div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={trustData}>
                <CartesianGrid stroke="#1e2d45" strokeDasharray="3 3" />
                <XAxis dataKey="i" hide />
                <YAxis domain={[0.5, 1.0]} tick={{ fill: "#3a5070", fontSize: 9, fontFamily: "JetBrains Mono" }} />
                <Tooltip contentStyle={{ background: "#0d1424", border: "1px solid #1e2d45", borderRadius: 6, fontSize: 11, fontFamily: "JetBrains Mono" }} itemStyle={{ color: "#00d4ff" }} formatter={(v: number) => [v.toFixed(4), "Trust"]} />
                <ReferenceLine y={0.85} stroke="#ffc40055" strokeDasharray="4 4" label={{ value: "override threshold", fill: "#ffc400", fontSize: 9, fontFamily: "JetBrains Mono" }} />
                <Line type="monotone" dataKey="v" stroke="#00d4ff" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Agent internals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card-base p-4 space-y-4">
            <div className="text-xs font-semibold text-white font-sans">Personality State (Aggregated)</div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-mono text-[#4a6080]">Trust Coefficient</span>
                  <span className="text-[10px] font-mono text-cyan-DEFAULT">{agent.trustEvolution[agent.trustEvolution.length - 1]?.toFixed(4)}</span>
                </div>
                <MiniBar value={agent.trustEvolution[agent.trustEvolution.length - 1] ?? 0.75} color="bg-cyan-DEFAULT" height={6} />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-mono text-[#4a6080]">Avg RL Confidence</span>
                  <span className="text-[10px] font-mono text-green-neon">{agent.avgConfidence.toFixed(4)}</span>
                </div>
                <MiniBar value={agent.avgConfidence} color="bg-green-neon" height={6} />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-mono text-[#4a6080]">Override Rate</span>
                  <span className="text-[10px] font-mono text-yellow-warn">{formatPercent(agent.overrideRate)}</span>
                </div>
                <MiniBar value={agent.overrideRate} color="bg-yellow-warn" height={6} />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-mono text-[#4a6080]">Fraud Capture Rate</span>
                  <span className="text-[10px] font-mono text-green-neon">{formatPercent(agent.fraudCaptureRate)}</span>
                </div>
                <MiniBar value={agent.fraudCaptureRate} color="bg-green-neon" height={6} />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-mono text-[#4a6080]">False Decline Rate</span>
                  <span className="text-[10px] font-mono text-cyan-DEFAULT">{formatPercent(agent.falseDeclineRate, 2)}</span>
                </div>
                <MiniBar value={agent.falseDeclineRate} max={0.02} color="bg-cyan-DEFAULT" height={6} />
              </div>
            </div>
          </div>

          <div className="card-base p-4">
            <div className="text-xs font-semibold text-white font-sans mb-4">Training Configuration</div>
            <div className="space-y-2 font-mono text-xs">
              {[
                ["Algorithm", "PPO / Actor-Critic"],
                ["Batch Size", agent.batchSize.toString()],
                ["Replay Buffer", agent.replayBufferSize.toLocaleString()],
                ["Exploration ε", agent.epsilon.toFixed(5)],
                ["ε Decay", "Linear · min 0.05"],
                ["Reward Shaping", "Economic (charge-off + goodwill)"],
                ["Warmup", "Behavior Cloning (10k steps)"],
                ["Privacy", "LDP · noised buffer"],
                ["Override Trigger", "trust < 0.85 OR conf < 0.65"],
                ["Amplification", "welfare-negative ×10"],
                ["Last Update", agent.lastUpdate.toLocaleTimeString("en-US", { hour12: false })],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-bg-border/40 pb-1">
                  <span className="text-[#4a6080]">{k}</span>
                  <span className="text-[#aac4d8]">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Pro Control Panel */}
        <div className="card-base overflow-hidden">
          <div className="px-4 py-3 border-b border-bg-border flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-warn" />
            <span className="text-xs font-semibold text-white font-sans">Real-Time Agent Control</span>
            {!isPro && (
              <span className="ml-auto flex items-center gap-1 text-[9px] font-mono font-bold text-yellow-warn border border-yellow-dim bg-yellow-dim/10 rounded px-1.5 py-0.5">
                <Lock className="w-2.5 h-2.5" /> PRO ONLY
              </span>
            )}
          </div>

          {isPro ? (
            <div className="p-4 space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Force Override Toggle */}
                <div className="bg-bg-base rounded-lg border border-bg-border p-3">
                  <div className="text-[10px] font-mono text-[#4a6080] uppercase tracking-wider mb-2">Force Human Override</div>
                  <div className="flex items-center justify-between">
                    <span className={cn("text-xs font-bold font-mono", overrideActive ? "text-red-alert" : "text-[#5a7090]")}>
                      {overrideActive ? "OVERRIDE ACTIVE" : "POLICY ACTIVE"}
                    </span>
                    <button
                      onClick={() => setOverrideActive(v => !v)}
                      className={cn(
                        "relative w-10 h-5 rounded-full transition-all",
                        overrideActive ? "bg-red-alert" : "bg-bg-elevated border border-bg-border"
                      )}
                    >
                      <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", overrideActive ? "left-5" : "left-0.5")} />
                    </button>
                  </div>
                  <div className="text-[9px] font-mono text-[#2a4060] mt-2">
                    {overrideActive ? "All decisions routed to human review queue" : "RL policy making decisions"}
                  </div>
                </div>

                {/* Exploration Rate */}
                <div className="bg-bg-base rounded-lg border border-bg-border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-[#4a6080] uppercase tracking-wider">Exploration Rate</span>
                    <span className="text-[10px] font-mono text-yellow-warn font-bold">{explorationRate}%</span>
                  </div>
                  <input
                    type="range" min={0} max={100} value={explorationRate}
                    onChange={e => setExplorationRate(Number(e.target.value))}
                    className="w-full accent-yellow-400 cursor-pointer"
                  />
                  <div className="text-[9px] font-mono text-[#2a4060] mt-2">
                    Higher = more random exploration. Lower = exploit learned policy.
                  </div>
                </div>

                {/* Block Threshold */}
                <div className="bg-bg-base rounded-lg border border-bg-border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-[#4a6080] uppercase tracking-wider">Block Threshold</span>
                    <span className="text-[10px] font-mono text-red-alert font-bold">{blockThreshold}%</span>
                  </div>
                  <input
                    type="range" min={50} max={99} value={blockThreshold}
                    onChange={e => setBlockThreshold(Number(e.target.value))}
                    className="w-full accent-red-500 cursor-pointer"
                  />
                  <div className="text-[9px] font-mono text-[#2a4060] mt-2">
                    Risk score above this % triggers auto-block decision.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => { setOverrideActive(false); setExplorationRate(50); setBlockThreshold(75); }}
                  className="px-3 py-1.5 rounded border border-bg-border text-[10px] font-mono text-[#4a6080] hover:border-cyan-dim hover:text-cyan-DEFAULT transition-all"
                >
                  RESET DEFAULTS
                </button>
                <button className="px-4 py-1.5 rounded bg-cyan-DEFAULT text-bg-base text-[10px] font-mono font-bold hover:bg-cyan-DEFAULT/90 transition-all">
                  APPLY CONFIG
                </button>
                {overrideActive && (
                  <span className="flex items-center gap-1.5 text-[10px] font-mono text-red-alert">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-alert animate-pulse" />
                    Human override mode active — all decisions queued for review
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-dim/20 border border-yellow-dim flex items-center justify-center">
                <Lock className="w-6 h-6 text-yellow-warn" />
              </div>
              <div>
                <div className="text-sm font-bold text-white font-sans mb-1">Pro Feature — Real-Time Control</div>
                <div className="text-xs font-mono text-[#4a6080] max-w-sm">
                  Upgrade to Pro to access live agent controls: force override mode, tune exploration rate, adjust block thresholds, and apply runtime parameter changes.
                </div>
              </div>
              <Link
                to="/pricing"
                className="flex items-center gap-2 px-4 py-2 rounded bg-yellow-warn text-bg-base text-xs font-mono font-bold hover:bg-yellow-warn/90 transition-all"
              >
                <Crown className="w-3.5 h-3.5" /> Upgrade to Pro
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
