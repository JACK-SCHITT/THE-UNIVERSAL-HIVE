import { RadioBand, formatFrequency } from '@/types/radio-bands';
import { Radio, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface BandSelectorProps {
  bands: RadioBand[];
  selectedBand: RadioBand;
  onSelectBand: (band: RadioBand) => void;
}

export default function BandSelector({ bands, selectedBand, onSelectBand }: BandSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
        <Radio className="w-4 h-4" />
        Select Radio Band
      </h3>
      
      <div className="grid gap-2 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
        {bands.map(band => (
          <Card
            key={band.id}
            onClick={() => onSelectBand(band)}
            className={`p-3 cursor-pointer transition-all border ${
              selectedBand.id === band.id
                ? 'bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border-cyan-600'
                : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
            }`}
          >
            <div className="flex items-start gap-3">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                style={{ backgroundColor: band.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm text-white truncate">
                    {band.name}
                  </h4>
                  {band.channels && (
                    <span className="text-xs bg-gray-800 px-2 py-0.5 rounded flex-shrink-0">
                      {band.channels} CH
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatFrequency(band.frequencyRange[0])} - {formatFrequency(band.frequencyRange[1])}
                </p>
                
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-gray-800 px-2 py-0.5 rounded">
                    {band.modulation}
                  </span>
                  <span className="text-xs text-gray-500 truncate">
                    {band.usage}
                  </span>
                </div>

                {selectedBand.id === band.id && (
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <div className="flex items-start gap-2">
                      <Info className="w-3 h-3 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <ul className="space-y-1">
                        {band.capabilities.map((cap, idx) => (
                          <li key={idx} className="text-xs text-gray-400">
                            • {cap}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
