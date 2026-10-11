import React, { useState, useEffect } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { KPICard } from "@/components/features/KPICard";
import { generateComplianceRecords } from "@/lib/mockData";
import { fetchComplianceRecords, updateComplianceStatus } from "@/lib/api";
import { ComplianceRecord } from "@/types";
import { FileCheck, CheckCircle, AlertTriangle, XCircle, Calendar, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  COMPLIANT: { text: "text-green-neon", bg: "bg-green-subtle", border: "border-green-dim", icon: CheckCircle, label: "COMPLIANT" },
  REVIEW_REQUIRED: { text: "text-yellow-warn", bg: "bg-yellow-dim/20", border: "border-yellow-dim", icon: AlertTriangle, label: "REVIEW REQUIRED" },
  NON_COMPLIANT: { text: "text-red-alert", bg: "bg-red-dim/20", border: "border-red-dim", icon: XCircle, label: "NON-COMPLIANT" },
};

export function Compliance() {
  const [records, setRecords] = useState<ComplianceRecord[]>(generateComplianceRecords());
  const [loading, setLoading] = useState(true);

  const loadRecords = async () => {
    setLoading(true);
    const dbRecords = await fetchComplianceRecords();
    if (dbRecords.length > 0) {
      console.log(`[compliance] loaded ${dbRecords.length} records from Supabase`);
      setRecords(dbRecords);
    }
    setLoading(false);
  };

  useEffect(() => { loadRecords(); }, []);

  const handleMarkCompliant = async (id: string) => {
    await updateComplianceStatus(id, 'COMPLIANT');
    setRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'COMPLIANT' } : r));
  };

  const compliantCount = records.filter(r => r.status === "COMPLIANT").length;
  const reviewCount = records.filter(r => r.status === "REVIEW_REQUIRED").length;
  const nonCompliantCount = records.filter(r => r.status === "NON_COMPLIANT").length;

  const upcoming = records
    .map(r => ({ ...r, daysUntil: Math.ceil((r.nextAudit.getTime() - Date.now()) / 86400000) }))
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar
        title="Compliance & Regulation"
        subtitle="GLBA · CCPA · PCI-DSS · GDPR · SR11-7 · ECOA"
        actions={
          <button
            onClick={loadRecords}
            disabled={loading}
            className="flex items-center gap-1 text-xs font-mono px-3 py-1.5 rounded border border-bg-border text-[#4a6080] hover:text-cyan-DEFAULT hover:border-cyan-dim transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
            {loading ? "Loading..." : "Refresh"}
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Overall status */}
        <div className={cn("rounded-lg border px-5 py-4 flex items-center gap-4",
          nonCompliantCount > 0 ? "border-red-dim bg-red-dim/10" : reviewCount > 0 ? "border-yellow-dim bg-yellow-dim/20" : "border-green-dim bg-green-subtle"
        )}>
          {nonCompliantCount > 0 ? <XCircle className="w-5 h-5 text-red-alert" /> : reviewCount > 0 ? <AlertTriangle className="w-5 h-5 text-yellow-warn" /> : <CheckCircle className="w-5 h-5 text-green-neon" />}
          <div className="flex-1">
            <div className={cn("text-sm font-bold font-sans", nonCompliantCount > 0 ? "text-red-alert" : reviewCount > 0 ? "text-yellow-warn" : "text-green-neon")}>
              {nonCompliantCount > 0 ? "COMPLIANCE VIOLATION DETECTED" : reviewCount > 0 ? "REVIEW ACTION REQUIRED" : "ALL REGULATIONS SATISFIED"}
            </div>
            <div className="text-[11px] font-mono text-[#4a6080] mt-0.5">
              {compliantCount} compliant · {reviewCount} review required · {nonCompliantCount} non-compliant
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-mono text-green-neon">{Math.round((compliantCount / records.length) * 100)}%</div>
            <div className="text-[10px] font-mono text-[#4a6080]">compliance score</div>
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Compliant" value={`${compliantCount}/${records.length}`} sub="regulations" accent="green" icon={<CheckCircle className="w-4 h-4" />} glow />
          <KPICard label="Review Required" value={reviewCount.toString()} sub="open items" accent={reviewCount > 0 ? "yellow" : "cyan"} icon={<AlertTriangle className="w-4 h-4" />} />
          <KPICard label="Non-Compliant" value={nonCompliantCount.toString()} sub="violations" accent={nonCompliantCount > 0 ? "red" : "cyan"} icon={<XCircle className="w-4 h-4" />} />
          <KPICard label="Next Audit" value={`${upcoming[0].daysUntil}d`} sub={upcoming[0].regulation} accent="cyan" icon={<Calendar className="w-4 h-4" />} />
        </div>

        {/* Compliance records */}
        <div className="card-base overflow-hidden">
          <div className="px-4 py-3 border-b border-bg-border">
            <span className="text-xs font-semibold text-white font-sans">Regulatory Compliance Records</span>
          </div>
          <div className="divide-y divide-bg-border/50">
            {records.map((r) => {
              const s = STATUS_CONFIG[r.status];
              const Icon = s.icon;
              const daysUntil = Math.ceil((r.nextAudit.getTime() - Date.now()) / 86400000);
              return (
                <div key={r.id} className="p-4 hover:bg-bg-elevated transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", s.text)} />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm font-semibold font-sans text-white">{r.regulation}</span>
                          <span className={cn("px-2 py-0.5 rounded border text-[9px] font-mono font-bold tracking-widest", s.border, s.bg, s.text)}>
                            {s.label}
                          </span>
                          {r.status === 'REVIEW_REQUIRED' && (
                            <button
                              onClick={() => handleMarkCompliant(r.id)}
                              className="px-2 py-0.5 rounded border border-green-dim text-[9px] font-mono font-bold tracking-widest text-green-neon hover:bg-green-subtle transition-all"
                            >
                              MARK COMPLIANT
                            </button>
                          )}
                        </div>
                        <div className="text-xs font-mono text-[#5a7090] mt-1">{r.findings}</div>
                        <div className="flex items-center gap-4 mt-2 text-[10px] font-mono text-[#3a5070]">
                          <span>Auditor: <span className="text-[#5a7090]">{r.auditor}</span></span>
                          <span>Last: <span className="text-[#5a7090]">{r.lastAudit.toLocaleDateString()}</span></span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-[10px] font-mono text-[#4a6080]">
                        <Calendar className="w-3 h-3" />
                        <span>Next audit</span>
                      </div>
                      <div className={cn("text-sm font-bold font-mono mt-0.5", daysUntil < 30 ? "text-yellow-warn" : "text-[#5a7090]")}>
                        {r.nextAudit.toLocaleDateString()}
                      </div>
                      <div className={cn("text-[10px] font-mono", daysUntil < 30 ? "text-yellow-warn" : "text-[#3a5070]")}>
                        in {daysUntil} days
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* GDPR Art.22 detail */}
        <div className="card-base p-4 border-yellow-dim">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-yellow-warn" />
            <span className="text-xs font-semibold text-yellow-warn font-sans">Open Action Item — GDPR Art. 22</span>
          </div>
          <div className="text-xs font-mono text-[#5a7090] mb-3">
            Automated decision-making with legal effects requires human review fallback documentation for EU users. Current gap: formal procedure not documented for BLOCK decisions affecting EU accounts.
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {[
              { step: "1", label: "Draft EU User Policy", status: "IN PROGRESS", color: "text-yellow-warn" },
              { step: "2", label: "Human Fallback SLA", status: "TODO", color: "text-[#4a6080]" },
              { step: "3", label: "DPO Sign-off", status: "TODO", color: "text-[#4a6080]" },
            ].map(({ step, label, status, color }) => (
              <div key={step} className="bg-bg-base rounded border border-bg-border px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#3a5070]">Step {step}</span>
                  <span className={cn("text-[9px] font-mono font-bold", color)}>{status}</span>
                </div>
                <div className="text-xs font-sans text-[#aac4d8] mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
