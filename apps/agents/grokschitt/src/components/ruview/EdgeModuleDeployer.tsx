import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Download, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';

interface EdgeModule {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'available' | 'installed' | 'running';
  size: string;
}

export default function EdgeModuleDeployer() {
  const [modules] = useState<EdgeModule[]>([
    {
      id: 'sleep-apnea',
      name: 'Sleep Apnea Detection',
      category: 'Medical',
      description: 'Detects abnormal breathing patterns during sleep',
      status: 'installed',
      size: '2.3 MB'
    },
    {
      id: 'fall-detection',
      name: 'Fall Detection',
      category: 'Medical',
      description: 'Real-time fall detection with instant alerts',
      status: 'running',
      size: '1.8 MB'
    },
    {
      id: 'customer-flow',
      name: 'Customer Flow Analysis',
      category: 'Retail',
      description: 'Track customer movement and dwell patterns',
      status: 'available',
      size: '2.1 MB'
    },
    {
      id: 'queue-length',
      name: 'Queue Length Estimator',
      category: 'Retail',
      description: 'Estimate wait times and queue lengths',
      status: 'available',
      size: '1.5 MB'
    },
    {
      id: 'hvac-presence',
      name: 'HVAC Presence Optimizer',
      category: 'Building',
      description: 'Energy-efficient HVAC based on real occupancy',
      status: 'installed',
      size: '1.9 MB'
    },
    {
      id: 'gait-analysis',
      name: 'Gait Analysis',
      category: 'Medical',
      description: 'Walking pattern analysis for health monitoring',
      status: 'available',
      size: '2.7 MB'
    },
    {
      id: 'perimeter-breach',
      name: 'Perimeter Breach Alert',
      category: 'Security',
      description: 'Detect unauthorized entry in restricted areas',
      status: 'available',
      size: '1.4 MB'
    },
    {
      id: 'breathing-sync',
      name: 'Breathing Synchronization',
      category: 'Fitness',
      description: 'Monitor breathing cadence during exercise',
      status: 'available',
      size: '1.6 MB'
    },
  ]);

  const installModule = (moduleId: string) => {
    toast.success('Installing module...');
    setTimeout(() => {
      toast.success('Module installed successfully!');
    }, 1500);
  };

  const startModule = (moduleId: string) => {
    toast.success('Module started');
  };

  const stopModule = (moduleId: string) => {
    toast.success('Module stopped');
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Medical': return 'text-red-500 bg-red-500/20 border-red-500/30';
      case 'Retail': return 'text-blue-500 bg-blue-500/20 border-blue-500/30';
      case 'Building': return 'text-green-500 bg-green-500/20 border-green-500/30';
      case 'Security': return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/30';
      case 'Fitness': return 'text-purple-500 bg-purple-500/20 border-purple-500/30';
      default: return 'text-gray-500 bg-gray-500/20 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">Edge Module Deployer</h3>
        <p className="text-sm text-muted-foreground">
          Deploy AI modules directly to ESP32 sensors — runs on-device with no cloud
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
          <p className="text-sm text-muted-foreground mb-1">Available</p>
          <p className="text-2xl font-bold">{modules.filter(m => m.status === 'available').length}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-secondary/20 to-secondary/5 border-secondary/30">
          <p className="text-sm text-muted-foreground mb-1">Installed</p>
          <p className="text-2xl font-bold">{modules.filter(m => m.status === 'installed').length}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-accent/20 to-accent/5 border-accent/30">
          <p className="text-sm text-muted-foreground mb-1">Running</p>
          <p className="text-2xl font-bold">{modules.filter(m => m.status === 'running').length}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-yellow-500/30">
          <p className="text-sm text-muted-foreground mb-1">Total Size</p>
          <p className="text-2xl font-bold">12.3 MB</p>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {modules.map(module => (
          <Card key={module.id} className="p-6 bg-card/50">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold">{module.name}</h4>
                  <p className="text-xs text-muted-foreground">{module.description}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className={`px-2 py-1 rounded text-xs font-bold border ${getCategoryColor(module.category)}`}>
                {module.category}
              </span>
              <span className="text-xs text-muted-foreground">• {module.size}</span>
            </div>

            <div className="flex gap-2">
              {module.status === 'available' && (
                <Button
                  size="sm"
                  className="gradient-cyber text-white gap-2"
                  onClick={() => installModule(module.id)}
                >
                  <Download className="w-3 h-3" />
                  Install
                </Button>
              )}
              {module.status === 'installed' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => startModule(module.id)}
                >
                  <Play className="w-3 h-3" />
                  Start
                </Button>
              )}
              {module.status === 'running' && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-2"
                  onClick={() => stopModule(module.id)}
                >
                  <Pause className="w-3 h-3" />
                  Stop
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-card/50">
        <h4 className="text-lg font-bold mb-4">💡 Edge Module Categories</h4>
        <div className="grid md:grid-cols-5 gap-4">
          <div>
            <p className="font-bold text-sm mb-2 text-red-500">Medical</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Sleep apnea</li>
              <li>• Fall detection</li>
              <li>• Gait analysis</li>
              <li>• Respiratory distress</li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-sm mb-2 text-blue-500">Retail</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Customer flow</li>
              <li>• Queue length</li>
              <li>• Dwell heatmap</li>
              <li>• Shelf engagement</li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-sm mb-2 text-green-500">Building</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• HVAC presence</li>
              <li>• Lighting zones</li>
              <li>• Energy audit</li>
              <li>• Meeting rooms</li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-sm mb-2 text-yellow-500">Security</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Perimeter breach</li>
              <li>• Loitering alert</li>
              <li>• Panic motion</li>
              <li>• Confined space</li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-sm mb-2 text-purple-500">Fitness</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Breathing sync</li>
              <li>• Rep counting</li>
              <li>• Posture tracking</li>
              <li>• Form analysis</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
