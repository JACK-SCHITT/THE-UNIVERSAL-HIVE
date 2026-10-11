import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { DEFAULT_SOUL_PILLARS } from '@/constants/defaultSoulData';
import type { SoulPillar, NavTab, VaultToken } from '@/types';

interface HiveContextType {
  // Soul
  pillars: SoulPillar[];
  loading: boolean;
  syncing: boolean;
  lastSync: string | null;
  savePillar: (pillar: SoulPillar) => Promise<void>;
  syncNow: () => Promise<void>;

  // Navigation
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;

  // Primary keys (localStorage, fast access)
  githubToken: string;
  grokKey: string;
  claudeKey: string;
  setGithubToken: (token: string) => void;
  setGrokKey: (key: string) => void;
  setClaudeKey: (key: string) => void;

  // Token vault (multi-account, persisted in DB)
  vault: VaultToken[];
  vaultLoading: boolean;
  addVaultToken: (token: Omit<VaultToken, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateVaultToken: (id: string, updates: Partial<VaultToken>) => Promise<void>;
  deleteVaultToken: (id: string) => Promise<void>;
  getVaultByCategory: (category: VaultToken['category']) => VaultToken[];
}

const HiveContext = createContext<HiveContextType | null>(null);

export function HiveProvider({ children }: { children: React.ReactNode }) {
  const [pillars, setPillars] = useState<SoulPillar[]>(DEFAULT_SOUL_PILLARS);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('foundry');

  // Vault state
  const [vault, setVault] = useState<VaultToken[]>([]);
  const [vaultLoading, setVaultLoading] = useState(true);

  // Primary keys — localStorage for instant access
  const [githubToken, setGithubTokenState] = useState(() => localStorage.getItem('hive_gh_token') || '');
  const [grokKey, setGrokKeyState] = useState(() => localStorage.getItem('hive_grok_key') || '');
  const [claudeKey, setClaudeKeyState] = useState(() => localStorage.getItem('hive_claude_key') || '');

  const setGithubToken = (token: string) => {
    localStorage.setItem('hive_gh_token', token);
    setGithubTokenState(token);
  };
  const setGrokKey = (key: string) => {
    localStorage.setItem('hive_grok_key', key);
    setGrokKeyState(key);
  };
  const setClaudeKey = (key: string) => {
    localStorage.setItem('hive_claude_key', key);
    setClaudeKeyState(key);
  };

  // ── Soul Pillars ──────────────────────────────────────────────────────
  const fetchPillars = useCallback(async () => {
    const { data, error } = await supabase.from('soul_pillars').select('*');
    if (!error && data && data.length > 0) {
      setPillars(data as SoulPillar[]);
    } else {
      const toInsert = DEFAULT_SOUL_PILLARS.map(p => ({ id: p.id, pillar_name: p.pillar_name, content: p.content }));
      await supabase.from('soul_pillars').upsert(toInsert);
    }
    setLastSync(new Date().toLocaleTimeString());
    setLoading(false);
  }, []);

  useEffect(() => { fetchPillars(); }, [fetchPillars]);

  const savePillar = async (pillar: SoulPillar) => {
    setSyncing(true);
    const { error } = await supabase.from('soul_pillars').upsert({
      id: pillar.id,
      pillar_name: pillar.pillar_name,
      content: pillar.content,
      updated_at: new Date().toISOString(),
    });
    if (!error) {
      setPillars(prev => prev.map(p => p.id === pillar.id ? { ...pillar, updated_at: new Date().toISOString() } : p));
      setLastSync(new Date().toLocaleTimeString());
    }
    setSyncing(false);
  };

  const syncNow = async () => {
    setSyncing(true);
    await Promise.all([fetchPillars(), fetchVault()]);
    setSyncing(false);
  };

  // ── Token Vault ───────────────────────────────────────────────────────
  const fetchVault = useCallback(async () => {
    setVaultLoading(true);
    const { data, error } = await supabase
      .from('token_vault')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setVault(data as VaultToken[]);
    setVaultLoading(false);
  }, []);

  useEffect(() => { fetchVault(); }, [fetchVault]);

  const addVaultToken = async (token: Omit<VaultToken, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('token_vault')
      .insert({ ...token, meta: token.meta || {} })
      .select()
      .single();
    if (!error && data) setVault(prev => [data as VaultToken, ...prev]);
  };

  const updateVaultToken = async (id: string, updates: Partial<VaultToken>) => {
    const { error } = await supabase
      .from('token_vault')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) setVault(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteVaultToken = async (id: string) => {
    const { error } = await supabase.from('token_vault').delete().eq('id', id);
    if (!error) setVault(prev => prev.filter(t => t.id !== id));
  };

  const getVaultByCategory = (category: VaultToken['category']) =>
    vault.filter(t => t.category === category && t.active);

  return (
    <HiveContext.Provider value={{
      pillars, loading, syncing, lastSync,
      savePillar, syncNow,
      activeTab, setActiveTab,
      githubToken, grokKey, claudeKey,
      setGithubToken, setGrokKey, setClaudeKey,
      vault, vaultLoading,
      addVaultToken, updateVaultToken, deleteVaultToken, getVaultByCategory,
    }}>
      {children}
    </HiveContext.Provider>
  );
}

export function useHive() {
  const ctx = useContext(HiveContext);
  if (!ctx) throw new Error('useHive must be used within HiveProvider');
  return ctx;
}
