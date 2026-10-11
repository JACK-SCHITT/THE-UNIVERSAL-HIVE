import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Shield, Loader2, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function EnhancedFraudDetector() {
  const [amount, setAmount] = useState('');
  const [merchantCategory, setMerchantCategory] = useState('5');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const detectFraud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || loading) return;

    setLoading(true);

    try {
      const currentHour = new Date().getHours();
      
      const { data, error } = await supabase.functions.invoke('fraud-detect-rl', {
        body: {
          amount: parseFloat(amount),
          timeHour: currentHour,
          merchantCategory: parseInt(merchantCategory),
          email: email || undefined
        }
      });

      if (error) {
        let errorMessage = error.message;
        if (error instanceof FunctionsHttpError) {
          try {
            const textContent = await error.context?.text();
            errorMessage = textContent || error.message;
          } catch {
            errorMessage = error.message;
          }
        }
        throw new Error(errorMessage);
      }

      setResult(data);
      
      if (data.decision === 'reject') {
        toast.error('Transaction rejected!');
      } else if (data.decision === 'step-up') {
        toast.warning('Additional verification required');
      } else {
        toast.success('Transaction approved');
      }
      
    } catch (error: any) {
      console.error('Fraud detection error:', error);
      toast.error(error.message || 'Failed to analyze transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-card/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl gradient-cyber flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold">RL-Enhanced Fraud Detection</h3>
          <p className="text-sm text-muted-foreground">Reinforcement learning with trust scoring</p>
        </div>
      </div>

      <form onSubmit={detectFraud} className="space-y-4">
        <div>
          <Label>Transaction Amount ($)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="50.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-background/50"
            required
          />
        </div>

        <div>
          <Label>Merchant Category (0-20)</Label>
          <Input
            type="number"
            min="0"
            max="20"
            placeholder="5"
            value={merchantCategory}
            onChange={(e) => setMerchantCategory(e.target.value)}
            className="bg-background/50"
            required
          />
        </div>

        <div>
          <Label>Email (Optional - for fraud alerts)</Label>
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-background/50"
          />
          <p className="text-xs text-muted-foreground mt-1">Receive instant alerts for suspicious activity</p>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full gradient-cyber text-white"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Analyze Transaction
            </>
          )}
        </Button>
      </form>

      {result && (
        <div className="mt-6 space-y-3">
          <Card className={cn(
            "p-4",
            result.decision === 'approve' && "bg-accent/20 border-accent/30",
            result.decision === 'step-up' && "bg-yellow-500/20 border-yellow-500/30",
            result.decision === 'reject' && "bg-destructive/20 border-destructive/30"
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold uppercase">
                {result.decision}
              </span>
              <AlertTriangle className={cn(
                "w-5 h-5",
                result.decision === 'approve' && "text-accent",
                result.decision === 'step-up' && "text-yellow-500",
                result.decision === 'reject' && "text-destructive"
              )} />
            </div>
            <p className="text-xs text-muted-foreground mb-3">{result.reason}</p>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Trust Score</p>
                <p className="text-lg font-bold">{(result.trustScore * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Deviation</p>
                <p className="text-lg font-bold">{result.deviation}σ</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Risk Level</p>
                <p className="text-lg font-bold">{result.riskLevel}</p>
              </div>
            </div>
          </Card>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span>Powered by RL-based fraud detection with differential privacy</span>
          </div>
        </div>
      )}
    </Card>
  );
}
