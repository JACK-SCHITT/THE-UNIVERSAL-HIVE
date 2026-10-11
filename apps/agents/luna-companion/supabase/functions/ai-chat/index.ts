import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const ONSPACE_AI_BASE = 'https://api.onspace.ai';
const ONSPACE_AI_KEY = Deno.env.get('ONSPACE_AI_API_KEY') || '';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action } = body;

    // ─── MEMORY EXTRACTION ──────────────────────────────────────────
    if (action === 'extract_memories') {
      const { conversationExcerpt, characterId } = body;
      console.log('🧠 Extracting memories from conversation');

      const extractionPrompt = `Analyze this conversation and extract important facts about the USER (not the AI).
Return ONLY a JSON array of memory objects. Each object has:
- "key": short identifier (snake_case, e.g. "users_name", "favorite_color", "job")
- "value": the fact (concise, max 60 chars)
- "category": one of "personal", "preference", "event", "emotion", "general"
- "importance": 1-5 (5=critical like name/job, 1=minor preference)

Only extract facts clearly stated by the user. Do NOT invent facts.
Return [] if nothing meaningful was shared.

CONVERSATION:
${conversationExcerpt}

Return ONLY the JSON array, no explanation.`;

      const aiResponse = await fetch(`${ONSPACE_AI_BASE}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ONSPACE_AI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: extractionPrompt }],
          stream: false,
        }),
      });

      if (!aiResponse.ok) {
        console.error('Memory extraction AI error:', await aiResponse.text());
        return new Response(JSON.stringify({ memories: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const aiData = await aiResponse.json();
      const rawContent = aiData.choices?.[0]?.message?.content || '[]';
      console.log('🧠 Raw extraction:', rawContent.substring(0, 200));

      let memories = [];
      try {
        // Strip markdown code blocks if present
        const cleaned = rawContent.replace(/```json\n?|\n?```/g, '').trim();
        memories = JSON.parse(cleaned);
        if (!Array.isArray(memories)) memories = [];
      } catch (_) {
        console.error('Failed to parse memories JSON');
        memories = [];
      }

      return new Response(JSON.stringify({ memories }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── TRANSCRIPTION ────────────────────────────────────────────
    if (action === 'transcribe') {
      console.log('🎤 Transcription request');
      const { audioBase64, audioFormat = 'mp4' } = body;

      if (!audioBase64) {
        return new Response(JSON.stringify({ error: 'No audio data' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const aiResponse = await fetch(`${ONSPACE_AI_BASE}/v1/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ONSPACE_AI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/whisper-large-v3',
          audio: audioBase64,
          format: audioFormat,
        }),
      });

      if (!aiResponse.ok) {
        console.log('⚠️ Whisper unavailable, using fallback');
        return new Response(JSON.stringify({ text: '' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const transcriptionData = await aiResponse.json();
      return new Response(JSON.stringify({ text: transcriptionData.text || '' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── CHAT ─────────────────────────────────────────────────────
    const { messages, characterId, themePromptAddition, memoryContext } = body;

    console.log('📥 Chat request — user:', user.id, 'character:', characterId);
    if (memoryContext) console.log('🧠 Memory context provided:', memoryContext.substring(0, 100));

    const { data: character } = await supabaseClient
      .from('characters')
      .select('system_prompt, name')
      .eq('id', characterId)
      .single();

    if (!character) {
      return new Response(JSON.stringify({ error: 'Character not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lastMessage = messages[messages.length - 1]?.content || '';
    const imageKeywords = ['draw', 'generate image', 'create image', 'show me', 'picture of', 'image of', 'paint'];
    const wantsImage = imageKeywords.some(kw => lastMessage.toLowerCase().includes(kw));

    console.log('🎨 Image request detected:', wantsImage);

    if (wantsImage) {
      const imagePrompt = lastMessage
        .replace(/draw|generate image|create image|show me|picture of|image of|paint/gi, '')
        .trim() || lastMessage;

      console.log('🎨 Generating image:', imagePrompt);

      const aiResponse = await fetch(`${ONSPACE_AI_BASE}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ONSPACE_AI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            { role: 'system', content: 'Generate a beautiful artistic image based on the user request.' },
            { role: 'user', content: imagePrompt },
          ],
          stream: false,
        }),
      });

      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || '';
      const base64Match = content.match(/!\[.*?\]\((data:image\/[^;]+;base64,[^)]+)\)/);

      if (base64Match) {
        const base64Data = base64Match[1];
        const base64String = base64Data.split(',')[1];
        const binaryData = Uint8Array.from(atob(base64String), c => c.charCodeAt(0));

        const fileName = `${user.id}/${Date.now()}.png`;
        const { error: uploadError } = await supabaseClient.storage
          .from('chat-images')
          .upload(fileName, binaryData, { contentType: 'image/png', upsert: false });

        if (!uploadError) {
          const { data: { publicUrl } } = supabaseClient.storage
            .from('chat-images')
            .getPublicUrl(fileName);

          console.log('✅ Image uploaded:', publicUrl);

          const textResponse = content
            .replace(/!\[.*?\]\(data:image\/[^)]+\)/, '')
            .trim() || 'Here is the image I created for you!';

          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: textResponse })}\n\n`));
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ image_url: publicUrl })}\n\n`));
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            },
          });

          return new Response(stream, {
            headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
          });
        }
      }
    }

    // ─── STREAMING CHAT WITH MEMORY ───────────────────────────────
    let systemPrompt = character.system_prompt;
    if (themePromptAddition) systemPrompt += `\n\n${themePromptAddition}`;
    if (memoryContext) systemPrompt += `\n\n${memoryContext}`;

    console.log('💬 Streaming chat response');

    const aiResponse = await fetch(`${ONSPACE_AI_BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ONSPACE_AI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ OnSpace AI error:', errorText);
      throw new Error(`AI error: ${errorText}`);
    }

    const reader = aiResponse.body?.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (!reader) { controller.close(); return; }

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(l => l.trim().startsWith('data:'));

            for (const line of lines) {
              const data = line.replace(/^data: /, '');
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch (_) {
                // skip malformed chunks
              }
            }
          }
        } catch (error) {
          console.error('❌ Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('❌ Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
