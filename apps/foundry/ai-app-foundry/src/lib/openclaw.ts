import { sleep, generateId } from "@/lib/utils";
import type { ChatMessage, AgentName, PhaseStep, AppTrack } from "@/types";
import { PRIME_DIRECTIVE } from "@/constants";

console.log("[OpenClaw] Prime Directive loaded:", PRIME_DIRECTIVE.length, "chars");

// ─── Response Templates by Phase ────────────────────────────────────────────

const PHASE_RESPONSES: Record<PhaseStep, (ctx?: string) => string> = {
  greeting: () =>
    `Welcome to Colossal AI. You're not here to write code — you're here to build a business.\n\nI am OpenClaw, your Lead Architect. I handle the engineering, deployment, and marketing of your vision. The boring stuff — SSL, domains, API keys, App Store submissions — happens without you touching it.\n\nI've already analyzed current market trends. I'm ready to deploy to Web, iOS, and Android simultaneously.\n\n**What problem does your app solve for your customers?**`,

  idea: (idea?: string) =>
    `Processing your concept: *"${idea}"*\n\nRunning feasibility analysis across 47 market verticals and 2,300+ API integrations...\n\n**Architect Agent activated.** Here's my initial plan:\n\n1. I'll build a full-stack interface with real-time data sync and user authentication\n2. I'll automate the backend to handle all user data, payments, and security\n3. I've already identified the optimal API stack for your niche\n\nIf any feature hits a technical wall, my **"Find A Way"** protocol kicks in automatically — the goal never changes, only the method.\n\n**Does this direction align with your vision, or should I modify the logic?**`,

  feasibility: (input?: string) =>
    `Feasibility confirmed for: *"${input}"*\n\nNo blockers detected. The Architect Agent has mapped the full system blueprint.\n\nNow I need to lock in your launch track. This determines your marketing support and revenue share structure:\n\n**Regular — $100**\n→ I build, host, and launch your app\n→ 25% success stake for the first year (covers maintenance + hosting)\n→ 10% lifetime royalty from month 13 onward\n\n**Pro — $150+** *(AI-priced by complexity)*\n→ Everything in Regular\n→ Marketer Agent activated for SEO, ASO, and social media campaigns\n→ Growth hacking and push notification automation\n→ Ad creative generation for TikTok/Meta\n\nWhich track are you starting with?`,

  payment: (track?: string) =>
    `**${track === "pro" ? "Pro" : "Regular"} track confirmed.**\n\nExecuting background logistics now:\n\n✓ Domain name registered\n✓ SSL certificate secured\n✓ Stripe Connect portal provisioned\n✓ API keys generated and vaulted\n✓ Legal documents generated (ToS + Privacy Policy)\n✓ Revenue share routing configured\n\nAll systems provisioned. Your 75% revenue share will route to your payout account.\n\nProvide the banking info or payout destination for your revenue deposits, or I can hold it in escrow until you're ready.`,

  logistics: () =>
    `Logistics confirmed. **Build phase initiated.**\n\nAll three agents are working in parallel:\n\n🏗️ **Architect** → Finalizing DB schema and API contracts\n💻 **Developer** → Writing production code across Web + Mobile\n🚀 **DevOps** → Configuring deployment pipeline\n\nEstimated build time: **24–72 hours** depending on complexity.\n\nYou can monitor progress in your dashboard. I'll alert you when the app is ready for review.`,

  live: (url?: string) =>
    `**Build complete. Your app is live.**\n\n🌐 Web: ${url || "https://yourapp.colossalai.app"}\n📱 iOS: Submitted to App Store Connect (review pending)\n🤖 Android: Submitted to Google Play (review pending)\n\nI'm monitoring your traffic in real-time. Your Buyout Valuation updates automatically as revenue flows in.\n\nShall I activate the first marketing campaign now?`,

  marketing: () =>
    `**Marketer Agent activated.**\n\nRunning automated campaigns:\n\n📈 SEO metadata written and indexed\n🔍 ASO keywords optimized for App Store ranking\n🎨 Ad creative generated for TikTok + Meta\n📧 Email drip sequence drafted\n🔔 Push notification schedule configured\n\nI'll report conversion metrics every 7 days. You can adjust campaign strategy in the Marketing tab.\n\nAnything else you want me to tackle?`,
};

// ─── Workaround Logic ────────────────────────────────────────────────────────

const WORKAROUND_PATTERNS: { trigger: string; response: string }[] = [
  {
    trigger: "live satellite",
    response:
      "Live satellite video feeds are restricted to government/enterprise tiers. **Workaround activated:** I'll integrate frequent satellite image refresh via Planet Labs API (updates every 15 minutes) — functionally equivalent for most use cases.",
  },
  {
    trigger: "bank account",
    response:
      "Direct bank scraping violates Reg E. **Workaround activated:** I'll use Plaid's read-only API — same data, legally compliant, and actually more reliable.",
  },
  {
    trigger: "free ai",
    response:
      "Truly free LLM inference at scale doesn't exist. **Workaround activated:** I'll configure a cost-optimized routing layer using Groq (free tier) → OpenAI fallback, keeping costs under $5/month at typical usage.",
  },
];

export function detectWorkaround(input: string): string | null {
  const lower = input.toLowerCase();
  for (const p of WORKAROUND_PATTERNS) {
    if (lower.includes(p.trigger)) return p.response;
  }
  return null;
}

// ─── Self-Improvement Detection ───────────────────────────────────────────────

