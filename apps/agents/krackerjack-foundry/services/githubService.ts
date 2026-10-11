// KRACKERJACK AI — Real GitHub API Service

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  pushed_at: string;
  default_branch: string;
  private: boolean;
  topics: string[];
  open_issues_count: number;
  size: number;
  watchers_count: number;
  clone_url: string;
  homepage: string | null;
  fork: boolean;
  archived: boolean;
}

export interface GitHubUser {
  login: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  avatar_url: string;
  html_url: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
}

export interface GitHubLanguages {
  [language: string]: number;
}

const GITHUB_API = 'https://api.github.com';

function getHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

export async function fetchUserRepos(token: string): Promise<{ data: GitHubRepo[] | null; error: string | null }> {
  try {
    const response = await fetch(`${GITHUB_API}/user/repos?per_page=100&sort=updated&type=all`, {
      headers: getHeaders(token),
    });
    if (!response.ok) {
      const err = await response.json();
      return { data: null, error: err.message || `GitHub error: ${response.status}` };
    }
    const data = await response.json();
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || 'Network error reaching GitHub' };
  }
}

export async function fetchRepo(token: string, owner: string, repo: string): Promise<{ data: GitHubRepo | null; error: string | null }> {
  try {
    const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
      headers: getHeaders(token),
    });
    if (!response.ok) {
      const err = await response.json();
      return { data: null, error: err.message || `GitHub error: ${response.status}` };
    }
    const data = await response.json();
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || 'Network error' };
  }
}

export async function fetchRepoCommits(token: string, owner: string, repo: string): Promise<{ data: GitHubCommit[] | null; error: string | null }> {
  try {
    const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/commits?per_page=10`, {
      headers: getHeaders(token),
    });
    if (!response.ok) {
      const err = await response.json();
      return { data: null, error: err.message || `GitHub error: ${response.status}` };
    }
    const data = await response.json();
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || 'Network error' };
  }
}

export async function fetchRepoLanguages(token: string, owner: string, repo: string): Promise<{ data: GitHubLanguages | null; error: string | null }> {
  try {
    const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/languages`, {
      headers: getHeaders(token),
    });
    if (!response.ok) {
      return { data: null, error: `GitHub error: ${response.status}` };
    }
    const data = await response.json();
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || 'Network error' };
  }
}

export async function fetchGitHubUser(token: string): Promise<{ data: GitHubUser | null; error: string | null }> {
  try {
    const response = await fetch(`${GITHUB_API}/user`, {
      headers: getHeaders(token),
    });
    if (!response.ok) {
      const err = await response.json();
      return { data: null, error: err.message || `GitHub error: ${response.status}` };
    }
    const data = await response.json();
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || 'Network error' };
  }
}

export async function updateRepoTopics(token: string, owner: string, repo: string, topics: string[]): Promise<{ error: string | null }> {
  try {
    const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/topics`, {
      method: 'PUT',
      headers: {
        ...getHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ names: topics }),
    });
    if (!response.ok) {
      const err = await response.json();
      return { error: err.message || `GitHub error: ${response.status}` };
    }
    return { error: null };
  } catch (e: any) {
    return { error: e.message || 'Network error' };
  }
}

export async function updateRepo(
  token: string,
  owner: string,
  repo: string,
  updates: { description?: string; homepage?: string; private?: boolean }
): Promise<{ data: GitHubRepo | null; error: string | null }> {
  try {
    const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
      method: 'PATCH',
      headers: {
        ...getHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      const err = await response.json();
      return { data: null, error: err.message || `GitHub error: ${response.status}` };
    }
    const data = await response.json();
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || 'Network error' };
  }
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function bytesToKB(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── GitHub Search ───────────────────────────────────────────────────────────

export interface GitHubSearchResult {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepo[];
}

export async function searchRepos(
  token: string,
  query: string,
  sort: 'stars' | 'forks' | 'updated' | 'best-match' = 'stars',
  perPage = 30
): Promise<{ data: GitHubSearchResult | null; error: string | null }> {
  try {
    const params = new URLSearchParams({
      q: query,
      sort: sort === 'best-match' ? '' : sort,
      order: 'desc',
      per_page: String(perPage),
    });
    if (sort === 'best-match') params.delete('sort');
    const response = await fetch(`${GITHUB_API}/search/repositories?${params}`, {
      headers: getHeaders(token),
    });
    if (!response.ok) {
      const err = await response.json();
      return { data: null, error: err.message || `GitHub error: ${response.status}` };
    }
    const data = await response.json();
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || 'Network error' };
  }
}

// ─── README ──────────────────────────────────────────────────────────────────

export async function fetchRepoReadme(
  token: string,
  owner: string,
  repo: string
): Promise<{ content: string | null; error: string | null }> {
  try {
    const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/readme`, {
      headers: {
        ...getHeaders(token),
        Accept: 'application/vnd.github.raw+json',
      },
    });
    if (response.status === 404) return { content: null, error: 'No README found' };
    if (!response.ok) return { content: null, error: `GitHub error: ${response.status}` };
    const text = await response.text();
    return { content: text, error: null };
  } catch (e: any) {
    return { content: null, error: e.message || 'Network error' };
  }
}

// ─── Grok / xAI direct call ─────────────────────────────────────────────────
// NOTE: Calls xAI API directly from the client using a user-provided API key.
// The key is stored locally via storageService and never sent to any server.
export async function callGrokAI(
  apiKey: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  model = 'grok-3'
): Promise<{ reply: string | null; error: string | null }> {
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, max_tokens: 1024 }),
    });
    if (!response.ok) {
      const err = await response.json();
      return { reply: null, error: err.error?.message || `xAI error: ${response.status}` };
    }
    const data = await response.json();
    return { reply: data.choices?.[0]?.message?.content ?? null, error: null };
  } catch (e: any) {
    return { reply: null, error: e.message || 'Network error reaching xAI' };
  }
}
