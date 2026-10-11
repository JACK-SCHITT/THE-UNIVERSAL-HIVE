import { useState, useEffect } from "react";
import type { ColossalApp, ChatMessage, PhaseStep, SelfImprovementModule } from "@/types";
import { generateId } from "@/lib/utils";

const STORAGE_KEY = "colossal_state";

interface AppState {
  apps: ColossalApp[];
  messages: ChatMessage[];
  phase: PhaseStep;
  appIdea: string;
  modules: SelfImprovementModule[];
  totalRevenue: number;
  colossalEarnings: number;
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        messages: (parsed.messages || []).map((m: ChatMessage) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })),
        apps: (parsed.apps || []).map((a: ColossalApp) => ({
          ...a,
          createdAt: new Date(a.createdAt),
        })),
      };
    }
  } catch (e) {
    console.error("[AppStore] Failed to load state:", e);
  }
  return getDefaultState();
}

function getDefaultState(): AppState {
  return {
    apps: DEMO_APPS,
    messages: [],
    phase: "greeting",
    appIdea: "",
    modules: INITIAL_MODULES,
    totalRevenue: 18450,
    colossalEarnings: 4612,
  };
}

export function useAppStore() {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("[AppStore] Failed to save state:", e);
    }
  }, [state]);

  const addMessage = (msg: ChatMessage) => {
    setState((s) => ({ ...s, messages: [...s.messages, msg] }));
  };

  const setPhase = (phase: PhaseStep) => {
    setState((s) => ({ ...s, phase }));
  };

  const setAppIdea = (appIdea: string) => {
    setState((s) => ({ ...s, appIdea }));
  };

  const addApp = (app: ColossalApp) => {
    setState((s) => ({
      ...s,
      apps: [app, ...s.apps],
      totalRevenue: s.totalRevenue + app.monthlyRevenue,
    }));
  };

  const addModule = (mod: Omit<SelfImprovementModule, "id" | "addedAt">) => {
    const existing = state.modules.find((m) => m.name === mod.name);
    if (existing) return;
    const newMod: SelfImprovementModule = {
      id: generateId(),
      ...mod,
      addedAt: new Date(),
    };
    setState((s) => ({ ...s, modules: [...s.modules, newMod] }));
    console.log("[Self-Improve] New module integrated:", mod.name);
  };

  const clearMessages = () => {
    setState((s) => ({ ...s, messages: [], phase: "greeting" }));
  };

  return {
    ...state,
    addMessage,
    setPhase,
    setAppIdea,
    addApp,
    addModule,
    clearMessages,
  };
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_APPS: ColossalApp[] = [
  {
    id: "app_001",
    name: "NutriTrack Pro",
    description: "AI-powered nutrition tracker with personalized meal planning",
    track: "pro",
    status: "live",
    monthlyRevenue: 4200,
    growthRate: 0.18,
    createdAt: new Date("2025-01-15"),
    launchUrl: "https://nutritrack.colossalai.app",
    niche: "HealthTech",
    platforms: ["web", "ios", "android"],
    revShareYear1: 0.25,
    revShareLifetime: 0.10,
    buildFee: 150,
    logoEmoji: "🥗",
  },
  {
    id: "app_002",
    name: "DealFlow CRM",
    description: "Real estate deal tracking and pipeline management for investors",
    track: "pro",
    status: "live",
    monthlyRevenue: 8900,
    growthRate: 0.22,
    createdAt: new Date("2024-11-20"),
    launchUrl: "https://dealflow.colossalai.app",
    niche: "SaaS",
    platforms: ["web"],
    revShareYear1: 0.25,
    revShareLifetime: 0.10,
    buildFee: 200,
    logoEmoji: "🏢",
  },
  {
    id: "app_003",
    name: "GigRouter",
    description: "Freelancer job aggregator with AI-matched opportunities",
    track: "regular",
    status: "deployed",
    monthlyRevenue: 1850,
    growthRate: 0.12,
    createdAt: new Date("2025-02-28"),
    niche: "Marketplace",
    platforms: ["web", "ios"],
    revShareYear1: 0.25,
    revShareLifetime: 0.10,
    buildFee: 100,
    logoEmoji: "💼",
  },
  {
    id: "app_004",
    name: "MindVault",
    description: "Second brain app with AI-powered knowledge graph",
    track: "pro",
    status: "building",
    monthlyRevenue: 0,
    growthRate: 0.3,
    createdAt: new Date("2025-04-20"),
    niche: "Productivity",
    platforms: ["web", "ios", "android"],
    revShareYear1: 0.25,
    revShareLifetime: 0.10,
    buildFee: 150,
    logoEmoji: "🧠",
  },
];

const INITIAL_MODULES: SelfImprovementModule[] = [
  {
    id: "mod_core",
    name: "Core Reasoning Engine",
    description: "OpenClaw base reasoning and Prime Directive enforcement",
    status: "active",
    addedAt: new Date("2025-01-01"),
  },
  {
    id: "mod_build",
    name: "App Build Pipeline",
    description: "React, Next.js, React Native code generation",
    status: "active",
    addedAt: new Date("2025-01-01"),
  },
  {
    id: "mod_deploy",
    name: "Deployment Automation",
    description: "Vercel, AWS, App Store, Google Play automated deployment",
    status: "active",
    addedAt: new Date("2025-01-01"),
  },
  {
    id: "mod_legal",
    name: "Legal Factory",
    description: "Auto-generated ToS and Privacy Policy for every app",
    status: "active",
    addedAt: new Date("2025-01-01"),
  },
];
