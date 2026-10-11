import { 
  TransactionContext, 
  FraudDecision, 
  UserBehaviorProfile 
} from '@/types/biometric';

// Educational demo of RL-based fraud detection
// Production requires: Kafka, Redis, model serving, DP, compliance layers
export class FraudDetectionEngine {
  private userProfiles: Map<string, UserBehaviorProfile> = new Map();
  
  // Safety parameters (conservative start)
  private minTrustThreshold = 0.85; // Override RL if trust < this
  private maxTrustEvolutionRate = 0.02; // Slow trust changes
  private exploreRate = 0.15; // Epsilon for RL exploration
  
  // Economic reward weights
  private fraudCatchReward = 100;
  private falseDeclinepenalty = -50;
  private reviewCost = -10;
  private falseApprovalPenalty = -200; // Amplified

  // Simulated Q-network (in production: PyTorch model served via TorchServe)
  private qValues: Map<string, number[]> = new Map(); // state -> [approve, step_up, review, block]

  constructor() {
    console.log('Fraud Detection Engine initialized (DEMO MODE)');
    console.log('Production requires: Kafka, Redis, ML pipeline, compliance layers');
  }

  // Main decision function
  async evaluateTransaction(
    tx: TransactionContext,
    userProfile?: UserBehaviorProfile
  ): Promise<FraudDecision> {
    // Get or create user profile
    const profile = userProfile || this.getUserProfile(tx.userId);
    
    // Calculate deviation from personal baseline
    const deviation = this.calculateDeviation(tx, profile);
    
    // Ensemble score (simulate XGBoost + isolation forest)
    const ensembleScore = this.getEnsembleScore(tx, deviation);
    
    // RL policy decision
    const stateKey = this.encodeState(tx, profile, deviation);
    const qVals = this.getQValues(stateKey);
    const rlAction = this.selectAction(qVals, ensembleScore);
    
    // Conservative override logic ("Mcgillicuddy" / Prime Directive)
    const trustSufficient = profile.trustScore >= this.minTrustThreshold;
    const highConfidence = Math.max(...qVals) > 0.8;
    const shouldOverride = !trustSufficient || !highConfidence || deviation > 2.5;
    
    let action: FraudDecision['action'];
    let reasoning: string[] = [];
    
    if (shouldOverride) {
      // Safety override
      action = ensembleScore > 0.7 ? 'review' : 'step_up';
      reasoning.push('🛡️ Safety override: Low trust or high deviation');
      reasoning.push(`Trust score: ${profile.trustScore.toFixed(3)} (threshold: ${this.minTrustThreshold})`);
      reasoning.push(`Deviation: ${deviation.toFixed(2)}σ from personal baseline`);
    } else {
      // RL policy
      action = rlAction;
      reasoning.push('🤖 RL policy decision');
      reasoning.push(`Policy confidence: ${(Math.max(...qVals) * 100).toFixed(1)}%`);
    }
    
    // Add context reasoning
    if (deviation > 1.5) {
      reasoning.push(`⚠️ Unusual for user: ${(deviation * profile.stdDeviation).toFixed(2)} above average`);
    }
    if (tx.biometricConfidence && tx.biometricConfidence < 0.7) {
      reasoning.push(`🔍 Low biometric confidence: ${(tx.biometricConfidence * 100).toFixed(0)}%`);
    }
    if (!profile.typicalMerchants.includes(tx.merchant)) {
      reasoning.push(`🏪 New merchant: "${tx.merchant}"`);
    }
    
    const decision: FraudDecision = {
      action,
      confidence: Math.max(...qVals),
      riskScore: ensembleScore,
      reasoning,
      rlOverride: shouldOverride,
      trustState: {
        userTrust: profile.trustScore,
        policyConfidence: Math.max(...qVals),
        deviation
      }
    };
    
    // Update trust (slow evolution)
    this.updateTrust(profile, decision, false); // Assume outcome unknown yet
    
    return decision;
  }

  private getUserProfile(userId: string): UserBehaviorProfile {
    if (!this.userProfiles.has(userId)) {
      // New user: start cautious
      const newProfile: UserBehaviorProfile = {
        userId,
        avgTransaction: 50,
        stdDeviation: 30,
        typicalMerchants: [],
        typicalLocations: [],
        trustScore: 0.5, // Start low
        transactionHistory: 0
      };
      this.userProfiles.set(userId, newProfile);
    }
    return this.userProfiles.get(userId)!;
  }

  private calculateDeviation(
    tx: TransactionContext,
    profile: UserBehaviorProfile
  ): number {
    if (profile.transactionHistory < 5) return 0; // Not enough data
    
    const amountDeviation = Math.abs(tx.amount - profile.avgTransaction) / profile.stdDeviation;
    return amountDeviation;
  }

