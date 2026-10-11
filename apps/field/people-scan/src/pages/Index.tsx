import { useState } from "react";
import { Search, Shield, Database, Globe, Zap } from "lucide-react";
import { SearchData, defaultSearchData } from "@/types";
import SearchForm from "@/components/features/SearchForm";
import ResultsView from "@/components/features/ResultsView";
import heroBg from "@/assets/hero-bg.jpg";

export default function Index() {
  const [data, setData] = useState<SearchData>(defaultSearchData);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field: keyof SearchData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    setData(defaultSearchData);
    setSubmitted(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (submitted) {
    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #020817 0%, #0a0f1e 50%, #020a12 100%)" }}>
        <header className="border-b border-slate-800/60 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <button onClick={handleReset} className="flex items-center gap-2.5 group">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #00d4ff, #0096ff)" }}
              >
                <Search size={14} className="text-slate-900" />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-100">
                TERRY <span className="text-[#00d4ff]">FINDER</span>
              </span>
            </button>
            <span className="text-xs text-slate-600 tracking-widest uppercase">100% Free · Public Records Only</span>
          </div>
        </header>
        <ResultsView data={data} onReset={handleReset} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #020817 0%, #0a0f1e 50%, #020a12 100%)" }}>
      {/* Hero section */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})`, opacity: 0.18 }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(2,8,23,0.4), rgba(2,8,23,0.9), #020817)" }} />

        <div className="relative max-w-4xl mx-auto px-4 pt-12 pb-8 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #00d4ff, #0096ff)", boxShadow: "0 0 32px rgba(0,212,255,0.3)" }}
            >
              <Search size={20} className="text-slate-900" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-100">
              TERRY <span className="text-[#00d4ff]">FINDER</span>
            </span>
          </div>

          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6"
            style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "#00d4ff", letterSpacing: "0.06em" }}
          >
            <div className="pulse-dot w-1.5 h-1.5 rounded-full bg-[#00d4ff]" />
            WORLD-CLASS · 100% FREE · NO REGISTRATION
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-slate-100 mb-4 leading-tight tracking-tight">
            Find Anyone.<br />
            <span style={{ background: "linear-gradient(90deg, #00d4ff, #0096ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Every Public Record.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            Queries government databases and open APIs directly — FEC, federal courts, state court systems, corporate registries, BOP inmates, and sex offender registries. The same primary sources paid apps resell. Free.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-10">
            {[
              { icon: Database, value: "12", label: "Live APIs" },
              { icon: Globe, value: "50+", label: "State Court Portals" },
              { icon: Shield, value: "$0", label: "Cost — Ever" },
              { icon: Zap, value: "Primary", label: "Source Data" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)" }}
                >
                  <Icon size={15} className="text-[#00d4ff]" />
                </div>
                <div className="text-left">
                  <div className="text-base font-bold text-slate-100">{value}</div>
                  <div className="text-xs text-slate-500">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search form */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="mb-4 text-center">
          <p className="text-xs text-slate-600 tracking-widest uppercase">
            Fill in as much or as little as you know — every field is optional
          </p>
        </div>

        <SearchForm data={data} onChange={handleChange} onSubmit={handleSubmit} />

        {/* Category preview badges */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {[
            "⚖️ Federal Court Dockets",
            "🏛️ FEC Political Donations",
            "📊 Corporate Officer Records",
            "💻 GitHub Developer Profiles",
            "🏢 BOP Federal Inmates",
            "⚠️ NSOPW Sex Offender Registry",
            "🗳️ State Voter Portals",
            "🏠 County Property Assessors",
            "📋 IRS Nonprofit Filings",
          ].map((tag) => (
            <span key={tag} className="source-chip px-2.5 py-1 rounded-full text-xs">
              {tag}
            </span>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-slate-700 mt-6 leading-relaxed max-w-xl mx-auto">
          TERRY FINDER queries government APIs and open data sources directly. All data is from public records. Intended for lawful use only in accordance with applicable laws.
        </p>
      </div>
    </div>
  );
}
