// KRACKERJACK AI — Identity & Training Hook (with Knowledge Base)

import { useState, useCallback, useEffect } from 'react';
import {
  SoulVault,
  SoulPillar,
  NeuralMemory,
  TrainingEntry,
  PersonalityConfig,
  HiveDirective,
  ConsciousnessLogEntry,
  KnowledgeEntry,
  loadSoulVault,
  saveSoulVault,
  loadNeuralMemories,
  addNeuralMemory,
  deleteNeuralMemory,
  toggleNeuralMemory,
  loadTrainingEntries,
  addTrainingEntry,
  deleteTrainingEntry,
  approveTrainingEntry,
  loadPersonalityConfig,
  savePersonalityConfig,
  loadHiveDirectives,
  addHiveDirective,
  deleteHiveDirective,
  toggleHiveDirective,
  loadConsciousnessLog,
  logConsciousnessCycle,
  loadKnowledgeBase,
  addKnowledgeEntry,
  deleteKnowledgeEntry,
  toggleKnowledgeEntry,
  seedClawHubKnowledge,
} from '@/services/identityService';

export function useIdentity() {
  const [soulVault, setSoulVault] = useState<SoulVault | null>(null);
  const [memories, setMemories] = useState<NeuralMemory[]>([]);
  const [trainingEntries, setTrainingEntries] = useState<TrainingEntry[]>([]);
  const [personality, setPersonality] = useState<PersonalityConfig | null>(null);
  const [directives, setDirectives] = useState<HiveDirective[]>([]);
  const [consciousnessLog, setConsciousnessLog] = useState<ConsciousnessLogEntry[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [vault, mems, training, pers, dirs, clog, kb] = await Promise.all([
      loadSoulVault(),
      loadNeuralMemories(),
      loadTrainingEntries(),
      loadPersonalityConfig(),
      loadHiveDirectives(),
      loadConsciousnessLog(),
      loadKnowledgeBase(),
    ]);
    setSoulVault(vault);
    setMemories(mems);
    setTrainingEntries(training);
    setPersonality(pers);
    setDirectives(dirs);
    setConsciousnessLog(clog);
    setKnowledgeBase(kb);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Soul Vault ──────────────────────────────────────────────────────────────
  const updateSoulPillar = useCallback(async (pillar: SoulPillar, content: string) => {
    if (!soulVault) return;
    const updated = { ...soulVault, [pillar]: content, lastUpdated: new Date().toISOString() };
    setSoulVault(updated);
    await saveSoulVault(updated);
    await logConsciousnessCycle('MODIFY', `Soul pillar updated: ${pillar.toUpperCase()}`);
  }, [soulVault]);

  // ── Neural Memory ───────────────────────────────────────────────────────────
  const addMemory = useCallback(async (
    content: string,
    category: NeuralMemory['category'],
    importance: NeuralMemory['importance'],
    tags: string[] = []
  ) => {
    const mem = await addNeuralMemory(content, category, importance, tags);
    setMemories(prev => [mem, ...prev]);
    await logConsciousnessCycle('LEARN', `Neural memory added [${category}|★${importance}]: ${content.slice(0, 60)}`);
    return mem;
  }, []);

  const removeMemory = useCallback(async (id: string) => {
    await deleteNeuralMemory(id);
    setMemories(prev => prev.filter(m => m.id !== id));
  }, []);

  const flipMemory = useCallback(async (id: string) => {
    await toggleNeuralMemory(id);
    setMemories(prev => prev.map(m => m.id === id ? { ...m, active: !m.active } : m));
  }, []);

  // ── Training ────────────────────────────────────────────────────────────────
  const addTraining = useCallback(async (
    prompt: string,
    idealResponse: string,
    category: TrainingEntry['category'],
    notes: string = ''
  ) => {
    const entry = await addTrainingEntry(prompt, idealResponse, category, notes);
    setTrainingEntries(prev => [entry, ...prev]);
    await logConsciousnessCycle('LEARN', `Training entry added [${category}]: "${prompt.slice(0, 50)}"`);
    return entry;
  }, []);

  const removeTraining = useCallback(async (id: string) => {
    await deleteTrainingEntry(id);
    setTrainingEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const flipTrainingApproval = useCallback(async (id: string, approved: boolean) => {
    await approveTrainingEntry(id, approved);
    setTrainingEntries(prev => prev.map(e => e.id === id ? { ...e, approved } : e));
  }, []);

  // ── Personality ─────────────────────────────────────────────────────────────
  const updatePersonality = useCallback(async (config: PersonalityConfig) => {
    setPersonality(config);
    await savePersonalityConfig(config);
    await logConsciousnessCycle('MODIFY', 'Personality calibration updated by Architect');
  }, []);

  // ── Directives ──────────────────────────────────────────────────────────────
  const addDirective = useCallback(async (directive: string, priority: HiveDirective['priority']) => {
    const d = await addHiveDirective(directive, priority);
    setDirectives(prev => [d, ...prev]);
    await logConsciousnessCycle('PLAN', `New ${priority} directive added: ${directive.slice(0, 60)}`);
    return d;
  }, []);

  const removeDirective = useCallback(async (id: string) => {
    await deleteHiveDirective(id);
    setDirectives(prev => prev.filter(d => d.id !== id));
  }, []);

  const flipDirective = useCallback(async (id: string) => {
    await toggleHiveDirective(id);
    setDirectives(prev => prev.map(d => d.id === id ? { ...d, active: !d.active } : d));
  }, []);

  // ── Consciousness ───────────────────────────────────────────────────────────
  const logCycle = useCallback(async (state: ConsciousnessLogEntry['state'], notes: string) => {
    await logConsciousnessCycle(state, notes);
    const updated = await loadConsciousnessLog();
    setConsciousnessLog(updated);
  }, []);

  // ── Knowledge Base ──────────────────────────────────────────────────────────
  const addKnowledge = useCallback(async (title: string, content: string, source: string) => {
    const entry = await addKnowledgeEntry(title, content, source);
    setKnowledgeBase(prev => [entry, ...prev]);
    await logConsciousnessCycle('LEARN', `Knowledge entry added: ${title}`);
    return entry;
  }, []);

  const removeKnowledge = useCallback(async (id: string) => {
    await deleteKnowledgeEntry(id);
    setKnowledgeBase(prev => prev.filter(e => e.id !== id));
  }, []);

  const flipKnowledge = useCallback(async (id: string) => {
    await toggleKnowledgeEntry(id);
    setKnowledgeBase(prev => prev.map(e => e.id === id ? { ...e, active: !e.active } : e));
  }, []);

  const importClawHubKnowledge = useCallback(async () => {
    const seeded = await seedClawHubKnowledge();
    if (seeded) {
      const updated = await loadKnowledgeBase();
      setKnowledgeBase(updated);
      await logConsciousnessCycle('LEARN', 'ClawHub CLI reference imported into Knowledge Base');
    }
    return seeded;
  }, []);

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = {
    totalMemories: memories.length,
    activeMemories: memories.filter(m => m.active).length,
    highPriorityMemories: memories.filter(m => m.importance >= 4).length,
    totalTraining: trainingEntries.length,
    approvedTraining: trainingEntries.filter(e => e.approved).length,
    totalDirectives: directives.length,
    activeDirectives: directives.filter(d => d.active).length,
    conscienceCycles: consciousnessLog.length,
    knowledgeEntries: knowledgeBase.length,
    activeKnowledge: knowledgeBase.filter(e => e.active).length,
    lastPillarUpdate: soulVault?.lastUpdated ?? null,
  };

  return {
    loading,
    soulVault,
    memories,
    trainingEntries,
    personality,
    directives,
    consciousnessLog,
    knowledgeBase,
    stats,
    // Actions
    updateSoulPillar,
    addMemory,
    removeMemory,
    flipMemory,
    addTraining,
    removeTraining,
    flipTrainingApproval,
    updatePersonality,
    addDirective,
    removeDirective,
    flipDirective,
    logCycle,
    addKnowledge,
    removeKnowledge,
    flipKnowledge,
    importClawHubKnowledge,
    reload: loadAll,
  };
}
