import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Zap, Brain, Cpu } from 'lucide-react';
import type { GeminiModel } from '@/types';
import { cn, MODEL_LABELS, MODEL_DESCRIPTIONS } from '@/lib/utils';

const MODEL_ICONS: Record<string, React.ReactNode> = {
  'gemini-2.5-pro': <Brain className="w-3.5 h-3.5 text-purple-400" />,
  'gemini-2.5-flash': <Zap className="w-3.5 h-3.5 text-yellow-400" />,
  'gemini-2.0-flash': <Zap className="w-3.5 h-3.5 text-blue-400" />,
  'gemini-1.5-pro': <Brain className="w-3.5 h-3.5 text-pink-400" />,
  'gemini-1.5-flash': <Cpu className="w-3.5 h-3.5 text-green-400" />,
};

const MODELS: GeminiModel[] = [
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
];

interface ModelSelectorProps {
  value: GeminiModel;
  onChange: (model: GeminiModel) => void;
  className?: string;
  compact?: boolean;
}

export default function ModelSelector({ value, onChange, className }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-700/60 border border-surface-400/40 hover:border-brand-500/40 transition-colors text-sm"
      >
        {MODEL_ICONS[value]}
        <span className="font-mono text-xs text-gray-300">{MODEL_LABELS[value]}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-gray-500 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-72 glass rounded-xl shadow-2xl border border-surface-400/40 py-1 z-50 animate-fade-in">
          {MODELS.map(m => (
            <button
              key={m}
              onClick={() => { onChange(m); setOpen(false); }}
              className={cn(
                'w-full flex items-start gap-3 px-3 py-2.5 hover:bg-surface-600/60 transition-colors',
                m === value && 'bg-brand-500/10'
              )}
            >
              <div className="mt-0.5">{MODEL_ICONS[m]}</div>
              <div className="text-left">
                <div className={cn('text-sm font-medium font-mono', m === value ? 'text-brand-300' : 'text-gray-200')}>
                  {MODEL_LABELS[m]}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{MODEL_DESCRIPTIONS[m]}</div>
              </div>
              {m === value && (
                <div className="ml-auto mt-1 w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
