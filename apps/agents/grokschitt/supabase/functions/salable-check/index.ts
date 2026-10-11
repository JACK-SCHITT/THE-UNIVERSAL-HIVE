import { corsHeaders } from '../_shared/cors.ts';

interface CheckLicenseRequest {
  granteeId: string; // User ID or email
  productId?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { granteeId, productId }: CheckLicenseRequest = await req.json();

    const apiKey = Deno.env.get('SALABLE_API_KEY');
    if (!apiKey) {
      throw new Error('Salable API key not configured');
    }

    // Use the product ID from environment or request
    const activeProductId = productId || '6bd5c49b-5cfd-4c4b-a609-3f3a0627841b';

    console.log('Checking Salable license for:', granteeId);

    // Check license with Salable
    const response = await fetch(
      `https://api.salable.app/licenses/check?granteeId=${encodeURIComponent(granteeId)}&productUuid=${activeProductId}`,
      {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'version': 'v2'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Salable error:', errorText);
      
      // If not found, user doesn't have a license
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ 
            hasAccess: false, 
            message: 'No active subscription found'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      throw new Error(`Salable: ${errorText}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({ 
        hasAccess: data.valid === true,
        subscription: data,
        message: data.valid ? 'Active subscription' : 'Subscription inactive or expired'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in salable-check:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
