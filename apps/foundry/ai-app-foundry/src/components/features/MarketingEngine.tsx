import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ColossalApp, MarketingCampaign } from "@/types";
import { generateId } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  apps: ColossalApp[];
}

const CAMPAIGN_TYPES: { type: MarketingCampaign["type"]; label: string; icon: string; desc: string }[] = [
  { type: "seo", label: "SEO", icon: "🔍", desc: "Writes metadata, keywords, and descriptions to rank on Google" },
  { type: "aso", label: "ASO", icon: "📱", desc: "App Store keyword optimization and ranking strategy" },
  { type: "social", label: "Social Ads", icon: "🎨", desc: "AI-generated ad creative for TikTok and Meta" },
  { type: "email", label: "Email Drip", icon: "📧", desc: "Automated onboarding and retention email sequences" },
  { type: "push", label: "Push Notifications", icon: "🔔", desc: "Behavior-triggered push notifications for re-engagement" },
];

export default function MarketingEngine({ apps }: Props) {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>(apps[0]?.id ?? "");

  const launchCampaign = (type: MarketingCampaign["type"]) => {
    if (!selectedApp) return;
    const newCampaign: MarketingCampaign = {
      id: generateId(),
      appId: selectedApp,
      type,
      status: "queued",
      reach: 0,
      conversions: 0,
    };
    setCampaigns((prev) => [newCampaign, ...prev]);
    toast.success(`${type.toUpperCase()} campaign queued for Marketer Agent`);

    // Simulate progression
    setTimeout(() => {
      setCampaigns((prev) =>
        prev.map((c) => c.id === newCampaign.id ? { ...c, status: "running" } : c)
      );
    }, 1500);

    setTimeout(() => {
      const reach = Math.floor(Math.random() * 50000) + 5000;
      const conversions = Math.floor(reach * (0.02 + Math.random() * 0.05));
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === newCampaign.id ? { ...c, status: "complete", reach, conversions } : c
        )
      );
      toast.success(`Campaign complete — ${conversions.toLocaleString()} conversions`);
    }, 5000);
  };

  return (
    <div className="space-y-5">
      {/* App selector */}
      <div>
        <label className="text-xs text-muted-foreground font-mono uppercase tracking-wider block mb-2">
          Target App
        </label>
        <select
          value={selectedApp}
          onChange={(e) => setSelectedApp(e.target.value)}
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/60"
        >
          {apps.map((app) => (
            <option key={app.id} value={app.id}>
              {app.logoEmoji} {app.name}
            </option>
          ))}
        </select>
      </div>

      {/* Campaign types */}
      <div>
        <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-2">
          Launch Campaign
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CAMPAIGN_TYPES.map((ct) => (
            <button
              key={ct.type}
              onClick={() => launchCampaign(ct.type)}
              className="flex items-start gap-2.5 p-3 rounded-lg bg-secondary/50 border border-border/60 hover:border-primary/40 hover:bg-primary/5 text-left transition-all duration-200 group"
            >
              <span className="text-lg">{ct.icon}</span>
              <div>
                <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  {ct.label}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ct.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active campaigns */}
      {campaigns.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-2">
            Campaign Log
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {campaigns.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/40 text-xs"
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    c.status === "queued" && "bg-muted-foreground",
                    c.status === "running" && "bg-amber-400 animate-pulse",
                    c.status === "complete" && "bg-green-400"
                  )}
                />
                <span className="font-mono font-semibold text-foreground uppercase">{c.type}</span>
                <span className="text-muted-foreground flex-1">{c.status}</span>
                {c.status === "complete" && (
                  <span className="text-green-400 font-mono">
                    {c.conversions.toLocaleString()} cvr
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
