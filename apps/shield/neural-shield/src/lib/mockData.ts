import { Transaction, AgentState, ModelHealth, PrivacyMetrics, ComplianceRecord, KPIMetrics, DecisionType, RiskLevel } from '@/types';

const USER_NAMES = ['Alice Chen', 'Bob Martinez', 'Carol Wong', 'David Osei', 'Elena Petrov', 'Frank Kowalski', 'Grace Kim', 'Hank Johnson', 'Iris Nakamura', 'Jake Thompson'];
const MERCHANTS = ['Amazon', 'Uber Eats', 'Netflix', 'Apple Store', 'Shell Gas', 'Walgreens', 'Starbucks', 'Target', 'Steam', 'CVS Pharmacy'];
const CATEGORIES = ['E-Commerce', 'Food Delivery', 'Streaming', 'Electronics', 'Gas Station', 'Pharmacy', 'Coffee', 'Retail', 'Gaming', 'Healthcare'];
const DEVICES = ['iOS 17 · iPhone 15', 'Android 14 · Pixel 8', 'Web · Chrome/macOS', 'Android 13 · Samsung S23', 'iOS 16 · iPhone 14'];
const LOCATIONS = ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Chicago, IL', 'Miami, FL', 'Seattle, WA', 'Boston, MA'];

let txCounter = 0;

