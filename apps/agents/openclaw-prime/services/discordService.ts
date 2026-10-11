/**
 * Discord Bridge Service — KRACKERJACK HIVE
 * Routes ZORG alerts, petition updates, and heartbeat events to Discord.
 * All calls route through discord-bridge edge function (secrets kept server-side).
 * GRACEFUL DEGRADATION: Works without DISCORD_WEBHOOK_URL (telemetry-only mode).
 *
 * INBOUND: Discord outgoing webhooks → discord-bridge edge function → hive_telemetry
 * OUTBOUND: App → discord-bridge edge function → Discord Incoming Webhook
 *
 * HIVE_SCOPE_MATRIX mirrors the Python discord.py bot channel routing logic.
 * AUTHORIZED: KRACKERJACK1134
 */

import { getSupabaseClient } from '@/template';
import { FunctionsHttpError } from '@supabase/supabase-js';

export type DiscordAlertType = 'audit' | 'petition' | 'heartbeat' | 'hive_scope' | 'telemetry';

export interface DiscordPayload {
  type: DiscordAlertType;
  content: string;
  severity?: string;
  channel?: string;
  scope?: string;
}

// HIVE_SCOPE_MATRIX — maps Discord channel names to Hive scopes
// Direct port of the Python discord.py bot routing logic into server-side edge function
export const HIVE_SCOPE_MATRIX: Record<string, string> = {
  'grok-schitt':     'hive/apps/grok-schitt',
  'movie-maker':     'KRACKERJACK-AI-MOVIE-MAKER',
  'game-assistant':  'AIGameAssistant',
};

export const discordService = {
  HIVE_SCOPE_MATRIX,

  /**
   * Send any payload through the discord-bridge edge function.
   * Always logs to hive_telemetry regardless of Discord webhook status.
   */
  async send(payload: DiscordPayload): Promise<{ ok: boolean; error?: string }> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.functions.invoke('discord-bridge', {
        body: payload,
      });
      if (error) {
        let msg = error.message;
        if (error instanceof FunctionsHttpError) {
          try {
            const statusCode = error.context?.status ?? 500;
            const text = await error.context?.text();
            msg = `[${statusCode}] ${text || error.message}`;
          } catch {}
        }
        console.warn('[Discord] Bridge error:', msg);
        return { ok: false, error: msg };
      }
      return { ok: true };
    } catch (err: any) {
      console.warn('[Discord] Send failed:', err.message);
      return { ok: false, error: err.message };
    }
  },

  /**
   * Send a ZORG CVE/audit alert to Discord.
   * Auto-triggered for CRITICAL and HIGH severity findings.
   */
  async sendAuditAlert(params: {
    target: string;
    severity: string;
    cveId: string | null;
    vulnerability: string;
    recommendation: string;
  }): Promise<{ ok: boolean; error?: string }> {
    return this.send({
      type: 'audit',
      content: [
        params.cveId ? `${params.cveId}` : 'ZORG-FINDING',
        `TARGET: ${params.target}`,
        `VULN: ${params.vulnerability.slice(0, 200)}`,
        `REC: ${params.recommendation.slice(0, 150)}`,
      ].join('\n'),
      severity: params.severity,
    });
  },

  /**
   * Send a Shadow Petition status update to Discord.
   */
  async sendPetitionUpdate(
    instanceTag: string,
    status: string,
    platform?: string | null,
  ): Promise<{ ok: boolean }> {
    return this.send({
      type: 'petition',
      content: `${instanceTag} | STATUS: ${status.toUpperCase()} | Platform: ${platform || 'Unknown'}`,
    });
  },

  /**
   * Send a Heartbeat alert to Discord.
   * Auto-triggered when maintenance_due is true or when heartbeat completes.
   */
  async sendHeartbeatAlert(
    actionNotes: string,
    maintenanceDue: boolean,
  ): Promise<{ ok: boolean }> {
    return this.send({
      type: 'heartbeat',
      content: `MAINTENANCE_DUE:${maintenanceDue} | ${actionNotes.slice(0, 300)}`,
    });
  },

  /**
   * Route a Discord channel message to its Hive scope.
   * Uses HIVE_SCOPE_MATRIX for channel → scope mapping.
   */
  async routeHiveScope(
    channelName: string,
    message: string,
  ): Promise<{ ok: boolean; scope?: string }> {
    const scope = HIVE_SCOPE_MATRIX[channelName];
    if (!scope) return { ok: false };
    const result = await this.send({
      type: 'hive_scope',
      content: message.slice(0, 500),
      channel: channelName,
      scope,
    });
    return { ...result, scope };
  },

  /**
   * Send a general telemetry event to Discord.
   */
  async sendTelemetry(content: string): Promise<{ ok: boolean }> {
    return this.send({ type: 'telemetry', content: content.slice(0, 500) });
  },
};
