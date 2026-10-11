import { useState } from 'react';
import { useHive } from '@/hooks/useHive';
import type { GitHubSearchResult } from '@/types';
import { timeAgo } from '@/lib/utils';
import { Search, Star, GitFork, ExternalLink } from 'lucide-react';

const QUICK_SEARCHES = [
  'stars:>10000 language:TypeScript',
  'grok api',
  'ai cli tool',
  'free tier saas',
  'react native',
  'gentoo linux tools',
  'termux utilities',
];

const SYNTAX_TIPS = [
  'language:TypeScript',
  'stars:>1000',
  'topic:machine-learning',
  'user:JACK-SCHITT',
  'is:public archived:false',
];

const SORT_OPTIONS = [
  { value: 'best-match', label: 'Best Match' },
  { value: 'stars', label: 'Stars' },
  { value: 'forks', label: 'Forks' },
  { value: 'updated', label: 'Updated' },
];

export function SearchPage() {
  const { githubToken } = useHive();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('best-match');
  const [results, setResults] = useState<GitHubSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  const headers: Record<string, string> = githubToken ? { Authorization: `token ${githubToken}` } : {};

  const doSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true); setError(''); setResults([]);
    const sortParam = sort !== 'best-match' ? `&sort=${sort}&order=desc` : '';
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&per_page=20${sortParam}`;
    const res = await fetch(url, { headers });
    const data = await res.json();
    if (res.ok) {
      setResults(data.items || []);
      setTotalCount(data.total_count || 0);
    } else {
      setError(data.message || 'Search failed');
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); doSearch(query); };
  const handleQuick = (q: string) => { setQuery(q); doSearch(q); };

  return (
    <div className="p-4 space-y-4">
      <h2 className="font-mono text-sm font-bold text-gold tracking-widest">GITHUB SEARCH</h2>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search repositories..."
              className="w-full bg-hive-card border border-hive-border rounded-lg pl-9 pr-3 py-2.5 font-mono text-xs text-gray-200 outline-none focus:border-gold/50 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-4 py-2.5 rounded-lg font-mono text-xs font-bold tracking-wider bg-gold text-hive-black disabled:opacity-50 transition-opacity"
          >
            {loading ? '...' : 'SCAN'}
          </button>
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="bg-hive-card border border-hive-border rounded text-xs font-mono text-gray-300 px-2 py-1.5 outline-none"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </form>

      {/* Quick Searches */}
      <div>
        <div className="font-mono text-[10px] text-gold/60 tracking-widest mb-2">🔥 QUICK SEARCHES</div>
        <div className="flex flex-wrap gap-2">
          {QUICK_SEARCHES.map(q => (
            <button
              key={q}
              onClick={() => handleQuick(q)}
              className="px-2.5 py-1 rounded text-[10px] font-mono border border-hive-border text-muted-foreground hover:border-gold/40 hover:text-gold transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Syntax Tips */}
      <div>
        <div className="font-mono text-[10px] text-gold/60 tracking-widest mb-2">🎯 SEARCH SYNTAX</div>
        <div className="flex flex-wrap gap-2">
          {SYNTAX_TIPS.map(t => (
            <button
              key={t}
              onClick={() => setQuery(prev => prev ? `${prev} ${t}` : t)}
              className="px-2.5 py-1 rounded text-[10px] font-mono border border-terminal-green/20 text-terminal-green/70 hover:border-terminal-green/50 transition-colors"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="text-red-500 text-xs font-mono p-3 bg-red-500/10 rounded border border-red-500/30">{error}</div>}

      {/* Results */}
      {totalCount > 0 && (
        <div className="font-mono text-[10px] text-muted-foreground">
          {totalCount.toLocaleString()} repositories found
        </div>
      )}

      <div className="space-y-2">
        {results.map(repo => (
          <div key={repo.id} className="hive-card rounded-lg p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <img src={repo.owner.avatar_url} alt="" className="w-5 h-5 rounded-full" />
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs font-bold text-gold hover:underline truncate"
                  >
                    {repo.full_name}
                  </a>
                </div>
                {repo.description && (
                  <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed line-clamp-2">{repo.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {repo.language && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: '#f5a623' }} />
                      {repo.language}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                    <Star size={9} className="text-gold" /> {repo.stargazers_count.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                    <GitFork size={9} /> {repo.forks_count.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">{timeAgo(repo.updated_at)}</span>
                </div>
              </div>
              <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 p-1.5 rounded border border-hive-border hover:border-gold/40 transition-colors">
                <ExternalLink size={12} className="text-muted-foreground" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="text-center py-8 font-mono text-gold text-xs animate-pulse">SCANNING GITHUB NODES...</div>
      )}

      {!loading && results.length === 0 && query && !error && (
        <div className="text-center py-8 font-mono text-muted-foreground text-xs">No results. Refine your search.</div>
      )}
    </div>
  );
}
