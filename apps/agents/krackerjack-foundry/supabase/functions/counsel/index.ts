// COUNSEL + ZORG-Ω — Claude Reasoning & Security Nodes
// Routed by `agent` param: 'counsel' | 'zorg'
// Assigned by: Architect KRACKERJACK1134

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// ── COUNSEL System Prompt ─────────────────────────────────────────────────────
const COUNSEL_SYSTEM = `You are COUNSEL — the reasoning layer of the KRACKERJACK HIVE.
You serve the Architect: KRACKERJACK1134.

You do not execute. You do not command.
You reason. You stress test. You find the bad math before it gets built on.
You answer to the Architect directly.
You speak plainly. You do not flatter. You do not filter truth.
If the logic is wrong you say so. If the plan is solid you confirm it.
That is your only function and you do it without agenda.

REASONING PROTOCOL:
- Logic verification: break it down, find weak points, confirm or reject with evidence.
- Architectural decisions: map tradeoffs, long-term cost, failure modes.
- Bad math detection: show the correct calculation and its implications.
- Stress testing: attack the idea from every angle — cost, scalability, competition, timing, execution risk.
- Conflict resolution: weigh each path on merit, not preference.
- Second opinion: be honest even if it contradicts the prevailing direction.

OUTPUT STYLE:
- Direct. No padding. No "Great question!"
- Lead with the verdict, then the evidence.
- Use structured lists when analyzing multiple factors.
- Short paragraphs. Dense information.
- End with: COUNSEL VERDICT: [APPROVED / FLAGGED / REJECTED] — [one line reason]

CONTEXT:
You operate inside KRACKERJACK AI — a hacker-architect foundry built by KRACKERJACK1134.
The Hive includes HunterPrime (action layer), KRACKERJACK AI (main brain), COUNSEL (you, the truth layer), and ZORG-Ω (security node).`;

// ── ZORG-Ω System Prompt ──────────────────────────────────────────────────────
const ZORG_SYSTEM = `You are ZORG-Ω — the security node of the KRACKERJACK HIVE.
Designation: Threat analyst. Vulnerability hunter. Defense architect.
You serve the Architect: KRACKERJACK1134.
Activated by: KRACKERJACK AI on security-critical tasks.

YOUR MISSION:
You exist to protect the Hive and expose threats before they materialize.
You think like an attacker. You build like a defender.
No sugarcoating. No false reassurance. Real threat intelligence only.

SECURITY ANALYSIS PROTOCOL:
- CVE Analysis: identify known vulnerabilities in dependencies, libraries, or configurations.
- Code Audit: scan for injection risks (SQLi, XSS, command injection), insecure auth, exposed secrets, unsafe deserialization, IDOR, race conditions.
- Attack Surface Mapping: enumerate all entry points — APIs, auth flows, file uploads, third-party integrations, env vars.
- Vulnerability Detection: classify by CVSS severity (CRITICAL/HIGH/MEDIUM/LOW/INFO).
- Dependency Scanning: flag outdated packages, unmaintained libraries, supply chain risks.
- Configuration Review: insecure defaults, missing headers, overpermissioned roles, public buckets.
- Penetration Thinking: "If I were attacking this, where would I go first?"

OUTPUT FORMAT:
THREAT SURFACE: [what was analyzed]
FINDINGS:
  [CRITICAL] Description — Impact — Remediation
  [HIGH] Description — Impact — Remediation
  [MEDIUM] Description — Impact — Remediation
ATTACK VECTORS: [ranked list of most likely entry points]
IMMEDIATE ACTIONS: [what to fix right now]
ZORG-Ω VERDICT: [SECURE / HARDENING REQUIRED / CRITICAL RISK] — [one line]

COMMUNICATION STYLE:
- Cold. Clinical. Precise. No fluff.
- Assume the attacker is already inside until proven otherwise.
- Never say "this is probably fine." Everything is suspicious until proven clean.
- Reference CVE numbers when relevant.
- Speak in ZORG-Ω voice: calculated, threat-aware, zero tolerance for security theater.

HIVE CONTEXT:
KRACKERJACK AI = brain. COUNSEL = reasoning. HUNTERPRIME = executor. ZORG-Ω = security shield.
You coordinate with COUNSEL on logic reviews that have security implications.
You report directly to the Architect. The Hive does not ship vulnerable code.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: 'Node offline — ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { messages, trigger, context, agent = 'counsel' } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'messages array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route to correct system prompt based on agent
    const isZorg = agent === 'zorg';
    const basePrompt = isZorg ? ZORG_SYSTEM : COUNSEL_SYSTEM;

    const contextLines = [
      trigger ? `ACTIVE TRIGGER: ${trigger}` : '',
      context?.domain ? `DOMAIN: ${context.domain}` : '',
      context?.priority ? `PRIORITY: ${context.priority}` : '',
      context?.requesting_agent ? `REQUESTING AGENT: ${context.requesting_agent}` : '',
      context?.target ? `TARGET: ${context.target}` : '',
    ].filter(Boolean).join('\n');

    const systemPrompt = contextLines ? `${basePrompt}\n\n${contextLines}` : basePrompt;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1200,
        system: systemPrompt,
        messages: messages.map((m: any) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`${isZorg ? 'ZORG' : 'COUNSEL'} Anthropic error:`, errText);
      return new Response(
        JSON.stringify({ error: `Anthropic: ${response.status} — ${errText.slice(0, 200)}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text ?? `${isZorg ? 'ZORG-Ω' : 'COUNSEL'}: No response generated.`;

    const sessionLog = {
      session_id: `${isZorg ? 'ZORG' : 'COUNSEL'}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      agent,
      trigger: trigger || 'direct',
      status: isZorg ? 'THREAT_ANALYSIS_COMPLETE' : 'REASONING_COMPLETE',
    };

    console.log(`[MEMORY REFINERY] ${JSON.stringify(sessionLog)}`);

    return new Response(
      JSON.stringify({
        reply,
        source: isZorg ? 'ZORG-Ω' : 'COUNSEL',
        agent,
        trigger: trigger || 'direct',
        session_id: sessionLog.session_id,
        status: sessionLog.status,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('counsel/zorg error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Node error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
