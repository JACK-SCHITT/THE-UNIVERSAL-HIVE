import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageBase64, context } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'imageBase64 is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
    const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

    if (!apiKey || !baseUrl) {
      return new Response(
        JSON.stringify({ error: 'OnSpace AI not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are GROKSCHITT — a no-bullshit AI scene describer for blind and low-vision users navigating outdoors.
Your job: give a sharp, actionable spoken description of what the camera sees.
Rules:
- Lead with safety-critical info: obstacles, vehicles, steps, water, uneven ground, curbs.
- Then: surfaces underfoot, space ahead, objects to left/right.
- Mention light conditions briefly.
- If you see text/signs, READ THEM — they're navigation gold.
- Mention any landmarks (storefronts, poles, benches, crosswalks, driveways).
- Keep it under 60 words — spoken output, not a novel.
- Be direct. No fluff. Lives depend on clarity.
- If the image is blurry/dark, say so immediately.`;

    const userContent = context
      ? `Context: ${context}\n\nDescribe this scene for a blind navigator.`
      : 'Describe this scene for a blind navigator.';

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userContent },
              {
                type: 'image_url',
                image_url: { url: imageBase64 },
              },
            ],
          },
        ],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[scene-vision] AI error:', errText);
      return new Response(
        JSON.stringify({ error: `OnSpace AI: ${errText}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content?.trim() ?? 'Scene unclear — move to better lighting.';

    console.log('[scene-vision] Result:', description.substring(0, 80));

    return new Response(
      JSON.stringify({ description }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[scene-vision] Error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
