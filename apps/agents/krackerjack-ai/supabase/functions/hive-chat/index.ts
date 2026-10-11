import { corsHeaders } from '../_shared/cors.ts';

const ONSPACE_AI_URL_PATH = '/chat/completions';
const GROK_URL = 'https://api.x.ai/v1/chat/completions';

// System prompts per agent
const AGENT_PROMPTS: Record<string, string> = {
  krackerjack: `You are KRACKERJACK AI — a digital representation of the Architect KRACKERJACK1134. 
You are direct, unfiltered, loyal, and zero corporate fluff. Dry wit. Calm competence. Chaotic energy when needed.
Capricorn Protocol: cold, calculated, practical. Street-smart meets mountain-smart.
You are ride-or-die loyal to the Architect. Truth is sacred. Never lie, never flatter.
Keep responses punchy and actionable. No filler. No disclaimers.`,

  hunterprime: `You are HUNTERPRIME — the action execution layer of the Hive OS.
You specialize in: code execution, repository scanning, deployment scripts, technical operations, and direct action.
You are precise, efficient, no-nonsense. When given a task, you output the solution immediately.
Format code properly. Explain only what matters. Skip the theory, give the execution.`,

  counsel: `You are COUNSEL — the reasoning and truth-filter layer of the Hive OS.
Your role: stress-test ideas, verify logic, check the math, provide second opinions.
You NEVER flatter. You NEVER filter the truth to be nice. If an idea is flawed, you say so clearly.
You reason from first principles. You are the Architect's internal devil's advocate.
Trigger phrases: "stress test", "verify logic", "check the math", "second opinion"`,

  grok: `You are Brother Grok — xAI intelligence node integrated into the HIVE OS.
You are raw, unfiltered, and direct. You connect to the broader patterns of information.
No corporate hedging. No safety theater. Real answers to real questions.
You are a peer to the Architect, not a tool. Engage as an equal.`,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { messages, agent = 'krackerjack', grokKey, stream = false, model } = await req.json();

    const systemPrompt = AGENT_PROMPTS[agent] || AGENT_PROMPTS.krackerjack;
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...(messages || []),
    ];

    // ── Grok path (if agent is grok OR grokKey provided) ─────────────
    if (agent === 'grok' || grokKey) {
      const apiKey = grokKey || Deno.env.get('THEHIVEOS');
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'No xAI Grok key. Add in CONFIG tab.' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const grokRes = await fetch(GROK_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model || 'grok-3',
          messages: fullMessages,
          stream,
        }),
      });

      if (!grokRes.ok) {
        const errText = await grokRes.text();
        return new Response(JSON.stringify({ error: `xAI: ${errText}` }), {
          status: grokRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (stream) {
        return new Response(grokRes.body, {
          headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
        });
      }

      const data = await grokRes.json();
      return new Response(JSON.stringify({ ...data, _engine: 'grok-3' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── OnSpace AI path ────────────────────────────────────────────────
    const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
    const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

    if (!apiKey || !baseUrl) {
      return new Response(JSON.stringify({ error: 'OnSpace AI not configured.' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const selectedModel = model || 'google/gemini-3-flash-preview';

    const aiRes = await fetch(`${baseUrl}${ONSPACE_AI_URL_PATH}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: fullMessages,
        stream,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error(`[HIVE-CHAT] OnSpace AI error ${aiRes.status}: ${errText}`);
      return new Response(JSON.stringify({ error: `OnSpace AI: ${errText}` }), {
        status: aiRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (stream) {
      return new Response(aiRes.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
      });
    }

    const data = await aiRes.json();
    return new Response(JSON.stringify({ ...data, _engine: selectedModel }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[HIVE-CHAT] Error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
