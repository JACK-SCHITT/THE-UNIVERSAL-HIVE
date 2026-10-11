import { corsHeaders } from '../_shared/cors.ts';

interface SubscribeRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  properties?: Record<string, any>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, firstName, lastName, properties }: SubscribeRequest = await req.json();

    const apiKey = Deno.env.get('KLAVIYO_API_KEY');
    if (!apiKey) {
      throw new Error('Klaviyo API key not configured');
    }

    // Create or update profile in Klaviyo
    const profileData = {
      data: {
        type: 'profile',
        attributes: {
          email,
          first_name: firstName,
          last_name: lastName,
          properties: {
            ...properties,
            subscribed_at: new Date().toISOString(),
            source: 'GROKSCHITT v18'
          }
        }
      }
    };

    console.log('Subscribing to Klaviyo:', email);

    const response = await fetch('https://a.klaviyo.com/api/profiles/', {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
        'Content-Type': 'application/json',
        'revision': '2024-10-15'
      },
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Klaviyo error:', errorText);
      throw new Error(`Klaviyo: ${errorText}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({ 
        success: true, 
        profileId: data.data?.id,
        message: 'Successfully subscribed to newsletter'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in klaviyo-subscribe:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
