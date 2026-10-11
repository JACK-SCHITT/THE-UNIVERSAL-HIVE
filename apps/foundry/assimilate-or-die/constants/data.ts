// Static data for ASSIMILATE OR DIE — AI APP FOUNDRY

export interface AITool {
  id: string;
  name: string;
  category: string;
  description: string;
  tier: 'CORE' | 'ADVANCED' | 'APEX';
  power: number; // 1–100
  tags: string[];
  launchUrl?: string;
  isNew?: boolean;
}

export interface AppSubmission {
  id: string;
  name: string;
  builder: string;
  description: string;
  category: string;
  votes: number;
  status: 'live' | 'pending' | 'rejected';
  createdAt: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  xp: number;
  completed: boolean;
  type: 'explore' | 'build' | 'chat' | 'submit';
}

export interface Rank {
  level: number;
  title: string;
  minXP: number;
  maxXP: number;
  color: string;
}

export const AI_TOOLS: AITool[] = [
  {
    id: '1',
    name: 'NEURALFORGE',
    category: 'Code Generation',
    description: 'Generate, debug, and refactor code across 40+ languages. Full-stack domination from a single prompt.',
    tier: 'APEX',
    power: 98,
    tags: ['Code', 'Debug', 'Refactor'],
    isNew: true,
  },
  {
    id: '2',
    name: 'VOIDSCRIBE',
    category: 'Content Creation',
    description: 'Dark, compelling copy that converts. Blog posts, ads, scripts — forged in the void.',
    tier: 'ADVANCED',
    power: 85,
    tags: ['Writing', 'Marketing', 'Copy'],
  },
  {
    id: '3',
    name: 'MINDMAP OVERLORD',
    category: 'Planning & Strategy',
    description: 'Break down any goal into an executable war plan. Projects, startups, campaigns — all fall.',
    tier: 'ADVANCED',
    power: 80,
    tags: ['Strategy', 'Planning', 'Goals'],
  },
  {
    id: '4',
    name: 'IMAGEREAPER',
    category: 'Image Generation',
    description: 'Generate photorealistic and artistic images from text. Logos, concepts, UI mockups on demand.',
    tier: 'APEX',
    power: 95,
    tags: ['Images', 'Design', 'Art'],
    isNew: true,
  },
  {
    id: '5',
    name: 'DATASOUL',
    category: 'Data Analysis',
    description: 'Upload any dataset. Get instant insights, charts, patterns, and actionable predictions.',
    tier: 'ADVANCED',
    power: 88,
    tags: ['Data', 'Analytics', 'CSV'],
  },
  {
    id: '6',
    name: 'PROMPTSMITH',
    category: 'Prompt Engineering',
    description: 'Craft elite prompts for any AI model. Turn mediocre outputs into masterpieces.',
    tier: 'CORE',
    power: 70,
    tags: ['Prompts', 'Optimization', 'AI'],
  },
  {
    id: '7',
    name: 'AUTOMATON PRIME',
    category: 'Automation',
    description: 'Design multi-step AI workflows and automation chains. Let the machines do the heavy lifting.',
    tier: 'APEX',
    power: 92,
    tags: ['Automation', 'Workflow', 'Bots'],
  },
  {
    id: '8',
    name: 'VOICEBORN',
    category: 'Audio & Voice',
    description: 'Clone voices, generate speech, transcribe audio. Your words, amplified.',
    tier: 'ADVANCED',
    power: 82,
    tags: ['Voice', 'Audio', 'TTS'],
  },
  {
    id: '9',
    name: 'TRANSLATE.EXE',
    category: 'Language',
    description: 'Real-time translation across 120+ languages with cultural context and tone preservation.',
    tier: 'CORE',
    power: 75,
    tags: ['Language', 'Translation', 'Global'],
  },
  {
    id: '10',
    name: 'SENTINELMAIL',
    category: 'Email & Communication',
    description: 'AI-drafted emails that get responses. Cold outreach, follow-ups, negotiations — automated.',
    tier: 'CORE',
    power: 68,
    tags: ['Email', 'Outreach', 'Sales'],
  },
];

