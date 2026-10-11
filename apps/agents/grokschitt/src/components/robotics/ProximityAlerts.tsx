import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Bell, Clock } from 'lucide-react';

interface Alert {
  id: string;
  type: 'warning' | 'critical';
  robot: string;
  message: string;
  distance: number;
  timestamp: Date;
}

export default function ProximityAlerts() {
  const [alerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'warning',
      robot: 'Cobot-07',
      message: 'Human entering SLOW zone',
      distance: 2.1,
      timestamp: new Date(Date.now() - 5000)
    },
    {
      id: '2',
      type: 'critical',
      robot: 'AMR-03',
      message: 'Human detected behind rack',
      distance: 1.2,
      timestamp: new Date(Date.now() - 12000)
    },
    {
      id: '3',
      type: 'warning',
      robot: 'Cobot-12',
      message: 'Multiple humans approaching',
      distance: 2.8,
      timestamp: new Date(Date.now() - 25000)
    },
  ]);

  const getAlertColor = (type: Alert['type']) => {
    return type === 'critical' 
      ? 'border-red-500/30 bg-red-500/10'
      : 'border-yellow-500/30 bg-yellow-500/10';
  };

  const getAlertIcon = (type: Alert['type']) => {
    return type === 'critical' ? 'text-red-500' : 'text-yellow-500';
  };

  const getTimeSince = (timestamp: Date) => {
    const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">Proximity Alerts</h3>
        <p className="text-sm text-muted-foreground">
          Real-time alerts when humans enter robot work zones — latency &lt;100ms
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-red-500/20 to-red-500/5 border-red-500/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-sm text-muted-foreground">Critical Alerts</p>
              <p className="text-2xl font-bold">{alerts.filter(a => a.type === 'critical').length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-yellow-500/30">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-sm text-muted-foreground">Warnings</p>
              <p className="text-2xl font-bold">{alerts.filter(a => a.type === 'warning').length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-accent/20 to-accent/5 border-accent/30">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Avg Response</p>
              <p className="text-2xl font-bold">73ms</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Prevented Today</p>
              <p className="text-2xl font-bold">47</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-card/50">
        <h4 className="text-lg font-bold mb-4">Recent Alerts</h4>
        <div className="space-y-3">
          {alerts.map(alert => (
            <Card key={alert.id} className={`p-4 ${getAlertColor(alert.type)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 ${getAlertIcon(alert.type)}`} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold">{alert.robot}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-background/50">
                        {alert.distance.toFixed(1)}m
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{getTimeSince(alert.timestamp)}</span>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-card/50">
        <h4 className="text-lg font-bold mb-4">⚡ Alert Configuration</h4>
        <div className="space-y-4">
          <div className="p-4 bg-background/50 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="font-bold">Critical Alert Threshold</span>
              <span className="text-sm">0.5m</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-red-500" style={{ width: '10%' }}></div>
            </div>
          </div>

          <div className="p-4 bg-background/50 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="font-bold">Warning Alert Threshold</span>
              <span className="text-sm">1.5m</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500" style={{ width: '30%' }}></div>
            </div>
          </div>

          <div className="p-4 bg-background/50 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="font-bold">Safe Zone Threshold</span>
              <span className="text-sm">2.5m</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: '50%' }}></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
