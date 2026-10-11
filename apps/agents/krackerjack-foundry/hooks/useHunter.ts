// KRACKERJACK AI — useHunter Hook (Real GitHub API)

import { useState, useCallback, useEffect } from 'react';
import { GitHubRepo, fetchUserRepos, fetchGitHubUser, GitHubUser, timeAgo } from '@/services/githubService';
import { loadGHToken, loadAssimilated, saveAssimilated } from '@/services/storageService';
import { LogEntry, generateLogId, getTimestamp } from '@/services/mockData';

export function useHunter() {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [assimilatedIds, setAssimilatedIds] = useState<Set<string>>([]);
  const [log, setLog] = useState<LogEntry[]>([
    { id: 'l0', timestamp: getTimestamp(), type: 'info', message: 'KRACKERJACK AI HIVE initialized.' },
    { id: 'l1', timestamp: getTimestamp(), type: 'success', message: 'HunterPrime agent online. Awaiting token...' },
  ]);
  const [isAssimilating, setIsAssimilating] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hiveStrength, setHiveStrength] = useState(0);
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);
  const [hasToken, setHasToken] = useState(false);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setLog(prev => [...prev, { id: generateLogId(), timestamp: getTimestamp(), type, message }]);
  }, []);

  const loadRepos = useCallback(async (token?: string) => {
    const ghToken = token || (await loadGHToken());
    if (!ghToken) {
      addLog('No GitHub token found. Add one in Config tab.', 'warning');
      return;
    }
    setHasToken(true);
    setIsLoading(true);
    addLog('Connecting to GitHub API...', 'info');

    const [userResult, repoResult, savedIds] = await Promise.all([
      fetchGitHubUser(ghToken),
      fetchUserRepos(ghToken),
      loadAssimilated(),
    ]);

    if (userResult.data) {
      setGithubUser(userResult.data);
      addLog(`Authenticated as @${userResult.data.login} — ${userResult.data.public_repos} repos found.`, 'success');
    }

    if (repoResult.error) {
      addLog(`GitHub error: ${repoResult.error}`, 'danger');
      setIsLoading(false);
      return;
    }

    const repoData = repoResult.data ?? [];
    setRepos(repoData);

    const idsSet = new Set<string>(savedIds.map(String));
    setAssimilatedIds(idsSet);

    const assimCount = repoData.filter(r => idsSet.has(String(r.id))).length;
    const strength = repoData.length > 0 ? Math.round((assimCount / repoData.length) * 100) : 0;
    setHiveStrength(strength);

    addLog(`${repoData.length} repos loaded. ${assimCount} already assimilated.`, 'success');
    if (repoData.length - assimCount > 0) {
      addLog(`${repoData.length - assimCount} targets awaiting assimilation.`, 'warning');
    }

    setIsLoading(false);
  }, [addLog]);

  useEffect(() => {
    loadRepos();
  }, [loadRepos]);

  const assimilateAll = useCallback(async () => {
    if (isAssimilating) return;
    const token = await loadGHToken();
    if (!token) { addLog('No GitHub token. Add one in Config tab.', 'danger'); return; }

    const pending = repos.filter(r => !assimilatedIds.has(String(r.id)));
    if (pending.length === 0) {
      addLog('All repos already assimilated. Hive is at peak strength.', 'success');
      return;
    }

    setIsAssimilating(true);
    addLog(`🔥 Full assimilation protocol: ${pending.length} targets...`, 'warning');

    const newIds = new Set(assimilatedIds);
    for (let i = 0; i < pending.length; i++) {
      const repo = pending[i];
      await new Promise(resolve => setTimeout(resolve, 400 + i * 100));
      addLog(`⚡ Assimilating ${repo.full_name}...`, 'info');
      await new Promise(resolve => setTimeout(resolve, 300));
      newIds.add(String(repo.id));
      addLog(`✅ ${repo.name} assimilated into Hive.`, 'success');
    }

    setAssimilatedIds(new Set(newIds));
    await saveAssimilated(Array.from(newIds));
    const strength = repos.length > 0 ? Math.round((newIds.size / repos.length) * 100) : 0;
    setHiveStrength(strength);
    addLog('🔥 All nodes synced. Hive at maximum strength.', 'success');
    setIsAssimilating(false);
  }, [repos, assimilatedIds, isAssimilating, addLog]);

  const scanTargets = useCallback(async () => {
    if (isScanning) return;
    const token = await loadGHToken();
    if (!token) { addLog('No GitHub token. Add one in Config tab.', 'danger'); return; }

    setIsScanning(true);
    addLog('🔍 HunterPrime scanning GitHub grid...', 'info');
    await loadRepos(token);
    addLog('Scan complete. Hive node map updated.', 'success');
    setIsScanning(false);
  }, [isScanning, loadRepos, addLog]);

  const assimilateSingle = useCallback(async (repoId: number) => {
    if (assimilatedIds.has(String(repoId))) return;
    const repo = repos.find(r => r.id === repoId);
    if (!repo) return;

    addLog(`⚡ Targeting ${repo.name}...`, 'info');
    await new Promise(resolve => setTimeout(resolve, 800));
    const newIds = new Set(assimilatedIds);
    newIds.add(String(repoId));
    setAssimilatedIds(newIds);
    await saveAssimilated(Array.from(newIds));
    const strength = repos.length > 0 ? Math.round((newIds.size / repos.length) * 100) : 0;
    setHiveStrength(strength);
    addLog(`✅ ${repo.name} fully assimilated. Strength: ${strength}%`, 'success');
  }, [repos, assimilatedIds, addLog]);

  const assimilatedCount = repos.filter(r => assimilatedIds.has(String(r.id))).length;
  const pendingCount = repos.length - assimilatedCount;

  const languageStats = repos.reduce<Record<string, number>>((acc, r) => {
    if (r.language) acc[r.language] = (acc[r.language] || 0) + 1;
    return acc;
  }, {});

  const topLanguages = Object.entries(languageStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);

  return {
    repos,
    log,
    isAssimilating,
    isScanning,
    isLoading,
    hiveStrength,
    assimilatedIds,
    assimilatedCount,
    pendingCount,
    githubUser,
    hasToken,
    topLanguages,
    totalStars,
    assimilateAll,
    scanTargets,
    assimilateSingle,
    refreshRepos: loadRepos,
  };
}
