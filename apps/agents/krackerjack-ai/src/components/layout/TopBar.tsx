import { useHive } from '@/hooks/useHive';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';

export function TopBar() {
  const { syncing, lastSync, syncNow, pillars } = useHive();

  const stats = [
    { label: 'MEM', value: pillars.length },
    { label: 'TRAIN', value: 0 },
    { label: 'KB', value: 0 },
    { label: 'DIR', value: 0 },
  ];

  return (
    <div className="sticky top-0 z-50 bg-hive-black border-b border-hive-border safe-top">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div>
          <h1 className="text-gold font-mono text-lg font-bold tracking-widest gold-glow leading-none">
            KRACKERJACK AI
          </h1>
          <p className="text-[10px] font-mono tracking-widest mt-0.5" style={{ color: '#555' }}>
            IDENTITY COMMAND CENTER
            <span className="ml-2 text-terminal-green green-glow pulse-gold">· TRAINING ACTIVE</span>
          </p>
        </div>
        <button
          onClick={syncNow}
          disabled={syncing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-gold/30 hover:border-gold/60 transition-colors"
        >
          {syncing ? (
            <RefreshCw size={12} className="text-gold animate-spin" />
          ) : lastSync ? (
            <Wifi size={12} className="text-terminal-green" />
          ) : (
            <WifiOff size={12} className="text-red-500" />
          )}
          <span className="text-[10px] font-mono text-gold/60">
            {syncing ? 'SYNC...' : lastSync ? lastSync : 'OFFLINE'}
          </span>
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 border-t border-hive-border">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center py-2 border-r border-hive-border last:border-r-0">
            <span className="text-lg font-mono font-bold text-gold leading-none">{stat.value}</span>
            <span className="text-[9px] font-mono tracking-widest mt-0.5" style={{ color: '#555' }}>{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