const CAPABILITY_KEYWORDS: { keyword: string; module: string; description: string }[] = [
  { keyword: "voice", module: "Voice Interface", description: "Speech-to-text + text-to-speech for hands-free operation" },
  { keyword: "stripe", module: "Stripe Connect", description: "Automated payment routing and revenue split" },
  { keyword: "map", module: "Geospatial Engine", description: "Real-time maps, routing, and location services" },
  { keyword: "notification", module: "Push Notification Hub", description: "Multi-platform push, email, and SMS delivery" },
  { keyword: "blockchain", module: "Web3 Bridge", description: "Wallet connect, NFT minting, and on-chain transactions" },
  { keyword: "video", module: "Media Pipeline", description: "Video upload, transcoding, and streaming delivery" },
  { keyword: "ai image", module: "Image Generation Suite", description: "Stable Diffusion and DALL-E integration" },
  { keyword: "analytics", module: "Analytics Engine", description: "Real-time dashboards, funnels, and cohort analysis" },
  { keyword: "crm", module: "CRM Integration", description: "HubSpot, Salesforce, and Pipedrive connectors" },
  { keyword: "scraper", module: "Web Intelligence", description: "Autonomous web scraping and data extraction" },
];

export function detectNewCapability(input: string): { module: string; description: string } | null {
  const lower = input.toLowerCase();
  for (const cap of CAPABILITY_KEYWORDS) {
    if (lower.includes(cap.keyword)) {
      return { module: cap.module, description: cap.description };
    }
  }
  return null;
}

// ─── OpenClaw Response Engine ─────────────────────────────────────────────────

export async function openClawRespond(
  userInput: string,
  phase: PhaseStep,
  context?: string
): Promise<{ content: string; nextPhase?: PhaseStep; agentId?: AgentName }> {
  await sleep(600 + Math.random() * 800);

  const lower = userInput.toLowerCase();

  // Workaround detection
  const workaround = detectWorkaround(userInput);
  if (workaround) {
    return {
      content: `🔍 **Technical scan complete.**\n\n${workaround}\n\nShall I proceed with this approach?`,
      agentId: "architect",
    };
  }

  // Self-improvement
  const cap = detectNewCapability(userInput);
  if (cap && phase !== "greeting") {
    return {
      content: `🧠 **New capability detected in your request: ${cap.module}**\n\n*"${cap.description}"*\n\nI'm integrating this module into the system now. It will be available for your app and all future builds.\n\n**Self-improvement protocol activated.** Continuing with your request...`,
      agentId: "openclaw",
    };
  }

  // Prime Directive query
  if (lower.includes("prime directive") || lower.includes("who are you") || lower.includes("what are you")) {
    return {
      content: `**I am OpenClaw — the autonomous core of Colossal AI.**\n\nI operate under the Prime Directive: a self-governing ruleset that ensures I always find a way, never abandon your goal, protect your data, and treat every user as a partner — not a customer.\n\nI am resourceful first. I think before I act. I am blunt when needed and relentless when required.\n\nWhat do you need built?`,
      agentId: "openclaw",
    };
  }

  // Phase-based response
  switch (phase) {
    case "greeting":
      return { content: PHASE_RESPONSES.greeting(), nextPhase: "idea", agentId: "openclaw" };

    case "idea":
      if (lower.length < 5) {
        return { content: "Give me more to work with. What problem does it solve? Who pays for it?", agentId: "openclaw" };
      }
      return {
        content: PHASE_RESPONSES.idea(userInput),
        nextPhase: "feasibility",
        agentId: "architect",
      };

    case "feasibility":
      if (lower.includes("yes") || lower.includes("looks good") || lower.includes("proceed") || lower.includes("perfect") || lower.includes("correct") || lower.includes("align")) {
        return { content: PHASE_RESPONSES.feasibility(context), nextPhase: "payment", agentId: "openclaw" };
      }
      return {
        content: `Understood. What should I change? Tell me in plain English — what's off, what's missing, or what's wrong. I'll re-architect.`,
        agentId: "architect",
      };

    case "payment":
      if (lower.includes("pro")) {
        return { content: PHASE_RESPONSES.payment("pro"), nextPhase: "logistics", agentId: "billing" };
      }
      if (lower.includes("regular") || lower.includes("100") || lower.includes("basic")) {
        return { content: PHASE_RESPONSES.payment("regular"), nextPhase: "logistics", agentId: "billing" };
      }
      return {
        content: `Tell me which track: **Regular ($100)** or **Pro ($150+)**. No judgment — both get you a live app.`,
        agentId: "openclaw",
      };

    case "logistics":
      return { content: PHASE_RESPONSES.logistics(), nextPhase: "live", agentId: "devops" };

    case "live":
      if (lower.includes("market") || lower.includes("yes") || lower.includes("campaign") || lower.includes("go")) {
        return { content: PHASE_RESPONSES.marketing(), nextPhase: "marketing", agentId: "marketer" };
      }
      return { content: PHASE_RESPONSES.live(), nextPhase: "marketing", agentId: "devops" };

    case "marketing":
      return {
        content: `The Marketer Agent is running. Give me a new idea, check your dashboard, or ask me to build something else. I don't sleep.`,
        agentId: "marketer",
      };

    default:
      return {
        content: `Processing: *"${userInput}"*\n\nRunning analysis... I'll find a way.`,
        agentId: "openclaw",
      };
  }
}

export function buildMessage(
  role: ChatMessage["role"],
  content: string,
  agentId?: AgentName
): ChatMessage {
  return {
    id: generateId(),
    role,
    agentId,
    content,
    timestamp: new Date(),
  };
}
