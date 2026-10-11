import { AppMode } from '@/types';

interface VoicePulseProps {
  mode: AppMode;
  isListening: boolean;
  isNavigating: boolean;
  isRecordingRoute: boolean;
  micPermission?: PermissionState | 'unknown';
  onClick: () => void;
}

export function VoicePulse({ mode, isListening, isNavigating, isRecordingRoute, micPermission = 'unknown', onClick }: VoicePulseProps) {
  const isMicBlocked = micPermission === 'denied';
  const getColor = () => {
    if (isMicBlocked) return 'bg-red-700';
    if (isListening) return 'bg-orange-500';
    if (isNavigating) return 'bg-green-500';
    if (isRecordingRoute) return 'bg-red-500';
    return 'bg-yellow-400';
  };

  const getPulseColor = () => {
    if (isListening) return 'bg-orange-500/40';
    if (isNavigating) return 'bg-green-500/40';
    if (isRecordingRoute) return 'bg-red-500/40';
    return 'bg-yellow-400/30';
  };

  const getLabel = () => {
    if (isMicBlocked) return 'MIC BLOCKED — TAP';
    if (isListening) return 'LISTENING...';
    if (isNavigating) return 'TAP TO COMMAND';
    if (isRecordingRoute) return 'RECORDING ROUTE';
    return 'TAP TO SPEAK';
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Outer pulse rings */}
      {isListening && (
        <>
          <div className={`absolute w-64 h-64 rounded-full ${getPulseColor()} animate-ping`} style={{ animationDuration: '1s' }} />
          <div className={`absolute w-52 h-52 rounded-full ${getPulseColor()} animate-ping`} style={{ animationDuration: '1.4s', animationDelay: '0.2s' }} />
        </>
      )}

      {/* Main button */}
      <button
        onClick={onClick}
        className={`relative z-10 w-44 h-44 rounded-full ${getColor()} flex items-center justify-center shadow-2xl transition-all duration-200 active:scale-95 focus:outline-none focus:ring-4 focus:ring-yellow-400/50`}
        aria-label={getLabel()}
      >
        {isMicBlocked ? (
          <MicBlockedIcon />
        ) : isListening ? (
          <MicActiveIcon />
        ) : isRecordingRoute ? (
          <RecordIcon />
        ) : isNavigating ? (
          <NavigateIcon />
        ) : (
          <MicIcon />
        )}
      </button>

      {isMicBlocked && (
        <div className="bg-red-950 border border-red-700 rounded-lg px-4 py-3 max-w-[280px] text-center">
          <p className="text-red-300 font-bold text-sm mb-1">MICROPHONE BLOCKED</p>
          <p className="text-red-400 font-mono text-xs leading-relaxed">
            1. Tap the 🔒 lock icon in the address bar{"\n"}
            2. Tap "Permissions" or "Site settings"{"\n"}
            3. Set Microphone → Allow{"\n"}
            4. Reload and tap the button
          </p>
        </div>
      )}

      <p className="text-yellow-400 font-black text-lg tracking-widest uppercase">
        {getLabel()}
      </p>
    </div>
  );
}

function MicBlockedIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23"/>
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="8" y1="22" x2="16" y2="22"/>
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="8" y1="22" x2="16" y2="22"/>
    </svg>
  );
}

function MicActiveIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="black" stroke="black" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="black" strokeWidth="2.5"/>
      <line x1="12" y1="19" x2="12" y2="22" stroke="black" strokeWidth="2.5"/>
      <line x1="8" y1="22" x2="16" y2="22" stroke="black" strokeWidth="2.5"/>
    </svg>
  );
}

function RecordIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5">
      <circle cx="12" cy="12" r="8" fill="black"/>
    </svg>
  );
}

function NavigateIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11"/>
    </svg>
  );
}
