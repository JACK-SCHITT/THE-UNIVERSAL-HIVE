import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface VideoRequest {
  prompt: string;
  model?: string;
  duration?: number;
  aspectRatio?: string;
  userId?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, model, duration, aspectRatio, userId }: VideoRequest = await req.json();

    // OnSpace AI configuration
    const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
    const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

    if (!apiKey || !baseUrl) {
      throw new Error('OnSpace AI not configured');
    }

    console.log('Generating video with prompt:', prompt);

    // Default to veo-2 for video generation
    const selectedModel = model || 'google/veo-2';

    // Call OnSpace AI video generation
    const aiResponse = await fetch(`${baseUrl}/video/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        prompt: prompt,
        duration: duration || 5,
        aspect_ratio: aspectRatio || '16:9'
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('OnSpace AI video error:', errorText);
      throw new Error(`Video generation failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    
    // Video generation is async, return job ID or video URL depending on response
    const videoUrl = aiData.data?.url;
    const jobId = aiData.id;

    console.log('Video generation initiated');

    return new Response(
      JSON.stringify({
        videoUrl: videoUrl || null,
        jobId: jobId || null,
        prompt,
        model: selectedModel,
        status: videoUrl ? 'completed' : 'processing'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in generate-video:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
