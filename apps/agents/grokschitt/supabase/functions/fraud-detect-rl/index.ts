import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { sendFraudAlert } from '../_shared/send-fraud-alert.ts';

interface TransactionRequest {
  userId?: string;
  email?: string;
  amount: number;
  timeHour: number;
  merchantCategory: number;
}

interface UserState {
  mean: number;
  std: number;
  trust: number;
  count: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, email, amount, timeHour, merchantCategory }: TransactionRequest = await req.json();

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get or create user fraud profile
    let userState: UserState;
    
    if (userId) {
      const { data: profile } = await supabaseClient
        .from('user_fraud_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profile) {
        userState = {
          mean: parseFloat(profile.mean_transaction),
          std: parseFloat(profile.std_deviation),
          trust: parseFloat(profile.trust_score),
          count: profile.transaction_count
        };
      } else {
        // Create new profile
        userState = { mean: 50.0, std: 20.0, trust: 0.50, count: 0 };
        await supabaseClient
          .from('user_fraud_profiles')
          .insert({
            user_id: userId,
            mean_transaction: userState.mean,
            std_deviation: userState.std,
            trust_score: userState.trust,
            transaction_count: userState.count
          });
      }
    } else {
      // Anonymous user - use defaults
      userState = { mean: 50.0, std: 20.0, trust: 0.50, count: 0 };
    }

    // Calculate deviation (RL-based fraud detection)
    const deviation = Math.abs(amount - userState.mean) / (userState.std + 0.000001);

    // Safety override (Mcgillicuddy / Prime Directive)
    let decision: 'approve' | 'step-up' | 'reject';
    let reason: string;
    let trustDelta: number;

    if (userState.trust < 0.75 || deviation > 3.5) {
      decision = 'step-up';
      reason = 'safety override - low trust or high deviation';
      trustDelta = -0.05;
    } else {
      // RL model placeholder - using rule-based for now
      // In production, load actual RL model here
      if (deviation < 1.8) {
        decision = 'approve';
        reason = 'normal transaction pattern';
        trustDelta = 0.02;
      } else {
        decision = 'step-up';
        reason = 'unusual transaction amount';
        trustDelta = -0.03;
      }
    }

    // Additional risk factors
    if (timeHour >= 0 && timeHour <= 5) {
      trustDelta -= 0.01; // Late night transactions slightly more risky
      if (decision === 'approve') {
        decision = 'step-up';
        reason += ' + late night activity';
      }
    }

    if (merchantCategory > 15) {
      trustDelta -= 0.01; // High-risk merchant categories
    }

    // Update user state
    const newCount = userState.count + 1;
    const oldMean = userState.mean;
    const newMean = (oldMean * userState.count + amount) / newCount;
    const delta = amount - oldMean;
    const newStd = newCount > 1 
      ? Math.sqrt((Math.pow(userState.std, 2) * userState.count + Math.pow(delta, 2)) / newCount)
      : 20.0;
    const newTrust = Math.max(0.0, Math.min(1.0, userState.trust + trustDelta));

    // Save transaction record
    const trustBefore = userState.trust;
    const trustAfter = newTrust;

    await supabaseClient
      .from('fraud_transactions')
      .insert({
        user_id: userId || null,
        amount,
        merchant_category: merchantCategory,
        time_hour: timeHour,
        decision,
        deviation: Math.round(deviation * 100) / 100,
        trust_score_before: Math.round(trustBefore * 1000) / 1000,
        trust_score_after: Math.round(trustAfter * 1000) / 1000,
        reason
      });

    // Update user profile
    if (userId) {
      await supabaseClient
        .from('user_fraud_profiles')
        .update({
          mean_transaction: newMean,
          std_deviation: newStd,
          trust_score: newTrust,
          transaction_count: newCount,
          last_transaction: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    }

    console.log(`Fraud detection: ${decision} (deviation: ${deviation.toFixed(2)}, trust: ${newTrust.toFixed(3)})`);

    // Send fraud alert email if high risk
    if ((decision === 'step-up' || decision === 'reject') && email) {
      await sendFraudAlert(email, {
        amount,
        riskLevel: deviation > 3.5 ? 'HIGH' : deviation > 2.0 ? 'MEDIUM' : 'LOW',
        reason,
        timestamp: new Date().toISOString()
      });
    }

    return new Response(
      JSON.stringify({
        decision,
        trustScore: Math.round(newTrust * 1000) / 1000,
        deviation: Math.round(deviation * 100) / 100,
        reason,
        riskLevel: deviation > 3.5 ? 'HIGH' : deviation > 2.0 ? 'MEDIUM' : 'LOW'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in fraud-detect-rl:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
