import { GeoPosition } from '@/hooks/useGeolocation';
import { AppMode, SavedRoute, SavedPlace } from '@/types';

interface StatusBarProps {
  mode: AppMode;
  position: GeoPosition | null;
  gpsError: string | null;
  compassHeading: number | null;
  activeRoute?: SavedRoute | null;
  destination?: SavedPlace | null;
  isRecordingRoute: boolean;
  routePointCount: number;
}

export function StatusBar({
  mode,
  position,
  gpsError,
  compassHeading,
  activeRoute,
  destination,
  isRecordingRoute,
  routePointCount,
}: StatusBarProps) {
  const getCompassDirection = (h: number): string => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(h / 45) % 8];
  };

  return (
    <div className="w-full px-4 py-3 flex items-center justify-between">
      {/* GPS Status */}
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${position ? 'bg-green-400' : gpsError ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`} />
        <span className={`font-mono text-sm font-bold ${position ? 'text-green-400' : gpsError ? 'text-red-400' : 'text-yellow-400'}`}>
          {position ? `GPS ${Math.round(position.accuracy)}m` : gpsError ? 'NO GPS' : 'ACQUIRING'}
        </span>
      </div>

      {/* Mode indicator */}
      <div className="text-center">
        {isRecordingRoute && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 font-black text-sm uppercase">REC {routePointCount}pts</span>
          </div>
        )}
        {mode === 'navigating' && destination && (
          <span className="text-green-400 font-black text-sm uppercase">→ {destination.name}</span>
        )}
        {mode === 'listening' && (
          <span className="text-orange-400 font-black text-sm animate-pulse">● LIVE</span>
        )}
      </div>

      {/* Compass */}
      <div className="flex items-center gap-2">
        {compassHeading !== null ? (
          <>
            <span className="text-yellow-400 font-mono text-sm font-bold">
              {getCompassDirection(compassHeading)} {compassHeading}°
            </span>
            <CompassIcon heading={compassHeading} />
          </>
        ) : (
          <span className="text-zinc-600 font-mono text-sm">NO CMP</span>
        )}
      </div>
    </div>
  );
}

function CompassIcon({ heading }: { heading: number }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ transform: `rotate(${heading}deg)` }}>
      <circle cx="12" cy="12" r="10" fill="none" stroke="#71717a" strokeWidth="1.5"/>
      <path d="M12 2 L15 12 L12 10 L9 12 Z" fill="#f97316" />
      <path d="M12 22 L15 12 L12 14 L9 12 Z" fill="#52525b" />
    </svg>
  );
}
