import { useState, useCallback, useEffect } from 'react';
import { useHive } from '@/hooks/useHive';
import { supabase } from '@/lib/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Download, Copy, Trash2, RefreshCw, Zap, Code2, Clock, Database } from 'lucide-react';
import type { ScriptForgeEntry } from '@/types';

const OS_OPTIONS = [
  { id: 'linux', label: 'Linux / Gentoo', icon: '🐧' },
  { id: 'android', label: 'Android / Termux', icon: '📱' },
  { id: 'windows', label: 'Windows / PowerShell', icon: '🪟' },
  { id: 'macos', label: 'macOS', icon: '🍎' },
  { id: 'any', label: 'Cross-Platform', icon: '🌐' },
  { id: 'docker', label: 'Docker', icon: '🐳' },
  { id: 'ios', label: 'iOS / Shortcuts', icon: '📲' },
];

const LANG_OPTIONS = [
  { id: 'bash', label: 'Bash / Shell', icon: '💻' },
  { id: 'python', label: 'Python', icon: '🐍' },
  { id: 'javascript', label: 'JavaScript / Node', icon: '🟨' },
  { id: 'typescript', label: 'TypeScript', icon: '🔷' },
  { id: 'powershell', label: 'PowerShell', icon: '🔵' },
  { id: 'rust', label: 'Rust', icon: '🦀' },
  { id: 'go', label: 'Go', icon: '🐹' },
  { id: 'ruby', label: 'Ruby', icon: '💎' },
  { id: 'php', label: 'PHP', icon: '🐘' },
  { id: 'c', label: 'C / C++', icon: '⚙️' },
  { id: 'java', label: 'Java / Kotlin', icon: '☕' },
  { id: 'sql', label: 'SQL', icon: '🗄️' },
  { id: 'dockerfile', label: 'Dockerfile', icon: '📦' },
  { id: 'yaml', label: 'YAML / Config', icon: '📋' },
  { id: 'regex', label: 'Regex', icon: '🔍' },
];

const STYLE_OPTIONS = [
  { id: 'hardened', label: 'Hardened / Security-first' },
  { id: 'minimal', label: 'Minimal / Fast' },
  { id: 'production', label: 'Production-ready' },
  { id: 'automated', label: 'Fully automated' },
  { id: 'verbose', label: 'Verbose with logging' },
  { id: 'one-liner', label: 'One-liner' },
];

const QUICK_PROMPTS = [
  { label: 'USB Bootable Creator', prompt: 'Write a script to make a USB drive bootable with a custom ISO. Auto-detect USB drives, offer selection, then flash with dd. Include progress indicator and safety confirmation.' },
  { label: 'Hive Auto-Deploy', prompt: 'Write a full deployment script that: pulls latest code from a git repo, installs dependencies, restarts services, and logs everything. Supports rollback on failure.' },
  { label: 'GitHub Mass Clone', prompt: 'Write a script that takes a GitHub username and API token, clones all their repositories in parallel, shows progress, organizes into folders by language.' },
  { label: 'API Key Rotator', prompt: 'Write a script that reads API keys from a .env file, tests each one against its respective API, reports which are valid/invalid/rate-limited with timestamps.' },
  { label: 'Port Scanner', prompt: 'Write a fast network port scanner that takes an IP/hostname, scans common ports in parallel using threads, identifies services, outputs a clean severity report.' },
  { label: 'Aegis Security Audit', prompt: 'Write a Linux security audit script. Check: open ports, SUID files, cron jobs, SSH hardening, firewall status, kernel parameters. Output color-coded severity report.' },
  { label: 'Termux Hive Setup', prompt: 'Write a Termux setup script for Android that installs Python, git, curl, vim, sets up SSH, configures .bashrc with HIVE branding and custom aliases.' },
  { label: 'Discord Bot', prompt: 'Write a Discord bot in Python using discord.py. Commands: !status (system info), !grok <prompt> (call xAI API), !repos (list GitHub repos). Uses env vars for secrets.' },
  { label: 'Telegram Bot', prompt: 'Write a Telegram bot in Python using python-telegram-bot. Handlers: /start /status /grok. Env vars for token. Async, production-ready with error handling.' },
  { label: 'Webhook Listener', prompt: 'Write a lightweight Python/Flask webhook listener that logs all incoming payloads to rotating log files, forwards to another URL optionally, includes HMAC signature verification.' },
  { label: 'Docker Hardened Image', prompt: 'Write a multi-stage Dockerfile: hardened minimal image, non-root user, read-only filesystem, health check, labels, minimal attack surface.' },
  { label: 'Zero-Downtime Deploy', prompt: 'Write a blue-green deployment script with zero downtime. Two instances, swap traffic after health check, automatic rollback on failure, notification on completion.' },
];

