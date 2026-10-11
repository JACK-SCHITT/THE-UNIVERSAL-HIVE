import { useState } from 'react';
import { useHive } from '@/hooks/useHive';
import { PILLAR_COLOR, PILLAR_ICON, HIVE_NODES } from '@/constants/defaultSoulData';
import { Save, RefreshCw, CheckCircle } from 'lucide-react';
import type { SoulPillar } from '@/types';
import { timeAgo } from '@/lib/utils';

export function DnaPage() {
  const { pillars, loading, savePillar, syncing } = useHive();
  const [selected, setSelected] = useState<SoulPillar | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saved, setSaved] = useState('');

  const selectPillar = (p: SoulPillar) => {
    setSelected(p);
    setEditContent(p.content);
    setSaved('');
  };

  const handleSave = async () => {
    if (!selected) return;
    await savePillar({ ...selected, content: editContent });
    setSaved(selected.id);
    setTimeout(() => setSaved(''), 2000);
  };

  if (selected) {
    const color = PILLAR_COLOR[selected.id] || '#f5a623';
    const icon = PILLAR_ICON[selected.id] || '◈';
    return (
      <div className="flex flex-col h-full min-h-[calc(100vh-130px)]">
        <div className="flex items-center justify-between p-4 border-b border-hive-border bg-hive-dark">
          <div>
            <button onClick={() => setSelected(null)} className="font-mono text-[10px] text-muted-foreground hover:text-gold transition-colors mb-1">
              ← BACK TO DNA
            </button>
            <h3 className="font-mono font-bold text-base tracking-wider" style={{ color }}>
              {icon} {selected.pillar_name}
            </h3>
          </div>
          <button
            onClick={handleSave}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-2 rounded font-mono text-xs font-bold tracking-wider transition-all disabled:opacity-50"
            style={{ background: color, color: '#0a0a0a' }}
          >
            {syncing ? <RefreshCw size={12} className="animate-spin" /> : saved === selected.id ? <CheckCircle size={12} /> : <Save size={12} />}
            {syncing ? 'SYNC' : saved === selected.id ? 'SAVED' : 'SAVE'}
          </button>
        </div>

        <textarea
          className="flex-1 bg-hive-black font-mono text-sm text-gray-200 p-4 resize-none outline-none leading-relaxed"
          value={editContent}
          onChange={e => setEditContent(e.target.value)}
          placeholder="Define this pillar..."
          style={{ caretColor: color }}
        />

        <div className="p-3 bg-hive-dark border-t border-hive-border">
          <p className="font-mono text-[10px] text-muted-foreground text-center">
            Saved content injects into every Hive response automatically · Syncs cross-device
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h2 className="font-mono text-sm font-bold text-gold tracking-widest">ARCHITECT DNA</h2>
        <p className="font-mono text-[10px] text-muted-foreground mt-1">
          Edit any pillar. Changes sync across all Hive nodes and devices instantly.
        </p>
      </div>

      {/* Hive Nodes Status */}
      <div className="hive-card rounded-lg p-4">
        <div className="font-mono text-[10px] text-gold tracking-widest mb-3">ACTIVE NODES</div>
        <div className="grid grid-cols-2 gap-2">
          {HIVE_NODES.map(node => (
            <div key={node.id} className="flex items-center gap-2 p-2 rounded" style={{ background: `${node.color}08`, borderWidth: 1, borderColor: `${node.color}22` }}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${node.status === 'ACTIVE' ? 'pulse-gold' : ''}`} style={{ background: node.color }} />
              <div className="min-w-0">
                <div className="font-mono text-[9px] font-bold truncate" style={{ color: node.color }}>{node.name}</div>
                <div className="font-mono text-[8px] text-muted-foreground">{node.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pillars */}
      <div className="font-mono text-[10px] text-gold tracking-widest">SOUL PILLARS — TAP TO EDIT</div>

      {loading ? (
        <div className="text-center py-8 font-mono text-gold text-xs animate-pulse">LOADING DNA...</div>
      ) : (
        <div className="space-y-2">
          {pillars.map(pillar => {
            const color = PILLAR_COLOR[pillar.id] || '#f5a623';
            const icon = PILLAR_ICON[pillar.id] || '◈';
            const lines = pillar.content.split('\n').filter(Boolean).length;
            return (
              <button
                key={pillar.id}
                onClick={() => selectPillar(pillar)}
                className="w-full hive-card rounded-lg p-3 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ borderColor: `${color}33` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <div className="font-mono font-bold text-xs tracking-wider" style={{ color }}>
                        {pillar.pillar_name}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                        {lines} lines · {timeAgo(pillar.updated_at)}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono text-[10px] px-2.5 py-1 rounded border transition-colors" style={{ borderColor: color, color }}>
                    EDIT →
                  </div>
                </div>
                <div className="mt-2 font-mono text-[10px] text-muted-foreground leading-relaxed line-clamp-1 pl-10">
                  {pillar.content.split('\n')[0]}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Cross-device sync note */}
      <div className="flex items-center gap-2 p-3 rounded-lg border border-terminal-green/20 bg-terminal-green/5">
        <span className="w-2 h-2 rounded-full bg-terminal-green pulse-gold flex-shrink-0" />
        <p className="font-mono text-[10px] text-terminal-green/80">
          Cross-device sync active. Edit here → updates on your iPhone app automatically.
        </p>
      </div>
    </div>
  );
}
