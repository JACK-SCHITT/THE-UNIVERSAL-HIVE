import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BandSelector from '@/components/BandSelector';
import RadioSpectrumAnalyzer from '@/components/RadioSpectrumAnalyzer';
import SignalList from '@/components/SignalList';
import { RADIO_BANDS, RadioBand, RadioSignal, CB_CHANNELS, MARINE_CHANNELS, WEATHER_CHANNELS } from '@/types/radio-bands';
import { RadioScanner as Scanner } from '@/lib/radio-scanner';
import { Play, Pause, Radio, Antenna, Info, AlertTriangle } from 'lucide-react';

export default function RadioScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [selectedBand, setSelectedBand] = useState<RadioBand>(RADIO_BANDS[1]); // FM by default
  const [detectedSignals, setDetectedSignals] = useState<RadioSignal[]>([]);
  const [scanner] = useState(() => new Scanner());

  useEffect(() => {
    if (!isScanning) return;

    const cleanup = scanner.continuousScan([selectedBand], (signals) => {
      setDetectedSignals(signals);
    });

    return cleanup;
  }, [isScanning, selectedBand, scanner]);

  const handleBandChange = (band: RadioBand) => {
    setSelectedBand(band);
    setDetectedSignals([]); // Clear previous signals
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                Multi-Band Radio Scanner
              </h1>
              <p className="text-xs text-gray-500">AM/FM • CB • Marine • Aviation • Ham • Weather</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Info Banner */}
        <Card className="mb-6 bg-gradient-to-r from-orange-950/40 to-red-950/40 border-orange-800/50 p-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="text-gray-300">
                This scanner simulates detection across <span className="font-semibold text-orange-400">AM, FM, CB, Marine, Aviation, Ham Radio, and WiFi bands</span>. 
                Real implementation requires SDR hardware (RTL-SDR, HackRF) or device's native FM tuner.
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Legal Notice: Listening is legal in most countries. Transmitting requires appropriate licenses.</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Controls */}
        <Card className="mb-6 bg-gray-900/50 border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setIsScanning(!isScanning)}
                className={`${isScanning ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}`}
                size="lg"
              >
                {isScanning ? (
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

              <div className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-lg border border-gray-800">
                <Antenna className="w-4 h-4 text-orange-400" />
                <div>
                  <p className="text-xs text-gray-500">Current Band</p>
                  <p className="text-sm font-semibold">{selectedBand.name}</p>
                </div>
              </div>
            </div>

            {isScanning && (
              <div className="flex items-center gap-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Scanning...</span>
              </div>
            )}
          </div>
        </Card>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Band Selector */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-900/50 border-gray-800 p-4">
              <BandSelector
                bands={RADIO_BANDS}
                selectedBand={selectedBand}
                onSelectBand={handleBandChange}
              />
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Spectrum Analyzer */}
            <Card className="bg-gray-900/50 border-gray-800 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedBand.color }}
                />
                {selectedBand.name}
              </h2>
              <RadioSpectrumAnalyzer
                band={selectedBand}
                isScanning={isScanning}
              />
            </Card>

            {/* Detected Signals */}
            <SignalList signals={detectedSignals} />

            {/* Band-Specific Information */}
            <Tabs defaultValue="capabilities" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-900 border border-gray-800">
                <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
                <TabsTrigger value="channels">Channels</TabsTrigger>
                <TabsTrigger value="equipment">Equipment</TabsTrigger>
              </TabsList>

              <TabsContent value="capabilities">
                <Card className="bg-gray-900/50 border-gray-800 p-6">
                  <h3 className="text-sm font-semibold mb-3 text-gray-300">
                    What You Can Do With {selectedBand.name}
                  </h3>
                  <ul className="space-y-2">
                    {selectedBand.capabilities.map((capability, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-400">
                        <span className="text-orange-400 flex-shrink-0">•</span>
                        <span>{capability}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <p className="text-xs text-gray-500 mb-2">Technical Specs:</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500">Modulation:</span>
                        <span className="ml-2 font-semibold text-orange-400">{selectedBand.modulation}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Usage:</span>
                        <span className="ml-2 text-gray-300">{selectedBand.usage}</span>
                      </div>
                      {selectedBand.channels && (
                        <div>
                          <span className="text-gray-500">Channels:</span>
                          <span className="ml-2 font-semibold text-orange-400">{selectedBand.channels}</span>
                        </div>
                      )}
                      {selectedBand.channelSpacing && (
                        <div>
                          <span className="text-gray-500">Spacing:</span>
                          <span className="ml-2 text-gray-300">{selectedBand.channelSpacing} kHz</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="channels">
                <Card className="bg-gray-900/50 border-gray-800 p-6">
                  <h3 className="text-sm font-semibold mb-3 text-gray-300">
                    Common Channels
                  </h3>
                  
                  {selectedBand.id === 'cb_radio' && (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {CB_CHANNELS.slice(0, 10).map(ch => (
                        <div key={ch.number} className="flex items-center justify-between p-2 bg-black/40 rounded border border-gray-800">
                          <div className="flex items-center gap-3">
                            <span className="text-orange-400 font-bold font-mono text-sm">
                              CH {ch.number}
                            </span>
                            <span className="text-gray-400 text-xs font-mono">
                              {(ch.frequency / 1e6).toFixed(3)} MHz
                            </span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            ch.usage === 'EMERGENCY' ? 'bg-red-900 text-red-300' : 'bg-gray-800 text-gray-400'
                          }`}>
                            {ch.usage}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedBand.id === 'marine_vhf' && (
                    <div className="space-y-2">
                      {MARINE_CHANNELS.map(ch => (
                        <div key={ch.number} className="flex items-center justify-between p-2 bg-black/40 rounded border border-gray-800">
                          <div className="flex items-center gap-3">
                            <span className="text-blue-400 font-bold font-mono text-sm">
                              {ch.name}
                            </span>
                            <span className="text-gray-400 text-xs font-mono">
                              {(ch.frequency / 1e6).toFixed(3)} MHz
                            </span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            ch.usage.includes('DISTRESS') ? 'bg-red-900 text-red-300' : 'bg-gray-800 text-gray-400'
                          }`}>
                            {ch.usage}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedBand.id === 'weather' && (
                    <div className="space-y-2">
                      {WEATHER_CHANNELS.map(ch => (
                        <div key={ch.number} className="flex items-center justify-between p-2 bg-black/40 rounded border border-gray-800">
                          <div className="flex items-center gap-3">
                            <span className="text-cyan-400 font-bold font-mono text-sm">
                              {ch.name}
                            </span>
                            <span className="text-gray-400 text-xs font-mono">
                              {(ch.frequency / 1e6).toFixed(3)} MHz
                            </span>
                          </div>
                          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">
                            {ch.usage}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {!['cb_radio', 'marine_vhf', 'weather'].includes(selectedBand.id) && (
                    <p className="text-sm text-gray-500 text-center py-8">
                      This band uses continuous frequency tuning rather than fixed channels.
                      Use the spectrum analyzer to find active frequencies.
                    </p>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="equipment">
                <Card className="bg-gray-900/50 border-gray-800 p-6">
                  <h3 className="text-sm font-semibold mb-3 text-gray-300">
                    Recommended Equipment
                  </h3>
                  
                  <div className="space-y-4 text-sm">
                    <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
                      <h4 className="font-semibold text-orange-400 mb-2">For Listening:</h4>
                      <ul className="space-y-1 text-gray-400">
                        <li>• RTL-SDR dongle ($25-40) - covers 24-1766 MHz</li>
                        <li>• HackRF One ($300) - full duplex, 1 MHz to 6 GHz</li>
                        <li>• Dedicated scanner radio (Uniden, Whistler)</li>
                        <li>• Smartphone with FM tuner chip (for FM only)</li>
                      </ul>
                    </div>

                    <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
                      <h4 className="font-semibold text-orange-400 mb-2">For Transmitting:</h4>
                      <ul className="space-y-1 text-gray-400">
                        <li>• CB Radio: No license needed (most countries)</li>
                        <li>• Ham Radio: Requires amateur license (Technician/General/Extra)</li>
                        <li>• Marine VHF: Ship radio operator license</li>
                        <li>• Aviation: Restricted to licensed pilots/operators</li>
                      </ul>
                    </div>

                    <div className="bg-amber-950/40 border border-amber-800/50 p-4 rounded-lg">
                      <p className="text-xs text-amber-300">
                        ⚠️ Always check local regulations before transmitting. Unauthorized transmission 
                        can result in heavy fines and equipment seizure.
                      </p>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-gray-500 border-t border-gray-800 pt-8">
          <p>
            This is a demonstration with simulated signals. Real RF scanning requires hardware like RTL-SDR or native device radio chips.
          </p>
          <p className="mt-2">
            Always comply with local radio regulations. Some bands require licenses for transmission.
          </p>
        </footer>
      </div>
    </div>
  );
}
