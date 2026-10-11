export type DecisionType = 'APPROVE' | 'BLOCK' | 'STEP_UP' | 'REVIEW';
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL';

export interface Transaction {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  amount: number;
  merchant: string;
  merchantCategory: string;
  device: string;
  location: string;
  decision: DecisionType;
  riskScore: number;
  ensembleScore: number;
  rlConfidence: number;
  overrideTriggered: boolean;
  trustScore: number;
  deviationFromBaseline: number;
  processingMs: number;
  fraudProbability: number;
  rewardEstimate: number;
  personalityState: PersonalityState;
  privacyNoiseApplied: boolean;
  epsilon: number;
}

export interface PersonalityState {
  trust: number;
  caution: number;
  adaptivity: number;
  convergence: number;
}

export interface AgentState {
  episode: number;
  totalReward: number;
  epsilon: number;
  explorationRate: number;
  overrideRate: number;
  fraudCaptureRate: number;
  falseDeclineRate: number;
  avgConfidence: number;
  trustEvolution: number[];
  rewardHistory: number[];
  policyEntropy: number;
  tdError: number;
  batchSize: number;
  replayBufferSize: number;
  lastUpdate: Date;
  circuitBreakerStatus: 'NOMINAL' | 'WARNING' | 'TRIPPED';
  fprLast1h: number;
  fraudEscapeRate: number;
}

export interface ModelHealth {
  supervisedEnsemble: ModelComponent;
  rlPolicy: ModelComponent;
  privacyLayer: ModelComponent;
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  lastAudit: Date;
  modelVersion: string;
  shadowMode: boolean;
  trafficSplit: number;
}

export interface ModelComponent {
  name: string;
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'OFFLINE';
  latencyP50: number;
  latencyP99: number;
  accuracy: number;
  lastChecked: Date;
}

export interface PrivacyMetrics {
  currentEpsilon: number;
  epsilonBudgetUsed: number;
  epsilonBudgetTotal: number;
  noiseMechanism: string;
  sensitivityBound: number;
  queriesLastHour: number;
  ldpCoverage: number;
  federatedNodes: number;
  activeNodes: number;
  privacyRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  dailyEpsilonTarget: number;
  compositionMethod: string;
}

export interface ComplianceRecord {
  id: string;
  regulation: string;
  status: 'COMPLIANT' | 'REVIEW_REQUIRED' | 'NON_COMPLIANT';
  lastAudit: Date;
  nextAudit: Date;
  findings: string;
  auditor: string;
}

export interface KPIMetrics {
  transactionsPerSecond: number;
  fraudCaptureRate: number;
  falseDeclineRate: number;
  avgDecisionLatencyMs: number;
  totalLossAvoided: number;
  totalFraudAmount24h: number;
  approvalRate: number;
  reviewQueueDepth: number;
  chargebackRate: number;
  economicRewardToday: number;
}
