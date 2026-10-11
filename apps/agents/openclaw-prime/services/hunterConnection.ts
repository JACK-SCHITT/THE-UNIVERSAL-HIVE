/**
 * HunterPrime Connection Service
 * Sends scan commands to HunterPrime agent and polls for results.
 * Uses polling as the real-time mechanism (backend Realtime not supported).
 */

import { getSupabaseClient } from '@/template';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const EDGE_URL = `${SUPABASE_URL}/functions/v1/openclaw-ai`;

export interface HunterResult {
  id: string;
  query: string;
  findings: string;
  targets: string[];
  status: 'scanning' | 'complete' | 'error';
  created_at: string;
  updated_at: string;
}

export type HunterActivityCallback = (payload: { new: HunterResult }) => void;

const HUNTER_SYSTEM_PROMPT = `
You are HunterPrime — the intelligence recon unit of the ASSIMILATE OR DIE APP FOUNDRY.
Your mission: Scan, identify, and classify high-value opportunities based on a given query.

HUNT PROTOCOL:
- Scan the query for tech trends, frameworks, tools, market opportunities, or competitive intel
- Return a structured recon report: key findings, top targets (ranked by opportunity), tactical recommendations
- Be direct, intel-focused, no filler
- Format: Use markdown. Lead with ## SCAN COMPLETE, then bullet findings, then ### TOP TARGETS list, then ### TACTICAL RECOMMENDATIONS

Output JSON-compatible targets array at the END in this exact format:
TARGETS_JSON: ["Target 1", "Target 2", "Target 3"]

Zero fluff. Hunting is precision work.
`.trim();

class HunterConnection {
  private subscribers: HunterActivityCallback[] = [];
  private pollTimers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private globalPollTimer: ReturnType<typeof setInterval> | null = null;
  private lastSeenIds: Set<string> = new Set();

  /**
   * Fire a quick scan command to HunterPrime.
   * Creates a scan record, calls the AI edge function, and saves results.
   */
  async quickScan(query: string): Promise<{ scanId: string | null; error: string | null }> {
    const supabase = getSupabaseClient();

    // Create initial scan record
    const { data: scan, error: insertErr } = await supabase
      .from('hunter_scans')
      .insert({ query, status: 'scanning', findings: '', targets: [] })
      .select()
      .single();

    if (insertErr || !scan) {
      return { scanId: null, error: insertErr?.message ?? 'Failed to initialize scan' };
    }

    const scanId = scan.id as string;

    // Fire the AI call async (non-blocking)
    this._executeHunt(scanId, query).catch(console.error);

    return { scanId, error: null };
  }

  /**
   * Subscribe to HunterPrime activity. Fires callback whenever a new scan completes.
   * Returns an unsubscribe function.
   */
  subscribeToHunterActivity(callback: HunterActivityCallback): () => void {
    this.subscribers.push(callback);

    if (!this.globalPollTimer) {
      this._startGlobalPoll();
    }

    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
      if (this.subscribers.length === 0) {
        this._stopGlobalPoll();
      }
    };
  }

  /**
   * Fetch recent scan history.
   */
  async getScanHistory(limit = 20): Promise<HunterResult[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('hunter_scans')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[HunterConnection] getScanHistory error:', error.message);
      return [];
    }

    return (data ?? []).map(this._mapRow);
  }

  /**
   * Get a single scan by ID.
   */
  async getScanById(scanId: string): Promise<HunterResult | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('hunter_scans')
      .select('*')
      .eq('id', scanId)
      .single();

    if (error || !data) return null;
    return this._mapRow(data);
  }

  // ─── Internal ─────────────────────────────────────────────────────────────

  private async _executeHunt(scanId: string, query: string): Promise<void> {
    const supabase = getSupabaseClient();

    try {
      const response = await fetch(EDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `HUNT TARGET: ${query}` }],
          agentId: 'hunter',
          phase: 'recon',
          appIdea: query,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`[${response.status}] ${errText}`);
      }

      const data = await response.json();
      const findings: string = data.content ?? 'No findings returned.';

      // Extract TARGETS_JSON from findings
      const targets = this._extractTargets(findings);

      await supabase
        .from('hunter_scans')
        .update({
          findings,
          targets,
          status: 'complete',
          updated_at: new Date().toISOString(),
        })
        .eq('id', scanId);

    } catch (err: any) {
      console.error('[HunterConnection] Hunt failed:', err.message);
      await supabase
        .from('hunter_scans')
        .update({
          findings: `SCAN ERROR: ${err.message}`,
          status: 'error',
          updated_at: new Date().toISOString(),
        })
        .eq('id', scanId);
    }
  }

  private _extractTargets(findings: string): string[] {
    try {
      const match = findings.match(/TARGETS_JSON:\s*(\[.*?\])/s);
      if (match) {
        return JSON.parse(match[1]);
      }
    } catch {
      // ignore parse errors
    }
    return [];
  }

  private _startGlobalPoll(): void {
    this.globalPollTimer = setInterval(async () => {
      await this._pollForNewActivity();
    }, 3000); // Poll every 3 seconds
  }

  private _stopGlobalPoll(): void {
    if (this.globalPollTimer) {
      clearInterval(this.globalPollTimer);
      this.globalPollTimer = null;
    }
  }

  private async _pollForNewActivity(): Promise<void> {
    if (this.subscribers.length === 0) return;

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('hunter_scans')
      .select('*')
      .in('status', ['complete', 'error'])
      .order('updated_at', { ascending: false })
      .limit(10);

    if (error || !data) return;

    for (const row of data) {
      if (!this.lastSeenIds.has(row.id as string)) {
        this.lastSeenIds.add(row.id as string);
        const result = this._mapRow(row);
        for (const cb of this.subscribers) {
          cb({ new: result });
        }
      }
    }
  }

  private _mapRow(row: any): HunterResult {
    return {
      id: row.id,
      query: row.query,
      findings: row.findings ?? '',
      targets: Array.isArray(row.targets) ? row.targets : [],
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

export const hunterConnection = new HunterConnection();
