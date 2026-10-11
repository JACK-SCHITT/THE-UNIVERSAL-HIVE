import React, { useState, useEffect } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { KPICard } from "@/components/features/KPICard";
import { MiniBar } from "@/components/features/MiniBar";
import { TransactionDrawer } from "@/components/features/TransactionDrawer";
import { useTransactionStream } from "@/hooks/useTransactionStream";
import { generateKPIs, generateAgentState, formatCurrency, formatPercent, getDecisionColor, getRiskLevel, getRiskColor } from "@/lib/mockData";
import { Transaction, KPIMetrics, AgentState } from "@/types";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import {
  DollarSign, TrendingDown, Clock, ShieldCheck, AlertTriangle, Users, RefreshCw, Pause, Play
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Dashboard() {
  const { transactions, isLive, toggleLive, refresh, tps } = useTransactionStream();
  const [kpis, setKpis] = useState<KPIMetrics>(generateKPIs());
  const [agent, setAgent] = useState<AgentState>(generateAgentState());
  const [selected, setSelected] = useState<Transaction | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setKpis(generateKPIs());
      setAgent(prev => ({ ...prev, episode: prev.episode + 1, totalReward: prev.totalReward + (Math.random() * 40 - 5) }));
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const rewardData = agent.rewardHistory.map((v, i) => ({ i, v }));
  const recent = transactions.slice(0, 8);

  const decisionsCount = transactions.slice(0, 60).reduce((acc, tx) => {
    acc[tx.decision] = (acc[tx.decision] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const total = transactions.slice(0, 60).length || 1;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar
        title="Operations Dashboard"
        subtitle="Real-time fraud decision monitoring"
        isLive={isLive}
        tps={tps}
        actions={
          <div className="flex gap-2">
            <button onClick={toggleLive} className={cn("flex items-center gap-1 text-xs font-mono px-3 py-1.5 rounded border transition-all",
              isLive ? "text-green-neon border-green-dim hover:bg-green-subtle" : "text-[#4a6080] border-bg-border hover:border-cyan-dim hover:text-cyan-DEFAULT"
            )}>
              {isLive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {isLive ? "Pause" : "Resume"}
            </button>
            <button onClick={refresh} className="flex items-center gap-1 text-xs font-mono px-3 py-1.5 rounded border border-bg-border text-[#4a6080] hover:text-cyan-DEFAULT hover:border-cyan-dim transition-all">
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Fraud Capture Rate"
            value={formatPercent(kpis.fraudCaptureRate)}
            sub="target ≥ 95%"
            delta="0.3%"
            deltaPositive={true}
            accent="green"
            icon={<ShieldCheck className="w-4 h-4" />}
            glow
          />
          <KPICard
            label="False Decline Rate"
            value={formatPercent(kpis.falseDeclineRate, 2)}
            sub="target < 0.5%"
            delta="0.02%"
            deltaPositive={true}
            accent="cyan"
            icon={<TrendingDown className="w-4 h-4" />}
          />
          <KPICard
            label="Loss Avoided (24h)"
            value={formatCurrency(kpis.totalLossAvoided)}
            sub="economic reward"
            delta="$12K"
            deltaPositive={true}
            accent="green"
            icon={<DollarSign className="w-4 h-4" />}
          />
          <KPICard
            label="Avg Decision Latency"
            value={`${kpis.avgDecisionLatencyMs}ms`}
            sub="p50 / p99: 8ms / 31ms"
            accent="cyan"
            icon={<Clock className="w-4 h-4" />}
          />
          <KPICard
            label="Approval Rate"
            value={formatPercent(kpis.approvalRate)}
            sub="live traffic"
            accent="cyan"
            icon={<Users className="w-4 h-4" />}
          />
          <KPICard
            label="Chargeback Rate"
            value={formatPercent(kpis.chargebackRate, 2)}
            sub="industry: < 0.3%"
            delta="0.01%"
            deltaPositive={true}
            accent="yellow"
          />
          <KPICard
            label="Review Queue"
            value={kpis.reviewQueueDepth.toLocaleString()}
            sub="pending human review"
            accent="orange"
            icon={<AlertTriangle className="w-4 h-4" />}
          />
          <KPICard
            label="RL Episode"
            value={agent.episode.toLocaleString()}
            sub={`ε = ${agent.epsilon.toFixed(3)}`}
            delta="Training"
            deltaPositive={true}
            accent="cyan"
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Reward chart */}
          <div className="lg:col-span-2 card-base p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-semibold text-white font-sans">Cumulative Reward Trajectory</div>
                <div className="text-[10px] font-mono text-[#4a6080] mt-0.5">48h rolling · economic reward units</div>
              </div>
              <span className="text-sm font-bold text-green-neon font-mono">+{agent.totalReward.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={rewardData}>
                <defs>
                  <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="i" hide />
                <Tooltip
                  contentStyle={{ background: "#0d1424", border: "1px solid #1e2d45", borderRadius: 6, fontSize: 11, fontFamily: "JetBrains Mono" }}
                  labelStyle={{ color: "#4a6080" }}
                  itemStyle={{ color: "#00ff88" }}
                  formatter={(v: number) => [v.toFixed(1), "Reward"]}
                />
                <Area type="monotone" dataKey="v" stroke="#00ff88" strokeWidth={1.5} fill="url(#rGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Decision distribution */}
          <div className="card-base p-4">
            <div className="text-xs font-semibold text-white font-sans mb-1">Decision Distribution</div>
            <div className="text-[10px] font-mono text-[#4a6080] mb-4">last 60 transactions</div>
            <div className="space-y-3">
              {(["APPROVE", "BLOCK", "STEP_UP", "REVIEW"] as const).map(d => {
                const count = decisionsCount[d] || 0;
                const pct = count / total;
                const colors: Record<string, string> = { APPROVE: "bg-green-neon", BLOCK: "bg-red-alert", STEP_UP: "bg-yellow-warn", REVIEW: "bg-cyan-DEFAULT" };
                const textColors: Record<string, string> = { APPROVE: "text-green-neon", BLOCK: "text-red-alert", STEP_UP: "text-yellow-warn", REVIEW: "text-cyan-DEFAULT" };
                return (
                  <div key={d}>
                    <div className="flex justify-between mb-1">
                      <span className={cn("text-[10px] font-mono font-bold", textColors[d])}>{d}</span>
                      <span className="text-[10px] font-mono text-[#4a6080]">{count} · {formatPercent(pct, 0)}</span>
                    </div>
                    <MiniBar value={pct} color={colors[d]} height={5} />
                  </div>
                );
              })}
            </div>

            <div className="border-t border-bg-border mt-4 pt-3 space-y-2">
              <div className="text-[10px] font-mono text-[#3a5070] uppercase mb-1">Override Rate</div>
              <MiniBar value={agent.overrideRate} color="bg-yellow-warn" showValue />
              <div className="text-[10px] font-mono text-[#3a5070] uppercase mt-2 mb-1">Policy Confidence</div>
              <MiniBar value={agent.avgConfidence} color="bg-cyan-DEFAULT" showValue />
            </div>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="card-base overflow-hidden">
          <div className="px-4 py-3 border-b border-bg-border flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-white font-sans">Recent Transactions</span>
              <span className="ml-2 text-[10px] font-mono text-[#3a5070]">click for detail</span>
            </div>
            {isLive && <span className="flex items-center gap-1.5 text-[10px] font-mono text-green-neon"><span className="status-dot bg-green-neon" />streaming</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-bg-border text-[#3a5070] uppercase text-[9px] tracking-widest">
                  <th className="text-left px-4 py-2.5">TXN ID</th>
                  <th className="text-left px-4 py-2.5">User</th>
                  <th className="text-right px-4 py-2.5">Amount</th>
                  <th className="text-left px-4 py-2.5">Merchant</th>
                  <th className="text-center px-4 py-2.5">Decision</th>
                  <th className="text-center px-4 py-2.5">Risk</th>
                  <th className="text-right px-4 py-2.5">Latency</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((tx, i) => {
                  const risk = getRiskLevel(tx.riskScore);
                  return (
                    <tr
                      key={tx.id}
                      className={cn("border-b border-bg-border/50 cursor-pointer hover:bg-bg-elevated transition-colors",
                        i === 0 && isLive ? "animate-ticker" : ""
                      )}
                      onClick={() => setSelected(tx)}
                    >
                      <td className="px-4 py-2.5 text-cyan-DEFAULT/70">{tx.id.slice(-12)}</td>
                      <td className="px-4 py-2.5 text-[#aac4d8]">{tx.userName}</td>
                      <td className="px-4 py-2.5 text-right text-white font-semibold">{formatCurrency(tx.amount)}</td>
                      <td className="px-4 py-2.5 text-[#5a7090]">{tx.merchant}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={cn("px-2 py-0.5 rounded border text-[9px] font-bold tracking-widest", getDecisionColor(tx.decision))}>
                          {tx.decision}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={cn("text-xs font-bold", getRiskColor(risk))}>{risk}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-[#4a6080]">{tx.processingMs.toFixed(1)}ms</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <TransactionDrawer tx={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
