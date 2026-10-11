import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { BarChart, TrendingUp, Shield, MessageSquare, DollarSign, Users } from 'lucide-react';

interface Stats {
  totalConversations: number;
  totalMessages: number;
  totalTransactions: number;
  avgTrustScore: number;
  fraudAlertsToday: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalConversations: 0,
    totalMessages: 0,
    totalTransactions: 0,
    avgTrustScore: 0,
    fraudAlertsToday: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [conversations, messages, transactions, alerts] = await Promise.all([
        supabase.from('conversations').select('id', { count: 'exact', head: true }),
        supabase.from('messages').select('id', { count: 'exact', head: true }),
        supabase.from('fraud_transactions').select('trust_score_after'),
        supabase.from('fraud_alerts').select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString())
      ]);

      const avgTrust = transactions.data && transactions.data.length > 0
        ? transactions.data.reduce((sum, t) => sum + parseFloat(t.trust_score_after), 0) / transactions.data.length
        : 0;

      setStats({
        totalConversations: conversations.count || 0,
        totalMessages: messages.count || 0,
        totalTransactions: transactions.data?.length || 0,
        avgTrustScore: avgTrust,
        fraudAlertsToday: alerts.count || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'AI Conversations',
      value: stats.totalConversations,
      icon: MessageSquare,
      gradient: 'from-purple-500/20 to-purple-500/5',
      border: 'border-purple-500/30'
    },
    {
      title: 'Messages Processed',
      value: stats.totalMessages,
      icon: BarChart,
      gradient: 'from-blue-500/20 to-blue-500/5',
      border: 'border-blue-500/30'
    },
    {
      title: 'Transactions Analyzed',
      value: stats.totalTransactions,
      icon: DollarSign,
      gradient: 'from-green-500/20 to-green-500/5',
      border: 'border-green-500/30'
    },
    {
      title: 'Avg Trust Score',
      value: `${(stats.avgTrustScore * 100).toFixed(0)}%`,
      icon: TrendingUp,
      gradient: 'from-cyan-500/20 to-cyan-500/5',
      border: 'border-cyan-500/30'
    },
    {
      title: 'Fraud Alerts (24h)',
      value: stats.fraudAlertsToday,
      icon: Shield,
      gradient: 'from-red-500/20 to-red-500/5',
      border: 'border-red-500/30'
    }
  ];

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-muted/20 rounded-lg"></div>
        <div className="h-32 bg-muted/20 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl gradient-cyber flex items-center justify-center">
          <BarChart className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-sm text-muted-foreground">Platform usage and performance metrics</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Card 
            key={stat.title}
            className={`p-4 bg-gradient-to-br ${stat.gradient} ${stat.border} border`}
          >
            <div className="flex items-start justify-between mb-2">
              <stat.icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.title}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
