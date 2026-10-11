import { useState, useEffect } from 'react';
import {
  GitBranch, Star, Lock, Globe, GitCommit, GitPullRequest,
  AlertCircle, RefreshCw, ExternalLink, Code, PlayCircle,
  FileCode, Search, ChevronDown, ChevronRight, Loader2, Key
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { updateUser } from '@/lib/storage';
import {
  getAuthenticatedUser, getUserRepos, getRepoCommits,
  getRepoPRs, getRepoIssues, getWorkflows, getWorkflowRuns
} from '@/lib/github';
import type { GitHubRepo, GitHubCommit, GitHubPR, GitHubIssue } from '@/types';
import { formatRelative, truncate } from '@/lib/utils';

type Tab = 'repos' | 'commits' | 'prs' | 'issues' | 'actions';

export default function GitHubPage() {
  const { user, refreshUser } = useAuth();
  const [token, setToken] = useState(user?.githubToken || '');
  const [tokenInput, setTokenInput] = useState('');
  const [ghUser, setGhUser] = useState<any>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [prs, setPRs] = useState<GitHubPR[]>([]);
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [tab, setTab] = useState<Tab>('repos');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user?.githubToken) {
      setToken(user.githubToken);
      loadGitHub(user.githubToken);
    }
  }, [user]);

  const loadGitHub = async (t: string) => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([getAuthenticatedUser(t), getUserRepos(t)]);
      setGhUser(u);
      setRepos(r);
    } catch (err: any) {
      toast.error(err.message || 'Failed to connect to GitHub');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToken = async () => {
    if (!tokenInput.trim() || !user) return;
    setLoading(true);
    try {
      await loadGitHub(tokenInput.trim());
      updateUser(user.id, { githubToken: tokenInput.trim() });
      setToken(tokenInput.trim());
      setTokenInput('');
      refreshUser();
      toast.success('GitHub connected!');
    } catch {
      toast.error('Invalid GitHub token');
    } finally {
      setLoading(false);
    }
  };

  const selectRepo = async (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setTab('commits');
    setLoading(true);
    const [owner, name] = repo.full_name.split('/');
    try {
      const [c, p, i, w, r] = await Promise.allSettled([
        getRepoCommits(token, owner, name),
        getRepoPRs(token, owner, name, 'all'),
        getRepoIssues(token, owner, name, 'all'),
        getWorkflows(token, owner, name),
        getWorkflowRuns(token, owner, name),
      ]);
      if (c.status === 'fulfilled') setCommits(c.value);
      if (p.status === 'fulfilled') setPRs(p.value);
      if (i.status === 'fulfilled') setIssues(i.value);
      if (w.status === 'fulfilled') setWorkflows(w.value);
      if (r.status === 'fulfilled') setRuns(r.value);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredRepos = repos.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(search.toLowerCase())
  );

  if (!token) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-lg mx-auto mt-16">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-surface-700/60 border border-surface-500/30 flex items-center justify-center mx-auto mb-4">
              <GitBranch className="w-8 h-8 text-gray-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Connect GitHub</h1>
            <p className="text-gray-500 text-sm">
              Connect your GitHub account to manage repos, review PRs, trigger workflows, and more.
            </p>
          </div>

          <div className="card">
            <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" /> Personal Access Token
            </label>
            <input
              type="password"
              className="input-field w-full mb-3"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveToken()}
            />
            <p className="text-xs text-gray-600 mb-4">
              Generate a token at{' '}
              <a href="https://github.com/settings/tokens/new" target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">
                github.com/settings/tokens
              </a>
              . Requires: repo, workflow, read:user scopes.
            </p>
            <button onClick={handleSaveToken} disabled={!tokenInput.trim() || loading} className="btn-primary w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Connect GitHub'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'repos', label: 'Repositories', icon: <GitBranch className="w-3.5 h-3.5" />, count: repos.length },
    { id: 'commits', label: 'Commits', icon: <GitCommit className="w-3.5 h-3.5" />, count: commits.length },
    { id: 'prs', label: 'Pull Requests', icon: <GitPullRequest className="w-3.5 h-3.5" />, count: prs.length },
    { id: 'issues', label: 'Issues', icon: <AlertCircle className="w-3.5 h-3.5" />, count: issues.length },
    { id: 'actions', label: 'Actions', icon: <PlayCircle className="w-3.5 h-3.5" />, count: workflows.length },
  ];

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-500/30 bg-surface-800/40 flex-shrink-0">
        <div className="flex items-center gap-3">
          {ghUser && (
            <>
              <img src={ghUser.avatar_url} alt="" className="w-8 h-8 rounded-full border border-surface-400/50" />
              <div>
                <div className="text-sm font-medium text-white">{ghUser.name || ghUser.login}</div>
                <div className="text-xs text-gray-500">@{ghUser.login} · {ghUser.public_repos} repos</div>
              </div>
            </>
          )}
          {selectedRepo && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-mono text-brand-300">{selectedRepo.name}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedRepo && (
            <button onClick={() => { setSelectedRepo(null); setTab('repos'); }} className="btn-ghost text-xs">
              ← All Repos
            </button>
          )}
          <button onClick={() => loadGitHub(token)} disabled={loading} className="btn-ghost p-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-400' : 'text-gray-400'}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 py-2 border-b border-surface-500/30 flex-shrink-0 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            disabled={t.id !== 'repos' && !selectedRepo}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              tab === t.id ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed'
            }`}
          >
            {t.icon} {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="bg-surface-600 text-gray-400 px-1.5 py-0.5 rounded-full text-xs">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading && !selectedRepo && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
          </div>
        )}

        {/* Repos */}
        {tab === 'repos' && !loading && (
          <div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <input className="input-field w-full pl-10 max-w-sm" placeholder="Search repositories..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredRepos.map(r => (
                <button key={r.id} onClick={() => selectRepo(r)} className="card text-left glass-hover group">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {r.private ? <Lock className="w-3.5 h-3.5 text-yellow-500" /> : <Globe className="w-3.5 h-3.5 text-green-500" />}
                      <span className="text-sm font-medium text-gray-200 group-hover:text-white">{r.name}</span>
                    </div>
                    <a href={r.html_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-gray-600 hover:text-gray-400">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  {r.description && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{r.description}</p>}
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    {r.language && <span className="flex items-center gap-1"><Code className="w-3 h-3" />{r.language}</span>}
                    <span className="flex items-center gap-1"><Star className="w-3 h-3" />{r.stargazers_count}</span>
                    <span className="ml-auto">{formatRelative(r.updated_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Commits */}
        {tab === 'commits' && (
          <div className="space-y-2">
            {commits.map(c => (
              <a key={c.sha} href={c.url} target="_blank" rel="noreferrer" className="flex items-start gap-3 p-3 rounded-xl glass glass-hover">
                <code className="text-xs font-mono text-brand-300 bg-brand-500/10 px-2 py-1 rounded flex-shrink-0">{c.sha}</code>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-200 truncate">{c.message}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{c.author} · {formatRelative(c.date)}</div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-gray-600 flex-shrink-0 mt-1" />
              </a>
            ))}
          </div>
        )}

        {/* PRs */}
        {tab === 'prs' && (
          <div className="space-y-2">
            {prs.map(pr => (
              <a key={pr.number} href={pr.url} target="_blank" rel="noreferrer" className="flex items-start gap-3 p-3 rounded-xl glass glass-hover">
                <GitPullRequest className={`w-4 h-4 mt-0.5 flex-shrink-0 ${pr.state === 'open' ? 'text-green-400' : pr.state === 'merged' ? 'text-purple-400' : 'text-red-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm text-gray-200">#{pr.number} {pr.title}</span>
                  </div>
                  <div className="text-xs text-gray-500">{pr.author} · {formatRelative(pr.createdAt)}</div>
                  {(pr.additions || pr.deletions) ? (
                    <div className="text-xs mt-1">
                      <span className="text-green-400">+{pr.additions}</span>
                      <span className="text-gray-600"> / </span>
                      <span className="text-red-400">-{pr.deletions}</span>
                    </div>
                  ) : null}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${pr.state === 'open' ? 'bg-green-500/10 text-green-400 border-green-500/30' : pr.state === 'merged' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                  {pr.state}
                </span>
              </a>
            ))}
          </div>
        )}

        {/* Issues */}
        {tab === 'issues' && (
          <div className="space-y-2">
            {issues.map(issue => (
              <a key={issue.number} href={issue.url} target="_blank" rel="noreferrer" className="flex items-start gap-3 p-3 rounded-xl glass glass-hover">
                <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${issue.state === 'open' ? 'text-green-400' : 'text-gray-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-200">#{issue.number} {issue.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{issue.author} · {formatRelative(issue.createdAt)}</div>
                  {issue.labels.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {issue.labels.map(l => (
                        <span key={l} className="text-xs px-1.5 py-0.5 rounded-full bg-surface-600/60 text-gray-400 border border-surface-400/30">{l}</span>
                      ))}
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Actions */}
        {tab === 'actions' && (
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">Workflows ({workflows.length})</h3>
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              {workflows.map((w: any) => (
                <div key={w.id} className="card flex items-center gap-3">
                  <PlayCircle className={`w-5 h-5 flex-shrink-0 ${w.state === 'active' ? 'text-green-400' : 'text-gray-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-200 truncate">{w.name}</div>
                    <div className="text-xs text-gray-500">{w.path}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${w.state === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-500/10 text-gray-500'}`}>
                    {w.state}
                  </span>
                </div>
              ))}
            </div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">Recent Runs ({runs.length})</h3>
            <div className="space-y-2">
              {runs.slice(0, 10).map((r: any) => (
                <a key={r.id} href={r.html_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl glass glass-hover">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${r.conclusion === 'success' ? 'bg-green-400' : r.conclusion === 'failure' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-200 truncate">{r.name}</div>
                    <div className="text-xs text-gray-500">{r.head_branch} · {formatRelative(r.created_at)}</div>
                  </div>
                  <span className="text-xs text-gray-600">{r.conclusion || r.status}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
