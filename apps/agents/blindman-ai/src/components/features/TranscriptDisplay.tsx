import { useEffect, useRef } from 'react';

interface TranscriptEntry {
  id: string;
  type: 'user' | 'system' | 'warning' | 'success' | 'navigation';
  text: string;
  timestamp: number;
}

interface TranscriptDisplayProps {
  entries: TranscriptEntry[];
  interimText: string;
}

export type { TranscriptEntry };

export function TranscriptDisplay({ entries, interimText }: TranscriptDisplayProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries, interimText]);

  const getEntryStyle = (type: TranscriptEntry['type']) => {
    switch (type) {
      case 'user': return 'text-white bg-zinc-800 border-l-4 border-yellow-400';
      case 'system': return 'text-yellow-300 bg-zinc-900 border-l-4 border-yellow-600';
      case 'warning': return 'text-red-300 bg-red-950 border-l-4 border-red-500';
      case 'success': return 'text-green-300 bg-green-950 border-l-4 border-green-500';
      case 'navigation': return 'text-cyan-300 bg-cyan-950 border-l-4 border-cyan-500';
      default: return 'text-zinc-300 bg-zinc-900';
    }
  };

  const getPrefix = (type: TranscriptEntry['type']) => {
    switch (type) {
      case 'user': return '> YOU';
      case 'system': return '⚡ AI';
      case 'warning': return '⚠ WARN';
      case 'success': return '✓ LOCKED';
      case 'navigation': return '→ NAV';
      default: return '·';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 min-h-0">
      {entries.length === 0 && !interimText && (
        <div className="flex items-center justify-center h-full">
          <p className="text-zinc-600 font-mono text-sm text-center">
            TAP THE CIRCLE AND START BARKING COMMANDS
          </p>
        </div>
      )}
      {entries.map((entry) => (
        <div key={entry.id} className={`rounded px-3 py-2 ${getEntryStyle(entry.type)}`}>
          <div className="flex items-start gap-2">
            <span className="font-black text-xs opacity-60 shrink-0 mt-0.5">
              {getPrefix(entry.type)}
            </span>
            <p className="font-mono text-sm leading-relaxed">{entry.text}</p>
          </div>
        </div>
      ))}
      {interimText && (
        <div className="rounded px-3 py-2 bg-zinc-800 border-l-4 border-orange-500 animate-pulse">
          <div className="flex items-start gap-2">
            <span className="font-black text-xs opacity-60 shrink-0 mt-0.5 text-orange-400">HEARING</span>
            <p className="font-mono text-sm text-orange-300 italic">{interimText}...</p>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
