import React, { useState, useMemo } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { TransactionDrawer } from "@/components/features/TransactionDrawer";
import { useTransactionStream } from "@/hooks/useTransactionStream";
import { getDecisionColor, getRiskLevel, getRiskColor, formatCurrency, formatPercent } from "@/lib/mockData";
import { Transaction, DecisionType } from "@/types";
import { Search, Pause, Play, RefreshCw, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const DECISIONS: (DecisionType | "ALL")[] = ["ALL", "APPROVE", "BLOCK", "STEP_UP", "REVIEW"];

export function Transactions() {
  const { transactions, isLive, toggleLive, refresh, tps } = useTransactionStream();
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [filter, setFilter] = useState<DecisionType | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [minRisk, setMinRisk] = useState(0);

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (filter !== "ALL" && tx.decision !== filter) return false;
      if (tx.riskScore < minRisk) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!tx.id.toLowerCase().includes(q) && !tx.userName.toLowerCase().includes(q) && !tx.merchant.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [transactions, filter, search, minRisk]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar
        title="Transaction Feed"
        subtitle={`${transactions.length} buffered · ${filtered.length} shown`}
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
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        }
      />

      {/* Filter bar */}
      <div className="px-6 py-3 border-b border-bg-border bg-bg-card flex items-center gap-4 flex-wrap shrink-0">
        <div className="flex items-center gap-2 bg-bg-base rounded border border-bg-border px-3 py-1.5 flex-1 min-w-48 max-w-72">
          <Search className="w-3.5 h-3.5 text-[#3a5070]" />
          <input
            type="text"
            placeholder="TXN ID · User · Merchant"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-xs font-mono text-[#aac4d8] placeholder-[#2a4060] outline-none flex-1"
          />
        </div>

        <div className="flex items-center gap-1">
          {DECISIONS.map(d => (
            <button
              key={d}
              onClick={() => setFilter(d)}
              className={cn("px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider border transition-all",
                filter === d
                  ? d === "ALL" ? "text-cyan-DEFAULT bg-cyan-subtle border-cyan-dim"
                    : getDecisionColor(d as DecisionType)
                  : "text-[#3a5070] border-bg-border hover:text-[#5a7090]"
              )}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#4a6080]">
          <Filter className="w-3 h-3" />
          <span>Risk ≥</span>
          <input
            type="range" min={0} max={1} step={0.05}
            value={minRisk}
            onChange={e => setMinRisk(Number(e.target.value))}
            className="w-20 accent-cyan-DEFAULT"
          />
          <span className="text-cyan-DEFAULT w-8">{formatPercent(minRisk, 0)}</span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs font-mono">
          <thead className="sticky top-0 bg-bg-card border-b border-bg-border z-10">
            <tr className="text-[#3a5070] uppercase text-[9px] tracking-widest">
              <th className="text-left px-4 py-3">Timestamp</th>
              <th className="text-left px-4 py-3">TXN ID</th>
              <th className="text-left px-4 py-3">User</th>
              <th className="text-right px-4 py-3">Amount</th>
              <th className="text-left px-4 py-3">Merchant</th>
              <th className="text-center px-4 py-3">Decision</th>
              <th className="text-center px-4 py-3">Risk</th>
              <th className="text-right px-4 py-3">Ensemble</th>
              <th className="text-right px-4 py-3">RL Conf.</th>
              <th className="text-center px-4 py-3">Override</th>
              <th className="text-right px-4 py-3">Latency</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx, i) => {
              const risk = getRiskLevel(tx.riskScore);
              return (
                <tr
                  key={tx.id}
                  className={cn(
                    "border-b border-bg-border/40 cursor-pointer hover:bg-bg-elevated transition-colors",
                    i === 0 && isLive ? "animate-ticker" : ""
                  )}
                  onClick={() => setSelected(tx)}
                >
                  <td className="px-4 py-2 text-[#3a5070] whitespace-nowrap">
                    {tx.timestamp.toLocaleTimeString("en-US", { hour12: false })}
                  </td>
                  <td className="px-4 py-2 text-cyan-DEFAULT/60 whitespace-nowrap">{tx.id.slice(-14)}</td>
                  <td className="px-4 py-2 text-[#aac4d8] whitespace-nowrap">{tx.userName}</td>
                  <td className="px-4 py-2 text-right text-white font-semibold whitespace-nowrap">{formatCurrency(tx.amount)}</td>
                  <td className="px-4 py-2 text-[#5a7090] whitespace-nowrap">{tx.merchant}</td>
                  <td className="px-4 py-2 text-center whitespace-nowrap">
                    <span className={cn("px-2 py-0.5 rounded border text-[9px] font-bold tracking-widest", getDecisionColor(tx.decision))}>
                      {tx.decision}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className={cn("text-[10px] font-bold", getRiskColor(risk))}>{risk}</span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span className={tx.ensembleScore > 0.6 ? "text-red-alert" : "text-[#5a7090]"}>
                      {formatPercent(tx.ensembleScore)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span className={tx.rlConfidence > 0.8 ? "text-green-neon" : "text-yellow-warn"}>
                      {formatPercent(tx.rlConfidence)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    {tx.overrideTriggered
                      ? <span className="text-yellow-warn text-[10px] font-bold">YES</span>
                      : <span className="text-[#2a4060] text-[10px]">—</span>
                    }
                  </td>
                  <td className="px-4 py-2 text-right text-[#4a6080] whitespace-nowrap">{tx.processingMs.toFixed(1)}ms</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-[#2a4060] font-mono text-sm">
            No transactions match current filters.
          </div>
        )}
      </div>

      <TransactionDrawer tx={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