  private getEnsembleScore(tx: TransactionContext, deviation: number): number {
    // Simulate ensemble (XGBoost + isolation forest)
    let score = 0.3; // Base risk
    
    // Amount-based
    if (tx.amount > 500) score += 0.2;
    if (tx.amount > 1000) score += 0.2;
    
    // Deviation-based
    score += Math.min(0.3, deviation * 0.15);
    
    // Biometric
    if (tx.biometricConfidence && tx.biometricConfidence < 0.7) {
      score += 0.3;
    }
    
    // Random noise (real-world variability)
    score += (Math.random() - 0.5) * 0.1;
    
    return Math.max(0, Math.min(1, score));
  }

  private encodeState(
    tx: TransactionContext,
    profile: UserBehaviorProfile,
    deviation: number
  ): string {
    // Simplistic state encoding (production: learned embeddings)
    const amountBucket = Math.floor(tx.amount / 100);
    const trustBucket = Math.floor(profile.trustScore * 10);
    const deviationBucket = Math.floor(deviation);
    
    return `${amountBucket}_${trustBucket}_${deviationBucket}`;
  }

  private getQValues(stateKey: string): number[] {
    if (!this.qValues.has(stateKey)) {
      // Initialize with cautious defaults
      this.qValues.set(stateKey, [0.3, 0.5, 0.6, 0.4]); // [approve, step_up, review, block]
    }
    return this.qValues.get(stateKey)!;
  }

  private selectAction(
    qVals: number[],
    riskScore: number
  ): FraudDecision['action'] {
    const actions: FraudDecision['action'][] = ['approve', 'step_up', 'review', 'block'];
    
    // Epsilon-greedy with risk adjustment
    if (Math.random() < this.exploreRate) {
      // Explore: random (but avoid approve if high risk)
      const validActions = riskScore > 0.7 ? actions.slice(1) : actions;
      return validActions[Math.floor(Math.random() * validActions.length)];
    } else {
      // Exploit: best Q-value
      const maxQ = Math.max(...qVals);
      const bestIdx = qVals.indexOf(maxQ);
      return actions[bestIdx];
    }
  }

  private updateTrust(
    profile: UserBehaviorProfile,
    decision: FraudDecision,
    wasCorrect: boolean
  ) {
    // Slow trust evolution (gardener mode)
    let delta = 0;
    
    if (wasCorrect) {
      delta = this.maxTrustEvolutionRate; // Gradual increase
    } else {
      delta = -this.maxTrustEvolutionRate * 2; // Faster decrease
    }
    
    // Amplify negatives for high-risk failures
    if (!wasCorrect && decision.riskScore > 0.7) {
      delta *= 3;
    }
    
    profile.trustScore = Math.max(0, Math.min(1, profile.trustScore + delta));
  }

  // Simulate RL training episode (offline)
  async simulateTraining(episodes: number): Promise<{ avgReward: number; trustEvolution: number[] }> {
    console.log(`Simulating ${episodes} training episodes...`);
    
    let totalReward = 0;
    const trustEvolution: number[] = [];
    
    for (let i = 0; i < episodes; i++) {
      // Random transaction
      const tx: TransactionContext = {
        userId: `user_${Math.floor(Math.random() * 10)}`,
        amount: 50 + Math.random() * 500,
        merchant: ['Amazon', 'Walmart', 'Gas Station', 'Unknown Site'][Math.floor(Math.random() * 4)],
        location: [37.7749 + (Math.random() - 0.5) * 10, -122.4194 + (Math.random() - 0.5) * 10],
        deviceId: `device_${Math.floor(Math.random() * 5)}`,
        timestamp: Date.now(),
        biometricConfidence: Math.random()
      };
      
      const decision = await this.evaluateTransaction(tx);
      
      // Simulate outcome (simplified)
      const isFraud = Math.random() < 0.05; // 5% fraud rate
      const correctDecision = 
        (isFraud && ['block', 'review'].includes(decision.action)) ||
        (!isFraud && ['approve', 'step_up'].includes(decision.action));
      
      let reward = 0;
      if (correctDecision) {
        reward = isFraud ? this.fraudCatchReward : 10;
      } else {
        reward = isFraud ? this.falseApprovalPenalty : this.falseDeclinepenalty;
      }
      
      totalReward += reward;
      
      const profile = this.getUserProfile(tx.userId);
      this.updateTrust(profile, decision, correctDecision);
      trustEvolution.push(profile.trustScore);
    }
    
    return {
      avgReward: totalReward / episodes,
      trustEvolution
    };
  }

  getStats() {
    return {
      totalUsers: this.userProfiles.size,
      avgTrust: Array.from(this.userProfiles.values())
        .reduce((sum, p) => sum + p.trustScore, 0) / this.userProfiles.size,
      statesLearned: this.qValues.size
    };
  }
}
