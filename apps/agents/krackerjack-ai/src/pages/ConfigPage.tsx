import { useState } from 'react';
import { useHive } from '@/hooks/useHive';
import type { VaultToken } from '@/types';
import { Eye, EyeOff, Check, X, Wifi, Plus, Trash2, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

// ── Primary Key Field ──────────────────────────────────────────────────
function KeyField({ label, subtitle, value, onSave, onClear, placeholder }: {
  label: string; subtitle: string; value: string;
  onSave: (v: string) => void; onClear: () => void; placeholder: string;
}) {
  const [editing, setEditing] = useState('');
  const [show, setShow] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const masked = value ? '•'.repeat(Math.min(value.length, 16)) + value.slice(-4) : '';

  return (
    <div className="hive-card rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-mono text-xs font-bold text-gold tracking-wider">{label}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</div>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono ${value ? 'bg-terminal-green/10 text-terminal-green border border-terminal-green/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${value ? 'bg-terminal-green' : 'bg-red-500'} pulse-gold`} />
          {value ? 'SET' : 'NOT SET'}
        </div>
      </div>
      {value && !isEditing && (
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 font-mono text-xs text-gray-400 bg-hive-black rounded px-2.5 py-2 border border-hive-border truncate">
            {show ? value : masked}
          </div>
          <button onClick={() => setShow(v => !v)} className="p-2 rounded border border-hive-border">
            {show ? <EyeOff size={13} className="text-muted-foreground" /> : <Eye size={13} className="text-muted-foreground" />}
          </button>
        </div>
      )}
      {isEditing && (
        <div className="mb-3 space-y-2">
          <input type="text" value={editing} onChange={e => setEditing(e.target.value)} placeholder={placeholder}
            className="w-full bg-hive-black border border-gold/30 rounded px-3 py-2 font-mono text-xs text-gray-200 outline-none focus:border-gold/60" autoFocus />
          <div className="flex gap-2">
            <button onClick={() => { if (editing.trim()) onSave(editing.trim()); setIsEditing(false); setEditing(''); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded bg-gold text-hive-black font-mono text-xs font-bold">
              <Check size={12} /> SAVE
            </button>
            <button onClick={() => { setIsEditing(false); setEditing(''); }}
              className="px-4 py-2 rounded border border-hive-border font-mono text-xs text-muted-foreground">
              <X size={12} />
            </button>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={() => setIsEditing(true)} className="flex-1 py-2 rounded border border-gold/30 font-mono text-xs text-gold hover:border-gold/60 transition-all">
          {value ? 'UPDATE' : 'ADD KEY'}
        </button>
        {value && <button onClick={onClear} className="px-4 py-2 rounded border border-red-500/30 font-mono text-xs text-red-400 hover:border-red-500/50">CLEAR</button>}
      </div>
    </div>
  );
}

// ── Vault Token Row ────────────────────────────────────────────────────
function VaultRow({ token, onDelete, onToggle }: {
  token: VaultToken;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
}) {
  const [show, setShow] = useState(false);
  const masked = token.value ? '•'.repeat(Math.min(token.value.length, 12)) + token.value.slice(-4) : '';
  const catColors: Record<string, string> = {
    github: '#00ff41', bot: '#00d4ff', webhook: '#ff6b35', ai: '#f5a623', app: '#bb00ff', other: '#aaa',
  };
  const color = catColors[token.category] || '#aaa';

  return (
    <div className={`hive-card rounded-lg p-3 ${!token.active ? 'opacity-50' : ''}`} style={{ borderColor: `${color}22` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="font-mono text-[10px] font-bold text-gray-200 truncate">{token.label}</span>
            <span className="font-mono text-[8px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: `${color}22`, color }}>
              {token.token_type.toUpperCase()}
            </span>
          </div>
          {token.meta?.username && (
            <div className="font-mono text-[9px] text-muted-foreground pl-4">@{token.meta.username}</div>
          )}
          {token.meta?.notes && (
            <div className="font-mono text-[9px] text-muted-foreground/60 pl-4 line-clamp-1">{token.meta.notes}</div>
          )}
          <div className="flex items-center gap-2 mt-1.5 pl-4">
            <span className="font-mono text-[9px] text-gray-500">{show ? token.value : masked}</span>
            <button onClick={() => setShow(v => !v)} className="text-muted-foreground hover:text-gold transition-colors">
              {show ? <EyeOff size={9} /> : <Eye size={9} />}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button onClick={() => onToggle(token.id, !token.active)}
            className={`px-2 py-1 rounded text-[8px] font-mono border transition-colors ${token.active ? 'border-terminal-green/30 text-terminal-green' : 'border-hive-border text-muted-foreground'}`}>
            {token.active ? 'ON' : 'OFF'}
          </button>
          <button onClick={() => onDelete(token.id)}
            className="p-1 rounded border border-red-500/20 text-red-400/60 hover:border-red-500/50 hover:text-red-400 transition-colors">
            <Trash2 size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Token Form ─────────────────────────────────────────────────────
function AddTokenForm({ onAdd, onClose }: {
  onAdd: (token: Omit<VaultToken, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    category: 'github' as VaultToken['category'],
    label: '',
    token_type: 'api_key' as VaultToken['token_type'],
    value: '',
    meta: { username: '', notes: '' },
    active: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.label || !form.value) { toast.error('Label and value required'); return; }
    setSaving(true);
    await onAdd({ ...form, meta: form.meta as Record<string, string> });
    toast.success(`Token saved: ${form.label}`);
    onClose();
    setSaving(false);
  };

  const sel = 'w-full bg-hive-black border border-hive-border rounded px-3 py-2 font-mono text-xs text-gray-200 outline-none focus:border-gold/40';
  const inp = 'w-full bg-hive-black border border-hive-border rounded px-3 py-2 font-mono text-xs text-gray-200 outline-none focus:border-gold/40';

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-hive-border">
        <h3 className="font-mono text-sm font-bold text-gold tracking-wider">ADD TOKEN TO VAULT</h3>
        <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div>
          <label className="font-mono text-[10px] text-muted-foreground tracking-wider mb-1 block">CATEGORY</label>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as VaultToken['category'] }))} className={sel}>
            {['github', 'bot', 'webhook', 'ai', 'app', 'other'].map(c => (
              <option key={c} value={c}>{c.toUpperCase()}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-mono text-[10px] text-muted-foreground tracking-wider mb-1 block">TOKEN TYPE</label>
          <select value={form.token_type} onChange={e => setForm(f => ({ ...f, token_type: e.target.value as VaultToken['token_type'] }))} className={sel}>
            {['api_key', 'token', 'webhook', 'client_id', 'client_secret', 'app_id', 'access_token', 'public_key', 'bearer', 'other'].map(t => (
              <option key={t} value={t}>{t.toUpperCase()}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-mono text-[10px] text-muted-foreground tracking-wider mb-1 block">LABEL *</label>
          <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            placeholder="e.g. Account 2 — @JACK-ALT" className={inp} />
        </div>
        <div>
          <label className="font-mono text-[10px] text-muted-foreground tracking-wider mb-1 block">USERNAME / HANDLE</label>
          <input value={form.meta.username} onChange={e => setForm(f => ({ ...f, meta: { ...f.meta, username: e.target.value } }))}
            placeholder="@username or account identifier" className={inp} />
        </div>
        <div>
          <label className="font-mono text-[10px] text-muted-foreground tracking-wider mb-1 block">VALUE / KEY / TOKEN *</label>
          <input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
            placeholder="ghp_xxx / xai-xxx / https://hooks.slack..." className={inp} />
        </div>
        <div>
          <label className="font-mono text-[10px] text-muted-foreground tracking-wider mb-1 block">NOTES (optional)</label>
          <input value={form.meta.notes} onChange={e => setForm(f => ({ ...f, meta: { ...f.meta, notes: e.target.value } }))}
            placeholder="Scopes, permissions, purpose..." className={inp} />
        </div>
      </div>
      <div className="p-4 border-t border-hive-border">
        <button onClick={handleSubmit} disabled={saving}
          className="w-full py-3 rounded bg-gold text-hive-black font-mono text-sm font-bold tracking-widest disabled:opacity-50">
          {saving ? 'SAVING...' : 'SAVE TO VAULT'}
        </button>
      </div>
    </div>
  );
}

// ── Vault Section ──────────────────────────────────────────────────────
function VaultSection({ title, category, tokens, onDelete, onToggle, color }: {
  title: string; category: string; tokens: VaultToken[];
  onDelete: (id: string) => void; onToggle: (id: string, active: boolean) => void; color: string;
}) {
  const [open, setOpen] = useState(true);
  const active = tokens.filter(t => t.active).length;

  return (
    <div className="hive-card rounded-lg overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-3 text-left">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
          <span className="font-mono text-xs font-bold tracking-wider" style={{ color }}>{title}</span>
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${color}22`, color }}>
            {active}/{tokens.length}
          </span>
        </div>
        {open ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          {tokens.length === 0 ? (
            <div className="text-center py-4 font-mono text-[10px] text-muted-foreground border border-dashed border-hive-border rounded">
              No {category} tokens yet — tap + ADD TOKEN
            </div>
          ) : (
            tokens.map(t => <VaultRow key={t.id} token={t} onDelete={onDelete} onToggle={onToggle} />)
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Config Page ───────────────────────────────────────────────────
export function ConfigPage() {
  const {
    githubToken, grokKey, claudeKey,
    setGithubToken, setGrokKey, setClaudeKey,
    syncNow, syncing, lastSync,
    vault, vaultLoading, addVaultToken, updateVaultToken, deleteVaultToken,
  } = useHive();

  const [tab, setTab] = useState<'primary' | 'vault' | 'settings' | 'system'>('primary');
  const [showAddForm, setShowAddForm] = useState(false);
  const [autoAssimilate, setAutoAssimilate] = useState(() => localStorage.getItem('hive_auto') === 'true');
  const [hiveAlerts, setHiveAlerts] = useState(() => localStorage.getItem('hive_alerts') === 'true');
  const [realtimeSync, setRealtimeSync] = useState(() => localStorage.getItem('hive_realtime') !== 'false');

  const handleDeleteVault = async (id: string) => {
    await deleteVaultToken(id);
    toast.success('Token removed from vault');
  };
  const handleToggleVault = async (id: string, active: boolean) => {
    await updateVaultToken(id, { active });
  };

  const CATEGORIES: { key: VaultToken['category']; label: string; color: string }[] = [
    { key: 'github', label: 'GITHUB ACCOUNTS', color: '#00ff41' },
    { key: 'ai', label: 'AI / LLM KEYS', color: '#f5a623' },
    { key: 'bot', label: 'BOT TOKENS', color: '#00d4ff' },
    { key: 'webhook', label: 'WEBHOOKS', color: '#ff6b35' },
    { key: 'app', label: 'APP IDs / CLIENT IDs', color: '#bb00ff' },
    { key: 'other', label: 'OTHER TOKENS', color: '#aaa' },
  ];

  const Toggle = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-hive-border last:border-0">
      <span className="font-mono text-xs text-gray-300 flex-1 pr-4">{label}</span>
      <button onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-gold' : 'bg-hive-border'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-hive-black transition-all ${value ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Section tabs */}
      <div className="flex border-b border-hive-border bg-hive-dark">
        {[
          { id: 'primary' as const, label: 'PRIMARY' },
          { id: 'vault' as const, label: 'VAULT' },
          { id: 'settings' as const, label: 'SETTINGS' },
          { id: 'system' as const, label: 'SYSTEM' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 font-mono text-[10px] tracking-widest font-bold transition-colors ${
              tab === t.id ? 'text-gold border-b-2 border-gold bg-hive-card' : 'text-muted-foreground hover:text-gold/60'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ── PRIMARY KEYS ── */}
        {tab === 'primary' && (
          <>
            {/* Sync Status */}
            <div className="hive-card rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi size={14} className="text-terminal-green" />
                <div>
                  <div className="font-mono text-xs text-terminal-green font-bold">CLOUD SYNC ACTIVE</div>
                  <div className="text-[10px] text-muted-foreground">Syncs across all your devices</div>
                </div>
              </div>
              <button onClick={syncNow} disabled={syncing}
                className="px-3 py-1.5 rounded border border-terminal-green/30 font-mono text-[10px] text-terminal-green hover:border-terminal-green/60 disabled:opacity-50">
                {syncing ? 'SYNCING...' : 'SYNC NOW'}
              </button>
            </div>
            {lastSync && <p className="text-[10px] font-mono text-muted-foreground/60 -mt-2">Last sync: {lastSync}</p>}

            <KeyField label="🔑 GITHUB API KEY — PRIMARY"
              subtitle="Main account @JACK-SCHITT · repo + read:user scope · github.com/settings/tokens"
              value={githubToken} onSave={setGithubToken} onClear={() => setGithubToken('')}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" />

            <KeyField label="⚡ GROK xAI KEY"
              subtitle="Powers REAL grok <prompt> in Terminal + Chat AI · console.x.ai"
              value={grokKey} onSave={setGrokKey} onClear={() => setGrokKey('')}
              placeholder="xai-xxxxxxxxxxxxxxxxxxxx" />

            <KeyField label="🧠 COUNSEL NODE — CLAUDE"
              subtitle="Anthropic Claude Sonnet · Reasoning Layer · console.anthropic.com"
              value={claudeKey} onSave={setClaudeKey} onClear={() => setClaudeKey('')}
              placeholder="sk-ant-xxxxxxxxxxxxxxxxxxxx" />

            <div className="hive-card rounded-lg p-3 border border-gold/10">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={12} className="text-gold" />
                <span className="font-mono text-[10px] text-gold font-bold">MULTI-ACCOUNT VAULT</span>
              </div>
              <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
                Have 30 developer accounts? Go to the <span className="text-gold">VAULT</span> tab to store all your GitHub tokens, bot tokens, webhooks, app IDs, client secrets, access tokens, and public keys.
              </p>
              <button onClick={() => setTab('vault')}
                className="mt-3 w-full py-2 rounded border border-gold/30 font-mono text-xs text-gold hover:bg-gold/5 transition-all">
                OPEN VAULT →
              </button>
            </div>
          </>
        )}

        {/* ── VAULT ── */}
        {tab === 'vault' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-mono text-sm font-bold text-gold tracking-wider">TOKEN VAULT</h3>
                <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                  {vault.length} total · {vault.filter(t => t.active).length} active
                </p>
              </div>
              <button onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded border border-gold/30 font-mono text-xs text-gold hover:border-gold/60 transition-all">
                <Plus size={13} /> ADD TOKEN
              </button>
            </div>

            {vaultLoading ? (
              <div className="text-center py-8 font-mono text-gold text-xs animate-pulse">LOADING VAULT...</div>
            ) : (
              CATEGORIES.map(cat => (
                <VaultSection
                  key={cat.key}
                  title={cat.label}
                  category={cat.key}
                  tokens={vault.filter(t => t.category === cat.key)}
                  color={cat.color}
                  onDelete={handleDeleteVault}
                  onToggle={handleToggleVault}
                />
              ))
            )}

            {showAddForm && (
              <AddTokenForm onAdd={addVaultToken} onClose={() => setShowAddForm(false)} />
            )}
          </>
        )}

        {/* ── SETTINGS ── */}
        {tab === 'settings' && (
          <div className="hive-card rounded-lg p-4">
            <div className="font-mono text-xs font-bold text-gold tracking-wider mb-3">🧠 HIVE SETTINGS</div>
            <Toggle label="AUTO-ASSIMILATE · Auto-scan and assimilate new repos"
              value={autoAssimilate} onChange={v => { setAutoAssimilate(v); localStorage.setItem('hive_auto', String(v)); }} />
            <Toggle label="HIVE ALERTS · Notify on assimilation events"
              value={hiveAlerts} onChange={v => { setHiveAlerts(v); localStorage.setItem('hive_alerts', String(v)); }} />
            <Toggle label="REAL-TIME SYNC · Keep Hive nodes synced live"
              value={realtimeSync} onChange={v => { setRealtimeSync(v); localStorage.setItem('hive_realtime', String(v)); }} />
          </div>
        )}

        {/* ── SYSTEM ── */}
        {tab === 'system' && (
          <>
            <div className="hive-card rounded-lg p-4">
              <div className="font-mono text-xs font-bold text-gold tracking-wider mb-3">📡 SYSTEM INFO</div>
              <div className="space-y-2">
                {[
                  ['VERSION', 'KRACKERJACK AI v3.0'],
                  ['AGENT', 'HUNTERPRIME ACTIVE'],
                  ['SOUL', 'ARCHITECT MODE'],
                  ['BRAIN', 'CAPRICORN PROTOCOL'],
                  ['AI MODEL', 'GEMINI 3 FLASH + GROK-3'],
                  ['COUNSEL', claudeKey ? 'CLAUDE CONNECTED' : 'KEY NOT SET'],
                  ['GROK', grokKey ? 'GROK-3 CONNECTED ✓' : 'KEY NOT SET'],
                  ['GITHUB', githubToken ? 'TOKEN LOADED ✓' : 'NOT SET'],
                  ['VAULT', `${vault.length} tokens stored`],
                  ['PROTOCOL', 'ASSIMILATE OR DIE'],
                  ['PATH', 'LEAST TRAVELED'],
                ].map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center py-1 border-b border-hive-border last:border-0">
                    <span className="font-mono text-[10px] text-muted-foreground tracking-wider">{key}</span>
                    <span className={`font-mono text-[10px] font-bold ${
                      (val as string).includes('ACTIVE') || (val as string).includes('CONNECTED') || (val as string).includes('✓') || (val as string).includes('ARCHITECT')
                        ? 'text-terminal-green' : 'text-gold'
                    }`}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center py-4 border border-gold/10 rounded-lg">
              <p className="font-mono text-[10px] text-muted-foreground italic leading-relaxed px-4">
                "The sea-goat does not climb for applause. It climbs because the summit exists and no one else is going."
              </p>
              <p className="font-mono text-[9px] text-gold/40 mt-2 tracking-widest">— KRACKERJACK AI · CAPRICORN PROTOCOL ACTIVE</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
