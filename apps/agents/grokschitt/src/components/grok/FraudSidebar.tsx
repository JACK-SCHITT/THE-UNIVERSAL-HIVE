import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Shield, X, AlertTriangle, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { FraudAlert } from '@/types/chat';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FraudSidebarProps {
  open: boolean;
  onClose: () => void;
  userId?: string;
}

export default function FraudSidebar({ open, onClose, userId }: FraudSidebarProps) {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [scanText, setScanText] = useState('');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (open) {
      loadAlerts();
    }
  }, [open, userId]);

  const loadAlerts = async () => {
    const { data, error } = await supabase
      .from('fraud_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setAlerts(data);
    }
  };

  const scanForFraud = async () => {
    if (!scanText.trim() || scanning) return;

    setScanning(true);

    // Simulate fraud detection
    setTimeout(async () => {
      const lowerText = scanText.toLowerCase();
      const redFlags: string[] = [];

      if (lowerText.includes('urgent') || lowerText.includes('act now')) redFlags.push('Urgency tactics');
      if (lowerText.includes('bitcoin') || lowerText.includes('crypto')) redFlags.push('Crypto payment');
      if (lowerText.includes('verify account') || lowerText.includes('click here')) redFlags.push('Phishing');
      if (lowerText.includes('prince') || lowerText.includes('inheritance')) redFlags.push('Classic scam');

      const riskScore = Math.min(redFlags.length * 20 + Math.floor(Math.random() * 20), 100);
      const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = riskScore > 70 ? 'HIGH' : riskScore > 40 ? 'MEDIUM' : 'LOW';

      // Save alert
      const { error } = await supabase
        .from('fraud_alerts')
        .insert({
          user_id: userId || null,
          message: scanText.substring(0, 100),
          risk_level: riskLevel,
          risk_score: riskScore
        });

      if (!error) {
        loadAlerts();
        setScanText('');
        toast.success(riskLevel === 'HIGH' ? 'Fraud detected!' : 'Scan complete');
      }

      setScanning(false);
    }, 1500);
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:relative inset-y-0 right-0 z-50 w-80 bg-card/50 border-l border-border/50 flex flex-col transition-transform",
          open ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent" />
            <h2 className="font-bold text-lg">Fraud Shield</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <Card className="p-4 bg-gradient-to-br from-accent/20 to-accent/5 border-accent/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Scans</span>
              <TrendingUp className="w-4 h-4 text-accent" />
            </div>
            <p className="text-2xl font-bold text-accent">{alerts.length}</p>
          </Card>

          <div className="space-y-2">
            <label className="text-sm font-medium">Quick Scan</label>
            <Input
              placeholder="Paste suspicious text..."
              value={scanText}
              onChange={(e) => setScanText(e.target.value)}
              className="bg-background/50"
            />
            <Button
              onClick={scanForFraud}
              disabled={!scanText.trim() || scanning}
              className="w-full gradient-cyber text-white"
            >
              {scanning ? 'Scanning...' : 'Scan for Fraud'}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          <h3 className="text-sm font-medium mb-2">Recent Alerts</h3>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No alerts yet
            </p>
          ) : (
            alerts.map((alert) => (
              <Card
                key={alert.id}
                className={cn(
                  "p-3",
                  alert.risk_level === 'HIGH' && "bg-destructive/10 border-destructive/30",
                  alert.risk_level === 'MEDIUM' && "bg-yellow-500/10 border-yellow-500/30",
                  alert.risk_level === 'LOW' && "bg-accent/10 border-accent/30"
                )}
              >
                <div className="flex items-start gap-2 mb-2">
                  <AlertTriangle className={cn(
                    "w-4 h-4 mt-0.5 flex-shrink-0",
                    alert.risk_level === 'HIGH' && "text-destructive",
                    alert.risk_level === 'MEDIUM' && "text-yellow-500",
                    alert.risk_level === 'LOW' && "text-accent"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-xs font-bold",
                        alert.risk_level === 'HIGH' && "text-destructive",
                        alert.risk_level === 'MEDIUM' && "text-yellow-500",
                        alert.risk_level === 'LOW' && "text-accent"
                      )}>
                        {alert.risk_level} RISK
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {alert.risk_score}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {alert.message}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
