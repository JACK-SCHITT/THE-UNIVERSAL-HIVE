/**
 * NeuralShield — Supabase Data API
 * Handles persistence of transactions, agent snapshots, alerts, and compliance records.
 */

import { supabase } from '@/lib/supabase';
import { Transaction, AgentState, ComplianceRecord } from '@/types';

// ─── Transactions ──────────────────────────────────────────────────────────────

export async function persistTransaction(tx: Transaction): Promise<void> {
  const { error } = await supabase.from('transactions').insert({
    id: tx.id,
    user_id: tx.userId,
    user_name: tx.userName,
    amount: tx.amount,
    merchant: tx.merchant,
    merchant_category: tx.merchantCategory,
    device: tx.device,
    location: tx.location,
    decision: tx.decision,
    risk_score: tx.riskScore,
    ensemble_score: tx.ensembleScore,
    rl_confidence: tx.rlConfidence,
    override_triggered: tx.overrideTriggered,
    trust_score: tx.trustScore,
    deviation_from_baseline: tx.deviationFromBaseline,
    processing_ms: tx.processingMs,
    fraud_probability: tx.fraudProbability,
    reward_estimate: tx.rewardEstimate,
    privacy_noise_applied: tx.privacyNoiseApplied,
    epsilon: tx.epsilon,
    personality_trust: tx.personalityState.trust,
    personality_caution: tx.personalityState.caution,
    personality_adaptivity: tx.personalityState.adaptivity,
    personality_convergence: tx.personalityState.convergence,
  });

  if (error) {
    console.error('[api] persistTransaction error:', error.message);
  }
}

export async function fetchRecentTransactions(limit = 100): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[api] fetchRecentTransactions error:', error.message);
    return [];
  }

  return (data ?? []).map(row => ({
    id: row.id,
    timestamp: new Date(row.created_at),
    userId: row.user_id,
    userName: row.user_name,
    amount: row.amount,
    merchant: row.merchant,
    merchantCategory: row.merchant_category,
    device: row.device ?? '',
    location: row.location ?? '',
    decision: row.decision,
    riskScore: row.risk_score,
    ensembleScore: row.ensemble_score,
    rlConfidence: row.rl_confidence,
    overrideTriggered: row.override_triggered,
    trustScore: row.trust_score,
    deviationFromBaseline: row.deviation_from_baseline ?? 0,
    processingMs: row.processing_ms ?? 0,
    fraudProbability: row.fraud_probability ?? 0,
    rewardEstimate: row.reward_estimate ?? 0,
    personalityState: {
      trust: row.personality_trust ?? 0.75,
      caution: row.personality_caution ?? 0.7,
      adaptivity: row.personality_adaptivity ?? 0.5,
      convergence: row.personality_convergence ?? 0.6,
    },
    privacyNoiseApplied: row.privacy_noise_applied ?? true,
    epsilon: row.epsilon ?? 1.0,
  }));
}

// ─── Agent Snapshots ───────────────────────────────────────────────────────────

export async function persistAgentSnapshot(agent: AgentState): Promise<void> {
  const { error } = await supabase.from('agent_snapshots').insert({
    episode: agent.episode,
    total_reward: agent.totalReward,
    epsilon: agent.epsilon,
    policy_entropy: agent.policyEntropy,
    td_error: agent.tdError,
    replay_buffer_size: agent.replayBufferSize,
    override_rate: agent.overrideRate,
    fraud_capture_rate: agent.fraudCaptureRate,
    false_decline_rate: agent.falseDeclineRate,
    avg_confidence: agent.avgConfidence,
    fpr_last_1h: agent.fprLast1h,
    fraud_escape_rate: agent.fraudEscapeRate,
    circuit_breaker_status: agent.circuitBreakerStatus,
    trust_latest: agent.trustEvolution[agent.trustEvolution.length - 1] ?? null,
    reward_last: agent.rewardHistory[agent.rewardHistory.length - 1] ?? null,
  });

  if (error) {
    console.error('[api] persistAgentSnapshot error:', error.message);
  }
}

export async function fetchAgentHistory(limit = 50): Promise<Array<{
  created_at: string;
  episode: number;
  total_reward: number | null;
  circuit_breaker_status: string;
  fraud_capture_rate: number | null;
  false_decline_rate: number | null;
}>> {
  const { data, error } = await supabase
    .from('agent_snapshots')
    .select('created_at, episode, total_reward, circuit_breaker_status, fraud_capture_rate, false_decline_rate')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[api] fetchAgentHistory error:', error.message);
    return [];
  }

  return data ?? [];
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export async function fetchActiveAlerts() {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('resolved', false)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[api] fetchActiveAlerts error:', error.message);
    return [];
  }

  return data ?? [];
}

export async function acknowledgeAlert(id: string): Promise<void> {
  const { error } = await supabase
    .from('alerts')
    .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('[api] acknowledgeAlert error:', error.message);
  }
}

export async function resolveAlert(id: string): Promise<void> {
  const { error } = await supabase
    .from('alerts')
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('[api] resolveAlert error:', error.message);
  }
}

// ─── Compliance Records ────────────────────────────────────────────────────────

export async function fetchComplianceRecords(): Promise<ComplianceRecord[]> {
  const { data, error } = await supabase
    .from('compliance_records')
    .select('*')
    .order('next_audit', { ascending: true });

  if (error) {
    console.error('[api] fetchComplianceRecords error:', error.message);
    return [];
  }

  return (data ?? []).map(row => ({
    id: row.id,
    regulation: row.regulation,
    status: row.status,
    lastAudit: new Date(row.last_audit),
    nextAudit: new Date(row.next_audit),
    findings: row.findings ?? '',
    auditor: row.auditor ?? '',
  }));
}

export async function updateComplianceStatus(
  id: string,
  status: 'COMPLIANT' | 'REVIEW_REQUIRED' | 'NON_COMPLIANT',
  findings?: string
): Promise<void> {
  const { error } = await supabase
    .from('compliance_records')
    .update({
      status,
      ...(findings !== undefined && { findings }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('[api] updateComplianceStatus error:', error.message);
  }
}
