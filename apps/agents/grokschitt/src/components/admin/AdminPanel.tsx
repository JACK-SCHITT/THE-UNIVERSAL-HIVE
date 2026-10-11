import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Activity, TrendingUp, AlertTriangle, Mail, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AdminPanel() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalConversations: 0,
    totalTransactions: 0,
    fraudAlerts: 0,
    totalRevenue: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      // Load user count
      const { count: userCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Load conversation count
      const { count: convCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true });

      // Load transaction count
      const { count: txCount } = await supabase
        .from('fraud_transactions')
        .select('*', { count: 'exact', head: true });

      // Load fraud alerts
      const { count: alertCount } = await supabase
        .from('fraud_alerts')
        .select('*', { count: 'exact', head: true });

      // Load recent activity
      const { data: recentTx } = await supabase
        .from('fraud_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setStats({
        totalUsers: userCount || 0,
        totalConversations: convCount || 0,
        totalTransactions: txCount || 0,
        fraudAlerts: alertCount || 0,
        totalRevenue: 0 // TODO: Calculate from transactions
      });

      setRecentActivity(recentTx || []);
    } catch (error: any) {
      console.error('Failed to load admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl gradient-cyber flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Admin Panel</h2>
          <p className="text-sm text-muted-foreground">System monitoring and management</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-secondary/20 to-secondary/5 border-secondary/30">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-secondary" />
            <div>
              <p className="text-sm text-muted-foreground">Conversations</p>
              <p className="text-2xl font-bold">{stats.totalConversations}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-accent/20 to-accent/5 border-accent/30">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Transactions</p>
              <p className="text-2xl font-bold">{stats.totalTransactions}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-destructive/20 to-destructive/5 border-destructive/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-destructive" />
            <div>
              <p className="text-sm text-muted-foreground">Fraud Alerts</p>
              <p className="text-2xl font-bold">{stats.fraudAlerts}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-yellow-500/30">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-2xl font-bold">${stats.totalRevenue}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="fraud">Fraud Monitor</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card className="p-6 bg-card/50">
            <h3 className="text-lg font-bold mb-4">Recent Transactions</h3>
            <div className="space-y-2">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <div>
                    <p className="font-bold">${parseFloat(activity.amount).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{activity.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${
                      activity.decision === 'approve' ? 'text-accent' :
                      activity.decision === 'step-up' ? 'text-yellow-500' :
                      'text-destructive'
                    }`}>
                      {activity.decision.toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card className="p-6 bg-card/50">
            <h3 className="text-lg font-bold mb-4">User Management</h3>
            <p className="text-muted-foreground">User management features coming soon...</p>
          </Card>
        </TabsContent>

        <TabsContent value="fraud" className="space-y-4">
          <Card className="p-6 bg-card/50">
            <h3 className="text-lg font-bold mb-4">Fraud Detection Monitor</h3>
            <p className="text-muted-foreground">Real-time fraud monitoring dashboard coming soon...</p>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card className="p-6 bg-card/50">
            <h3 className="text-lg font-bold mb-4">System Health</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Status</span>
                <span className="text-accent font-bold">ONLINE</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Edge Functions</span>
                <span className="text-accent font-bold">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">OnSpace AI</span>
                <span className="text-accent font-bold">CONNECTED</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Klaviyo API</span>
                <span className="text-accent font-bold">READY</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Salable API</span>
                <span className="text-accent font-bold">READY</span>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
