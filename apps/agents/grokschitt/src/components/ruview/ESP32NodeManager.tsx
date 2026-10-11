import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSimulation } from '@/hooks/useSimulation';
import { Cpu, Wifi, Battery, Thermometer, Activity, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function ESP32NodeManager() {
  const nodes = useSimulation(s => s.nodes);

  const handleReboot = (nodeId: string) => {
    toast.success(`Rebooting ${nodeId}...`);
  };

  const handleOTA = (nodeId: string) => {
    toast.success(`OTA update initiated for ${nodeId}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">ESP32 Node Manager</h3>
        <p className="text-sm text-muted-foreground">
          Manage the WiFi sensing mesh — OTA updates, diagnostics, CSI streaming
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-2">
        <Card className="p-4 bg-card/50">
          <p className="text-sm text-muted-foreground">Online</p>
          <p className="text-2xl font-bold text-accent">{nodes.filter(n => n.online).length}/{nodes.length}</p>
        </Card>
        <Card className="p-4 bg-card/50">
          <p className="text-sm text-muted-foreground">Avg CSI Quality</p>
          <p className="text-2xl font-bold">
            {Math.round(nodes.filter(n => n.online).reduce((s, n) => s + n.csiQuality, 0) / nodes.filter(n => n.online).length)}%
          </p>
        </Card>
        <Card className="p-4 bg-card/50">
          <p className="text-sm text-muted-foreground">Total Packets/s</p>
          <p className="text-2xl font-bold">
            {(nodes.reduce((s, n) => s + n.packetsPerSecond, 0) / 1000).toFixed(0)}K
          </p>
        </Card>
      </div>

      <div className="space-y-3">
        {nodes.map(node => (
          <Card key={node.id} className={`p-4 bg-card/50 ${!node.online ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${node.online ? 'bg-accent/20' : 'bg-muted'}`}>
                  <Cpu className={`w-5 h-5 ${node.online ? 'text-accent' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{node.name}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${node.online ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'}`}>
                      {node.online ? 'Online' : 'Offline'}
                    </span>
                    <span className="text-xs text-muted-foreground">v{node.firmwareVersion}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{node.id}</p>
                </div>
              </div>

              {node.online && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleOTA(node.id)}>
                    OTA
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleReboot(node.id)}>
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            {node.online && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">CSI Quality</p>
                    <p className="text-sm font-bold">{node.csiQuality.toFixed(0)}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Battery className={`w-4 h-4 ${node.batteryLevel < 30 ? 'text-red-400' : 'text-green-400'}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">Battery</p>
                    <p className="text-sm font-bold">{node.batteryLevel.toFixed(0)}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-orange-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Temp</p>
                    <p className="text-sm font-bold">{node.temperature.toFixed(1)}°C</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Packets/s</p>
                    <p className="text-sm font-bold">{(node.packetsPerSecond / 1000).toFixed(1)}K</p>
                  </div>
                </div>
              </div>
            )}

            {node.online && (
              <div className="mt-3 w-full h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent to-primary transition-all duration-1000"
                  style={{ width: `${node.csiQuality}%` }}
                />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
