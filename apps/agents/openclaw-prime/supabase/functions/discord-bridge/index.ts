/**
 * Discord Bridge Edge Function — KRACKERJACK HIVE
 *
 * INBOUND: Receives Discord outgoing webhooks → routes to hive_telemetry by HIVE_SCOPE_MATRIX
 * OUTBOUND: Receives app payloads → formats + sends to Discord Incoming Webhook
 *
 * ALWAYS logs to hive_telemetry regardless of Discord webhook status.
 * Gracefully degrades to telemetry-only mode if DISCORD_WEBHOOK_URL not set.
 *
 * Secrets required (Cloud → Secrets):
 *   DISCORD_WEBHOOK_URL — Discord Incoming Webhook URL for the target channel
 *
 * For inbound (Discord → Hive): Configure Discord server outgoing webhook
 * to point to this edge function's URL with type=discord_inbound in body.
 *
 * AUTHORIZED: KRACKERJACK1134
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HIVE_SCOPE_MATRIX — server-side mirror of discordService.HIVE_SCOPE_MATRIX
// Maps Discord channel names to Hive scopes (ported from Python discord.py bot)
const HIVE_SCOPE_MATRIX: Record<string, string> = {
  "grok-schitt":    "hive/apps/grok-schitt",
  "movie-maker":    "KRACKERJACK-AI-MOVIE-MAKER",
  "game-assistant": "AIGameAssistant",
};

const SEVERITY_COLOR: Record<string, number> = {
  critical: 0xFF0000,
  high:     0xFF4444,
  medium:   0xFF9800,
  low:      0xFFD54F,
  info:     0x69F0AE,
};

const SEVERITY_EMOJI: Record<string, string> = {
  critical: "🔴",
  high:     "🟠",
  medium:   "🟡",
  low:      "🟢",
  info:     "⚪",
};

// ─── Main Handler ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabase = createClient(supabaseUrl, serviceKey);
    const payload = await req.json();
    const { type, content, severity, channel, scope } = payload;

    console.log("[Discord Bridge] type:", type, "| severity:", severity ?? "—", "| channel:", channel ?? "—");

    // Always log to hive_telemetry first
    await logTelemetry(supabase, type, content, severity, channel, scope);

    // ── Inbound: Discord outgoing webhook → Hive Telemetry ───────────────────
    if (type === "discord_inbound") {
      const channelName = channel || "unknown";
      const hiveScope = HIVE_SCOPE_MATRIX[channelName] || `discord/${channelName}`;

      console.log(`[Discord Bridge] INBOUND: #${channelName} → ${hiveScope}`);

      // Echo acknowledgement back to Discord channel
      if (webhookUrl) {
        await sendToDiscord(webhookUrl, {
          username: "HIVE TRANSFER",
          content: `⚡ *Hive processing telemetry for scope: **${hiveScope}***`,
        });
      }

      return new Response(
        JSON.stringify({ ok: true, scope: hiveScope, discord: !!webhookUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── No webhook configured → telemetry-only mode ──────────────────────────
    if (!webhookUrl) {
      console.log("[Discord Bridge] No DISCORD_WEBHOOK_URL configured — telemetry-only mode");
      return new Response(
        JSON.stringify({ ok: true, discord: false, reason: "no_webhook" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Outbound: Hive → Discord Incoming Webhook ────────────────────────────
    let discordBody: object;

    switch (type) {
      case "audit": {
        const sev = (severity || "info").toLowerCase();
        discordBody = {
          username: "ZORG-Ω | Shadow Security",
          content: `**[ZORG-Ω PERIMETER ALERT]** ${SEVERITY_EMOJI[sev] ?? "⚪"} \`${sev.toUpperCase()}\` finding`,
          embeds: [{
            title: `${SEVERITY_EMOJI[sev] ?? "⚪"} Security Finding — ${sev.toUpperCase()}`,
            description: (content ?? "No details").slice(0, 2000),
            color: SEVERITY_COLOR[sev] ?? 0x69F0AE,
            footer: { text: "ZORG-Ω | KRACKERJACK HIVE | Zero Trust Perimeter" },
            timestamp: new Date().toISOString(),
          }],
        };
        break;
      }

      case "petition": {
        discordBody = {
          username: "ZORG-Ω | Operation Shadow Petition",
          content: `**[SHADOW PETITION UPDATE]**\n\`\`\`${(content ?? "").slice(0, 500)}\`\`\``,
        };
        break;
      }

      case "heartbeat": {
        const maintenanceDue = (content ?? "").includes("MAINTENANCE_DUE:true");
        const notes = (content ?? "").replace(/MAINTENANCE_DUE:(true|false) \| /, "");
        discordBody = {
          username: "HIVE HEARTBEAT",
          content: maintenanceDue
            ? `⚠️ **[HEARTBEAT — MAINTENANCE DUE]**\n\`\`\`${notes.slice(0, 500)}\`\`\``
            : `💗 **[HEARTBEAT CYCLE COMPLETE]**\n\`\`\`${notes.slice(0, 500)}\`\`\``,
        };
        break;
      }

      case "hive_scope": {
        const hiveScope = scope ?? HIVE_SCOPE_MATRIX[channel ?? ""] ?? "UNKNOWN";
        discordBody = {
          username: "HIVE TRANSFER",
          content: `⚡ **[HIVE TRANSFER]** \`#${channel ?? "unknown"}\` → \`${hiveScope}\`\n> ${(content ?? "").slice(0, 500)}`,
        };
        break;
      }

      default: {
        discordBody = {
          username: "KRACKERJACK HIVE",
          content: `**[HIVE TELEMETRY]** \`${type}\`\n${(content ?? "").slice(0, 1800)}`,
        };
        break;
      }
    }

    const discordRes = await sendToDiscord(webhookUrl, discordBody);
    const ok = discordRes.ok;

    if (!ok) {
      const errText = await discordRes.text().catch(() => "(unreadable)");
      console.error("[Discord Bridge] Webhook error:", discordRes.status, errText);
    } else {
      console.log("[Discord Bridge] Sent to Discord:", type, "| status:", discordRes.status);
    }

    return new Response(
      JSON.stringify({ ok, discord: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (err: any) {
    console.error("[Discord Bridge] Fatal error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function sendToDiscord(webhookUrl: string, body: object): Promise<Response> {
  return fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function logTelemetry(
  supabase: ReturnType<typeof createClient>,
  type: string,
  content: string,
  severity?: string,
  channel?: string,
  scope?: string,
): Promise<void> {
  try {
    const { data: zorgNode } = await supabase
      .from("hive_nodes")
      .select("id")
      .eq("node_name", "ZORG-Ω")
      .maybeSingle();

    await supabase.from("hive_telemetry").insert({
      source_node_id: zorgNode?.id ?? null,
      intent_hash: `DISCORD_${(type ?? "unknown").toUpperCase()}`,
      action_payload: {
        type: type ?? null,
        severity: severity ?? null,
        channel: channel ?? null,
        scope: scope ?? null,
      },
      outcome_impact: (content ?? "").slice(0, 400),
    });
  } catch (e: any) {
    console.error("[Discord Bridge] Telemetry log failed:", e.message);
  }
}
