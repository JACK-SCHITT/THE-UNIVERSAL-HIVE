export type AgentName = "architect" | "developer" | "devops" | "marketer" | "legal" | "billing" | "openclaw";

export type AgentStatus = "idle" | "thinking" | "working" | "done" | "error";

export interface Agent {
  id: AgentName;
  label: string;
  description: string;
  color: string;
  status: AgentStatus;
  icon: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "openclaw" | "agent";
  agentId?: AgentName;
  content: string;
  timestamp: Date;
  streaming?: boolean;
  actions?: MessageAction[];
  metadata?: Record<string, unknown>;
}

export interface MessageAction {
  label: string;
  value: string;
  variant?: "primary" | "secondary" | "danger";
}

export type AppTrack = "regular" | "pro";
export type AppStatus = "ideation" | "building" | "deployed" | "live" | "archived";

export interface ColossalApp {
  id: string;
  name: string;
  description: string;
  track: AppTrack;
  status: AppStatus;
  monthlyRevenue: number;
  growthRate: number;
  createdAt: Date;
  launchUrl?: string;
  niche: string;
  platforms: ("web" | "ios" | "android")[];
  revShareYear1: number;
  revShareLifetime: number;
  buildFee: number;
  logoEmoji: string;
}

export interface BuyoutProjection {
  appId: string;
  currentMRR: number;
  annualRevenue: number;
  growthRate: number;
  projected10Year: number;
  buyoutPrice: number;
  yearlyBreakdown: { year: number; revenue: number }[];
  colossalShare: number;
  nicheMultiplier: number;
}

export type PhaseStep =
  | "greeting"
  | "idea"
  | "feasibility"
  | "payment"
  | "logistics"
  | "live"
  | "marketing";

export interface OnboardingState {
  phase: PhaseStep;
  appIdea?: string;
  track?: AppTrack;
  projectName?: string;
}

export interface MarketingCampaign {
  id: string;
  appId: string;
  type: "seo" | "aso" | "social" | "email" | "push";
  status: "queued" | "running" | "complete";
  reach: number;
  conversions: number;
}

export interface SelfImprovementModule {
  id: string;
  name: string;
  description: string;
  status: "available" | "integrating" | "active";
  addedAt: Date;
}
