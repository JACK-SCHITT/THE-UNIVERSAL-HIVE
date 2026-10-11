import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Wifi, Activity, Users, Cpu, Radio, Heart, Eye, Waves, Map } from 'lucide-react';
import { useSimulation } from '@/hooks/useSimulation';
import LivePoseView from './LivePoseView';
import VitalSignsMonitor from './VitalSignsMonitor';
import ESP32NodeManager from './ESP32NodeManager';
import PresenceHeatmap from './PresenceHeatmap';
import CSIObservatory from './CSIObservatory';

export default function RuViewHub() {
  const { persons, nodes, csiQuality, avgHeartRate, avgBreathingRate } = useSimulation();
  const onlineNodes = nodes.filter(n => n.online).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-cyber flex items-center justify-center">
            <Wifi className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">RuView WiFi Sensing</h2>
            <p className="text-sm text-muted-foreground">See through walls with WiFi + AI — No cameras, no wearables</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse-glow"></div>
          <span className="text-sm font-medium text-accent">Live Sensing</span>
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">People Detected</p>
              <p className="text-2xl font-bold">{persons.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-secondary/20 to-secondary/5 border-secondary/30">
          <div className="flex items-center gap-3">
            <Cpu className="w-8 h-8 text-secondary" />
            <div>
              <p className="text-sm text-muted-foreground">ESP32 Nodes</p>
              <p className="text-2xl font-bold">{onlineNodes}/{nodes.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-accent/20 to-accent/5 border-accent/30">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Avg Heart Rate</p>
              <p className="text-2xl font-bold">{avgHeartRate} BPM</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-yellow-500/30">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-sm text-muted-foreground">Avg Breathing</p>
              <p className="text-2xl font-bold">{avgBreathingRate} BPM</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-purple-500/30">
          <div className="flex items-center gap-3">
            <Radio className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">CSI Quality</p>
              <p className="text-2xl font-bold">{csiQuality}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Interface */}
      <Tabs defaultValue="pose" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pose">Live Pose</TabsTrigger>
          <TabsTrigger value="vitals">Vital Signs</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          <TabsTrigger value="nodes">ESP32 Nodes</TabsTrigger>
          <TabsTrigger value="observatory">Observatory</TabsTrigger>
        </TabsList>

        <TabsContent value="pose">
          <LivePoseView />
        </TabsContent>
        <TabsContent value="vitals">
          <VitalSignsMonitor />
        </TabsContent>
        <TabsContent value="heatmap">
          <PresenceHeatmap />
        </TabsContent>
        <TabsContent value="nodes">
          <ESP32NodeManager />
        </TabsContent>
        <TabsContent value="observatory">
          <CSIObservatory />
        </TabsContent>
      </Tabs>

      {/* Info */}
      <Card className="p-6 bg-card/50">
        <h3 className="text-lg font-bold mb-4">📡 Signal Pipeline</h3>
        <div className="font-mono text-xs space-y-1 p-4 bg-black/50 rounded-lg">
          <p className="text-muted-foreground">WiFi Router → radio waves → hit human body → scatter</p>
          <p className="text-primary">↓ ESP32 mesh ({onlineNodes} nodes online) captures CSI</p>
          <p className="text-secondary">↓ Multi-band fusion (3 channels × 56 subcarriers = 168 virtual)</p>
          <p className="text-accent">↓ Multistatic fusion ({onlineNodes * (onlineNodes - 1)} signal paths)</p>
          <p className="text-yellow-500">↓ AI backbone (RuVector) + Signal-Line Protocol</p>
          <p className="text-purple-400">→ {persons.length} people detected · {avgHeartRate} BPM avg HR · {avgBreathingRate} BPM breathing</p>
        </div>
      </Card>
    </div>
  );
}
