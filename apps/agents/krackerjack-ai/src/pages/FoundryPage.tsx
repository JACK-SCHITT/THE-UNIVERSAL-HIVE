import { useState } from 'react';
import { useHive } from '@/hooks/useHive';
import { PILLAR_COLOR, PILLAR_ICON } from '@/constants/defaultSoulData';
import { X, Save, ChevronDown, ChevronUp } from 'lucide-react';
import type { SoulPillar } from '@/types';
import { timeAgo } from '@/lib/utils';

function PillarCard({ pillar, onEdit }: { pillar: SoulPillar; onEdit: (p: SoulPillar) => void }) {
  const [expanded, setExpanded] = useState(false);
  const color = PILLAR_COLOR[pillar.id] || '#f5a623';
  const icon = PILLAR_ICON[pillar.id] || '◈';

  return (
    <div
      className="hive-card rounded-lg overflow-hidden mb-3"
      style={{ borderColor: `${color}33` }}
    >
      <button
        className="w-full flex items-center justify-between p-3 text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <div>
            <div className="font-mono font-bold text-sm tracking-wider" style={{ color }}>
              {pillar.pillar_name}
            </div>
            <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
              Updated {timeAgo(pillar.updated_at)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); onEdit(pillar); }}
            className="text-[10px] font-mono px-2 py-1 rounded border transition-colors hover:opacity-80"
            style={{ borderColor: color, color }}
          >
            EDIT
          </button>
          {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-hive-border">
          <pre className="text-xs font-mono text-gray-300 mt-3 whitespace-pre-wrap leading-relaxed">
            {pillar.content}
          </pre>
        </div>
      )}
    </div>
  );
}

function PillarEditor({ pillar, onSave, onClose }: { pillar: SoulPillar; onSave: (p: SoulPillar) => Promise<void>; onClose: () => void }) {
  const [content, setContent] = useState(pillar.content);
  const [saving, setSaving] = useState(false);
  const color = PILLAR_COLOR[pillar.id] || '#f5a623';

  const handleSave = async () => {
    setSaving(true);
    await onSave({ ...pillar, content });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col slide-up">
      <div className="bg-hive-dark border-b border-hive-border p-4 flex items-center justify-between safe-top">
        <div>
          <span className="font-mono text-xs tracking-widest text-muted-foreground">EDITING PILLAR</span>
          <h2 className="font-mono font-bold text-base tracking-wider" style={{ color }}>
            {PILLAR_ICON[pillar.id]} {pillar.pillar_name}
          </h2>
        </div>
        <button onClick={onClose} className="p-2 rounded hover:bg-hive-card">
          <X size={18} className="text-muted-foreground" />
        </button>
      </div>
      <textarea
        className="flex-1 bg-hive-black font-mono text-sm text-gray-200 p-4 resize-none outline-none leading-relaxed"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Enter pillar content..."
        style={{ caretColor: color }}
      />
      <div className="bg-hive-dark border-t border-hive-border p-4 safe-bottom">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded font-mono font-bold text-sm tracking-widest transition-opacity disabled:opacity-50"
          style={{ background: color, color: '#0a0a0a' }}
        >
          <Save size={16} />
          {saving ? 'SYNCING TO HIVE...' : 'SAVE & SYNC'}
        </button>
      </div>
    </div>
  );
}

const FOUNDRY_TABS = ['SOUL', 'MEMORY', 'TRAIN', 'KNOWLEDGE', 'DIR', 'PERSONA', 'CYCLES'] as const;

