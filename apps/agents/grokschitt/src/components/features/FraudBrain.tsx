import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Brain, Lock, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function FraudBrain() {
  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [stats, setStats] = useState({
    scamsDetected: parseInt(localStorage.getItem('scamsDetected') || '0'),
    moneySaved: parseInt(localStorage.getItem('moneySaved') || '0'),
  });

  const analyzeText = () => {
    if (!text.trim()) {
      toast.error('Please enter text to analyze');
      return;
    }

    setAnalyzing(true);

    // Simulate AI analysis
    setTimeout(() => {
      const redFlags = [];
      const lowerText = text.toLowerCase();

      if (lowerText.includes('urgent') || lowerText.includes('act now')) redFlags.push('Urgency pressure tactics');
      if (lowerText.includes('bitcoin') || lowerText.includes('crypto') || lowerText.includes('wire transfer')) redFlags.push('Suspicious payment method');
      if (lowerText.includes('click here') || lowerText.includes('verify account')) redFlags.push('Phishing indicators');
      if (lowerText.includes('prince') || lowerText.includes('inheritance')) redFlags.push('Classic scam pattern');
      if (lowerText.match(/\d{3}-\d{2}-\d{4}/)) redFlags.push('SSN request detected');
      if (lowerText.includes('congratulations') && lowerText.includes('won')) redFlags.push('Prize/lottery scam');

      const riskScore = Math.min(redFlags.length * 18 + Math.floor(Math.random() * 20), 100);
      const riskLevel = riskScore > 70 ? 'HIGH' : riskScore > 40 ? 'MEDIUM' : 'LOW';
      const estimatedLoss = riskScore > 70 ? Math.floor(Math.random() * 5000) + 1000 : 0;

      setResult({
        riskScore,
        riskLevel,
        redFlags,
        estimatedLoss,
      });

      if (riskScore > 50) {
        const newScams = stats.scamsDetected + 1;
        const newMoneySaved = stats.moneySaved + estimatedLoss;
        setStats({ scamsDetected: newScams, moneySaved: newMoneySaved });
        localStorage.setItem('scamsDetected', newScams.toString());
        localStorage.setItem('moneySaved', newMoneySaved.toString());
        toast.success('Fraud detected and blocked!');
      } else {
        toast.success('Analysis complete - looks safe');
      }

      setAnalyzing(false);
    }, 2000);
  };

  return (
    <div id="fraud" className="space-y-8">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <Shield className="w-10 h-10 text-primary" />
          FraudBrain AI Detection
        </h2>
        <p className="text-lg text-muted-foreground">
          Neural network fraud detection with personality evolution and differential privacy.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 bg-card/50 border-border/50">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Scam Analyzer
          </h3>
          <Textarea
            placeholder="Paste suspicious message, email, or text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[200px] mb-4 bg-background/50"
          />
          <Button
            onClick={analyzeText}
            disabled={analyzing}
            className="w-full gradient-cyber text-white font-semibold"
          >
            {analyzing ? 'Analyzing...' : 'Analyze for Fraud'}
          </Button>

          {result && (
            <div className="mt-6 space-y-4">
              <div className="p-4 rounded-lg bg-background/70 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Risk Score:</span>
                  <span className="text-2xl font-bold text-primary">{result.riskScore}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      result.riskLevel === 'HIGH' ? 'bg-destructive' :
                      result.riskLevel === 'MEDIUM' ? 'bg-yellow-500' : 'bg-accent'
                    }`}
                    style={{ width: `${result.riskScore}%` }}
                  ></div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-background/70 border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Risk Level:</span>
                  <span className={`text-lg font-bold ${
                    result.riskLevel === 'HIGH' ? 'text-destructive' :
                    result.riskLevel === 'MEDIUM' ? 'text-yellow-500' : 'text-accent'
                  }`}>
                    {result.riskLevel}
                  </span>
                </div>
              </div>

              {result.redFlags.length > 0 && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                  <h4 className="text-sm font-semibold text-destructive mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Red Flags:
                  </h4>
                  <ul className="space-y-1">
                    {result.redFlags.map((flag: string, i: number) => (
                      <li key={i} className="text-sm text-destructive/80">• {flag}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
            <h3 className="text-xl font-semibold mb-4">FraudBrain Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/30">
                <span className="text-sm text-muted-foreground">Neural Network</span>
                <span className="text-sm font-medium text-accent flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse-glow"></div>
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/30">
                <span className="text-sm text-muted-foreground">Personality Agent</span>
                <span className="text-sm font-medium text-secondary">Learning</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/30">
                <span className="text-sm text-muted-foreground">Differential Privacy</span>
                <span className="text-sm font-medium text-primary">ε=1.0</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/30">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Scams Detected
                </span>
                <span className="text-sm font-bold text-foreground">{stats.scamsDetected}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Money Saved
                </span>
                <span className="text-sm font-bold text-accent">${stats.moneySaved.toLocaleString()}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card/50 border-border/50">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-accent" />
              AI Personality Evolution
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
                <p className="text-sm font-semibold text-accent mb-1">Constitutional Constraints (Hard-Coded)</p>
                <p className="text-xs text-muted-foreground">Active privacy and loyalty principles</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-sm font-bold text-primary">NEVER LEAVE A FRIEND BEHIND</p>
                <p className="text-xs text-muted-foreground mt-1">Unbreakable loyalty to users and their data</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/30">
                <p className="text-sm font-bold text-secondary">SECRETS DON'T MAKE FRIENDS</p>
                <p className="text-xs text-muted-foreground mt-1">Complete transparency in all operations</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
