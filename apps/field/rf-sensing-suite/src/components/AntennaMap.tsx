import { WiFiAntennaConfig } from '@/types/wifi-pose';
import { Wifi } from 'lucide-react';

interface AntennaMapProps {
  antennas: WiFiAntennaConfig[];
}

export default function AntennaMap({ antennas }: AntennaMapProps) {
  const mapSize = 300;
  const scale = 30; // pixels per meter

  return (
    <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-lg border border-gray-800 p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Antenna Array</h3>
      
      <svg width={mapSize} height={mapSize} className="mx-auto">
        {/* Grid */}
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1f1f1f" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width={mapSize} height={mapSize} fill="url(#grid)" />
        
        {/* Center point (coverage area) */}
        <circle
          cx={mapSize / 2}
          cy={mapSize / 2}
          r={80}
          fill="none"
          stroke="#4ECDC4"
          strokeWidth="2"
          strokeDasharray="5,5"
          opacity="0.3"
        />
        
        {/* Antennas */}
        {antennas.map((antenna, idx) => {
          const x = mapSize / 2 + antenna.position[0] * scale;
          const y = mapSize / 2 - antenna.position[1] * scale; // Invert Y for screen coords
          
          return (
            <g key={antenna.id}>
              {/* Signal radiation */}
              <circle
                cx={x}
                cy={y}
                r={40}
                fill="#4ECDC4"
                opacity="0.1"
              />
              <circle
                cx={x}
                cy={y}
                r={25}
                fill="#4ECDC4"
                opacity="0.15"
              />
              
              {/* Antenna icon background */}
              <circle
                cx={x}
                cy={y}
                r={12}
                fill={antenna.status === 'active' ? '#4ECDC4' : '#666'}
              />
              
              {/* Label */}
              <text
                x={x}
                y={y + 25}
                textAnchor="middle"
                className="text-xs fill-gray-400"
                fontSize="10"
              >
                A{idx + 1}
              </text>
            </g>
          );
        })}
      </svg>
      
      <div className="mt-4 space-y-2">
        {antennas.map((antenna, idx) => (
          <div key={antenna.id} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Wifi className={`w-3 h-3 ${antenna.status === 'active' ? 'text-cyan-400' : 'text-gray-600'}`} />
              <span className="text-gray-400">Antenna {idx + 1}</span>
            </div>
            <span className="text-gray-500 font-mono">
              {antenna.frequency} MHz
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
