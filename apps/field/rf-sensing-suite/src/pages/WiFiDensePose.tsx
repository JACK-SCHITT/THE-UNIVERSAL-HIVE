import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import WiFiSignalGraph from '@/components/WiFiSignalGraph';
import PoseVisualization from '@/components/PoseVisualization';
import AntennaMap from '@/components/AntennaMap';
import { WiFiSignalSimulator, DensePoseEstimator } from '@/lib/wifi-pose-simulator';
import { WiFiSignal, HumanPose } from '@/types/wifi-pose';
import { Play, Pause, Radio, Info, Github, Shield } from 'lucide-react';

export default function WiFiDensePose() {
  const [isRunning, setIsRunning] = useState(false);
  const [numPeople, setNumPeople] = useState(2);
  const [showDenseRegions, setShowDenseRegions] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [signal, setSignal] = useState<WiFiSignal | null>(null);
  const [poses, setPoses] = useState<HumanPose[]>([]);
  const [simulator] = useState(() => new WiFiSignalSimulator(3));
  const [estimator] = useState(() => new DensePoseEstimator());

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const newSignal = simulator.generateSignal(numPeople);
      setSignal(newSignal);
      
      const estimatedPoses = estimator.estimatePoses(newSignal, numPeople);
      setPoses(estimatedPoses);
    }, 100); // 10 Hz update rate

    return () => clearInterval(interval);
  }, [isRunning, numPeople, simulator, estimator]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                <Radio className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  DensePose from WiFi
                </h1>
                <p className="text-xs text-gray-500">Privacy-Preserving Human Pose Estimation</p>
              </div>
            </div>
            
            <a 
              href="https://github.com/superstar1225/DensePose_from_WiFi" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Github className="w-4 h-4" />
              <span className="text-sm">Research Code</span>
            </a>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Info Banner */}
        <Card className="mb-6 bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border-cyan-800/50 p-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="text-gray-300">
                This demo visualizes how <span className="font-semibold text-cyan-400">WiFi signals</span> can detect human pose without cameras. 
                The technology uses <span className="font-semibold">phase and amplitude</span> changes in WiFi CSI (Channel State Information) 
                to map body positions to UV coordinates across 24 human regions.
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Shield className="w-4 h-4" />
                <span>Privacy-preserving: No cameras or visual recording required</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Controls */}
        <Card className="mb-6 bg-gray-900/50 border-gray-800 p-6">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Button
                onClick={() => setIsRunning(!isRunning)}
                className={`w-full ${isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-cyan-600 hover:bg-cyan-700'}`}
                size="lg"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Stop Scanning
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Scanning
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400">Number of People: {numPeople}</Label>
              <Slider
                value={[numPeople]}
                onValueChange={([value]) => setNumPeople(value)}
                min={1}
                max={4}
                step={1}
                className="mt-2"
              />
            </div>

            <div className="flex items-center justify-between space-x-3">
              <Label htmlFor="dense-regions" className="text-gray-400">Dense Regions</Label>
              <Switch
                id="dense-regions"
                checked={showDenseRegions}
                onCheckedChange={setShowDenseRegions}
              />
            </div>

            <div className="flex items-center justify-between space-x-3">
              <Label htmlFor="skeleton" className="text-gray-400">Skeleton</Label>
              <Switch
                id="skeleton"
                checked={showSkeleton}
                onCheckedChange={setShowSkeleton}
              />
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Pose Visualization */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gray-900/50 border-gray-800 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                Estimated Poses
              </h2>
              <PoseVisualization
                poses={poses}
                showDenseRegions={showDenseRegions}
                showSkeleton={showSkeleton}
              />
              
              {poses.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {poses.map((pose, idx) => (
                    <div key={pose.id} className="bg-black/40 rounded-lg p-3 border border-gray-800">
                      <p className="text-xs text-gray-400 mb-1">Person {idx + 1}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-cyan-400">
                          {(pose.confidence * 100).toFixed(1)}%
                        </span>
                        <span className="text-xs text-gray-500">confidence</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {pose.denseRegions.length} regions mapped
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* WiFi Signal Graphs */}
            {signal && (
              <Card className="bg-gray-900/50 border-gray-800 p-6">
                <h2 className="text-lg font-semibold mb-4">WiFi CSI Data</h2>
                <div className="space-y-4">
                  <WiFiSignalGraph signal={signal} title="Amplitude (Signal Strength)" type="amplitude" />
                  <WiFiSignalGraph signal={signal} title="Phase Shift" type="phase" />
                  
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-800">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Frequency</p>
                      <p className="text-lg font-semibold text-cyan-400">{signal.frequency} MHz</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">RSSI</p>
                      <p className="text-lg font-semibold text-cyan-400">{signal.rssi.toFixed(1)} dBm</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Subcarriers</p>
                      <p className="text-lg font-semibold text-cyan-400">{signal.amplitude.length}</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right Column: Antenna Map & Info */}
          <div className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-800 p-6">
              <AntennaMap antennas={simulator.getAntennaConfig()} />
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 p-6">
              <h3 className="text-sm font-semibold mb-3 text-gray-300">How It Works</h3>
              <div className="space-y-3 text-xs text-gray-400">
                <div className="flex gap-2">
                  <span className="text-cyan-400 font-bold">1.</span>
                  <p>WiFi antennas transmit signals that bounce off human bodies</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-cyan-400 font-bold">2.</span>
                  <p>CSI data captures amplitude and phase changes caused by reflections</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-cyan-400 font-bold">3.</span>
                  <p>Deep neural network maps signal patterns to UV body coordinates</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-cyan-400 font-bold">4.</span>
                  <p>Outputs dense pose estimation comparable to camera-based systems</p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-amber-950/40 to-orange-950/40 border-amber-800/50 p-6">
              <h3 className="text-sm font-semibold mb-2 text-amber-400">Hardware Requirements</h3>
              <p className="text-xs text-gray-400 mb-3">
                Real implementation requires:
              </p>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span>WiFi adapters with CSI extraction (e.g., Intel 5300, Atheros)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span>3+ antennas positioned around detection area</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span>Backend server for deep learning inference</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span>PyTorch models trained on WiFi-pose datasets</span>
                </li>
              </ul>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 p-6">
              <h3 className="text-sm font-semibold mb-3 text-gray-300">Advantages</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs">
                  <Shield className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-300 font-medium">Privacy-Preserving</p>
                    <p className="text-gray-500">No visual recording or cameras</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <Radio className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-300 font-medium">Works Through Walls</p>
                    <p className="text-gray-500">RF signals penetrate obstacles</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <div className="w-4 h-4 flex items-center justify-center text-purple-400 flex-shrink-0">$</div>
                  <div>
                    <p className="text-gray-300 font-medium">Low Cost</p>
                    <p className="text-gray-500">Uses existing WiFi infrastructure</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-gray-500 border-t border-gray-800 pt-8">
          <p>
            Based on research: "DensePose from WiFi" - Privacy-preserving human sensing using WiFi signals
          </p>
          <p className="mt-2">
            This is a demonstration with simulated data. Real implementation requires specialized hardware.
          </p>
        </footer>
      </div>
    </div>
  );
}
