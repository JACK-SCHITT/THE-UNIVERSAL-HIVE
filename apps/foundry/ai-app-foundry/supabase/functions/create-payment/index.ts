import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user?.email) throw new Error("User not authenticated or email unavailable");

    console.log("[create-payment] User:", user.email);

    const body = await req.json();
    const { planId, planSlug } = body;

    if (!planId || !planSlug) throw new Error("planId and planSlug are required");

    // Load plan from DB to get price and stripe_price_id
    const { data: plan, error: planError } = await supabaseClient
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) throw new Error("Plan not found");
    console.log("[create-payment] Plan:", plan.name, plan.price);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://colossalai.app";

    let lineItems;

    // Use stripe_price_id if configured, otherwise use price_data
    if (plan.stripe_price_id) {
      lineItems = [{ price: plan.stripe_price_id, quantity: 1 }];
    } else {
      lineItems = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Colossal AI — ${plan.name} Build`,
              description: plan.description,
            },
            unit_amount: Math.round(plan.price * 100), // cents
          },
          quantity: 1,
        },
      ];
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      metadata: {
        user_id: user.id,
        plan_id: planId,
        plan_slug: planSlug,
        plan_price: String(plan.price),
      },
    });

    console.log("[create-payment] Session created:", session.id);

    // Create pending subscription record
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    await supabaseAdmin.from("user_subscriptions").insert({
      user_id: user.id,
      plan_id: planId,
      plan_slug: planSlug,
      stripe_session_id: session.id,
      stripe_customer_id: customerId ?? null,
      status: "pending",
      amount_paid: plan.price,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[create-payment] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
