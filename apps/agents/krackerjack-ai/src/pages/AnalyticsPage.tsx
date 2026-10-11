import { useState, useEffect, useCallback } from 'react';
import { useHive } from '@/hooks/useHive';
import type { GitHubRepo, GitHubUser } from '@/types';
import { formatBytes, timeAgo } from '@/lib/utils';
import { RefreshCw, Star, GitFork, AlertCircle, Lock, Archive } from 'lucide-react';

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
};

export function AnalyticsPage() {
  const { githubToken } = useHive();
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const headers: Record<string, string> = githubToken ? { Authorization: `token ${githubToken}` } : {};

  const fetchData = useCallback(async () => {
    if (!githubToken) { setError('GitHub token not configured. Go to CONFIG tab.'); return; }
    setLoading(true); setError('');
    const [uRes, rRes] = await Promise.all([
      fetch('https://api.github.com/user', { headers }),
      fetch('https://api.github.com/user/repos?per_page=100&sort=updated', { headers }),
    ]);
    const uData = await uRes.json();
    const rData = await rRes.json();
    if (uRes.ok) setUser(uData);
    if (rRes.ok) setRepos(rData);
    else setError(rData.message || 'Failed to fetch repos');
    setLoading(false);
  }, [githubToken]);

  useEffect(() => { if (githubToken) fetchData(); }, [fetchData, githubToken]);

  // Language breakdown
  const langMap: Record<string, number> = {};
  repos.forEach(r => { if (r.language) langMap[r.language] = (langMap[r.language] || 0) + 1; });
  const totalLanged = Object.values(langMap).reduce((a, b) => a + b, 0);
  const langs = Object.entries(langMap).sort((a, b) => b[1] - a[1]);

  const totalSize = repos.reduce((a, r) => a + r.size, 0) * 1024;
  const totalStars = repos.reduce((a, r) => a + r.stargazers_count, 0);
  const totalForks = repos.reduce((a, r) => a + r.forks_count, 0);
  const openIssues = repos.reduce((a, r) => a + r.open_issues_count, 0);
  const privateCount = repos.filter(r => r.private).length;
  const forkedCount = repos.filter(r => r.fork).length;
  const archivedCount = repos.filter(r => r.archived).length;

  const topStarred = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 5);
  const recent = [...repos].slice(0, 5);

  if (!githubToken) {
    return (
      <div className="p-4 text-center py-12 font-mono">
        <div className="text-4xl mb-4">📡</div>
        <div className="text-gold text-sm tracking-widest mb-2">NO SIGNAL</div>
        <div className="text-muted-foreground text-xs mb-4">GitHub token required for live analytics.</div>
        <div className="text-[10px] text-gold/50">Go to CONFIG → GITHUB API KEY</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-sm font-bold text-gold tracking-widest">HIVE ANALYTICS</h2>
        <button onClick={fetchData} disabled={loading} className="p-2 rounded border border-hive-border hover:border-gold/40 transition-colors">
          <RefreshCw size={14} className={`text-gold ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <div className="text-red-500 text-xs font-mono p-3 bg-red-500/10 rounded border border-red-500/30">{error}</div>}

      {/* GitHub User */}
      {user && (
        <div className="hive-card rounded-lg p-4 flex items-center gap-4">
          <img src={user.avatar_url} alt={user.login} className="w-14 h-14 rounded-full border-2 border-gold/50" />
          <div className="flex-1">
            <div className="font-mono font-bold text-gold text-sm">@{user.login}</div>
            {user.name && <div className="text-xs text-gray-300 mt-0.5">{user.name}</div>}
            {user.bio && <div className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{user.bio}</div>}
            <div className="flex gap-4 mt-2">
              <span className="text-[10px] font-mono text-muted-foreground"><span className="text-gold font-bold">{user.followers}</span> FOLLOWERS</span>
              <span className="text-[10px] font-mono text-muted-foreground"><span className="text-gold font-bold">{user.following}</span> FOLLOWING</span>
            </div>
          </div>
        </div>
      )}

      {/* Power Level */}
      <div className="hive-card rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs text-gold tracking-wider">⚡ HIVE POWER LEVEL</span>
          <span className="font-mono text-sm font-bold text-gold">100%</span>
        </div>
        <div className="h-2 bg-hive-border rounded-full overflow-hidden">
          <div className="h-full gold-bar rounded-full" style={{ width: '100%' }} />
        </div>
      </div>

      {/* Assimilation Rate */}
      <div className="hive-card rounded-lg p-4">
        <div className="font-mono text-xs text-gold tracking-wider mb-3">ASSIMILATION RATE</div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-mono text-3xl font-bold text-gold">{repos.length}</span>
          <span className="font-mono text-sm text-muted-foreground">of {repos.length} nodes under Hive control</span>
        </div>
        <div className="h-1.5 bg-hive-border rounded-full overflow-hidden mt-2">
          <div className="h-full bg-terminal-green rounded-full" style={{ width: '100%' }} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'TOTAL REPOS', value: repos.length, icon: '📁' },
          { label: 'TOTAL STARS', value: totalStars, icon: '⭐' },
          { label: 'TOTAL FORKS', value: totalForks, icon: '🍴' },
          { label: 'OPEN ISSUES', value: openIssues, icon: '🔴' },
          { label: 'PRIVATE', value: privateCount, icon: '🔒' },
          { label: 'FORKED', value: forkedCount, icon: '🔀' },
          { label: 'ARCHIVED', value: archivedCount, icon: '📦' },
          { label: 'TOTAL SIZE', value: formatBytes(totalSize), icon: '💾' },
        ].map(stat => (
          <div key={stat.label} className="hive-card rounded-lg p-3 text-center">
            <div className="text-lg mb-1">{stat.icon}</div>
            <div className="font-mono font-bold text-gold text-sm">{stat.value}</div>
            <div className="font-mono text-[9px] text-muted-foreground tracking-wider mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Language Breakdown */}
      {langs.length > 0 && (
        <div className="hive-card rounded-lg p-4">
          <div className="font-mono text-xs text-gold tracking-wider mb-3">💻 LANGUAGE BREAKDOWN</div>
          <div className="space-y-2">
            {langs.slice(0, 6).map(([lang, count]) => (
              <div key={lang}>
                <div className="flex justify-between mb-1">
                  <span className="font-mono text-[11px] text-gray-300">{lang}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {count} ({Math.round((count / totalLanged) * 100)}%)
                  </span>
                </div>
                <div className="h-1.5 bg-hive-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(count / totalLanged) * 100}%`, background: LANG_COLORS[lang] || '#f5a623' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Starred */}
      {topStarred.length > 0 && (
        <div className="hive-card rounded-lg p-4">
          <div className="font-mono text-xs text-gold tracking-wider mb-3">⭐ TOP STARRED NODES</div>
          {topStarred.map((repo, i) => (
            <div key={repo.id} className="flex items-center justify-between py-2 border-b border-hive-border last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-xs text-gold/50 w-4">#{i + 1}</span>
                <div className="min-w-0">
                  <div className="font-mono text-xs text-gray-200 truncate">{repo.name}</div>
                  {repo.language && <div className="text-[10px] text-muted-foreground">{repo.language}</div>}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Star size={10} className="text-gold" />
                <span className="font-mono text-xs text-gold">{repo.stargazers_count}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Activity */}
      {recent.length > 0 && (
        <div className="hive-card rounded-lg p-4">
          <div className="font-mono text-xs text-gold tracking-wider mb-3">🕐 RECENT ACTIVITY</div>
          {recent.map(repo => (
            <div key={repo.id} className="flex items-center justify-between py-2 border-b border-hive-border last:border-0">
              <div className="min-w-0">
                <div className="font-mono text-xs text-gray-200 truncate">{repo.name}</div>
                <div className="text-[10px] text-muted-foreground">{timeAgo(repo.updated_at)}</div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                {repo.private && <Lock size={10} className="text-muted-foreground" />}
                {repo.archived && <Archive size={10} className="text-muted-foreground" />}
                {repo.language && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${LANG_COLORS[repo.language] || '#333'}33`, color: LANG_COLORS[repo.language] || '#aaa' }}>
                    {repo.language}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
