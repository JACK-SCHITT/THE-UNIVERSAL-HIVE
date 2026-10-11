import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { RadioSignal, formatFrequency, getWavelength } from '@/types/radio-bands';
import { Activity, Radio, Waves } from 'lucide-react';

interface SignalListProps {
  signals: RadioSignal[];
}

export default function SignalList({ signals }: SignalListProps) {
  const [sortedSignals, setSortedSignals] = useState<RadioSignal[]>([]);

  useEffect(() => {
    // Sort by signal strength (strongest first)
    const sorted = [...signals].sort((a, b) => b.strength - a.strength);
    setSortedSignals(sorted.slice(0, 10)); // Show top 10
  }, [signals]);

  const getStrengthColor = (strength: number): string => {
    if (strength > -50) return 'text-green-400';
    if (strength > -70) return 'text-yellow-400';
    if (strength > -90) return 'text-orange-400';
    return 'text-red-400';
  };

  const getStrengthLabel = (strength: number): string => {
    if (strength > -50) return 'Excellent';
    if (strength > -70) return 'Good';
    if (strength > -90) return 'Fair';
    return 'Weak';
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Active Signals
        </h3>
        <span className="text-xs text-gray-500">
          {signals.length} detected
        </span>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
        {sortedSignals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Radio className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No signals detected</p>
            <p className="text-xs mt-1">Start scanning to find broadcasts</p>
          </div>
        ) : (
          sortedSignals.map((signal, idx) => (
            <div
              key={`${signal.frequency}-${idx}`}
              className="bg-black/40 rounded-lg p-3 border border-gray-800 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Waves className="w-3 h-3 text-cyan-400" />
                    <span className="font-mono text-sm text-white font-semibold">
                      {formatFrequency(signal.frequency)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    λ {getWavelength(signal.frequency)}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className={`text-sm font-bold ${getStrengthColor(signal.strength)}`}>
                    {signal.strength.toFixed(1)} dBm
                  </p>
                  <p className="text-xs text-gray-500">
                    {getStrengthLabel(signal.strength)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-gray-800 px-2 py-0.5 rounded">
                  {signal.modulation}
                </span>
                <span className="text-xs text-gray-500">
                  BW: {(signal.bandwidth / 1000).toFixed(1)} kHz
                </span>
              </div>

              {/* Signal strength bar */}
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full transition-all ${
                    signal.strength > -50
                      ? 'bg-green-500'
                      : signal.strength > -70
                      ? 'bg-yellow-500'
                      : signal.strength > -90
                      ? 'bg-orange-500'
                      : 'bg-red-500'
                  }`}
                  style={{
                    width: `${Math.max(5, Math.min(100, ((signal.strength + 120) / 100) * 100))}%`
                  }}
                />
              </div>

              {signal.decoded && (
                <div className="bg-cyan-950/40 border border-cyan-800/50 rounded p-2 mt-2">
                  <p className="text-xs text-cyan-300 font-mono">
                    📻 {signal.decoded}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
