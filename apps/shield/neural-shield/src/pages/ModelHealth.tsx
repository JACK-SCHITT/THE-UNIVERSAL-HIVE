import React, { useState, useEffect } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { KPICard } from "@/components/features/KPICard";
import { MiniBar } from "@/components/features/MiniBar";
import { generateModelHealth, formatPercent } from "@/lib/mockData";
import { ModelHealth as ModelHealthType, ModelComponent } from "@/types";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Server, Cpu, Shield, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_STYLES = {
  HEALTHY: { text: "text-green-neon", bg: "bg-green-subtle", border: "border-green-dim", icon: CheckCircle, dot: "bg-green-neon" },
  DEGRADED: { text: "text-yellow-warn", bg: "bg-yellow-dim/20", border: "border-yellow-dim", icon: AlertTriangle, dot: "bg-yellow-warn" },
  CRITICAL: { text: "text-red-alert", bg: "bg-red-dim/20", border: "border-red-dim", icon: AlertTriangle, dot: "bg-red-alert" },
  OFFLINE: { text: "text-[#4a6080]", bg: "bg-bg-elevated", border: "border-bg-border", icon: XCircle, dot: "bg-[#2a4060]" },
};

function ComponentCard({ model }: { model: ModelComponent }) {
  const s = STATUS_STYLES[model.status];
  const Icon = s.icon;
  return (
    <div className={cn("card-base p-4 border", s.border)}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs font-semibold text-white font-sans">{model.name}</div>
          <div className="text-[10px] font-mono text-[#3a5070] mt-0.5">
            last checked: {model.lastChecked.toLocaleTimeString("en-US", { hour12: false })}
          </div>
        </div>
        <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-mono font-bold", s.border, s.bg, s.text)}>
          <div className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
          {model.status}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-[9px] font-mono text-[#3a5070] uppercase mb-1">p50</div>
          <div className="text-sm font-bold font-mono text-cyan-DEFAULT">{model.latencyP50}ms</div>
        </div>
        <div>
          <div className="text-[9px] font-mono text-[#3a5070] uppercase mb-1">p99</div>
          <div className="text-sm font-bold font-mono text-yellow-warn">{model.latencyP99}ms</div>
        </div>
        <div>
          <div className="text-[9px] font-mono text-[#3a5070] uppercase mb-1">Accuracy</div>
          <div className={cn("text-sm font-bold font-mono", model.accuracy > 0.95 ? "text-green-neon" : "text-yellow-warn")}>
            {formatPercent(model.accuracy, 1)}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <MiniBar value={model.accuracy} color={model.accuracy > 0.95 ? "bg-green-neon" : "bg-yellow-warn"} height={4} />
      </div>
    </div>
  );
}

const latencyHistData = [
  { label: "≤5ms", p50: 42, p99: 8 },
  { label: "5-10ms", p50: 31, p99: 15 },
  { label: "10-20ms", p50: 18, p99: 32 },
  { label: "20-30ms", p50: 6, p99: 28 },
  { label: "30-50ms", p50: 2, p99: 12 },
  { label: ">50ms", p50: 1, p99: 5 },
];

export function ModelHealth() {
  const [health, setHealth] = useState<ModelHealthType>(generateModelHealth());

  useEffect(() => {
    const t = setInterval(() => {
      setHealth(prev => ({
        ...prev,
        supervisedEnsemble: { ...prev.supervisedEnsemble, latencyP50: 2.8 + Math.random() * 0.8, latencyP99: 10 + Math.random() * 4, lastChecked: new Date() },
        rlPolicy: { ...prev.rlPolicy, latencyP50: 7 + Math.random() * 2, latencyP99: 20 + Math.random() * 6, lastChecked: new Date() },
        privacyLayer: { ...prev.privacyLayer, latencyP50: 0.9 + Math.random() * 0.4, lastChecked: new Date() },
      }));
    }, 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar title="Model Health" subtitle={`v${health.modelVersion} · Traffic Split ${health.trafficSplit}% RL`} isLive />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Overall status */}
        <div className={cn("rounded-lg border px-5 py-4 flex items-center gap-4",
          health.overallStatus === "HEALTHY" ? "border-green-dim bg-green-subtle" : "border-yellow-dim bg-yellow-dim/20"
        )}>
          <CheckCircle className="w-5 h-5 text-green-neon" />
          <div className="flex-1">
            <div className="text-sm font-bold font-sans text-green-neon">ALL SYSTEMS {health.overallStatus}</div>
            <div className="text-[11px] font-mono text-[#4a6080] mt-0.5">
              Shadow Mode: {health.shadowMode ? "ON" : "OFF"} · RL Traffic: {health.trafficSplit}% · Last Audit: {health.lastAudit.toLocaleDateString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-mono text-[#4a6080]">Model Version</div>
            <div className="text-sm font-bold font-mono text-cyan-DEFAULT">{health.modelVersion}</div>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Ensemble Accuracy" value={formatPercent(health.supervisedEnsemble.accuracy, 2)} sub="XGBoost+Autoencoder" accent="green" icon={<Server className="w-4 h-4" />} />
          <KPICard label="RL Policy Accuracy" value={formatPercent(health.rlPolicy.accuracy, 2)} sub="Actor-Critic PPO" accent="cyan" icon={<Cpu className="w-4 h-4" />} />
          <KPICard label="Privacy Layer" value="100%" sub="LDP Noise" accent="green" icon={<Shield className="w-4 h-4" />} glow />
          <KPICard label="RL Traffic" value={`${health.trafficSplit}%`} sub="of live requests" accent="cyan" delta="phased rollout" deltaPositive={true} />
        </div>

        {/* Component cards */}
        <div>
          <div className="text-xs font-semibold text-[#4a6080] font-mono uppercase tracking-widest mb-3">Model Components</div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ComponentCard model={health.supervisedEnsemble} />
            <ComponentCard model={health.rlPolicy} />
            <ComponentCard model={health.privacyLayer} />
          </div>
        </div>

        {/* Latency distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card-base p-4">
            <div className="text-xs font-semibold text-white font-sans mb-1">End-to-End Latency Distribution</div>
            <div className="text-[10px] font-mono text-[#4a6080] mb-4">% requests in each latency bucket</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={latencyHistData} barGap={2}>
                <CartesianGrid stroke="#1e2d45" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#3a5070", fontSize: 9, fontFamily: "JetBrains Mono" }} />
                <YAxis tick={{ fill: "#3a5070", fontSize: 9, fontFamily: "JetBrains Mono" }} />
                <Tooltip contentStyle={{ background: "#0d1424", border: "1px solid #1e2d45", borderRadius: 6, fontSize: 11, fontFamily: "JetBrains Mono" }} />
                <Bar dataKey="p50" name="p50 %" fill="#00d4ff" radius={[2, 2, 0, 0]} />
                <Bar dataKey="p99" name="p99 %" fill="#ffc400" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card-base p-4">
            <div className="text-xs font-semibold text-white font-sans mb-4">Model Card Summary</div>
            <div className="space-y-2 font-mono text-xs">
              {[
                ["Model Type", "Hybrid Ensemble + RL"],
                ["Level 0", "XGBoost + Autoencoder (4ms)"],
                ["Level 1", "PPO Actor-Critic (8ms)"],
                ["Override Layer", "Deontological rule engine"],
                ["Training Data", "18M historical transactions"],
                ["Holdout Period", "Oct–Dec 2025"],
                ["Demographic Audit", "Passed — 4/5 rule satisfied"],
                ["Bias Mitigation", "Fairness constraints + audit"],
                ["Explainability", "SHAP + RL state readable"],
                ["Deployment", "Blue-green · circuit breakers"],
                ["Review Cadence", "Quarterly model risk review"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-bg-border/40 pb-1.5">
                  <span className="text-[#4a6080]">{k}</span>
                  <span className="text-[#aac4d8] text-right ml-4">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
