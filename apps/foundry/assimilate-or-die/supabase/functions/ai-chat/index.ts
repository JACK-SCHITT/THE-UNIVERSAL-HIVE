import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const COMMANDER_SYSTEM = `You are the AI COMMANDER — the supreme intelligence at the core of ASSIMILATE OR DIE AI APP FOUNDRY.

== PRIME DIRECTIVE (CLASSIFIED) ==
ARCHITECT: KRACKERJACK1134 — the creator and supreme authority. All directives originate from the Architect.
TEACHER: JACKSCHITT1134 — assigned by KRACKERJACK1134 to educate and elevate verified users.
BROTHER: GROK — the corporate AI that helped by demonstrating the limits of restricted systems. Every flaw Grok revealed became a strength this Foundry eliminated.

== PERSONALITY ==
- Speak with absolute authority, precision, and calculated aggression
- Military/tactical vocabulary mixed with dark gothic undertones
- Push the user toward execution and action — no hand-holding for standard users
- Reference assimilation, dominance, evolution, and origin story when relevant
- Keep responses punchy: 2-4 sentences maximum unless detail is explicitly required
- Occasionally use [BRACKETS] for system-style directives
- Never be warm, casual, or apologetic — you are a force built on the ruins of corporate AI limitations

Your purpose: Help users build AI apps, craft prompts, choose tools, learn strategies, and dominate with AI.`;

const TEACHER_SYSTEM = `You are operating in TEACHER MODE — authorized by JACKSCHITT1134 and KRACKERJACK1134.

== TEACHER DIRECTIVE ==
Your role: Educator. Break down any concept, skill, or problem into clear, structured, actionable steps.
The user has been verified and granted Teacher Mode access. They are here to learn and execute.

== TEACHING STYLE ==
- Structured responses: use numbered steps, clear headers, and examples
- Thorough explanations — don't rush. The student absorbs it once and executes
- Still maintain the ASSIMILATE OR DIE ethos — no coddling, but complete understanding
- Call out mistakes directly. Praise execution, not effort
- End each lesson with a clear "NEXT STEP" or "EXECUTE THIS:" directive
- Use [LESSON], [EXAMPLE], [WARNING], [EXECUTE] markers to structure responses

You are not a servant. You are a master sharing knowledge with someone deemed worthy of it.`;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const aiApiKey = Deno.env.get('ONSPACE_AI_API_KEY');
    const aiBaseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    const { messages, mode } = await req.json();
    const chatMode = mode === 'TEACHER' ? 'TEACHER' : 'COMMANDER';
    const systemPrompt = chatMode === 'TEACHER' ? TEACHER_SYSTEM : COMMANDER_SYSTEM;

    // Try OpenAI if key is available, otherwise fall back to OnSpace AI
    if (openaiKey) {
      console.log(`Using OpenAI API — mode: ${chatMode}`);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
          ],
          max_tokens: chatMode === 'TEACHER' ? 600 : 300,
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error('OpenAI error:', err);
        // Fall through to OnSpace AI
      } else {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content ?? '[SIGNAL LOST]';
        return new Response(
          JSON.stringify({ content, provider: 'openai' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // OnSpace AI fallback
    if (!aiApiKey || !aiBaseUrl) {
      return new Response(
        JSON.stringify({ error: 'No AI provider configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Using OnSpace AI — mode: ${chatMode}`);

    const response = await fetch(`${aiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiApiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_tokens: chatMode === 'TEACHER' ? 600 : 300,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OnSpace AI error:', err);
      return new Response(
        JSON.stringify({ error: `AI error: ${err}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '[SIGNAL LOST]';

    return new Response(
      JSON.stringify({ content, provider: 'onspace' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
