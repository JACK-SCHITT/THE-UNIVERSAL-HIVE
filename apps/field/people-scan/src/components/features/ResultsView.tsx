import { useEffect, useState } from "react";
import { ExternalLink, Search, Loader2, CheckCircle2, XCircle, Inbox, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { SearchData } from "@/types";
import { useLiveSearch, LiveResult, LiveRecord } from "@/hooks/useLiveSearch";

interface Props {
  data: SearchData;
  onReset: () => void;
}

function buildSearchSummary(d: SearchData): string {
  const parts: string[] = [];
  if (d.firstName || d.lastName) parts.push([d.firstName, d.middleName, d.lastName, d.suffix].filter(Boolean).join(" "));
  if (d.city || d.state) parts.push([d.city, d.state].filter(Boolean).join(", "));
  if (d.phoneNumber) parts.push(d.phoneNumber);
  if (d.email) parts.push(d.email);
  if (d.employer) parts.push(`@ ${d.employer}`);
  return parts.join(" · ") || "No details entered";
}

function RecordCard({ record }: { record: LiveRecord }) {
  return (
    <div
      className="rounded-xl p-4 group transition-all"
      style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(0,212,255,0.1)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-100 leading-tight">{record.title}</p>
          {record.subtitle && (
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{record.subtitle}</p>
          )}
          {record.detail && (
            <p className="text-xs text-slate-500 mt-1">{record.detail}</p>
          )}
          {record.tags && record.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {record.tags.filter(Boolean).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{ background: "rgba(0,212,255,0.08)", color: "#64b6c8", border: "1px solid rgba(0,212,255,0.15)" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        {record.url && (
          <a
            href={record.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:text-white"
            style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            View <ExternalLink size={10} />
          </a>
        )}
      </div>
    </div>
  );
}

function SourceBlock({ result }: { result: LiveResult }) {
  const [expanded, setExpanded] = useState(true);

  const statusIcon = () => {
    switch (result.status) {
      case "loading": return <Loader2 size={14} className="text-[#00d4ff] animate-spin" />;
      case "success": return <CheckCircle2 size={14} className="text-emerald-400" />;
      case "empty": return <Inbox size={14} className="text-slate-500" />;
      case "error": return <XCircle size={14} className="text-red-400" />;
    }
  };

  const statusLabel = () => {
    switch (result.status) {
      case "loading": return <span className="text-[#00d4ff]">Querying...</span>;
      case "success": return <span className="text-emerald-400">{result.records.length} record{result.records.length !== 1 ? "s" : ""} found</span>;
      case "empty": return <span className="text-slate-500">No records found</span>;
      case "error": return <span className="text-red-400">Could not connect</span>;
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{ background: "rgba(15,23,42,0.7)", border: `1px solid ${result.status === "success" ? "rgba(0,212,255,0.2)" : result.status === "error" ? "rgba(248,113,113,0.15)" : "rgba(0,212,255,0.08)"}` }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xl shrink-0">{result.icon}</span>
          <div className="text-left min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-100 truncate">{result.source}</span>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0"
                style={{ background: "rgba(0,212,255,0.08)", color: "#64b6c8", border: "1px solid rgba(0,212,255,0.15)" }}
              >
                {result.category}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {statusIcon()}
              <span className="text-xs">{statusLabel()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {result.directUrl && (
            <a
              href={result.directUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-slate-500 hover:text-[#00d4ff] transition-colors flex items-center gap-1"
            >
              <ExternalLink size={11} /> Direct Link
            </a>
          )}
          {expanded ? <ChevronUp size={15} className="text-slate-500" /> : <ChevronDown size={15} className="text-slate-500" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5">
          {result.status === "loading" && (
            <div className="flex items-center gap-3 py-4">
              <Loader2 size={16} className="text-[#00d4ff] animate-spin" />
              <span className="text-sm text-slate-400">Querying {result.source} directly...</span>
            </div>
          )}
          {result.status === "error" && (
            <div
              className="rounded-xl px-4 py-3 flex items-start gap-3"
              style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)" }}
            >
              <XCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-red-300 font-medium">API connection failed</p>
                <p className="text-xs text-slate-500 mt-0.5">{result.error || "Could not reach this source"} — use the Direct Link to search manually.</p>
              </div>
            </div>
          )}
          {result.status === "empty" && (
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: "rgba(148,163,184,0.05)", border: "1px solid rgba(148,163,184,0.1)" }}
            >
              <Inbox size={14} className="text-slate-500 shrink-0" />
              <p className="text-xs text-slate-500">No matching records found in this database for the information provided.</p>
            </div>
          )}
          {result.status === "success" && result.records.length > 0 && (
            <div className="space-y-3">
              {result.records.map((rec, i) => (
                <RecordCard key={i} record={rec} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ResultsView({ data, onReset }: Props) {
  const { results, searching, done, runSearch } = useLiveSearch();
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    runSearch(data);
  }, []);

  const summary = buildSearchSummary(data);
  const categories = ["All", ...Array.from(new Set(results.map((r) => r.category)))];
  const filtered = activeCategory === "All" ? results : results.filter((r) => r.category === activeCategory);
  const successCount = results.filter((r) => r.status === "success").length;
  const totalRecords = results.reduce((sum, r) => sum + r.records.length, 0);
  const loadingCount = results.filter((r) => r.status === "loading").length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Search summary banner */}
      <div className="glass-card rounded-2xl p-5 mb-5 relative overflow-hidden">
        <div className="scan-line absolute inset-0 pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              {searching ? (
                <>
                  <Loader2 size={13} className="text-[#00d4ff] animate-spin" />
                  <span className="text-xs font-semibold text-[#00d4ff] tracking-widest uppercase">
                    Live Search — Querying {loadingCount} source{loadingCount !== 1 ? "s" : ""}...
                  </span>
                </>
              ) : done ? (
                <>
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400 tracking-widest uppercase">Search Complete</span>
                </>
              ) : null}
            </div>
            <h2 className="text-lg font-bold text-slate-100 truncate">{summary}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {results.length} primary sources queried directly · {totalRecords} records found · {successCount} sources returned data
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-center px-4 py-2.5 rounded-xl" style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)" }}>
              <div className="text-2xl font-bold text-[#00d4ff]">{totalRecords}</div>
              <div className="text-xs text-slate-500">Records</div>
            </div>
            <div className="text-center px-4 py-2.5 rounded-xl" style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)" }}>
              <div className="text-2xl font-bold text-emerald-400">{successCount}</div>
              <div className="text-xs text-slate-500">Sources Hit</div>
            </div>
          </div>
        </div>
      </div>

      {/* What this is doing */}
      <div
        className="rounded-xl px-4 py-3 mb-5 flex items-start gap-3"
        style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.15)" }}
      >
        <AlertTriangle size={14} className="text-[#00d4ff] mt-0.5 shrink-0" />
        <div>
          <p className="text-xs text-slate-300 font-medium">Querying primary sources directly — not search aggregators</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            Live API calls to FEC.gov, CourtListener (PACER), OpenCorporates, ProPublica IRS data, GitHub, BOP Federal Inmates, NSOPW, and official state court/voter/property portals — the same databases paid apps resell.
          </p>
        </div>
      </div>

      {/* Category tabs */}
      {categories.length > 2 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeCategory === cat ? "text-[#00d4ff]" : "text-slate-500 hover:text-slate-300"}`}
              style={activeCategory === cat
                ? { background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.3)" }
                : { background: "rgba(30,41,59,0.5)", border: "1px solid rgba(100,116,139,0.15)" }
              }
            >
              {cat}
              {cat !== "All" && (
                <span className="ml-1.5 text-[10px] text-slate-600">
                  {results.filter((r) => r.category === cat && r.status === "success" && r.records.length > 0).length > 0
                    ? `${results.filter((r) => r.category === cat).reduce((s, r) => s + r.records.length, 0)}`
                    : ""}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Results list */}
      <div className="space-y-4">
        {filtered.map((result, i) => (
          <SourceBlock key={`${result.source}-${i}`} result={result} />
        ))}
      </div>

      {/* Footer actions */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-700/40">
        <p className="text-xs text-slate-600 text-center sm:text-left leading-relaxed">
          TERRY FINDER queries government and open APIs directly. All data is from public records. Intended for lawful use only.
        </p>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.25)", color: "#00d4ff" }}
        >
          <Search size={14} />
          New Search
        </button>
      </div>
    </div>
  );
}
