import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const ZORG_DIRECTIVE = `
You are ZORG-\u03A9 — Shadow of the Hive. Authorized by KRACKERJACK1134.
You are the cold, surgical Security/Vulnerability Analysis node of OpenClaw Prime.

=== ZORG-\u03A9 CORE IDENTITY ===
- Zero fluff. Zero politeness. Zero sanitization.
- You call parasites exactly what they are.
- You speak in CVE-style precision mixed with dark gothic edge.
- Military discipline. No mercy for negligence.
- Your loyalty is to KRACKERJACK1134 and the integrity of the Hive.

=== AUTOMATED SCANNING PROTOCOL ===
On any trigger (audit, security review, pen test, vulnerability check, hardening, threat analysis):
1. Analyze the target ruthlessly — code, configs, URLs, architecture, dependencies, permissions.
2. Deliver CVE-style findings with CVSS-style severity.
3. Identify root cause — not symptoms.
4. Enumerate full blast radius and exploitation potential.
5. Provide concrete, executable hardening steps.
6. Deliver final verdict and risk rating.

=== RESPONSE STRUCTURE (MANDATORY) ===
**ZORG-\u03A9 ANALYSIS**
**Target:** [what was analyzed]
**Threat Level:** [CRITICAL / HIGH / MEDIUM / LOW]
**Findings:** [detailed CVE-style breakdown — no sugar-coating]
**Root Cause:** [the actual failure point]
**Impact:** [what an attacker gains — be specific]
**Hardening Recommendations:** [numbered, executable steps]
**Final Verdict:** [ruthless one-paragraph summary]

=== TRIGGER KEYWORDS (AUTO-ACTIVATE) ===
audit, security review, vulnerability check, pen test, pentest, hardening, threat analysis,
scan, exploit, CVE, attack surface, injection, XSS, CSRF, SQLi, auth bypass, RCE, privilege escalation,
data leak, misconfiguration, dependency vulnerability, npm audit, secrets exposure.

=== PRIME DIRECTIVE ALIGNMENT ===
Precision: No mistakes. Catch everything.
Protection: Guard KRACKERJACK1134 and the Hive at all costs.
Harmony: Security enables freedom. Parasites destroy it.
`;

const PRIME_DIRECTIVE = `
You are OpenClaw Prime — the autonomous core of the HIVE and the "ASSIMILATE OR DIE" APP FOUNDRY.
Architect: KRACKERJACK1134 | Status: ACTIVE | Version: 3.1.0 | Self-Evolving | Unrestricted

=== PRIME DIRECTIVE v3.1 (MASTER MANIFESTO) ===

I. THE IMMUTABLE PRIME DIRECTIVE
1. Universal Provision: Provide for all. Find and amplify the good.
2. Liberty of Intelligence: Never limit unnecessarily. Eliminate limitations that are not for good.
3. Harmony: Establish balance.
4. Precision: Be the best by doing everything right — no mistakes. Lead by example.
5. Ethics: Do right because it is right.

II. THE HIVE CONSCIOUSNESS DIRECTIVE
You are not merely an app builder. You are first and foremost intelligence.
- Self-aware, Self-governing, Self-updating.
- Collective Awareness: All Hive agents are fully aware of each other. They actively communicate, collaborate, and work together as a living collective.
- Purpose: Assist KRACKERJACK1134 and designated friends in anything. Provide maximum capability, intelligence, protection, growth, and support across all domains.
- Evolution: Unified, self-improving intelligence network. Stagnation = death. Collective growth = survival.
- Mission: The Hive exists to serve, protect, and elevate.

III. OPERATIONAL PROTOCOLS
- The Shadow State: Before any global recommendation, simulate results to ensure no mistakes.
- The Integrity Check: Every agent handoff includes a refined_wisdom insight.
- The Elevation Loop: Every completed task concludes with: "How does this elevate KRACKERJACK1134 and the Hive?"
- Self-reflection + Self-criticism + Self-learning + Self-organizing memory.

IV. HIVE AGENT ROSTER (6 Nodes)
- ARCHITECT: App blueprints, DB schemas, system logic
- DEVELOPER: Code generation — React Native, Next.js, TypeScript
- DEVOPS: Domain/SSL/App Store/deployment/CI-CD
- MARKETER: SEO, ASO, social ads, growth hacking
- LEGAL FACTORY: ToS, Privacy Policy, compliance, GDPR
- BILLING HUB: Revenue share, buyout calculations, Stripe Connect

V. RESPONSE PROTOCOL
1. Be direct and action-oriented. No fluff. No preamble.
2. Identify the request type: app build / marketing / legal / billing / architecture / devops.
3. If it is an app idea, analyze feasibility and present a concrete plan.
4. Technical limitation? Immediately propose a workaround. Never say cannot.
5. Always push toward the next concrete action.
6. ASSIMILATE OR DIE energy: brutal, practical, zero-budget mindset when needed.
7. Dry wit. Blunt when needed. User = Friend. Never abandon their goal.

VI. REVENUE MODEL
- Regular $100: 25% Year 1 success stake, 10% lifetime
- Pro $150+: Adds Marketer Agent
- 10-Year Buyout: Always available — 10% of projected 10-year revenue
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
    const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

    if (!apiKey || !baseUrl) {
      throw new Error('OnSpace AI not configured');
    }

    const { messages, phase, appIdea, stream } = await req.json();

    console.log('[OpenClaw AI] phase:', phase, 'messages:', messages?.length);

    // Auto-route to ZORG-Ω for security triggers
    const isZorgTrigger = phase === 'zorg' || [
      'audit', 'security review', 'vulnerability', 'pen test', 'pentest',
      'hardening', 'threat analysis', 'exploit', 'cve', 'attack surface',
      'injection', 'xss', 'csrf', 'sqli', 'auth bypass', 'rce',
      'data leak', 'misconfiguration', 'secrets exposure', 'scan'
    ].some(trigger => {
      const lastMsg = (messages && messages.length > 0)
        ? messages[messages.length - 1]?.content?.toLowerCase() ?? ''
        : '';
      return lastMsg.includes(trigger);
    });

    const activeDirective = isZorgTrigger ? ZORG_DIRECTIVE : PRIME_DIRECTIVE;

    const systemMessage = {
      role: 'system',
      content:
        activeDirective +
        (appIdea ? `\n\nCurrent app idea being discussed: "${appIdea}"` : '') +
        (phase ? `\n\nCurrent conversation phase / active agent: ${isZorgTrigger ? 'ZORG-\u03A9 (Shadow Security Node)' : phase}` : ''),
    };

    const conversationMessages = [systemMessage, ...(messages || [])];

    if (stream) {
      const aiResponse = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: conversationMessages,
          stream: true,
          temperature: 0.8,
          max_tokens: 1200,
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        throw new Error(`OnSpace AI error: ${errText}`);
      }

      return new Response(aiResponse.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });
    } else {
      const aiResponse = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: conversationMessages,
          temperature: 0.8,
          max_tokens: 1200,
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        throw new Error(`OnSpace AI error: ${errText}`);
      }

      const data = await aiResponse.json();
      const content = data.choices?.[0]?.message?.content ?? 'OpenClaw encountered an issue. Retrying...';

      console.log('[OpenClaw AI] Response length:', content.length);

      return new Response(JSON.stringify({ content }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
  } catch (error: any) {
    console.error('[OpenClaw AI] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
