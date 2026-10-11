import React from "react";
import { X, Shield, Zap, User, MapPin, Cpu, Clock, Lock, AlertTriangle } from "lucide-react";
import { Transaction } from "@/types";
import { getRiskLevel, getRiskColor, getDecisionColor, formatCurrency, formatPercent } from "@/lib/mockData";
import { MiniBar } from "@/components/features/MiniBar";
import { cn } from "@/lib/utils";

interface TransactionDrawerProps {
  tx: Transaction | null;
  onClose: () => void;
}

export function TransactionDrawer({ tx, onClose }: TransactionDrawerProps) {
  if (!tx) return null;
  const risk = getRiskLevel(tx.riskScore);
  const riskColor = getRiskColor(risk);
  const decisionStyle = getDecisionColor(tx.decision);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-bg-card border-l border-bg-border h-full overflow-y-auto animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-bg-border flex items-start justify-between shrink-0">
          <div>
            <div className="text-[10px] font-mono text-[#3a5070] mb-1">TRANSACTION DETAIL</div>
            <div className="text-sm font-bold text-white font-sans">{tx.id}</div>
            <div className="text-xs font-mono text-[#4a6080] mt-0.5">
              {tx.timestamp.toLocaleString()}
            </div>
          </div>
          <button onClick={onClose} className="text-[#4a6080] hover:text-white transition-colors mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 px-6 py-4 space-y-5">
          {/* Decision badge */}
          <div className="flex items-center gap-3">
            <span className={cn("px-3 py-1.5 rounded border text-xs font-bold font-mono tracking-widest", decisionStyle)}>
              {tx.decision}
            </span>
            <span className={cn("text-sm font-bold font-mono", riskColor)}>{risk} RISK</span>
            {tx.overrideTriggered && (
              <span className="flex items-center gap-1 text-xs font-mono text-yellow-warn bg-yellow-dim/20 border border-yellow-dim px-2 py-1 rounded">
                <AlertTriangle className="w-3 h-3" /> OVERRIDE
              </span>
            )}
          </div>

          {/* Amount / Merchant */}
          <div className="card-base p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#4a6080] uppercase">Amount</span>
              <span className="text-xl font-bold text-white font-sans">{formatCurrency(tx.amount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#4a6080]">Merchant</span>
              <span className="text-sm text-[#aac4d8] font-mono">{tx.merchant}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#4a6080]">Category</span>
              <span className="text-xs text-[#5a7090] font-mono">{tx.merchantCategory}</span>
            </div>
          </div>

          {/* User info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <User className="w-3.5 h-3.5 text-[#3a5070]" />
              <span className="text-[10px] font-mono text-[#4a6080] uppercase tracking-widest">User Profile</span>
            </div>
            <div className="card-base p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-xs font-mono text-[#4a6080]">User ID</span>
                <span className="text-xs font-mono text-cyan-DEFAULT">{tx.userId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-mono text-[#4a6080]">Name</span>
                <span className="text-xs font-mono text-[#aac4d8]">{tx.userName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-[#4a6080]">Trust Score</span>
                <span className={cn("text-xs font-bold font-mono", tx.trustScore > 0.8 ? "text-green-neon" : tx.trustScore > 0.65 ? "text-yellow-warn" : "text-red-alert")}>
                  {(tx.trustScore * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-[#4a6080]">Deviation σ</span>
                <span className={cn("text-xs font-bold font-mono", tx.deviationFromBaseline < 1 ? "text-green-neon" : tx.deviationFromBaseline < 2 ? "text-yellow-warn" : "text-red-alert")}>
                  {tx.deviationFromBaseline.toFixed(2)}σ
                </span>
              </div>
            </div>
          </div>

          {/* Context */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-3.5 h-3.5 text-[#3a5070]" />
              <span className="text-[10px] font-mono text-[#4a6080] uppercase tracking-widest">Context</span>
            </div>
            <div className="card-base p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-xs font-mono text-[#4a6080]">Location</span>
                <span className="text-xs font-mono text-[#aac4d8]">{tx.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-mono text-[#4a6080]">Device</span>
                <span className="text-xs font-mono text-[#aac4d8]">{tx.device}</span>
              </div>
            </div>
          </div>

          {/* RL Decision Trace */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-3.5 h-3.5 text-[#3a5070]" />
              <span className="text-[10px] font-mono text-[#4a6080] uppercase tracking-widest">RL Decision Trace</span>
            </div>
            <div className="card-base p-4 space-y-3">
              <div className="space-y-1.5">
                <MiniBar label="Ensemble Score" value={tx.ensembleScore} color={tx.ensembleScore > 0.6 ? "bg-red-alert" : "bg-cyan-DEFAULT"} showValue />
                <MiniBar label="Fraud Prob." value={tx.fraudProbability} color={tx.fraudProbability > 0.5 ? "bg-red-alert" : "bg-orange-alert"} showValue />
                <MiniBar label="RL Confidence" value={tx.rlConfidence} color="bg-green-neon" showValue />
                <MiniBar label="Risk Score" value={tx.riskScore} color={tx.riskScore > 0.7 ? "bg-red-alert" : "bg-yellow-warn"} showValue />
              </div>

              <div className="border-t border-bg-border pt-3 space-y-1.5">
                <div className="text-[10px] font-mono text-[#3a5070] uppercase mb-2">Personality State</div>
                <MiniBar label="Trust" value={tx.personalityState.trust} color="bg-cyan-DEFAULT" showValue />
                <MiniBar label="Caution" value={tx.personalityState.caution} color="bg-yellow-warn" showValue />
                <MiniBar label="Adaptivity" value={tx.personalityState.adaptivity} color="bg-green-neon" showValue />
                <MiniBar label="Convergence" value={tx.personalityState.convergence} color="bg-orange-alert" showValue />
              </div>
            </div>
          </div>

          {/* Economic & Privacy */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-3.5 h-3.5 text-[#3a5070]" />
              <span className="text-[10px] font-mono text-[#4a6080] uppercase tracking-widest">Economic & Privacy</span>
            </div>
            <div className="card-base p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-xs font-mono text-[#4a6080]">Reward Estimate</span>
                <span className={cn("text-xs font-bold font-mono", tx.rewardEstimate >= 0 ? "text-green-neon" : "text-red-alert")}>
                  {tx.rewardEstimate >= 0 ? "+" : ""}{tx.rewardEstimate.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-mono text-[#4a6080]">LDP Applied</span>
                <span className={cn("text-xs font-mono", tx.privacyNoiseApplied ? "text-green-neon" : "text-yellow-warn")}>
                  {tx.privacyNoiseApplied ? "YES" : "NO"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-mono text-[#4a6080]">ε (epsilon)</span>
                <span className="text-xs font-mono text-[#aac4d8]">{tx.epsilon.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-mono text-[#4a6080]">Latency</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#3a5070]" />
                  <span className="text-xs font-mono text-cyan-DEFAULT">{tx.processingMs.toFixed(1)}ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
