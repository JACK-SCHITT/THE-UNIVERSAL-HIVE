import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { TestTube, Play, Pause, RefreshCw, Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function TestModePanel() {
  const [testMode, setTestMode] = useState(true);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [dataRealism, setDataRealism] = useState([85]);
  const [updateFrequency, setUpdateFrequency] = useState([5]);

  const toggleTestMode = () => {
    setTestMode(!testMode);
    toast.success(testMode ? 'Test mode disabled' : 'Test mode enabled — all data is simulated');
  };

  const resetSimulation = () => {
    toast.success('Simulation reset — starting fresh with new mock data');
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/30">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
          <TestTube className="w-5 h-5 text-purple-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold">Test/Preview Mode</h3>
          <p className="text-sm text-muted-foreground">All features work with realistic simulated data</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
          <div>
            <Label className="font-bold">Test Mode Active</Label>
            <p className="text-xs text-muted-foreground">Simulate all sensors and data sources</p>
          </div>
          <Switch checked={testMode} onCheckedChange={toggleTestMode} />
        </div>

        <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
          <div>
            <Label className="font-bold">Auto-Generate Data</Label>
            <p className="text-xs text-muted-foreground">Continuously generate realistic test data</p>
          </div>
          <Switch checked={autoGenerate} onCheckedChange={setAutoGenerate} />
        </div>

        <div className="p-4 bg-background/50 rounded-lg">
          <Label className="font-bold mb-3 block">Data Realism: {dataRealism}%</Label>
          <Slider
            value={dataRealism}
            onValueChange={setDataRealism}
            min={0}
            max={100}
            step={5}
            className="mb-2"
          />
          <p className="text-xs text-muted-foreground">Higher values = more realistic variations and noise</p>
        </div>

        <div className="p-4 bg-background/50 rounded-lg">
          <Label className="font-bold mb-3 block">Update Frequency: {updateFrequency}s</Label>
          <Slider
            value={updateFrequency}
            onValueChange={setUpdateFrequency}
            min={1}
            max={30}
            step={1}
            className="mb-2"
          />
          <p className="text-xs text-muted-foreground">How often simulated data refreshes</p>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={resetSimulation}
          >
            <RefreshCw className="w-4 h-4" />
            Reset Simulation
          </Button>
          <Button variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            Advanced Settings
          </Button>
        </div>

        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-sm font-bold text-yellow-500 mb-2">⚠️ Preview Mode Active</p>
          <p className="text-xs text-muted-foreground">
            All features are fully functional with simulated data. Connect real hardware (ESP32, sensors) to use live data.
          </p>
        </div>

        <div className="p-4 bg-background/50 rounded-lg">
          <p className="text-sm font-bold mb-3">🎭 Simulated Features</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>WiFi CSI Signals</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Pose Detection</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Vital Signs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Robot Positions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Building Occupancy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Energy Metrics</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Fraud Transactions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>AI Responses</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