export const CATEGORIES = ['ALL', 'Code Generation', 'Content Creation', 'Image Generation', 'Data Analysis', 'Automation', 'Planning & Strategy', 'Audio & Voice', 'Language', 'Email & Communication', 'Prompt Engineering'];

export const APP_SUBMISSIONS: AppSubmission[] = [
  {
    id: '1',
    name: 'CRYPTOVAULT AI',
    builder: 'Executor_7',
    description: 'Real-time crypto portfolio tracker with AI-powered predictions.',
    category: 'Finance',
    votes: 284,
    status: 'live',
    createdAt: '2026-04-28',
  },
  {
    id: '2',
    name: 'DARKGYM PRO',
    builder: 'IronSoul_X',
    description: 'AI personal trainer that builds gothic, hardcore workout programs.',
    category: 'Health',
    votes: 193,
    status: 'live',
    createdAt: '2026-04-30',
  },
  {
    id: '3',
    name: 'LEGALREAPER',
    builder: 'LawBreaker_AI',
    description: 'AI that reads contracts and finds every loophole. Lawyer killer.',
    category: 'Legal',
    votes: 97,
    status: 'pending',
    createdAt: '2026-05-01',
  },
];

export const MISSIONS: Mission[] = [
  {
    id: '1',
    title: 'FIRST ASSIMILATION',
    description: 'Browse and launch your first AI tool from the Foundry.',
    xp: 100,
    completed: false,
    type: 'explore',
  },
  {
    id: '2',
    title: 'MIND MELD',
    description: 'Send 5 messages to the AI Commander.',
    xp: 150,
    completed: false,
    type: 'chat',
  },
  {
    id: '3',
    title: 'BUILDER INITIATE',
    description: 'Submit your first app to the Foundry.',
    xp: 300,
    completed: false,
    type: 'submit',
  },
  {
    id: '4',
    title: 'KNOWLEDGE SEEKER',
    description: 'Complete 3 lessons in the Build & Learn section.',
    xp: 200,
    completed: false,
    type: 'build',
  },
  {
    id: '5',
    title: 'TOOL MASTER',
    description: 'Explore all 10 AI tools in the Foundry.',
    xp: 250,
    completed: false,
    type: 'explore',
  },
];

export const RANKS: Rank[] = [
  { level: 1, title: 'INITIATE', minXP: 0, maxXP: 499, color: '#888888' },
  { level: 2, title: 'ASSIMILANT', minXP: 500, maxXP: 1499, color: '#27AE60' },
  { level: 3, title: 'EXECUTOR', minXP: 1500, maxXP: 3499, color: '#00B8CC' },
  { level: 4, title: 'DOMINATOR', minXP: 3500, maxXP: 6999, color: '#F39C12' },
  { level: 5, title: 'APEX ENTITY', minXP: 7000, maxXP: 999999, color: '#E74C3C' },
];

export const LEARN_MODULES = [
  {
    id: '1',
    title: 'PROMPT ENGINEERING 101',
    subtitle: 'Master the art of commanding AI',
    lessons: 8,
    duration: '45 min',
    level: 'CORE',
    icon: 'psychology',
    completed: 0,
  },
  {
    id: '2',
    title: 'BUILDING AI APPS',
    subtitle: 'From idea to deployed product',
    lessons: 12,
    duration: '2h 10m',
    level: 'ADVANCED',
    icon: 'build',
    completed: 0,
  },
  {
    id: '3',
    title: 'AI AUTOMATION MASTERY',
    subtitle: 'Chain AI tools into unstoppable workflows',
    lessons: 10,
    duration: '1h 30m',
    level: 'ADVANCED',
    icon: 'auto_awesome',
    completed: 0,
  },
  {
    id: '4',
    title: 'APEX AI STRATEGY',
    subtitle: 'Dominate markets and systems with AI',
    lessons: 15,
    duration: '3h+',
    level: 'APEX',
    icon: 'military_tech',
    completed: 0,
  },
];