export function generateTransaction(overrides?: Partial<Transaction>): Transaction {
  const riskScore = Math.random();
  const isFraud = riskScore > 0.82;
  const ensembleScore = isFraud ? 0.7 + Math.random() * 0.29 : Math.random() * 0.4;
  const trustScore = 0.6 + Math.random() * 0.39;
  const rlConfidence = 0.55 + Math.random() * 0.44;
  const overrideTriggered = trustScore < 0.75 || rlConfidence < 0.65;
  const deviationFromBaseline = isFraud ? 1.5 + Math.random() * 3 : Math.random() * 1.2;

  let decision: DecisionType;
  if (isFraud && overrideTriggered) decision = 'BLOCK';
  else if (isFraud) decision = Math.random() > 0.5 ? 'BLOCK' : 'REVIEW';
  else if (overrideTriggered) decision = 'STEP_UP';
  else if (riskScore > 0.55) decision = 'REVIEW';
  else decision = 'APPROVE';

  const idx = txCounter % USER_NAMES.length;
  const mIdx = txCounter % MERCHANTS.length;
  txCounter++;

  return {
    id: `TXN-${Date.now()}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
    timestamp: new Date(),
    userId: `USR-${(idx + 1001).toString()}`,
    userName: USER_NAMES[idx],
    amount: isFraud ? 200 + Math.random() * 4800 : 5 + Math.random() * 495,
    merchant: MERCHANTS[mIdx],
    merchantCategory: CATEGORIES[mIdx],
    device: DEVICES[Math.floor(Math.random() * DEVICES.length)],
    location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
    decision,
    riskScore,
    ensembleScore,
    rlConfidence,
    overrideTriggered,
    trustScore,
    deviationFromBaseline,
    processingMs: 8 + Math.random() * 24,
    fraudProbability: ensembleScore * 0.6 + riskScore * 0.4,
    rewardEstimate: decision === 'BLOCK' && isFraud ? 45 + Math.random() * 120 : decision === 'APPROVE' && isFraud ? -(150 + Math.random() * 500) : -0.5 + Math.random() * 1,
    personalityState: {
      trust: 0.72 + Math.random() * 0.2,
      caution: 0.65 + Math.random() * 0.3,
      adaptivity: 0.4 + Math.random() * 0.4,
      convergence: 0.5 + Math.random() * 0.45,
    },
    privacyNoiseApplied: Math.random() > 0.15,
    epsilon: 0.8 + Math.random() * 0.7,
    ...overrides,
  };
}

export function generateInitialTransactions(count: number): Transaction[] {
  const txns: Transaction[] = [];
  for (let i = 0; i < count; i++) {
    const tx = generateTransaction();
    tx.timestamp = new Date(Date.now() - (count - i) * 12000);
    txns.push(tx);
  }
  return txns;
}

export function generateAgentState(): AgentState {
  const rewardHistory = Array.from({ length: 48 }, (_, i) => -30 + i * 2.1 + (Math.random() - 0.5) * 15);
  const trustEvolution = Array.from({ length: 30 }, (_, i) => 0.5 + i * 0.012 + (Math.random() - 0.5) * 0.04);

  return {
    episode: 1247,
    totalReward: 18432.5,
    epsilon: 0.12,
    explorationRate: 0.12,
    overrideRate: 0.34,
    fraudCaptureRate: 0.961,
    falseDeclineRate: 0.0031,
    avgConfidence: 0.847,
    trustEvolution,
    rewardHistory,
    policyEntropy: 0.432,
    tdError: 0.087,
    batchSize: 256,
    replayBufferSize: 148500,
    lastUpdate: new Date(Date.now() - 45000),
    circuitBreakerStatus: 'NOMINAL',
    fprLast1h: 0.0019,
    fraudEscapeRate: 0.0039,
  };
}

export function generateModelHealth(): ModelHealth {
  return {
    supervisedEnsemble: {
      name: 'XGBoost + Autoencoder Ensemble',
      status: 'HEALTHY',
      latencyP50: 3.2,
      latencyP99: 11.4,
      accuracy: 0.9712,
      lastChecked: new Date(Date.now() - 30000),
    },
    rlPolicy: {
      name: 'Actor-Critic PPO Policy v2.4.1',
      status: 'HEALTHY',
      latencyP50: 7.8,
      latencyP99: 22.1,
      accuracy: 0.9489,
      lastChecked: new Date(Date.now() - 30000),
    },
    privacyLayer: {
      name: 'LDP Noise + Federated Aggregator',
      status: 'HEALTHY',
      latencyP50: 1.1,
      latencyP99: 4.3,
      accuracy: 1.0,
      lastChecked: new Date(Date.now() - 30000),
    },
    overallStatus: 'HEALTHY',
    lastAudit: new Date(Date.now() - 7 * 24 * 3600 * 1000),
    modelVersion: 'v2.4.1-stable',
    shadowMode: false,
    trafficSplit: 78,
  };
}

export function generatePrivacyMetrics(): PrivacyMetrics {
  return {
    currentEpsilon: 1.14,
    epsilonBudgetUsed: 1.14,
    epsilonBudgetTotal: 2.0,
    noiseMechanism: 'Gaussian (σ=1.42)',
    sensitivityBound: 1.0,
    queriesLastHour: 847230,
    ldpCoverage: 0.94,
    federatedNodes: 12,
    activeNodes: 11,
    privacyRisk: 'LOW',
    dailyEpsilonTarget: 1.5,
    compositionMethod: 'Rényi DP (α=8)',
  };
}

export function generateComplianceRecords(): ComplianceRecord[] {
  return [
    { id: 'C-001', regulation: 'GLBA § 501(b)', status: 'COMPLIANT', lastAudit: new Date('2026-01-15'), nextAudit: new Date('2026-07-15'), findings: 'All safeguards operational. No gaps identified.', auditor: 'Deloitte Risk Advisory' },
    { id: 'C-002', regulation: 'CCPA / CPRA', status: 'COMPLIANT', lastAudit: new Date('2026-02-01'), nextAudit: new Date('2026-08-01'), findings: 'LDP implementation satisfies data minimization.', auditor: 'Privacy Analytics LLC' },
    { id: 'C-003', regulation: 'PCI-DSS v4.0', status: 'COMPLIANT', lastAudit: new Date('2026-03-10'), nextAudit: new Date('2026-09-10'), findings: 'SAQ-D Level 1. No critical findings.', auditor: 'Coalfire Systems' },
    { id: 'C-004', regulation: 'GDPR Art. 22 (Automated Decisions)', status: 'REVIEW_REQUIRED', lastAudit: new Date('2026-01-20'), nextAudit: new Date('2026-04-30'), findings: 'Human review fallback documentation incomplete for EU users.', auditor: 'CNIL / Internal DPO' },
    { id: 'C-005', regulation: 'SR 11-7 Model Risk Management', status: 'COMPLIANT', lastAudit: new Date('2026-02-28'), nextAudit: new Date('2026-08-28'), findings: 'Model card complete. Validation report approved.', auditor: 'OCC Exam Team' },
    { id: 'C-006', regulation: 'ECOA / Fair Lending', status: 'COMPLIANT', lastAudit: new Date('2026-03-01'), nextAudit: new Date('2026-09-01'), findings: 'Disparate impact analysis: all protected class FPR within 4/5 rule.', auditor: 'Fair Lending Analytics' },
  ];
}

export function generateKPIs(): KPIMetrics {
  return {
    transactionsPerSecond: 2847 + Math.floor(Math.random() * 400),
    fraudCaptureRate: 0.961,
    falseDeclineRate: 0.0031,
    avgDecisionLatencyMs: 12.4,
    totalLossAvoided: 2840000,
    totalFraudAmount24h: 148200,
    approvalRate: 0.9721,
    reviewQueueDepth: 847,
    chargebackRate: 0.0018,
    economicRewardToday: 94200,
  };
}

export function getRiskLevel(score: number): RiskLevel {
  if (score > 0.9) return 'CRITICAL';
  if (score > 0.75) return 'HIGH';
  if (score > 0.55) return 'MEDIUM';
  if (score > 0.35) return 'LOW';
  return 'MINIMAL';
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'CRITICAL': return 'text-red-400';
    case 'HIGH': return 'text-orange-400';
    case 'MEDIUM': return 'text-yellow-400';
    case 'LOW': return 'text-cyan-400';
    case 'MINIMAL': return 'text-green-400';
  }
}

export function getDecisionColor(decision: DecisionType): string {
  switch (decision) {
    case 'APPROVE': return 'text-green-400 bg-green-400/10 border-green-400/30';
    case 'BLOCK': return 'text-red-400 bg-red-400/10 border-red-400/30';
    case 'STEP_UP': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
    case 'REVIEW': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30';
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function formatPercent(val: number, decimals = 1): string {
  return `${(val * 100).toFixed(decimals)}%`;
}
