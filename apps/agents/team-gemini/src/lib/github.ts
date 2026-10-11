import type { GitHubRepo, GitHubCommit, GitHubPR, GitHubIssue } from '@/types';

const BASE = 'https://api.github.com';

async function ghFetch(token: string, path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `GitHub API error: ${res.status}`);
  }
  return res.json();
}

export async function getAuthenticatedUser(token: string) {
  return ghFetch(token, '/user');
}

export async function getUserRepos(token: string): Promise<GitHubRepo[]> {
  const data = await ghFetch(token, '/user/repos?sort=updated&per_page=50&type=all');
  return data.map((r: any) => ({
    id: r.id,
    name: r.name,
    full_name: r.full_name,
    description: r.description || '',
    private: r.private,
    html_url: r.html_url,
    clone_url: r.clone_url,
    language: r.language || 'Unknown',
    stargazers_count: r.stargazers_count,
    updated_at: r.updated_at,
    default_branch: r.default_branch,
  }));
}

export async function getRepoCommits(token: string, owner: string, repo: string, branch?: string): Promise<GitHubCommit[]> {
  const path = `/repos/${owner}/${repo}/commits?per_page=30${branch ? `&sha=${branch}` : ''}`;
  const data = await ghFetch(token, path);
  return data.map((c: any) => ({
    sha: c.sha.slice(0, 7),
    message: c.commit.message.split('\n')[0],
    author: c.commit.author.name,
    date: c.commit.author.date,
    url: c.html_url,
  }));
}

export async function getRepoPRs(token: string, owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<GitHubPR[]> {
  const data = await ghFetch(token, `/repos/${owner}/${repo}/pulls?state=${state}&per_page=30`);
  return data.map((pr: any) => ({
    number: pr.number,
    title: pr.title,
    state: pr.merged_at ? 'merged' : pr.state,
    author: pr.user.login,
    createdAt: pr.created_at,
    url: pr.html_url,
    body: pr.body || '',
    additions: pr.additions || 0,
    deletions: pr.deletions || 0,
  }));
}

export async function getRepoIssues(token: string, owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<GitHubIssue[]> {
  const data = await ghFetch(token, `/repos/${owner}/${repo}/issues?state=${state}&per_page=30`);
  return data
    .filter((i: any) => !i.pull_request)
    .map((i: any) => ({
      number: i.number,
      title: i.title,
      state: i.state,
      author: i.user.login,
      createdAt: i.created_at,
      url: i.html_url,
      labels: i.labels.map((l: any) => l.name),
      body: i.body || '',
    }));
}

export async function getRepoContents(token: string, owner: string, repo: string, path: string = ''): Promise<any[]> {
  return ghFetch(token, `/repos/${owner}/${repo}/contents/${path}`);
}

export async function getFileContent(token: string, owner: string, repo: string, path: string): Promise<string> {
  const data = await ghFetch(token, `/repos/${owner}/${repo}/contents/${path}`);
  return atob(data.content.replace(/\n/g, ''));
}

export async function createIssue(token: string, owner: string, repo: string, title: string, body: string, labels?: string[]) {
  return ghFetch(token, `/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    body: JSON.stringify({ title, body, labels }),
  });
}

export async function createPR(token: string, owner: string, repo: string, title: string, body: string, head: string, base: string) {
  return ghFetch(token, `/repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    body: JSON.stringify({ title, body, head, base }),
  });
}

export async function getRepoStats(token: string, owner: string, repo: string) {
  const [contributors, languages, branches] = await Promise.allSettled([
    ghFetch(token, `/repos/${owner}/${repo}/contributors?per_page=10`),
    ghFetch(token, `/repos/${owner}/${repo}/languages`),
    ghFetch(token, `/repos/${owner}/${repo}/branches?per_page=20`),
  ]);
  return {
    contributors: contributors.status === 'fulfilled' ? contributors.value : [],
    languages: languages.status === 'fulfilled' ? languages.value : {},
    branches: branches.status === 'fulfilled' ? branches.value : [],
  };
}

export async function searchCode(token: string, query: string, repo?: string): Promise<any[]> {
  const q = repo ? `${query}+repo:${repo}` : query;
  const data = await ghFetch(token, `/search/code?q=${encodeURIComponent(q)}&per_page=20`);
  return data.items || [];
}

export async function triggerWorkflow(token: string, owner: string, repo: string, workflowId: string, ref: string, inputs?: Record<string, string>) {
  return ghFetch(token, `/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, {
    method: 'POST',
    body: JSON.stringify({ ref, inputs }),
  });
}

export async function getWorkflows(token: string, owner: string, repo: string) {
  const data = await ghFetch(token, `/repos/${owner}/${repo}/actions/workflows`);
  return data.workflows || [];
}

export async function getWorkflowRuns(token: string, owner: string, repo: string) {
  const data = await ghFetch(token, `/repos/${owner}/${repo}/actions/runs?per_page=20`);
  return data.workflow_runs || [];
}
