import { useState, useEffect, useCallback } from 'react';
import { useHive } from '@/hooks/useHive';
import type { GitHubRepo, GitHubUser, VaultToken } from '@/types';
import { timeAgo, formatBytes } from '@/lib/utils';
import { GitFork, Star, ExternalLink, Usb, RefreshCw, Zap, ChevronDown, Users } from 'lucide-react';
import { UsbForge } from '@/components/features/UsbForge';

type HunterView = 'repos' | 'usb';

export function HunterPage() {
  const { githubToken, vault } = useHive();
  const [view, setView] = useState<HunterView>('repos');
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [activeUser, setActiveUser] = useState<GitHubUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState<'all' | 'public' | 'private' | 'forked' | 'archived'>('all');
  const [language, setLanguage] = useState('all');
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  // Multi-account: primary + vault github tokens
  const githubVaultTokens: VaultToken[] = vault.filter(t => t.category === 'github' && t.active);
  const [selectedAccountToken, setSelectedAccountToken] = useState<string>('');

  // Effective token = selected account OR primary
  const effectiveToken = selectedAccountToken || githubToken;
  const selectedAccount = selectedAccountToken
    ? githubVaultTokens.find(t => t.value === selectedAccountToken)
    : null;

  const fetchRepos = useCallback(async (token?: string) => {
    const tok = token || effectiveToken;
    if (!tok) return;
    setLoading(true);
    const headers = { Authorization: `token ${tok}` };
    const [reposRes, userRes] = await Promise.all([
      fetch('https://api.github.com/user/repos?per_page=100&sort=updated', { headers }),
      fetch('https://api.github.com/user', { headers }),
    ]);
    if (reposRes.ok) { const data = await reposRes.json(); setRepos(data); }
    if (userRes.ok) { const u = await userRes.json(); setActiveUser(u); }
    setLoading(false);
  }, [effectiveToken]);

  useEffect(() => { if (effectiveToken) fetchRepos(); }, [fetchRepos, effectiveToken]);

  const simulate = async () => {
    setScanning(true);
    await new Promise(r => setTimeout(r, 1500));
    await fetchRepos();
    setScanning(false);
  };

  const switchAccount = (token: string) => {
    setSelectedAccountToken(token);
    setShowAccountMenu(false);
    setRepos([]);
    setActiveUser(null);
    fetchRepos(token);
  };

  const switchToPrimary = () => {
    setSelectedAccountToken('');
    setShowAccountMenu(false);
    setRepos([]);
    setActiveUser(null);
    fetchRepos(githubToken);
  };

  const langs = ['all', ...Array.from(new Set(repos.map(r => r.language).filter(Boolean) as string[]))];

  const filtered = repos.filter(r => {
    if (filter === 'public' && r.private) return false;
    if (filter === 'private' && !r.private) return false;
    if (filter === 'forked' && !r.fork) return false;
    if (filter === 'archived' && !r.archived) return false;
    if (language !== 'all' && r.language !== language) return false;
    return true;
  });

  const statusColor = (r: GitHubRepo) => r.archived ? '#555' : r.private ? '#bb00ff' : r.fork ? '#00d4ff' : '#00ff41';
  const statusLabel = (r: GitHubRepo) => r.archived ? 'ARCHIVED' : r.private ? 'PRIVATE' : r.fork ? 'FORKED' : 'PUBLIC';

  const allAccounts = [
    { label: `PRIMARY${githubToken ? ` · @${activeUser?.login || ''}` : ' (not set)'}`, token: '', isPrimary: true },
    ...githubVaultTokens.map(t => ({ label: t.label + (t.meta?.username ? ` · @${t.meta.username}` : ''), token: t.value, isPrimary: false })),
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-sm font-bold text-terminal-green tracking-widest green-glow">HUNTERPRIME</h2>
          <p className="font-mono text-[10px] text-muted-foreground mt-0.5">Action Layer · Repo Scanner · USB Forge</p>
        </div>
        {view === 'repos' && (
          <button
            onClick={simulate}
            disabled={scanning || loading || !effectiveToken}
            className="flex items-center gap-1.5 px-3 py-2 rounded border border-terminal-green/30 text-terminal-green font-mono text-[10px] hover:border-terminal-green/60 transition-colors disabled:opacity-50"
          >
            {scanning ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />}
            {scanning ? 'SCANNING...' : 'ASSIMILATE'}
          </button>
        )}
      </div>

      {/* View switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('repos')}
          className={`flex-1 py-2.5 rounded-lg font-mono text-xs font-bold tracking-wider transition-all ${
            view === 'repos'
              ? 'bg-terminal-green/20 border border-terminal-green/50 text-terminal-green'
              : 'border border-hive-border text-muted-foreground hover:border-terminal-green/20'
          }`}
        >
          🎯 REPOS
        </button>
        <button
          onClick={() => setView('usb')}
          className={`flex-1 py-2.5 rounded-lg font-mono text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-2 ${
            view === 'usb'
              ? 'bg-neon-blue/20 border border-neon-blue/50 text-neon-blue'
              : 'border border-hive-border text-muted-foreground hover:border-neon-blue/20'
          }`}
        >
          <Usb size={12} /> USB FORGE
        </button>
      </div>

      {/* ── REPOS VIEW ── */}
      {view === 'repos' && (
        <>
          {!effectiveToken ? (
            <div className="text-center py-12 font-mono">
              <div className="text-4xl mb-4">🎯</div>
              <div className="text-gold text-sm tracking-widest mb-2">HUNTERPRIME OFFLINE</div>
              <div className="text-muted-foreground text-xs mb-4">GitHub token required to scan repositories.</div>
              <div className="text-[10px] text-gold/50">Go to CONFIG → PRIMARY or VAULT tab</div>
            </div>
          ) : (
            <>
              {/* Multi-Account Switcher */}
              <div className="relative">
                <button
                  onClick={() => setShowAccountMenu(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-hive-border bg-hive-card hover:border-gold/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-gold" />
                    <div className="text-left">
                      <div className="font-mono text-xs font-bold text-gold">
                        {selectedAccount ? selectedAccount.label : `PRIMARY · @${activeUser?.login || githubToken.slice(0, 8) + '...'}`}
                      </div>
                      <div className="font-mono text-[9px] text-muted-foreground">
                        {githubVaultTokens.length + (githubToken ? 1 : 0)} accounts available · tap to switch
                      </div>
                    </div>
                  </div>
                  <ChevronDown size={14} className={`text-muted-foreground transition-transform ${showAccountMenu ? 'rotate-180' : ''}`} />
                </button>

                {showAccountMenu && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-hive-dark border border-hive-border rounded-lg overflow-hidden shadow-2xl">
                    {allAccounts.map(acc => (
                      <button
                        key={acc.token || 'primary'}
                        onClick={() => acc.isPrimary ? switchToPrimary() : switchAccount(acc.token)}
                        className={`w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-hive-card transition-colors border-b border-hive-border last:border-0 ${
                          (!selectedAccountToken && acc.isPrimary) || selectedAccountToken === acc.token
                            ? 'bg-hive-card border-l-2 border-l-gold'
                            : ''
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          (!selectedAccountToken && acc.isPrimary) || selectedAccountToken === acc.token
                            ? 'bg-gold' : 'bg-hive-border'
                        }`} />
                        <span className="font-mono text-xs text-gray-200 truncate">{acc.label}</span>
                        {acc.isPrimary && (
                          <span className="ml-auto font-mono text-[8px] text-gold/60 flex-shrink-0">PRIMARY</span>
                        )}
                      </button>
                    ))}
                    {githubVaultTokens.length === 0 && !githubToken && (
                      <div className="px-4 py-3 font-mono text-[10px] text-muted-foreground text-center">
                        No accounts configured — add tokens in CONFIG → VAULT
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Scan Status */}
              <div className="hive-card rounded-lg p-3 border-green">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-terminal-green pulse-gold" />
                  <span className="font-mono text-xs text-terminal-green font-bold tracking-wider">
                    {activeUser ? `@${activeUser.login}${activeUser.name ? ` · ${activeUser.name}` : ''}` : 'SCANNING...'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'NODES', value: repos.length },
                    { label: 'ACTIVE', value: repos.filter(r => !r.archived).length },
                    { label: 'STARS', value: repos.reduce((a, r) => a + r.stargazers_count, 0) },
                    { label: 'SIZE', value: formatBytes(repos.reduce((a, r) => a + r.size, 0) * 1024) },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <div className="font-mono font-bold text-gold text-base">{s.value}</div>
                      <div className="font-mono text-[8px] text-muted-foreground tracking-wider">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {(['all', 'public', 'private', 'forked', 'archived'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded font-mono text-[10px] uppercase tracking-wider transition-colors ${
                      filter === f ? 'bg-gold text-hive-black font-bold' : 'border border-hive-border text-muted-foreground hover:border-gold/30'
                    }`}>
                    {f}
                  </button>
                ))}
              </div>

              {/* Language filter */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {langs.slice(0, 10).map(l => (
                  <button key={l} onClick={() => setLanguage(l)}
                    className={`flex-shrink-0 px-2.5 py-1 rounded font-mono text-[9px] transition-colors ${
                      language === l ? 'bg-terminal-green/20 border border-terminal-green/50 text-terminal-green' : 'border border-hive-border text-muted-foreground hover:border-terminal-green/20'
                    }`}>
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>

              {loading && <div className="text-center py-6 font-mono text-terminal-green text-xs animate-pulse">SCANNING NODES...</div>}

              {/* Repo List */}
              <div className="space-y-2">
                {filtered.map(repo => (
                  <div key={repo.id} className="hive-card rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: statusColor(repo) }} />
                          <span className="font-mono text-xs font-bold text-gray-200 truncate">{repo.name}</span>
                          <span className="font-mono text-[8px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: `${statusColor(repo)}22`, color: statusColor(repo) }}>
                            {statusLabel(repo)}
                          </span>
                        </div>
                        {repo.description && (
                          <p className="text-[10px] text-gray-400 leading-relaxed mb-1.5 line-clamp-1">{repo.description}</p>
                        )}
                        <div className="flex items-center gap-3 flex-wrap">
                          {repo.language && <span className="font-mono text-[9px] text-gold">{repo.language}</span>}
                          <span className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground"><Star size={8} /> {repo.stargazers_count}</span>
                          <span className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground"><GitFork size={8} /> {repo.forks_count}</span>
                          <span className="font-mono text-[9px] text-muted-foreground">{timeAgo(repo.updated_at)}</span>
                        </div>
                      </div>
                      <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded border border-hive-border hover:border-gold/40 transition-colors flex-shrink-0">
                        <ExternalLink size={11} className="text-muted-foreground" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {!loading && filtered.length === 0 && repos.length > 0 && (
                <div className="text-center py-6 font-mono text-muted-foreground text-xs">No repos match current filter.</div>
              )}
            </>
          )}
        </>
      )}

      {/* ── USB FORGE VIEW ── */}
      {view === 'usb' && <UsbForge />}
    </div>
  );
}