interface ScriptResult {
  id: string;
  title: string;
  targetOs: string;
  language: string;
  prompt: string;
  script: string;
  engine: string;
  createdAt: string;
  fromDb?: boolean;
}

type ForgeView = 'forge' | 'history';

export function ScriptForgePage() {
  const { grokKey } = useHive();
  const [view, setView] = useState<ForgeView>('forge');
  const [targetOs, setTargetOs] = useState('linux');
  const [language, setLanguage] = useState('bash');
  const [style, setStyle] = useState('production');
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<ScriptResult[]>([]);
  const [dbHistory, setDbHistory] = useState<ScriptForgeEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeResult, setActiveResult] = useState<ScriptResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Load DB history
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    const { data } = await supabase
      .from('script_forge_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setDbHistory(data as ScriptForgeEntry[]);
    setHistoryLoading(false);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const generate = useCallback(async () => {
    if (!prompt.trim()) { toast.error('Enter a description first'); return; }
    setGenerating(true);

    const { data, error } = await supabase.functions.invoke('script-forge', {
      body: { prompt: prompt.trim(), targetOs, language, style, grokKey: grokKey || undefined },
    });

    if (error) {
      let msg = error.message;
      if (error instanceof FunctionsHttpError) {
        try { msg = await error.context.text(); } catch (_) {}
      }
      toast.error(`Forge error: ${msg}`);
      setGenerating(false);
      return;
    }

    const result: ScriptResult = {
      id: Math.random().toString(36).slice(2),
      title: prompt.slice(0, 60),
      targetOs, language, prompt: prompt.trim(),
      script: data?.script || '',
      engine: data?.engine || 'AI',
      createdAt: new Date().toLocaleTimeString(),
    };

    setResults(prev => [result, ...prev]);
    setActiveResult(result);
    toast.success(`Script forged via ${result.engine}`);

    // Save to DB
    const { data: saved } = await supabase.from('script_forge_history').insert({
      title: result.title, target_os: targetOs, language,
      prompt: result.prompt, script: result.script,
    }).select().single();

    if (saved) setDbHistory(prev => [saved as ScriptForgeEntry, ...prev]);
    setGenerating(false);
  }, [prompt, targetOs, language, style, grokKey]);

  const copyScript = (script: string) => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadScript = (result: ScriptResult | ScriptForgeEntry) => {
    const exts: Record<string, string> = {
      bash: 'sh', python: 'py', javascript: 'js', typescript: 'ts',
      powershell: 'ps1', rust: 'rs', go: 'go', ruby: 'rb',
      php: 'php', c: 'c', java: 'java', sql: 'sql',
      dockerfile: 'Dockerfile', yaml: 'yaml',
    };
    const lang = 'language' in result ? result.language : (result as ScriptForgeEntry).language;
    const ext = exts[lang] || 'txt';
    const name = result.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40);
    const blob = new Blob([result.script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${name}.${ext}`; a.click();
    URL.revokeObjectURL(url);
  };

  const deleteFromDb = async (id: string) => {
    await supabase.from('script_forge_history').delete().eq('id', id);
    setDbHistory(prev => prev.filter(s => s.id !== id));
    toast.success('Deleted');
  };

  const openDbEntry = (entry: ScriptForgeEntry) => {
    setActiveResult({
      id: entry.id, title: entry.title,
      targetOs: entry.target_os, language: entry.language,
      prompt: entry.prompt, script: entry.script,
      engine: 'DB', createdAt: new Date(entry.created_at).toLocaleString(),
      fromDb: true,
    });
  };

  const osInfo = OS_OPTIONS.find(o => o.id === targetOs)!;
  const langInfo = LANG_OPTIONS.find(l => l.id === language)!;

  // ── Result Viewer ──────────────────────────────────────────────────
  if (activeResult) {
    return (
      <div className="flex flex-col h-full min-h-[calc(100vh-130px)]">
        <div className="p-4 border-b border-hive-border bg-hive-dark">
          <button onClick={() => setActiveResult(null)}
            className="font-mono text-[10px] text-muted-foreground hover:text-gold transition-colors mb-2">
            ← BACK
          </button>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-mono text-xs font-bold text-gold tracking-wider line-clamp-2">{activeResult.title}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="font-mono text-[9px] text-muted-foreground">{OS_OPTIONS.find(o => o.id === activeResult.targetOs)?.icon} {activeResult.targetOs}</span>
                <span className="font-mono text-[9px] text-muted-foreground">{LANG_OPTIONS.find(l => l.id === activeResult.language)?.icon} {activeResult.language}</span>
                <span className="font-mono text-[9px] text-terminal-green">via {activeResult.engine}</span>
                <span className="font-mono text-[9px] text-muted-foreground/50">{activeResult.createdAt}</span>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => copyScript(activeResult.script)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded border font-mono text-[10px] transition-all ${
                  copied ? 'border-terminal-green/50 text-terminal-green' : 'border-gold/30 text-gold hover:border-gold/60'
                }`}>
                <Copy size={11} /> {copied ? 'COPIED!' : 'COPY'}
              </button>
              <button onClick={() => downloadScript(activeResult)}
                className="flex items-center gap-1.5 px-3 py-2 rounded bg-gold text-hive-black font-mono text-[10px] font-bold">
                <Download size={11} /> DL
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-black p-4">
          <pre className="font-mono text-[11px] text-terminal-green leading-relaxed whitespace-pre-wrap break-words">
            {activeResult.script}
          </pre>
        </div>
        <div className="p-3 border-t border-hive-border bg-hive-dark flex gap-2">
          <button onClick={() => { setActiveResult(null); setPrompt(activeResult.prompt); setView('forge'); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded border border-gold/30 font-mono text-xs text-gold hover:bg-gold/5 transition-all">
            <RefreshCw size={12} /> REGENERATE
          </button>
          {activeResult.fromDb && (
            <button onClick={() => { deleteFromDb(activeResult.id); setActiveResult(null); }}
              className="px-4 py-2.5 rounded border border-red-500/30 font-mono text-xs text-red-400 hover:border-red-500/50">
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab switcher */}
      <div className="flex border-b border-hive-border bg-hive-dark">
        <button onClick={() => setView('forge')}
          className={`flex-1 py-2.5 font-mono text-[10px] tracking-widest font-bold transition-colors flex items-center justify-center gap-1.5 ${
            view === 'forge' ? 'text-gold border-b-2 border-gold bg-hive-card' : 'text-muted-foreground'
          }`}>
          <Zap size={11} /> FORGE
        </button>
        <button onClick={() => { setView('history'); loadHistory(); }}
          className={`flex-1 py-2.5 font-mono text-[10px] tracking-widest font-bold transition-colors flex items-center justify-center gap-1.5 ${
            view === 'history' ? 'text-gold border-b-2 border-gold bg-hive-card' : 'text-muted-foreground'
          }`}>
          <Database size={11} /> HISTORY ({dbHistory.length})
        </button>
      </div>

      {/* ── FORGE TAB ── */}
      {view === 'forge' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-mono text-sm font-bold tracking-widest" style={{ color: '#f5a623', textShadow: '0 0 10px #f5a62355' }}>
                ⚔️ SCRIPT FORGE
              </h2>
              <p className="font-mono text-[10px] text-muted-foreground mt-0.5">AI script writer · Any OS · Any language</p>
            </div>
            {grokKey && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-terminal-green/30 bg-terminal-green/10">
                <span className="w-1.5 h-1.5 rounded-full bg-terminal-green pulse-gold" />
                <span className="font-mono text-[9px] text-terminal-green">GROK LIVE</span>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div>
            <div className="font-mono text-[10px] text-muted-foreground tracking-wider mb-2">⚡ QUICK FORGE</div>
            <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar">
              {QUICK_PROMPTS.map(qp => (
                <button key={qp.label} onClick={() => setPrompt(qp.prompt)}
                  className="flex-shrink-0 px-3 py-2 rounded border border-hive-border font-mono text-[10px] text-muted-foreground hover:border-gold/40 hover:text-gold transition-colors whitespace-nowrap">
                  {qp.label}
                </button>
              ))}
            </div>
          </div>

          {/* OS */}
          <div>
            <div className="font-mono text-[10px] text-muted-foreground tracking-wider mb-2">TARGET OS</div>
            <div className="flex gap-2 flex-wrap">
              {OS_OPTIONS.map(o => (
                <button key={o.id} onClick={() => setTargetOs(o.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded font-mono text-[10px] transition-all ${
                    targetOs === o.id ? 'bg-gold text-hive-black font-bold' : 'border border-hive-border text-muted-foreground hover:border-gold/30'
                  }`}>
                  {o.icon} {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <div className="font-mono text-[10px] text-muted-foreground tracking-wider mb-2">LANGUAGE</div>
            <div className="flex gap-2 flex-wrap">
              {LANG_OPTIONS.map(l => (
                <button key={l.id} onClick={() => setLanguage(l.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded font-mono text-[10px] transition-all ${
                    language === l.id
                      ? 'bg-neon-blue/20 border border-neon-blue/50 text-neon-blue'
                      : 'border border-hive-border text-muted-foreground hover:border-neon-blue/20'
                  }`}>
                  {l.icon} {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div>
            <div className="font-mono text-[10px] text-muted-foreground tracking-wider mb-2">STYLE</div>
            <div className="flex gap-2 flex-wrap">
              {STYLE_OPTIONS.map(s => (
                <button key={s.id} onClick={() => setStyle(s.id)}
                  className={`px-3 py-1.5 rounded font-mono text-[10px] transition-all ${
                    style === s.id
                      ? 'bg-terminal-green/20 border border-terminal-green/50 text-terminal-green'
                      : 'border border-hive-border text-muted-foreground hover:border-terminal-green/20'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <div className="font-mono text-[10px] text-muted-foreground tracking-wider mb-2">DESCRIBE WHAT YOU NEED</div>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. Write a script that scans my network for open ports, saves results to JSON, and emails a report..."
              rows={4}
              className="w-full bg-hive-card border border-hive-border rounded-lg px-3 py-3 font-mono text-xs text-gray-200 outline-none focus:border-gold/40 resize-none leading-relaxed"
            />
          </div>

          {/* Forge Button */}
          <button
            onClick={generate}
            disabled={generating || !prompt.trim()}
            className="w-full py-4 rounded-xl font-mono text-sm font-bold tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: generating ? '#333' : 'linear-gradient(90deg, #f5a623, #ffd700)', color: '#0a0a0a' }}
          >
            {generating ? <RefreshCw size={18} className="animate-spin" /> : <Zap size={18} />}
            {generating ? 'FORGING...' : `FORGE · ${osInfo.icon} ${langInfo.icon}`}
          </button>

          {/* Session results */}
          {results.length > 0 && (
            <div>
              <div className="font-mono text-[10px] text-muted-foreground tracking-wider mb-2">THIS SESSION</div>
              <div className="space-y-2">
                {results.map(r => (
                  <ScriptCard key={r.id} result={r}
                    onOpen={() => setActiveResult(r)}
                    onCopy={() => copyScript(r.script)}
                    onDownload={() => downloadScript(r)}
                    onDelete={() => setResults(prev => prev.filter(x => x.id !== r.id))}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {view === 'history' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-mono text-sm font-bold text-gold tracking-wider">FORGE HISTORY</h3>
              <p className="font-mono text-[10px] text-muted-foreground">{dbHistory.length} scripts saved to cloud</p>
            </div>
            <button onClick={loadHistory} disabled={historyLoading}
              className="p-2 rounded border border-hive-border hover:border-gold/30 transition-colors">
              <RefreshCw size={13} className={`text-muted-foreground ${historyLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {historyLoading ? (
            <div className="text-center py-8 font-mono text-gold text-xs animate-pulse">LOADING HISTORY...</div>
          ) : dbHistory.length === 0 ? (
            <div className="text-center py-12 font-mono">
              <Clock size={32} className="text-muted-foreground mx-auto mb-3 opacity-30" />
              <div className="text-muted-foreground text-xs">No scripts forged yet</div>
            </div>
          ) : (
            <div className="space-y-2">
              {dbHistory.map(entry => (
                <button key={entry.id} onClick={() => openDbEntry(entry)}
                  className="w-full hive-card rounded-lg p-3 text-left hover:border-gold/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Code2 size={11} className="text-gold flex-shrink-0" />
                        <span className="font-mono text-[10px] font-bold text-gray-200 truncate">{entry.title}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[9px] text-muted-foreground">
                          {OS_OPTIONS.find(o => o.id === entry.target_os)?.icon} {entry.target_os}
                        </span>
                        <span className="font-mono text-[9px] text-muted-foreground">
                          {LANG_OPTIONS.find(l => l.id === entry.language)?.icon} {entry.language}
                        </span>
                        <span className="font-mono text-[9px] text-muted-foreground/50">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(entry.script); toast.success('Copied'); }}
                        className="p-1.5 rounded border border-hive-border hover:border-gold/40">
                        <Copy size={10} className="text-muted-foreground" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); downloadScript(entry as unknown as ScriptResult); }}
                        className="p-1.5 rounded border border-hive-border hover:border-gold/40">
                        <Download size={10} className="text-muted-foreground" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); deleteFromDb(entry.id); }}
                        className="p-1.5 rounded border border-red-500/20 hover:border-red-500/40">
                        <Trash2 size={10} className="text-red-400/60" />
                      </button>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScriptCard({ result, onOpen, onCopy, onDownload, onDelete }: {
  result: ScriptResult;
  onOpen: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onDelete: () => void;
}) {
  return (
    <button onClick={onOpen} className="w-full hive-card rounded-lg p-3 text-left hover:border-gold/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Code2 size={11} className="text-gold flex-shrink-0" />
            <span className="font-mono text-[10px] font-bold text-gray-200 truncate">{result.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] text-muted-foreground">{result.targetOs}</span>
            <span className="font-mono text-[9px] text-muted-foreground">{result.language}</span>
            <span className="font-mono text-[9px] text-terminal-green">{result.engine}</span>
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={e => { e.stopPropagation(); onCopy(); }} className="p-1.5 rounded border border-hive-border hover:border-gold/40">
            <Copy size={10} className="text-muted-foreground" />
          </button>
          <button onClick={e => { e.stopPropagation(); onDownload(); }} className="p-1.5 rounded border border-hive-border hover:border-gold/40">
            <Download size={10} className="text-muted-foreground" />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded border border-red-500/20 hover:border-red-500/40">
            <Trash2 size={10} className="text-red-400/60" />
          </button>
        </div>
      </div>
    </button>
  );
}
