import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FraudDetectionEngine } from '@/lib/fraud-detection';
import { TransactionContext, FraudDecision } from '@/types/biometric';
import { Shield, Play, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function FraudDetectionDemo() {
  const [engine] = useState(() => new FraudDetectionEngine());
  const [transaction, setTransaction] = useState<Partial<TransactionContext>>({
    userId: 'user_123',
    amount: 150,
    merchant: 'Amazon',
    deviceId: 'device_1',
    biometricConfidence: 0.9
  });
  const [decision, setDecision] = useState<FraudDecision | null>(null);
  const [training, setTraining] = useState(false);
  const [trainingStats, setTrainingStats] = useState<any>(null);

  const evaluateTransaction = async () => {
    const tx: TransactionContext = {
      userId: transaction.userId || 'user_123',
      amount: transaction.amount || 0,
      merchant: transaction.merchant || 'Unknown',
      location: [37.7749, -122.4194],
      deviceId: transaction.deviceId || 'device_1',
      timestamp: Date.now(),
      biometricConfidence: transaction.biometricConfidence
    };

    const result = await engine.evaluateTransaction(tx);
    setDecision(result);
  };

  const runTraining = async () => {
    setTraining(true);
    const stats = await engine.simulateTraining(100);
    setTrainingStats(stats);
    setTraining(false);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'approve': return 'bg-green-600';
      case 'step_up': return 'bg-yellow-600';
      case 'review': return 'bg-orange-600';
      case 'block': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approve': return '✓';
      case 'step_up': return '🔐';
      case 'review': return '👁️';
      case 'block': return '🚫';
      default: return '?';
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Card className="bg-gradient-to-r from-purple-950/40 to-blue-950/40 border-purple-800/50 p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm">
            <p className="text-gray-300">
              <span className="font-semibold text-purple-400">Educational Demo:</span> This simulates 
              an RL-based fraud detection system with conservative safety overrides. Production requires:
            </p>
            <ul className="text-xs text-gray-400 space-y-1 ml-4">
              <li>• Kafka/Flink streaming for real-time transactions</li>
              <li>• Redis/DynamoDB for user behavioral profiles</li>
              <li>• PyTorch model served via TorchServe/SageMaker</li>
              <li>• Local Differential Privacy (LDP) or Federated Learning</li>
              <li>• Compliance layers (PCI-DSS, GLBA, GDPR/CCPA)</li>
              <li>• Human-in-loop fallback + circuit breakers</li>
            </ul>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Transaction Input */}
        <Card className="bg-gray-900/50 border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            Simulate Transaction
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">User ID</label>
              <Input
                value={transaction.userId}
                onChange={(e) => setTransaction({ ...transaction, userId: e.target.value })}
                placeholder="user_123"
                className="bg-black/40 border-gray-700"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Amount ($)</label>
              <Input
                type="number"
                value={transaction.amount}
                onChange={(e) => setTransaction({ ...transaction, amount: parseFloat(e.target.value) })}
                placeholder="150.00"
                className="bg-black/40 border-gray-700"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Merchant</label>
              <Input
                value={transaction.merchant}
                onChange={(e) => setTransaction({ ...transaction, merchant: e.target.value })}
                placeholder="Amazon"
                className="bg-black/40 border-gray-700"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Biometric Confidence (0-1)
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={transaction.biometricConfidence}
                onChange={(e) => setTransaction({ ...transaction, biometricConfidence: parseFloat(e.target.value) })}
                className="bg-black/40 border-gray-700"
              />
            </div>

            <Button
              onClick={evaluateTransaction}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Evaluate Transaction
            </Button>
          </div>
        </Card>

        {/* Decision Output */}
        <Card className="bg-gray-900/50 border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-4">Fraud Decision</h2>

          {decision ? (
            <div className="space-y-4">
              {/* Action */}
              <div className={`${getActionColor(decision.action)} rounded-lg p-4 text-white`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getActionIcon(decision.action)}</span>
                  <div>
                    <p className="font-bold text-lg uppercase">{decision.action}</p>
                    <p className="text-sm opacity-90">
                      Confidence: {(decision.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Risk Score */}
              <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Risk Score</span>
                  <span className="text-sm font-bold text-red-400">
                    {(decision.riskScore * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500"
                    style={{ width: `${decision.riskScore * 100}%` }}
                  />
                </div>
              </div>

              {/* Trust State */}
              <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
                <p className="text-xs text-gray-400 mb-3">Trust State</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">User Trust</span>
                    <span className="font-semibold">
                      {(decision.trustState.userTrust * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Policy Confidence</span>
                    <span className="font-semibold">
                      {(decision.trustState.policyConfidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Deviation from Baseline</span>
                    <span className="font-semibold text-orange-400">
                      {decision.trustState.deviation.toFixed(2)}σ
                    </span>
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
                <p className="text-xs text-gray-400 mb-2">Decision Reasoning:</p>
                <div className="space-y-1">
                  {decision.reasoning.map((reason, idx) => (
                    <p key={idx} className="text-sm text-gray-300">
                      {reason}
                    </p>
                  ))}
                </div>
              </div>

              {/* Override Indicator */}
              {decision.rlOverride && (
                <div className="bg-amber-950/40 border border-amber-800/50 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-300 font-semibold">Safety Override Active</p>
                      <p className="text-xs text-amber-400 mt-1">
                        RL policy was overridden by conservative safety rules
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No transaction evaluated yet</p>
              <p className="text-xs mt-1">Enter transaction details and click "Evaluate"</p>
            </div>
          )}
        </Card>
      </div>

      {/* Training Simulation */}
      <Card className="bg-gray-900/50 border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">RL Training Simulation</h2>
            <p className="text-xs text-gray-400 mt-1">
              Offline training with conservative safety constraints
            </p>
          </div>
          
          <Button
            onClick={runTraining}
            disabled={training}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {training ? 'Training...' : 'Run 100 Episodes'}
          </Button>
        </div>

        {trainingStats && (
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
              <p className="text-xs text-gray-400 mb-1">Average Reward</p>
              <p className="text-2xl font-bold text-green-400">
                {trainingStats.avgReward.toFixed(2)}
              </p>
            </div>
            
            <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
              <p className="text-xs text-gray-400 mb-1">Final Trust Score</p>
              <p className="text-2xl font-bold text-blue-400">
                {(trainingStats.trustEvolution[trainingStats.trustEvolution.length - 1] * 100).toFixed(1)}%
              </p>
            </div>

            <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
              <p className="text-xs text-gray-400 mb-1">Engine Stats</p>
              <p className="text-sm text-gray-300">
                Users: {engine.getStats().totalUsers}<br/>
                States: {engine.getStats().statesLearned}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Architecture Overview */}
      <Card className="bg-gray-900/50 border-gray-800 p-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Production Architecture</h3>
        
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="text-purple-400 font-semibold mb-2">🛡️ Safety Philosophy ("Gardener Mode")</h4>
            <ul className="space-y-1 text-gray-400 text-xs">
              <li>• Start ultra-cautious: 100% safety overrides initially</li>
              <li>• Slow trust evolution: Max 2% change per transaction</li>
              <li>• Amplified negative rewards: 10× penalty for false approvals</li>
              <li>• Constitutional constraints: Hard limits on aggression</li>
              <li>• Self-judgment: Low confidence → force human review</li>
            </ul>
          </div>

          <div>
            <h4 className="text-blue-400 font-semibold mb-2">🔒 Privacy & Compliance</h4>
            <ul className="space-y-1 text-gray-400 text-xs">
              <li>• Local Differential Privacy (LDP): ε=0.8-1.5</li>
              <li>• Federated learning across devices/institutions</li>
              <li>• No raw biometric data stored centrally</li>
              <li>• Model cards + differential auditing quarterly</li>
              <li>• GLBA, PCI-DSS, GDPR/CCPA compliant design</li>
            </ul>
          </div>

          <div>
            <h4 className="text-green-400 font-semibold mb-2">⚙️ Production Infrastructure</h4>
            <ul className="space-y-1 text-gray-400 text-xs">
              <li>• Kafka/Flink: Real-time transaction streams</li>
              <li>• Redis/DynamoDB: Per-user behavioral profiles</li>
              <li>• PyTorch + TorchServe: Model serving</li>
              <li>• Circuit breakers: Auto-pause on FPR spike</li>
              <li>• Shadow mode → A/B test → phased rollout</li>
            </ul>
          </div>

          <div>
            <h4 className="text-orange-400 font-semibold mb-2">📊 Real-World Team & Timeline</h4>
            <ul className="space-y-1 text-gray-400 text-xs">
              <li>• Team: 6-8 people (ML, backend, security, compliance)</li>
              <li>• Timeline: 3-6mo offline → 6-12mo shadow → 12-18mo live</li>
              <li>• Budget: $3-7M for first 18 months</li>
              <li>• Achievable FPR: ~0.2-0.5% (conservative mode)</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