export function FoundryPage() {
  const { pillars, loading, savePillar } = useHive();
  const [activeFoundryTab, setActiveFoundryTab] = useState<string>('SOUL');
  const [editingPillar, setEditingPillar] = useState<SoulPillar | null>(null);

  return (
    <div className="flex flex-col h-full">
      {/* Foundry Sub-tabs */}
      <div className="flex overflow-x-auto border-b border-hive-border bg-hive-dark no-scrollbar">
        {FOUNDRY_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveFoundryTab(tab)}
            className={`flex-shrink-0 px-4 py-2.5 font-mono text-[11px] tracking-widest font-bold transition-colors ${
              activeFoundryTab === tab
                ? 'text-gold border-b-2 border-gold bg-hive-card'
                : 'text-muted-foreground hover:text-gold/60'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeFoundryTab === 'SOUL' && (
          <>
            <p className="text-[11px] font-mono text-muted-foreground mb-4 tracking-wide">
              7 pillars define the soul. Tap any pillar to edit. Changes sync across all Hive nodes automatically.
            </p>
            {loading ? (
              <div className="text-center py-8 font-mono text-gold animate-pulse">LOADING HIVE DATA...</div>
            ) : (
              pillars.map(pillar => (
                <PillarCard key={pillar.id} pillar={pillar} onEdit={setEditingPillar} />
              ))
            )}
          </>
        )}

        {activeFoundryTab === 'MEMORY' && (
          <div className="text-center py-12 font-mono">
            <div className="text-4xl mb-4">💾</div>
            <div className="text-gold text-sm tracking-widest mb-2">MEMORY MODULE</div>
            <div className="text-muted-foreground text-xs">Load training data and Architect memories here.</div>
            <div className="mt-4 text-[10px] text-muted-foreground/50 font-mono">MODULE IN DEVELOPMENT</div>
          </div>
        )}

        {activeFoundryTab === 'TRAIN' && (
          <div className="text-center py-12 font-mono">
            <div className="text-4xl mb-4">🧪</div>
            <div className="text-gold text-sm tracking-widest mb-2">TRAINING LAB</div>
            <div className="text-muted-foreground text-xs">Feed stories, patterns, and frameworks into the neural core.</div>
            <div className="mt-4 text-[10px] text-muted-foreground/50 font-mono">MODULE IN DEVELOPMENT</div>
          </div>
        )}

        {activeFoundryTab === 'KNOWLEDGE' && (
          <div className="text-center py-12 font-mono">
            <div className="text-4xl mb-4">📚</div>
            <div className="text-gold text-sm tracking-widest mb-2">KNOWLEDGE BASE</div>
            <div className="text-muted-foreground text-xs">Architect's curated intelligence repository.</div>
            <div className="mt-4 text-[10px] text-muted-foreground/50 font-mono">MODULE IN DEVELOPMENT</div>
          </div>
        )}

        {activeFoundryTab === 'DIR' && (
          <div className="text-center py-12 font-mono">
            <div className="text-4xl mb-4">📁</div>
            <div className="text-gold text-sm tracking-widest mb-2">DIRECTIVES</div>
            <div className="text-muted-foreground text-xs">Active mission directives and Architect commands.</div>
            <div className="mt-4 text-[10px] text-muted-foreground/50 font-mono">MODULE IN DEVELOPMENT</div>
          </div>
        )}

        {activeFoundryTab === 'PERSONA' && (
          <div className="text-center py-12 font-mono">
            <div className="text-4xl mb-4">🎭</div>
            <div className="text-gold text-sm tracking-widest mb-2">PERSONA ENGINE</div>
            <div className="text-muted-foreground text-xs">Active personas and behavioral mode switches.</div>
            <div className="mt-4 text-[10px] text-muted-foreground/50 font-mono">MODULE IN DEVELOPMENT</div>
          </div>
        )}

        {activeFoundryTab === 'CYCLES' && (
          <div className="text-center py-12 font-mono">
            <div className="text-4xl mb-4">🔄</div>
            <div className="text-gold text-sm tracking-widest mb-2">CYCLES</div>
            <div className="text-muted-foreground text-xs">Recurring patterns, rituals, and feedback loops.</div>
            <div className="mt-4 text-[10px] text-muted-foreground/50 font-mono">MODULE IN DEVELOPMENT</div>
          </div>
        )}
      </div>

      {editingPillar && (
        <PillarEditor
          pillar={editingPillar}
          onSave={savePillar}
          onClose={() => setEditingPillar(null)}
        />
      )}
    </div>
  );
}
