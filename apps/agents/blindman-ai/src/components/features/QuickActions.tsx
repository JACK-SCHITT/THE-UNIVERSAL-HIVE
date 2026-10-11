interface QuickAction {
  label: string;
  shortLabel: string;
  command: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'WHERE AM I', shortLabel: 'LOCATE', command: 'where am I', color: 'border-cyan-500 text-cyan-400' },
  { label: 'LIST SPOTS', shortLabel: 'SPOTS', command: 'list my spots', color: 'border-yellow-500 text-yellow-400' },
  { label: 'DESCRIBE SCENE', shortLabel: 'SCENE', command: 'describe the scene', color: 'border-purple-500 text-purple-400' },
  { label: 'EMERGENCY', shortLabel: 'SOS', command: 'emergency', color: 'border-red-500 text-red-400' },
];

interface QuickActionsProps {
  onCommand: (command: string) => void;
}

export function QuickActions({ onCommand }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-4 gap-2 px-4 pb-2">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.command}
          onClick={() => onCommand(action.command)}
          className={`border ${action.color} bg-zinc-900 rounded-lg py-3 px-1 flex flex-col items-center gap-1 active:scale-95 transition-transform min-h-[64px]`}
          aria-label={action.label}
        >
          <span className="font-black text-xs text-center leading-tight">{action.shortLabel}</span>
        </button>
      ))}
    </div>
  );
}
