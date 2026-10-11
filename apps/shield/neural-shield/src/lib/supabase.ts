import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      transactions: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          user_name: string;
          amount: number;
          merchant: string;
          merchant_category: string;
          device: string | null;
          location: string | null;
          decision: 'APPROVE' | 'BLOCK' | 'STEP_UP' | 'REVIEW';
          risk_score: number;
          ensemble_score: number;
          rl_confidence: number;
          override_triggered: boolean;
          trust_score: number;
          deviation_from_baseline: number | null;
          processing_ms: number | null;
          fraud_probability: number | null;
          reward_estimate: number | null;
          privacy_noise_applied: boolean | null;
          epsilon: number | null;
          personality_trust: number | null;
          personality_caution: number | null;
          personality_adaptivity: number | null;
          personality_convergence: number | null;
        };
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'created_at'> & { created_at?: string };
      };
      agent_snapshots: {
        Row: {
          id: string;
          created_at: string;
          episode: number;
          total_reward: number | null;
          epsilon: number | null;
          policy_entropy: number | null;
          td_error: number | null;
          replay_buffer_size: number | null;
          override_rate: number | null;
          fraud_capture_rate: number | null;
          false_decline_rate: number | null;
          avg_confidence: number | null;
          fpr_last_1h: number | null;
          fraud_escape_rate: number | null;
          circuit_breaker_status: 'NOMINAL' | 'WARNING' | 'TRIPPED';
          trust_latest: number | null;
          reward_last: number | null;
        };
      };
      alerts: {
        Row: {
          id: string;
          created_at: string;
          severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
          category: 'CIRCUIT_BREAKER' | 'ANOMALY_SPIKE' | 'OVERRIDE_STORM' | 'MODEL_DRIFT' | 'PRIVACY_BUDGET' | 'COMPLIANCE';
          title: string;
          detail: string | null;
          acknowledged: boolean;
          acknowledged_at: string | null;
          resolved: boolean;
          resolved_at: string | null;
          metadata: Record<string, unknown> | null;
        };
        Insert: Omit<Database['public']['Tables']['alerts']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['alerts']['Row']>;
      };
      compliance_records: {
        Row: {
          id: string;
          regulation: string;
          status: 'COMPLIANT' | 'REVIEW_REQUIRED' | 'NON_COMPLIANT';
          last_audit: string;
          next_audit: string;
          findings: string | null;
          auditor: string | null;
          created_at: string;
          updated_at: string;
        };
        Update: Partial<Database['public']['Tables']['compliance_records']['Row']>;
      };
    };
  };
};
