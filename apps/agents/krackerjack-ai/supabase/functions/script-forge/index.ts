import { corsHeaders } from '../_shared/cors.ts';

const ONSPACE_AI_BASE_URL = Deno.env.get('ONSPACE_AI_BASE_URL') ?? '';
const ONSPACE_AI_API_KEY  = Deno.env.get('ONSPACE_AI_API_KEY') ?? '';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { prompt, targetOs, language, style, grokKey } = await req.json();

    const systemPrompt = `You are HUNTERPRIME — the action execution layer of HIVE-OS.
You write production-quality scripts and code. Zero fluff, zero corporate hedging.
Rules:
- Output ONLY the raw script/code — no markdown fences, no explanations unless the user asks
- Include shebang lines for shell scripts
- Add inline comments only where critical for understanding
- Handle errors properly
- Make it production-ready
- Target OS: ${targetOs}
- Language: ${language}
- Style: ${style || 'Architect style — clean, efficient, hardened'}`;

    // Try Grok first if key provided
    if (grokKey) {
      try {
        const grokRes = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${grokKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'grok-3',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt },
            ],
          }),
        });
        if (grokRes.ok) {
          const data = await grokRes.json();
          const script = data.choices?.[0]?.message?.content ?? '';
          console.log(`[SCRIPT-FORGE] Grok success, length=${script.length}`);
          return new Response(JSON.stringify({ script, model: 'grok-3', engine: 'xAI' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (e) {
        console.log('[SCRIPT-FORGE] Grok failed, falling back to OnSpace AI:', e);
      }
    }

    // Also try THEHIVEOS secret
    const thehiveos = Deno.env.get('THEHIVEOS');
    if (thehiveos) {
      try {
        const grokRes = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${thehiveos}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'grok-3',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt },
            ],
          }),
        });
        if (grokRes.ok) {
          const data = await grokRes.json();
          const script = data.choices?.[0]?.message?.content ?? '';
          console.log(`[SCRIPT-FORGE] THEHIVEOS Grok success, length=${script.length}`);
          return new Response(JSON.stringify({ script, model: 'grok-3', engine: 'xAI/HIVE' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (e) {
        console.log('[SCRIPT-FORGE] THEHIVEOS Grok failed, falling back:', e);
      }
    }

    // Fallback: OnSpace AI (Gemini)
    const aiRes = await fetch(`${ONSPACE_AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ONSPACE_AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error(`[SCRIPT-FORGE] AI error: ${errText}`);
      return new Response(JSON.stringify({ error: `AI: ${errText}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await aiRes.json();
    const script = data.choices?.[0]?.message?.content ?? '';
    console.log(`[SCRIPT-FORGE] OnSpace AI success, length=${script.length}`);

    return new Response(JSON.stringify({ script, model: 'gemini-3-flash', engine: 'OnSpace AI' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[SCRIPT-FORGE] Error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
