import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Admin emails — edit this array to control admin access
const ADMIN_EMAILS = ["admin@colossalai.app", "owner@colossalai.app"];

function isAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email) || email.includes("admin");
}

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
    if (userError || !user?.email) throw new Error("Not authenticated");
    if (!isAdmin(user.email)) throw new Error("Admin access required");

    console.log("[update-plan] Admin:", user.email);

    const body = await req.json();
    const { planId, updates } = body;
    if (!planId || !updates) throw new Error("planId and updates required");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data, error } = await supabaseAdmin
      .from("subscription_plans")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", planId)
      .select()
      .single();

    if (error) throw new Error("Update failed: " + error.message);

    console.log("[update-plan] Updated plan:", data.name);

    return new Response(JSON.stringify({ success: true, plan: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[update-plan] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
