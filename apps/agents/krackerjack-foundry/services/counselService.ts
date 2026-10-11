// COUNSEL + ZORG-Ω — Anthropic Claude reasoning & security layer service

import { getSupabaseClient } from '@/template';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { ChatMessage } from './chatService';

export type CounselTrigger =
  | 'logic_verification'
  | 'architectural_decision'
  | 'bad_math_detection'
  | 'pre_commit_stress_test'
  | 'conflict_resolution'
  | 'second_opinion'
  | 'direct';

export type ZorgTrigger =
  | 'cve_analysis'
  | 'code_audit'
  | 'attack_surface'
  | 'dependency_scan'
  | 'config_review'
  | 'pen_test'
  | 'direct';

export type HiveNodeAgent = 'counsel' | 'zorg';

export interface CounselContext {
  domain?: string;
  priority?: 'low' | 'standard' | 'high' | 'critical';
  requesting_agent?: string;
  target?: string;
}

export interface NodeResponse {
  reply: string | null;
  source: string;
  agent: HiveNodeAgent;
  trigger: string;
  session_id: string;
  status: string;
  error: string | null;
}

async function invokeNode(
  messages: ChatMessage[],
  agent: HiveNodeAgent,
  trigger: string = 'direct',
  context: CounselContext = {}
): Promise<NodeResponse> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.functions.invoke('counsel', {
    body: { messages, agent, trigger, context },
  });

  if (error) {
    let errorMessage = error.message;
    if (error instanceof FunctionsHttpError) {
      try {
        const statusCode = error.context?.status ?? 500;
        const textContent = await error.context?.text();
        errorMessage = `[Code: ${statusCode}] ${textContent || error.message || 'Unknown error'}`;
      } catch {
        errorMessage = error.message || 'Failed to read node response';
      }
    }
    return {
      reply: null,
      source: agent === 'zorg' ? 'ZORG-Ω' : 'COUNSEL',
      agent,
      trigger,
      session_id: `${agent.toUpperCase()}-ERROR-${Date.now()}`,
      status: agent === 'zorg' ? 'ZORG_OFFLINE' : 'COUNSEL_OFFLINE',
      error: errorMessage,
    };
  }

  return {
    reply: data?.reply ?? null,
    source: data?.source ?? (agent === 'zorg' ? 'ZORG-Ω' : 'COUNSEL'),
    agent,
    trigger: data?.trigger ?? trigger,
    session_id: data?.session_id ?? `${agent.toUpperCase()}-${Date.now()}`,
    status: data?.status ?? (agent === 'zorg' ? 'THREAT_ANALYSIS_COMPLETE' : 'REASONING_COMPLETE'),
    error: null,
  };
}

// ── COUNSEL — Reasoning Layer ─────────────────────────────────────────────────
export async function consultCounsel(
  messages: ChatMessage[],
  trigger: CounselTrigger = 'direct',
  context: CounselContext = {}
): Promise<NodeResponse> {
  return invokeNode(messages, 'counsel', trigger, context);
}

// ── ZORG-Ω — Security Node ────────────────────────────────────────────────────
export async function consultZorg(
  messages: ChatMessage[],
  trigger: ZorgTrigger = 'direct',
  context: CounselContext = {}
): Promise<NodeResponse> {
  return invokeNode(messages, 'zorg', trigger, context);
}
