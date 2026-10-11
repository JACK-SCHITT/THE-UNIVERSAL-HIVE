import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface ImageRequest {
  prompt: string;
  model?: string;
  size?: string;
  style?: string;
  nsfw?: boolean;
  userId?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, model, size, style, nsfw, userId }: ImageRequest = await req.json();

    // OnSpace AI configuration
    const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
    const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

    if (!apiKey || !baseUrl) {
      throw new Error('OnSpace AI not configured');
    }

    console.log('Generating image with prompt:', prompt);

    // Default to flux-pro for NSFW or high-quality images
    const selectedModel = model || (nsfw ? 'black-forest-labs/flux-1.1-pro' : 'black-forest-labs/flux-1.1-pro');

    // Call OnSpace AI image generation
    const aiResponse = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        prompt: prompt,
        size: size || '1024x1024',
        style: style || 'natural',
        n: 1
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('OnSpace AI image error:', errorText);
      throw new Error(`Image generation failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const imageUrl = aiData.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error('No image URL returned');
    }

    console.log('Image generated successfully');

    // Initialize Supabase client for storage
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Download image and upload to Supabase Storage
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();
    const fileName = `${crypto.randomUUID()}.png`;
    const filePath = `generated-images/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('public-assets')
      .upload(filePath, imageBlob, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      // Return original URL if upload fails
      return new Response(
        JSON.stringify({
          imageUrl,
          prompt,
          model: selectedModel,
          storagePath: null
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabaseClient.storage
      .from('public-assets')
      .getPublicUrl(filePath);

    return new Response(
      JSON.stringify({
        imageUrl: publicUrlData.publicUrl,
        prompt,
        model: selectedModel,
        storagePath: filePath
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in generate-image:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
