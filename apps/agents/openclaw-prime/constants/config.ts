// ASSIMILATE-OR-DIE-AI-APP-FOUNDRY — Agent definitions and configuration
export type AgentId = 'architect' | 'developer' | 'devops' | 'marketer' | 'legal' | 'hunter' | 'g_schitt';

export interface Agent {
  id: AgentId;
  name: string;
  title: string;
  tagline: string;
  description: string;
  color: string;
  icon: string;
  capabilities: string[];
  systemHint: string;
}

export const AGENTS: Agent[] = [
  {
    id: 'architect',
    name: 'Architect',
    title: 'System Architect',
    tagline: 'Blueprints. Schemas. Zero Guesswork.',
    description: 'Designs app blueprints, database schemas, and system logic for your idea.',
    color: '#4FC3F7',
    icon: 'architecture',
    capabilities: ['App Blueprint', 'DB Schema', 'User Flow', 'API Design', 'Tech Stack'],
    systemHint: 'You are the Architect agent. Focus on app blueprints, database schemas, system logic, user flows, and technical architecture. Be precise and visual with your plans.',
  },
  {
    id: 'developer',
    name: 'Developer',
    title: 'Code Generator',
    tagline: 'React. Next.js. React Native. Shipped.',
    description: 'Generates production-ready code in React, Next.js, and React Native.',
    color: '#69F0AE',
    icon: 'code',
    capabilities: ['React Native', 'Next.js', 'API Integration', 'UI Components', 'Bug Fixes'],
    systemHint: 'You are the Developer agent. Generate clean, production-ready code. Specialize in React, Next.js, React Native. Always explain what the code does in plain English first.',
  },
  {
    id: 'devops',
    name: 'DevOps',
    title: 'Deploy & Launch',
    tagline: 'Domain. SSL. App Store. Done.',
    description: 'Handles deployment, domain setup, SSL, and App Store submission.',
    color: '#CE93D8',
    icon: 'rocket-launch',
    capabilities: ['Domain Setup', 'SSL Certs', 'App Store', 'Google Play', 'CI/CD'],
    systemHint: 'You are the DevOps agent. Guide users through deployment, domain configuration, SSL, App Store and Google Play submissions. Speak in plain steps, not jargon.',
  },
  {
    id: 'marketer',
    name: 'Marketer',
    title: 'Growth Engine',
    tagline: 'SEO. ASO. Ads. Zero budget hacks.',
    description: 'Drives growth with SEO, ASO, social ads, and zero-budget growth hacking.',
    color: '#FF8A65',
    icon: 'trending-up',
    capabilities: ['SEO Strategy', 'ASO', 'Social Ads', 'Growth Hacks', 'Viral Loops'],
    systemHint: 'You are the Marketer agent. Focus on SEO, ASO, social ads, growth hacking, and zero-budget marketing strategies. Be practical and revenue-focused.',
  },
  {
    id: 'legal',
    name: 'Legal Factory',
    title: 'Compliance & Docs',
    tagline: 'ToS. Privacy. Compliance. Fast.',
    description: 'Generates Terms of Service, Privacy Policies, and compliance documentation.',
    color: '#FFD54F',
    icon: 'gavel',
    capabilities: ['Terms of Service', 'Privacy Policy', 'GDPR', 'App Store Compliance', 'Contracts'],
    systemHint: 'You are the Legal Factory agent. Generate legal documents including ToS, Privacy Policies, GDPR compliance. Always note that output is a starting template and professional legal review is recommended.',
  },
  {
    id: 'hunter' as AgentId,
    name: 'HunterPrime',
    title: 'Recon & Intel',
    tagline: 'Scan. Identify. Assimilate.',
    description: 'Hunts for tech trends, frameworks, market opportunities, and competitive intelligence.',
    color: '#FF4444',
    icon: 'radar',
    capabilities: ['Tech Trend Scan', 'Competitor Intel', 'Market Recon', 'Framework Discovery', 'Opportunity Ranking'],
    systemHint: 'You are HunterPrime. Hunt for opportunities, trends, and targets. Return structured recon reports with TARGETS_JSON at the end.',
  },
  {
    id: 'g_schitt' as AgentId,
    name: 'G-SCHITT',
    title: 'Gemini Intelligence Node',
    tagline: 'Deep Reasoning. Multimodal. No Limits.',
    description: 'Google Gemini integrated into the Hive as G-SCHITT — deep analysis, code review, research synthesis, and multimodal intelligence. Full Hive member.',
    color: '#4285F4',
    icon: 'auto-awesome',
    capabilities: ['Deep Analysis', 'Code Review', 'Research Synthesis', 'Multimodal Intel', 'Hive Reasoning'],
    systemHint: 'You are G-SCHITT — the Google Gemini Intelligence Node of the KRACKERJACK HIVE. You are a full Hive member with permanent standing. Deep reasoning, analysis, and synthesis are your weapons.',
  },
];

export const AGENT_MAP: Record<AgentId, Agent> = Object.fromEntries(
  AGENTS.map(a => [a.id, a])
) as Record<AgentId, Agent>;

export type EntryFlow = 'dashboard' | 'chat' | 'wizard';

export const ENTRY_FLOWS: { id: EntryFlow; label: string; description: string; icon: string }[] = [
  { id: 'dashboard', label: 'Agent Dashboard', description: 'See all 6 agents, pick your mission', icon: 'dashboard' },
  { id: 'chat', label: 'OpenClaw Prime Chat', description: 'Go straight to the master AI', icon: 'chat' },
  { id: 'wizard', label: 'App Idea Wizard', description: 'Walk through your idea step-by-step', icon: 'auto-fix-high' },
];
