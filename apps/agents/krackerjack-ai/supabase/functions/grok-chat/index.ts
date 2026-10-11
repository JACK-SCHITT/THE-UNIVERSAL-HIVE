import { corsHeaders } from '../_shared/cors.ts';

const GROK_URL = 'https://api.x.ai/v1/chat/completions';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { messages, model = 'grok-3', stream = false, grokKey } = await req.json();

    // Use client-provided key OR the server-side THEHIVEOS secret
    const apiKey = grokKey || Deno.env.get('THEHIVEOS');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'No xAI API key configured. Add your Grok key in CONFIG tab or set THEHIVEOS secret.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = {
      model,
      messages: messages || [{ role: 'user', content: 'Hello' }],
      stream,
    };

    console.log(`[GROK-CHAT] model=${model} messages=${messages?.length} stream=${stream}`);

    const grokRes = await fetch(GROK_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!grokRes.ok) {
      const errText = await grokRes.text();
      console.error(`[GROK-CHAT] xAI error ${grokRes.status}: ${errText}`);
      return new Response(JSON.stringify({ error: `xAI: ${errText}` }), {
        status: grokRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (stream) {
      // Pass through SSE stream
      return new Response(grokRes.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });
    }

    const data = await grokRes.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[GROK-CHAT] Error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
