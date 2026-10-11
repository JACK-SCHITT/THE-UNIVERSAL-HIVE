import { useHive } from '@/hooks/useHive';
import type { NavTab } from '@/types';

const NAV_ITEMS: { id: NavTab; label: string; icon: string }[] = [
  { id: 'foundry',   label: 'FOUNDRY',  icon: '⚡' },
  { id: 'hunter',   label: 'HUNTER',   icon: '🎯' },
  { id: 'chat',     label: 'CHAT',     icon: '💬' },
  { id: 'dna',      label: 'DNA',      icon: '🧬' },
  { id: 'analytics',label: 'INTEL',    icon: '📊' },
  { id: 'forge',    label: 'FORGE',    icon: '⚔️' },
  { id: 'bot',      label: 'BOT',      icon: '📡' },
  { id: 'device',   label: 'DEVICE',   icon: '🌐' },
  { id: 'search',   label: 'SEARCH',   icon: '🔍' },
  { id: 'terminal', label: 'TERM',     icon: '▶' },
  { id: 'config',   label: 'CONFIG',   icon: '⚙' },
];

export function BottomNav() {
  const { activeTab, setActiveTab } = useHive();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-hive-dark border-t border-hive-border safe-bottom">
      <div className="flex overflow-x-auto no-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-shrink-0 flex flex-col items-center pt-2 pb-1 px-3 transition-all duration-200 min-h-[52px] relative ${
                isActive ? 'bg-hive-card' : 'hover:bg-hive-muted'
              }`}
              style={{ minWidth: 56 }}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gold rounded-b-full" />
              )}
              <span className="text-base leading-none mb-0.5">{item.icon}</span>
              <span className={`text-[7px] font-mono tracking-wider leading-none whitespace-nowrap ${
                isActive ? 'text-gold font-bold' : 'text-muted-foreground'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
