import React, { useState, useEffect } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { KPICard } from "@/components/features/KPICard";
import { MiniBar } from "@/components/features/MiniBar";
import { generatePrivacyMetrics, formatPercent } from "@/lib/mockData";
import { PrivacyMetrics } from "@/types";
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";
import { Shield, Lock, Wifi, Server } from "lucide-react";
import { cn } from "@/lib/utils";

const RISK_COLORS = {
  LOW: { text: "text-green-neon", bg: "bg-green-subtle", border: "border-green-dim" },
  MEDIUM: { text: "text-yellow-warn", bg: "bg-yellow-dim/20", border: "border-yellow-dim" },
  HIGH: { text: "text-red-alert", bg: "bg-red-dim/20", border: "border-red-dim" },
};

export function PrivacyLayer() {
  const [metrics, setMetrics] = useState<PrivacyMetrics>(generatePrivacyMetrics());

  useEffect(() => {
    const t = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        epsilonBudgetUsed: Math.min(prev.epsilonBudgetTotal - 0.01, prev.epsilonBudgetUsed + 0.0008),
        queriesLastHour: 820000 + Math.floor(Math.random() * 60000),
        activeNodes: 10 + Math.floor(Math.random() * 3),
        ldpCoverage: 0.92 + Math.random() * 0.06,
      }));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const budgetPct = metrics.epsilonBudgetUsed / metrics.epsilonBudgetTotal;
  const rc = RISK_COLORS[metrics.privacyRisk];

  const pieData = [
    { name: "Used", value: metrics.epsilonBudgetUsed, color: budgetPct > 0.8 ? "#ff4646" : budgetPct > 0.6 ? "#ffc400" : "#00d4ff" },
    { name: "Remaining", value: metrics.epsilonBudgetTotal - metrics.epsilonBudgetUsed, color: "#1e2d45" },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar title="Privacy Layer" subtitle="LDP · Federated Learning · Rényi DP Composition" isLive />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Privacy risk banner */}
        <div className={cn("rounded-lg border px-5 py-4 flex items-center gap-4", rc.border, rc.bg)}>
          <Shield className={cn("w-5 h-5", rc.text)} />
          <div className="flex-1">
            <div className={cn("text-sm font-bold font-sans", rc.text)}>
              PRIVACY RISK — {metrics.privacyRisk}
            </div>
            <div className="text-[11px] font-mono text-[#4a6080] mt-0.5">
              Composition: {metrics.compositionMethod} · ε used: {metrics.epsilonBudgetUsed.toFixed(3)} / {metrics.epsilonBudgetTotal.toFixed(1)} (daily budget)
            </div>
          </div>
          <div className="text-right">
            <div className={cn("text-lg font-bold font-mono", rc.text)}>ε = {metrics.currentEpsilon.toFixed(3)}</div>
            <div className="text-[10px] font-mono text-[#4a6080]">current query cost</div>
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="ε Budget Used" value={`${(budgetPct * 100).toFixed(1)}%`} sub={`${metrics.epsilonBudgetUsed.toFixed(3)} / ${metrics.epsilonBudgetTotal}`} accent={budgetPct > 0.7 ? "yellow" : "cyan"} icon={<Lock className="w-4 h-4" />} />
          <KPICard label="LDP Coverage" value={formatPercent(metrics.ldpCoverage)} sub="transactions noised" accent="green" icon={<Shield className="w-4 h-4" />} glow />
          <KPICard label="Federated Nodes" value={`${metrics.activeNodes}/${metrics.federatedNodes}`} sub="active / total" accent="cyan" icon={<Server className="w-4 h-4" />} />
          <KPICard label="Queries / Hour" value={(metrics.queriesLastHour / 1000).toFixed(0) + "K"} sub="LDP query volume" accent="cyan" icon={<Wifi className="w-4 h-4" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Epsilon budget gauge */}
          <div className="card-base p-4 flex flex-col items-center">
            <div className="text-xs font-semibold text-white font-sans mb-1">ε Budget Consumption</div>
            <div className="text-[10px] font-mono text-[#4a6080] mb-2">daily privacy budget</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} dataKey="value" startAngle={90} endAngle={-270}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0d1424", border: "1px solid #1e2d45", borderRadius: 6, fontSize: 11, fontFamily: "JetBrains Mono" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center -mt-4">
              <div className="text-2xl font-bold font-mono text-cyan-DEFAULT">{(budgetPct * 100).toFixed(1)}%</div>
              <div className="text-[10px] font-mono text-[#4a6080]">of daily budget</div>
            </div>
          </div>

          {/* Federated node status */}
          <div className="card-base p-4">
            <div className="text-xs font-semibold text-white font-sans mb-1">Federated Learning Nodes</div>
            <div className="text-[10px] font-mono text-[#4a6080] mb-4">Flower on SageMaker</div>
            <div className="space-y-2">
              {Array.from({ length: metrics.federatedNodes }, (_, i) => {
                const active = i < metrics.activeNodes;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full shrink-0", active ? "bg-green-neon animate-pulse" : "bg-[#1e2d45]")} />
                    <span className="text-[10px] font-mono text-[#4a6080] flex-1">
                      node-{String(i + 1).padStart(2, "0")}
                    </span>
                    <span className={cn("text-[10px] font-mono font-bold", active ? "text-green-neon" : "text-[#2a4060]")}>
                      {active ? "ACTIVE" : "OFFLINE"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LDP config */}
          <div className="card-base p-4">
            <div className="text-xs font-semibold text-white font-sans mb-4">LDP Configuration</div>
            <div className="space-y-2 font-mono text-xs">
              {[
                ["Mechanism", metrics.noiseMechanism],
                ["Target ε (daily)", metrics.dailyEpsilonTarget.toFixed(1)],
                ["Current ε", metrics.currentEpsilon.toFixed(3)],
                ["Sensitivity Δf", metrics.sensitivityBound.toFixed(2)],
                ["Composition", metrics.compositionMethod],
                ["LDP Coverage", formatPercent(metrics.ldpCoverage)],
                ["Queries/hr", metrics.queriesLastHour.toLocaleString()],
                ["Buffer", "Noised embeddings only"],
                ["Raw Data", "Never stored centrally"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-bg-border/40 pb-1.5">
                  <span className="text-[#4a6080]">{k}</span>
                  <span className="text-[#aac4d8]">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Privacy guarantees */}
        <div className="card-base p-4">
          <div className="text-xs font-semibold text-white font-sans mb-4">Constitutional Privacy Constraints</div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              { label: "No raw PII in replay buffer", status: true, detail: "Only noised embeddings and aggregates stored" },
              { label: "On-device noise injection", status: true, detail: "LDP applied client-side before any transmission" },
              { label: "ε-budget hard cap enforcement", status: true, detail: "Queries auto-blocked when daily budget exceeds 90%" },
              { label: "Federated aggregation only", status: true, detail: "Model updates aggregated; individual data never leaves node" },
              { label: "Demographic audit logging", status: true, detail: "All decisions logged with anonymized group metrics" },
              { label: "Right-to-erasure compliance", status: metrics.privacyRisk !== "HIGH", detail: "User deletion propagated across replay buffer within 72h" },
            ].map(({ label, status, detail }) => (
              <div key={label} className={cn("rounded border p-3", status ? "border-green-dim bg-green-subtle" : "border-yellow-dim bg-yellow-dim/20")}>
                <div className="flex items-start gap-2">
                  <div className={cn("w-2 h-2 rounded-full mt-1 shrink-0", status ? "bg-green-neon" : "bg-yellow-warn")} />
                  <div>
                    <div className={cn("text-xs font-semibold font-sans", status ? "text-green-neon" : "text-yellow-warn")}>{label}</div>
                    <div className="text-[10px] font-mono text-[#4a6080] mt-1">{detail}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
