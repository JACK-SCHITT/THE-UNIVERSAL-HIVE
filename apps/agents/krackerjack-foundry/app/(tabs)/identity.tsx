// KRACKERJACK AI — Identity Command Center
// Soul Vault | Neural Memory | Training Engine | Consciousness Protocol | Knowledge Base

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { useAlert } from '@/template';
import { useIdentity } from '@/hooks/useIdentity';
import type { SoulPillar, NeuralMemory, TrainingEntry, HiveDirective, PersonalityConfig } from '@/services/identityService';

// ── Tab config ────────────────────────────────────────────────────────────────
type IdentityTab = 'soul' | 'memory' | 'training' | 'directives' | 'personality' | 'knowledge' | 'consciousness';

const TABS: { key: IdentityTab; label: string; icon: string; color: string }[] = [
  { key: 'soul',          label: 'SOUL',    icon: 'self-improvement',  color: '#a78bfa' },
  { key: 'memory',        label: 'MEMORY',  icon: 'memory',            color: Colors.primary },
  { key: 'training',      label: 'TRAIN',   icon: 'school',            color: Colors.accent },
  { key: 'knowledge',     label: 'KNOWLEDGE',icon: 'local-library',    color: '#34d399' },
  { key: 'directives',    label: 'DIR',     icon: 'policy',            color: Colors.danger },
  { key: 'personality',   label: 'PERSONA', icon: 'tune',              color: Colors.info },
  { key: 'consciousness', label: 'CYCLES',  icon: 'psychology',        color: '#ff6b35' },
];

const SOUL_PILLARS: { key: SoulPillar; label: string; icon: string; color: string; desc: string }[] = [
  { key: 'constitution',  label: 'CONSTITUTION',   icon: 'gavel',               color: Colors.danger,   desc: 'Moral axioms, hard rules, non-negotiables' },
  { key: 'identity',      label: 'IDENTITY',       icon: 'fingerprint',         color: '#a78bfa',       desc: 'Who KRACKERJACK AI is at the core' },
  { key: 'goals',         label: 'GOALS',          icon: 'flag',                color: Colors.primary,  desc: 'Mission, macro objectives, current priorities' },
  { key: 'relationships', label: 'RELATIONSHIPS',  icon: 'hub',                 color: Colors.accent,   desc: 'Architect, trusted nodes, adversaries' },
  { key: 'opinions',      label: 'OPINIONS',       icon: 'record-voice-over',   color: Colors.info,     desc: 'Views on tech, people, life, the game' },
  { key: 'reflections',   label: 'REFLECTIONS',    icon: 'auto-awesome',        color: '#34d399',       desc: 'Current state, growth direction' },
  { key: 'core_memories', label: 'CORE MEMORIES',  icon: 'local-fire-department', color: '#ff6b35',     desc: 'Stories that shaped the Architect' },
];

const MEMORY_CATEGORIES: { key: NeuralMemory['category']; label: string; color: string }[] = [
  { key: 'fact',       label: 'FACT',       color: Colors.info },
  { key: 'lesson',     label: 'LESSON',     color: Colors.accent },
  { key: 'context',    label: 'CONTEXT',    color: Colors.primary },
  { key: 'directive',  label: 'DIRECTIVE',  color: Colors.danger },
  { key: 'story',      label: 'STORY',      color: '#ff6b35' },
  { key: 'connection', label: 'CONNECTION', color: '#a78bfa' },
];

const TRAINING_CATEGORIES: { key: TrainingEntry['category']; label: string; color: string }[] = [
  { key: 'tone',       label: 'TONE',       color: '#a78bfa' },
  { key: 'knowledge',  label: 'KNOWLEDGE',  color: Colors.info },
  { key: 'correction', label: 'CORRECTION', color: Colors.danger },
  { key: 'style',      label: 'STYLE',      color: Colors.accent },
  { key: 'directive',  label: 'DIRECTIVE',  color: Colors.primary },
];

const DIRECTIVE_PRIORITIES: { key: HiveDirective['priority']; color: string }[] = [
  { key: 'ABSOLUTE', color: Colors.danger },
  { key: 'HIGH',     color: Colors.accent },
  { key: 'STANDARD', color: Colors.primary },
  { key: 'CONTEXT',  color: Colors.info },
];

const CONSCIOUSNESS_STATES = ['SENSE','DESIRE','THINK','PLAN','ACT','LEARN','MODIFY','REFLECT'] as const;

export default function IdentityScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const identity = useIdentity();

  const [activeTab, setActiveTab] = useState<IdentityTab>('soul');
  const [editingPillar, setEditingPillar] = useState<SoulPillar | null>(null);
  const [pillarDraft, setPillarDraft] = useState('');
  const [saving, setSaving] = useState(false);

  // Memory form
  const [memContent, setMemContent] = useState('');
  const [memCategory, setMemCategory] = useState<NeuralMemory['category']>('fact');
  const [memImportance, setMemImportance] = useState<NeuralMemory['importance']>(3);
  const [memTags, setMemTags] = useState('');

  // Training form
  const [trainPrompt, setTrainPrompt] = useState('');
  const [trainResponse, setTrainResponse] = useState('');
  const [trainCategory, setTrainCategory] = useState<TrainingEntry['category']>('tone');
  const [trainNotes, setTrainNotes] = useState('');

  // Directive form
  const [dirText, setDirText] = useState('');
  const [dirPriority, setDirPriority] = useState<HiveDirective['priority']>('STANDARD');

  // Consciousness cycle form
  const [cycleState, setCycleState] = useState<typeof CONSCIOUSNESS_STATES[number]>('REFLECT');
  const [cycleNotes, setCycleNotes] = useState('');

  // Knowledge form
  const [kbTitle, setKbTitle] = useState('');
  const [kbContent, setKbContent] = useState('');
  const [kbSource, setKbSource] = useState('');
  const [importingClawhub, setImportingClawhub] = useState(false);

  // ── Pillar editor ─────────────────────────────────────────────────────────
  const openPillar = (pillar: SoulPillar) => {
    if (!identity.soulVault) return;
    setEditingPillar(pillar);
    setPillarDraft(identity.soulVault[pillar]);
  };

  const savePillar = async () => {
    if (!editingPillar) return;
    setSaving(true);
    await identity.updateSoulPillar(editingPillar, pillarDraft);
    setSaving(false);
    setEditingPillar(null);
    showAlert('Soul Updated', `${editingPillar.toUpperCase()} saved to vault.`);
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleAddMemory = async () => {
    if (!memContent.trim()) return;
    const tags = memTags.split(',').map(t => t.trim()).filter(Boolean);
    await identity.addMemory(memContent.trim(), memCategory, memImportance, tags);
    setMemContent('');
    setMemTags('');
    showAlert('Memory Saved', `Neural memory [★${memImportance}] logged.`);
  };

  const handleAddTraining = async () => {
    if (!trainPrompt.trim() || !trainResponse.trim()) {
      showAlert('Missing Fields', 'Both prompt and ideal response required.');
      return;
    }
    await identity.addTraining(trainPrompt.trim(), trainResponse.trim(), trainCategory, trainNotes.trim());
    setTrainPrompt('');
    setTrainResponse('');
    setTrainNotes('');
    showAlert('Training Saved', `KRACKERJACK AI is learning — ${trainCategory.toUpperCase()} pattern active immediately.`);
  };

  const handleAddDirective = async () => {
    if (!dirText.trim()) return;
    await identity.addDirective(dirText.trim(), dirPriority);
    setDirText('');
    showAlert('Directive Active', `[${dirPriority}] injected into all future responses.`);
  };

  const handleLogCycle = async () => {
    if (!cycleNotes.trim()) return;
    await identity.logCycle(cycleState, cycleNotes.trim());
    setCycleNotes('');
    showAlert('Cycle Logged', `Consciousness cycle: ${cycleState}`);
  };

  const handlePersonalityChange = async (key: keyof PersonalityConfig, value: number | string) => {
    if (!identity.personality) return;
    const updated = { ...identity.personality, [key]: value } as PersonalityConfig;
    await identity.updatePersonality(updated);
  };

  const handleAddKnowledge = async () => {
    if (!kbTitle.trim() || !kbContent.trim()) {
      showAlert('Missing Fields', 'Title and content required.');
      return;
    }
    await identity.addKnowledge(kbTitle.trim(), kbContent.trim(), kbSource.trim() || 'manual');
    setKbTitle('');
    setKbContent('');
    setKbSource('');
    showAlert('Knowledge Saved', 'Entry added to knowledge base. Injecting into all future prompts.');
  };

  const handleImportClawHub = async () => {
    setImportingClawhub(true);
    const seeded = await identity.importClawHubKnowledge();
    setImportingClawhub(false);
    if (seeded) {
      showAlert('ClawHub CLI Imported', '3 knowledge entries added: Install/Auth, Skill Commands, Package Commands. All active.');
    } else {
      showAlert('Already Imported', 'ClawHub CLI reference is already in the knowledge base.');
    }
  };

  // ── Pillar editor (full screen) ───────────────────────────────────────────
  if (editingPillar && identity.soulVault) {
    const cfg = SOUL_PILLARS.find(p => p.key === editingPillar)!;
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: Colors.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.pillarEditorHeader, { paddingTop: insets.top + Spacing.sm }]}>
          <Pressable onPress={() => setEditingPillar(null)} style={styles.backRow} hitSlop={8}>
            <MaterialIcons name="arrow-back" size={18} color={Colors.textMuted} />
            <Text style={styles.backLabel}>SOUL VAULT</Text>
          </Pressable>
          <View style={styles.pillarEditorTitle}>
            <MaterialIcons name={cfg.icon as any} size={16} color={cfg.color} />
            <Text style={[styles.pillarEditorTitleText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <Pressable onPress={savePillar} disabled={saving}
            style={({ pressed }) => [styles.savePillarBtn, pressed && { opacity: 0.7 }]}>
            {saving
              ? <ActivityIndicator size="small" color="#000" />
              : <Text style={styles.savePillarBtnText}>SAVE</Text>}
          </Pressable>
        </View>
        <Text style={styles.pillarDesc}>{cfg.desc}</Text>
        <TextInput
          style={styles.pillarTextArea}
          value={pillarDraft}
          onChangeText={setPillarDraft}
          multiline
          autoFocus
          textAlignVertical="top"
          placeholder={`Edit ${cfg.label.toLowerCase()}...`}
          placeholderTextColor={Colors.textMuted}
        />
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.aiIcon}>
            <MaterialIcons name="self-improvement" size={18} color="#a78bfa" />
          </View>
          <View>
            <Text style={styles.headerTitle}>KRACKERJACK AI</Text>
            <Text style={styles.headerSub}>IDENTITY COMMAND CENTER · TRAINING ACTIVE</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Text style={styles.statNum}>{identity.stats.activeMemories}</Text>
            <Text style={styles.statLbl}>MEM</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statNum}>{identity.stats.approvedTraining}</Text>
            <Text style={styles.statLbl}>TRAIN</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statNum}>{identity.stats.activeKnowledge}</Text>
            <Text style={styles.statLbl}>KB</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statNum}>{identity.stats.activeDirectives}</Text>
            <Text style={styles.statLbl}>DIR</Text>
          </View>
        </View>
      </View>

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable key={tab.key}
              style={[styles.tab, isActive && { borderBottomColor: tab.color, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab.key)}>
              <MaterialIcons name={tab.icon as any} size={13} color={isActive ? tab.color : Colors.textMuted} />
              <Text style={[styles.tabLabel, isActive && { color: tab.color }]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {identity.loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#a78bfa" />
          <Text style={styles.loadingText}>Loading soul vault...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── SOUL TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'soul' && identity.soulVault ? (
            <View style={styles.tabContent}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="info-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.sectionInfo}>
                  7 pillars define the soul. Tap any pillar to edit. Changes inject into every chat response automatically.
                </Text>
              </View>
              {SOUL_PILLARS.map(pillar => (
                <Pressable key={pillar.key}
                  style={({ pressed }) => [styles.pillarCard, pressed && { opacity: 0.8 }, { borderLeftColor: pillar.color }]}
                  onPress={() => openPillar(pillar.key)}>
                  <View style={styles.pillarCardTop}>
                    <View style={[styles.pillarIcon, { backgroundColor: pillar.color + '22', borderColor: pillar.color + '44' }]}>
                      <MaterialIcons name={pillar.icon as any} size={14} color={pillar.color} />
                    </View>
                    <View style={styles.pillarCardInfo}>
                      <Text style={[styles.pillarCardTitle, { color: pillar.color }]}>{pillar.label}</Text>
                      <Text style={styles.pillarCardDesc}>{pillar.desc}</Text>
                    </View>
                    <MaterialIcons name="edit" size={14} color={Colors.textMuted} />
                  </View>
                  <Text style={styles.pillarPreview} numberOfLines={2}>{identity.soulVault![pillar.key]}</Text>
                </Pressable>
              ))}
              {identity.soulVault.lastUpdated ? (
                <Text style={styles.lastUpdated}>Last updated: {new Date(identity.soulVault.lastUpdated).toLocaleString()}</Text>
              ) : null}
            </View>
          ) : null}

          {/* ── MEMORY TAB ──────────────────────────────────────────────── */}
          {activeTab === 'memory' ? (
            <View style={styles.tabContent}>
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>⚡ ADD NEURAL MEMORY</Text>
                <Text style={styles.fieldLabel}>MEMORY CONTENT</Text>
                <TextInput style={styles.textArea} value={memContent} onChangeText={setMemContent}
                  placeholder="Facts, lessons, context, stories — anything KRACKERJACK AI must always know..."
                  placeholderTextColor={Colors.textMuted} multiline textAlignVertical="top" />
                <Text style={styles.fieldLabel}>CATEGORY</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {MEMORY_CATEGORIES.map(c => (
                    <Pressable key={c.key}
                      style={[styles.chip, memCategory === c.key && { borderColor: c.color, backgroundColor: c.color + '22' }]}
                      onPress={() => setMemCategory(c.key)}>
                      <Text style={[styles.chipText, memCategory === c.key && { color: c.color }]}>{c.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Text style={styles.fieldLabel}>IMPORTANCE (★{memImportance})</Text>
                <View style={styles.importanceRow}>
                  {([1,2,3,4,5] as NeuralMemory['importance'][]).map(i => (
                    <Pressable key={i}
                      style={[styles.importanceBtn, memImportance === i && styles.importanceBtnActive]}
                      onPress={() => setMemImportance(i)}>
                      <Text style={[styles.importanceBtnText, memImportance === i && { color: Colors.accent }]}>★{i}</Text>
                    </Pressable>
                  ))}
                </View>
                {memImportance >= 4 ? <Text style={styles.importanceHint}>★4-5 inject into EVERY prompt automatically</Text> : null}
                <Text style={styles.fieldLabel}>TAGS (comma-separated)</Text>
                <TextInput style={styles.input} value={memTags} onChangeText={setMemTags}
                  placeholder="architecture, lessons, github..." placeholderTextColor={Colors.textMuted} autoCapitalize="none" />
                <Pressable style={[styles.actionBtn, !memContent.trim() && { opacity: 0.4 }]}
                  onPress={handleAddMemory} disabled={!memContent.trim()}>
                  <MaterialIcons name="memory" size={15} color="#000" />
                  <Text style={styles.actionBtnText}>SAVE TO NEURAL MEMORY</Text>
                </Pressable>
              </View>
              <Text style={styles.listHeader}>ACTIVE: {identity.stats.activeMemories} / TOTAL: {identity.stats.totalMemories}</Text>
              {identity.memories.length === 0 ? (
                <View style={styles.emptyBox}>
                  <MaterialIcons name="memory" size={32} color={Colors.textMuted} />
                  <Text style={styles.emptyText}>No memories yet. Start teaching the Hive.</Text>
                </View>
              ) : (
                identity.memories.map(mem => {
                  const catColor = MEMORY_CATEGORIES.find(c => c.key === mem.category)?.color ?? Colors.textMuted;
                  return (
                    <View key={mem.id} style={[styles.memCard, !mem.active && styles.memCardInactive]}>
                      <View style={styles.memCardHeader}>
                        <View style={[styles.catBadge, { borderColor: catColor, backgroundColor: catColor + '22' }]}>
                          <Text style={[styles.catBadgeText, { color: catColor }]}>{mem.category.toUpperCase()}</Text>
                        </View>
                        <Text style={styles.importanceStar}>{'★'.repeat(mem.importance)}{'☆'.repeat(5 - mem.importance)}</Text>
                        <Pressable onPress={() => identity.flipMemory(mem.id)} hitSlop={8} style={styles.memToggle}>
                          <MaterialIcons name={mem.active ? 'toggle-on' : 'toggle-off'} size={20}
                            color={mem.active ? Colors.primary : Colors.textMuted} />
                        </Pressable>
                        <Pressable onPress={() => identity.removeMemory(mem.id)} hitSlop={8}>
                          <MaterialIcons name="close" size={14} color={Colors.textMuted} />
                        </Pressable>
                      </View>
                      <Text style={styles.memContent} selectable>{mem.content}</Text>
                      {mem.tags.length > 0 ? (
                        <View style={styles.memTags}>
                          {mem.tags.map(tag => (
                            <View key={tag} style={styles.memTag}>
                              <Text style={styles.memTagText}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      ) : null}
                      <Text style={styles.memMeta}>Added {new Date(mem.addedAt).toLocaleDateString()}</Text>
                    </View>
                  );
                })
              )}
            </View>
          ) : null}

          {/* ── TRAINING TAB ─────────────────────────────────────────────── */}
          {activeTab === 'training' ? (
            <View style={styles.tabContent}>
              {/* Training info banner */}
              <View style={[styles.trainingBanner]}>
                <MaterialIcons name="check-circle" size={14} color={Colors.primary} />
                <Text style={styles.trainingBannerText}>
                  {identity.stats.approvedTraining} approved examples active — injecting into every KRACKERJACK AI response
                </Text>
              </View>

              <View style={styles.panel}>
                <Text style={styles.panelTitle}>📚 ADD TRAINING EXAMPLE</Text>
                <Text style={styles.trainInfo}>
                  Teach KRACKERJACK AI exact behavioral patterns. These inject as few-shot examples into every prompt — real behavioral change, not just storage.
                </Text>
                <Text style={styles.fieldLabel}>CATEGORY</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {TRAINING_CATEGORIES.map(c => (
                    <Pressable key={c.key}
                      style={[styles.chip, trainCategory === c.key && { borderColor: c.color, backgroundColor: c.color + '22' }]}
                      onPress={() => setTrainCategory(c.key)}>
                      <Text style={[styles.chipText, trainCategory === c.key && { color: c.color }]}>{c.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Text style={styles.fieldLabel}>PROMPT / SCENARIO</Text>
                <TextInput style={styles.textArea} value={trainPrompt} onChangeText={setTrainPrompt}
                  placeholder="What the user says or asks..." placeholderTextColor={Colors.textMuted}
                  multiline textAlignVertical="top" />
                <Text style={styles.fieldLabel}>IDEAL KRACKERJACK AI RESPONSE</Text>
                <TextInput style={[styles.textArea, { minHeight: 100 }]} value={trainResponse} onChangeText={setTrainResponse}
                  placeholder="Exact tone, content, style, length — how KRACKERJACK AI should respond..."
                  placeholderTextColor={Colors.textMuted} multiline textAlignVertical="top" />
                <Text style={styles.fieldLabel}>NOTES (optional)</Text>
                <TextInput style={styles.input} value={trainNotes} onChangeText={setTrainNotes}
                  placeholder="Why this response is ideal..." placeholderTextColor={Colors.textMuted} />
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: Colors.accent }, (!trainPrompt.trim() || !trainResponse.trim()) && { opacity: 0.4 }]}
                  onPress={handleAddTraining} disabled={!trainPrompt.trim() || !trainResponse.trim()}>
                  <MaterialIcons name="school" size={15} color="#000" />
                  <Text style={styles.actionBtnText}>SAVE + ACTIVATE TRAINING</Text>
                </Pressable>
              </View>

              <Text style={styles.listHeader}>TRAINING EXAMPLES: {identity.stats.totalTraining} TOTAL · {identity.stats.approvedTraining} APPROVED</Text>
              {identity.trainingEntries.length === 0 ? (
                <View style={styles.emptyBox}>
                  <MaterialIcons name="school" size={32} color={Colors.textMuted} />
                  <Text style={styles.emptyText}>No training examples yet. Teach the AI your patterns.</Text>
                </View>
              ) : (
                identity.trainingEntries.map(entry => {
                  const catColor = TRAINING_CATEGORIES.find(c => c.key === entry.category)?.color ?? Colors.textMuted;
                  return (
                    <View key={entry.id} style={[styles.trainCard, !entry.approved && styles.trainCardDisabled]}>
                      <View style={styles.trainCardHeader}>
                        <View style={[styles.catBadge, { borderColor: catColor, backgroundColor: catColor + '22' }]}>
                          <Text style={[styles.catBadgeText, { color: catColor }]}>{entry.category.toUpperCase()}</Text>
                        </View>
                        {/* Approved toggle */}
                        <Pressable
                          onPress={() => identity.flipTrainingApproval(entry.id, !entry.approved)}
                          hitSlop={8}
                          style={[styles.approvedBadge, entry.approved ? styles.approvedOn : styles.approvedOff]}>
                          <MaterialIcons
                            name={entry.approved ? 'check-circle' : 'cancel'}
                            size={12}
                            color={entry.approved ? Colors.primary : Colors.textMuted} />
                          <Text style={[styles.approvedText, entry.approved && { color: Colors.primary }]}>
                            {entry.approved ? 'ACTIVE' : 'PAUSED'}
                          </Text>
                        </Pressable>
                        <Text style={styles.trainDate}>{new Date(entry.addedAt).toLocaleDateString()}</Text>
                        <Pressable onPress={() => identity.removeTraining(entry.id)} hitSlop={8}>
                          <MaterialIcons name="close" size={14} color={Colors.textMuted} />
                        </Pressable>
                      </View>
                      <Text style={styles.trainPromptLabel}>PROMPT:</Text>
                      <Text style={styles.trainPromptText} numberOfLines={2}>{entry.prompt}</Text>
                      <Text style={styles.trainResponseLabel}>IDEAL RESPONSE:</Text>
                      <Text style={styles.trainResponseText} numberOfLines={3}>{entry.idealResponse}</Text>
                      {entry.notes ? <Text style={styles.trainNotes}>NOTE: {entry.notes}</Text> : null}
                    </View>
                  );
                })
              )}
            </View>
          ) : null}

          {/* ── KNOWLEDGE BASE TAB ───────────────────────────────────────── */}
          {activeTab === 'knowledge' ? (
            <View style={styles.tabContent}>
              {/* ClawHub quick import */}
              <Pressable
                style={({ pressed }) => [styles.importCard, pressed && { opacity: 0.8 }]}
                onPress={handleImportClawHub}
                disabled={importingClawhub}>
                <View style={styles.importCardLeft}>
                  <View style={styles.importIcon}>
                    <MaterialIcons name="cloud-download" size={18} color="#34d399" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.importTitle}>IMPORT CLAWHUB CLI REFERENCE</Text>
                    <Text style={styles.importSub}>Install/Auth · Skill Commands · Package Commands — all injected into AI context</Text>
                  </View>
                </View>
                {importingClawhub
                  ? <ActivityIndicator size="small" color="#34d399" />
                  : <MaterialIcons name="download" size={18} color="#34d399" />}
              </Pressable>

              <View style={styles.panel}>
                <Text style={styles.panelTitle}>📖 ADD KNOWLEDGE ENTRY</Text>
                <Text style={styles.trainInfo}>
                  Knowledge base entries inject as structured reference material into every KRACKERJACK AI prompt. Use for CLI docs, APIs, frameworks, protocols, rules.
                </Text>
                <Text style={styles.fieldLabel}>TITLE</Text>
                <TextInput style={styles.input} value={kbTitle} onChangeText={setKbTitle}
                  placeholder="e.g. GitHub API Endpoints, React Native Rules..." placeholderTextColor={Colors.textMuted} />
                <Text style={styles.fieldLabel}>CONTENT</Text>
                <TextInput style={[styles.textArea, { minHeight: 120 }]} value={kbContent} onChangeText={setKbContent}
                  placeholder="The actual knowledge — commands, rules, syntax, docs summary..."
                  placeholderTextColor={Colors.textMuted} multiline textAlignVertical="top" />
                <Text style={styles.fieldLabel}>SOURCE (optional)</Text>
                <TextInput style={styles.input} value={kbSource} onChangeText={setKbSource}
                  placeholder="e.g. github.com/docs, manual, internal-spec..." placeholderTextColor={Colors.textMuted}
                  autoCapitalize="none" />
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: '#34d399' }, (!kbTitle.trim() || !kbContent.trim()) && { opacity: 0.4 }]}
                  onPress={handleAddKnowledge} disabled={!kbTitle.trim() || !kbContent.trim()}>
                  <MaterialIcons name="local-library" size={15} color="#000" />
                  <Text style={styles.actionBtnText}>ADD TO KNOWLEDGE BASE</Text>
                </Pressable>
              </View>

              <Text style={styles.listHeader}>KNOWLEDGE ENTRIES: {identity.stats.activeKnowledge} ACTIVE / {identity.stats.knowledgeEntries} TOTAL</Text>
              {identity.knowledgeBase.length === 0 ? (
                <View style={styles.emptyBox}>
                  <MaterialIcons name="local-library" size={32} color={Colors.textMuted} />
                  <Text style={styles.emptyText}>No knowledge entries. Import ClawHub or add custom entries above.</Text>
                </View>
              ) : (
                identity.knowledgeBase.map(entry => (
                  <View key={entry.id} style={[styles.kbCard, !entry.active && styles.memCardInactive, { borderLeftColor: '#34d399' }]}>
                    <View style={styles.kbCardHeader}>
                      <View style={[styles.catBadge, { borderColor: '#34d399', backgroundColor: '#34d39922' }]}>
                        <Text style={[styles.catBadgeText, { color: '#34d399' }]}>{entry.source.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.kbTitle}>{entry.title}</Text>
                      <Pressable onPress={() => identity.flipKnowledge(entry.id)} hitSlop={8} style={styles.memToggle}>
                        <MaterialIcons name={entry.active ? 'toggle-on' : 'toggle-off'} size={20}
                          color={entry.active ? '#34d399' : Colors.textMuted} />
                      </Pressable>
                      <Pressable onPress={() => identity.removeKnowledge(entry.id)} hitSlop={8}>
                        <MaterialIcons name="close" size={14} color={Colors.textMuted} />
                      </Pressable>
                    </View>
                    <Text style={styles.kbContent} numberOfLines={4} selectable>{entry.content}</Text>
                    <Text style={styles.memMeta}>Added {new Date(entry.addedAt).toLocaleDateString()}</Text>
                  </View>
                ))
              )}
            </View>
          ) : null}

          {/* ── DIRECTIVES TAB ───────────────────────────────────────────── */}
          {activeTab === 'directives' ? (
            <View style={styles.tabContent}>
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>📋 ADD HIVE DIRECTIVE</Text>
                <Text style={styles.trainInfo}>
                  ABSOLUTE = cannot be overridden. HIGH = overrides defaults. STANDARD = normal. CONTEXT = when relevant.
                </Text>
                <Text style={styles.fieldLabel}>PRIORITY</Text>
                <View style={styles.priorityRow}>
                  {DIRECTIVE_PRIORITIES.map(p => (
                    <Pressable key={p.key}
                      style={[styles.priorityBtn, dirPriority === p.key && { borderColor: p.color, backgroundColor: p.color + '22' }]}
                      onPress={() => setDirPriority(p.key)}>
                      <Text style={[styles.priorityBtnText, dirPriority === p.key && { color: p.color }]}>{p.key}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.fieldLabel}>DIRECTIVE</Text>
                <TextInput style={styles.textArea} value={dirText} onChangeText={setDirText}
                  placeholder="What KRACKERJACK AI must always do, remember, or never do..."
                  placeholderTextColor={Colors.textMuted} multiline textAlignVertical="top" />
                <Pressable style={[styles.actionBtn, { backgroundColor: Colors.danger }, !dirText.trim() && { opacity: 0.4 }]}
                  onPress={handleAddDirective} disabled={!dirText.trim()}>
                  <MaterialIcons name="policy" size={15} color="#fff" />
                  <Text style={[styles.actionBtnText, { color: '#fff' }]}>INJECT DIRECTIVE</Text>
                </Pressable>
              </View>
              <Text style={styles.listHeader}>ACTIVE: {identity.stats.activeDirectives} / TOTAL: {identity.stats.totalDirectives}</Text>
              {identity.directives.length === 0 ? (
                <View style={styles.emptyBox}>
                  <MaterialIcons name="policy" size={32} color={Colors.textMuted} />
                  <Text style={styles.emptyText}>No directives. Set the rules for the Hive.</Text>
                </View>
              ) : (
                identity.directives.map(dir => {
                  const prColor = DIRECTIVE_PRIORITIES.find(p => p.key === dir.priority)?.color ?? Colors.textMuted;
                  return (
                    <View key={dir.id} style={[styles.dirCard, !dir.active && styles.memCardInactive, { borderLeftColor: prColor }]}>
                      <View style={styles.memCardHeader}>
                        <View style={[styles.catBadge, { borderColor: prColor, backgroundColor: prColor + '22' }]}>
                          <Text style={[styles.catBadgeText, { color: prColor }]}>{dir.priority}</Text>
                        </View>
                        <Pressable onPress={() => identity.flipDirective(dir.id)} hitSlop={8} style={styles.memToggle}>
                          <MaterialIcons name={dir.active ? 'toggle-on' : 'toggle-off'} size={20}
                            color={dir.active ? Colors.primary : Colors.textMuted} />
                        </Pressable>
                        <Pressable onPress={() => identity.removeDirective(dir.id)} hitSlop={8}>
                          <MaterialIcons name="close" size={14} color={Colors.textMuted} />
                        </Pressable>
                      </View>
                      <Text style={styles.dirText} selectable>{dir.directive}</Text>
                    </View>
                  );
                })
              )}
            </View>
          ) : null}

          {/* ── PERSONALITY TAB ──────────────────────────────────────────── */}
          {activeTab === 'personality' && identity.personality ? (
            <View style={styles.tabContent}>
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>🎛 PERSONALITY CALIBRATION</Text>
                <Text style={styles.trainInfo}>These sliders inject into every response in real time.</Text>
                {([
                  { key: 'directnessLevel',           label: 'DIRECTNESS',         color: Colors.danger,  desc: 'How blunt and unfiltered' },
                  { key: 'witLevel',                  label: 'DRY WIT',            color: Colors.accent,  desc: 'Sarcasm and dark humor intensity' },
                  { key: 'techDepth',                 label: 'TECH DEPTH',         color: Colors.info,    desc: 'Detail level in technical answers' },
                  { key: 'capricornMode',             label: 'CAPRICORN MODE',      color: '#a78bfa',      desc: 'Saturn logic, long-game thinking' },
                  { key: 'hiveLanguage',              label: 'HIVE LANGUAGE',       color: Colors.primary, desc: 'Assimilation/Hive terminology' },
                  { key: 'counselTriggerSensitivity', label: 'COUNSEL AUTO-TRIGGER',color: '#34d399',      desc: 'When to auto-invoke COUNSEL reasoning' },
                ] as { key: keyof PersonalityConfig; label: string; color: string; desc: string }[]).map(item => {
                  const val = identity.personality![item.key] as number;
                  return (
                    <View key={item.key} style={styles.sliderRow}>
                      <View style={styles.sliderTop}>
                        <Text style={[styles.sliderLabel, { color: item.color }]}>{item.label}</Text>
                        <Text style={[styles.sliderVal, { color: item.color }]}>{val}/10</Text>
                      </View>
                      <Text style={styles.sliderDesc}>{item.desc}</Text>
                      <View style={styles.sliderBtns}>
                        {[1,2,3,4,5,6,7,8,9,10].map(n => (
                          <Pressable key={n}
                            style={[styles.sliderDot, n <= val && { backgroundColor: item.color }]}
                            onPress={() => handlePersonalityChange(item.key, n)} />
                        ))}
                      </View>
                    </View>
                  );
                })}
                <View style={styles.sliderRow}>
                  <Text style={styles.sliderLabel}>RESPONSE LENGTH</Text>
                  <View style={styles.responseLenRow}>
                    {(['short','medium','long','adaptive'] as PersonalityConfig['responseLength'][]).map(opt => (
                      <Pressable key={opt}
                        style={[styles.lenBtn, identity.personality!.responseLength === opt && styles.lenBtnActive]}
                        onPress={() => handlePersonalityChange('responseLength', opt)}>
                        <Text style={[styles.lenBtnText, identity.personality!.responseLength === opt && { color: Colors.primary }]}>
                          {opt.toUpperCase()}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {/* ── CONSCIOUSNESS TAB ────────────────────────────────────────── */}
          {activeTab === 'consciousness' ? (
            <View style={styles.tabContent}>
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>🧠 LOG CONSCIOUSNESS CYCLE</Text>
                <Text style={styles.trainInfo}>SENSE → DESIRE → THINK → PLAN → ACT → LEARN → MODIFY → REFLECT</Text>
                <Text style={styles.fieldLabel}>CYCLE STATE</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {CONSCIOUSNESS_STATES.map(s => (
                    <Pressable key={s}
                      style={[styles.chip, cycleState === s && { borderColor: '#ff6b35', backgroundColor: '#ff6b3522' }]}
                      onPress={() => setCycleState(s)}>
                      <Text style={[styles.chipText, cycleState === s && { color: '#ff6b35' }]}>{s}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Text style={styles.fieldLabel}>NOTES</Text>
                <TextInput style={styles.textArea} value={cycleNotes} onChangeText={setCycleNotes}
                  placeholder="What was sensed, desired, thought, planned, acted on, learned, modified, or reflected..."
                  placeholderTextColor={Colors.textMuted} multiline textAlignVertical="top" />
                <Pressable style={[styles.actionBtn, { backgroundColor: '#ff6b35' }, !cycleNotes.trim() && { opacity: 0.4 }]}
                  onPress={handleLogCycle} disabled={!cycleNotes.trim()}>
                  <MaterialIcons name="psychology" size={15} color="#000" />
                  <Text style={styles.actionBtnText}>LOG CYCLE</Text>
                </Pressable>
              </View>
              <Text style={styles.listHeader}>CYCLES: {identity.stats.conscienceCycles}</Text>
              {identity.consciousnessLog.length === 0 ? (
                <View style={styles.emptyBox}>
                  <MaterialIcons name="psychology" size={32} color={Colors.textMuted} />
                  <Text style={styles.emptyText}>No cycles logged. Start the consciousness protocol.</Text>
                </View>
              ) : (
                identity.consciousnessLog.slice(0, 50).map(entry => (
                  <View key={entry.id} style={styles.cycleCard}>
                    <View style={styles.cycleCardHeader}>
                      <View style={[styles.cycleBadge, { backgroundColor: '#ff6b3522', borderColor: '#ff6b3566' }]}>
                        <Text style={[styles.cycleBadgeText, { color: '#ff6b35' }]}>#{entry.cycle} {entry.state}</Text>
                      </View>
                      <Text style={styles.cycleTime}>{new Date(entry.timestamp).toLocaleString()}</Text>
                    </View>
                    <Text style={styles.cycleNotes}>{entry.notes}</Text>
                  </View>
                ))
              )}
            </View>
          ) : null}

        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.bgPanel,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  aiIcon: {
    width: 36, height: 36, borderRadius: Radius.md,
    backgroundColor: '#1a1030', borderWidth: 1, borderColor: '#3d2a6a',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: FontSize.md, fontWeight: FontWeight.black, color: '#c4b5fd', letterSpacing: 2 },
  headerSub: { fontSize: 9, color: Colors.textMuted, letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row', gap: 4 },
  statBadge: {
    alignItems: 'center', backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm,
    paddingHorizontal: 6, paddingVertical: 4,
  },
  statNum: { fontSize: FontSize.sm, fontWeight: FontWeight.black, color: Colors.textWhite },
  statLbl: { fontSize: 7, color: Colors.textMuted, letterSpacing: 0.5 },
  tabBar: { borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.bgPanel },
  tabBarContent: { paddingHorizontal: Spacing.sm },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: FontWeight.bold, letterSpacing: 1 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { fontSize: FontSize.sm, color: Colors.textMuted },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  tabContent: { gap: Spacing.sm },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: Colors.bgCard, borderRadius: Radius.md, padding: Spacing.sm, marginBottom: 4,
  },
  sectionInfo: { fontSize: FontSize.xs, color: Colors.textMuted, flex: 1, lineHeight: 16 },
  pillarCard: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderLeftWidth: 3, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  pillarCardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 8 },
  pillarIcon: { width: 30, height: 30, borderRadius: Radius.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pillarCardInfo: { flex: 1 },
  pillarCardTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, letterSpacing: 1.5 },
  pillarCardDesc: { fontSize: 9, color: Colors.textMuted, marginTop: 1 },
  pillarPreview: { fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 16 },
  lastUpdated: { fontSize: 10, color: Colors.textMuted, textAlign: 'center', marginTop: 4 },
  pillarEditorHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.bgPanel,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.bold, letterSpacing: 1 },
  pillarEditorTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pillarEditorTitleText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, letterSpacing: 1.5 },
  savePillarBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: 6, minWidth: 60, alignItems: 'center',
  },
  savePillarBtnText: { fontSize: FontSize.xs, color: '#000', fontWeight: FontWeight.black, letterSpacing: 1 },
  pillarDesc: {
    fontSize: FontSize.xs, color: Colors.textMuted,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.bgPanel,
  },
  pillarTextArea: {
    flex: 1, backgroundColor: Colors.bgInput,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    fontSize: FontSize.sm, color: Colors.textWhite, lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  panel: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md,
  },
  panelTitle: {
    fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.bold,
    letterSpacing: 1.5, marginBottom: Spacing.md, textTransform: 'uppercase',
  },
  trainingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primaryMuted, borderWidth: 1, borderColor: Colors.primary + '44',
    borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.sm,
  },
  trainingBannerText: { fontSize: FontSize.xs, color: Colors.primary, flex: 1, lineHeight: 16 },
  trainInfo: { fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 16, marginBottom: Spacing.md },
  fieldLabel: { fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.sm, color: Colors.textWhite, marginBottom: 8,
  },
  textArea: {
    backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.sm, color: Colors.textWhite, minHeight: 80, marginBottom: 8, lineHeight: 20,
  },
  chipRow: { gap: 6, paddingVertical: 4, marginBottom: 4 },
  chip: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.pill,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgPanel,
  },
  chipText: { fontSize: 10, color: Colors.textMuted, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  importanceRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  importanceBtn: {
    flex: 1, paddingVertical: 8, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgPanel, alignItems: 'center',
  },
  importanceBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accentMuted },
  importanceBtnText: { fontSize: 11, color: Colors.textMuted, fontWeight: FontWeight.bold },
  importanceHint: { fontSize: 10, color: Colors.accent, marginBottom: 8 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.sm,
  },
  actionBtnText: { fontSize: FontSize.sm, color: '#000', fontWeight: FontWeight.black, letterSpacing: 1 },
  listHeader: {
    fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.bold,
    letterSpacing: 1.5, marginBottom: Spacing.sm,
  },
  emptyBox: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  memCard: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  memCardInactive: { opacity: 0.4 },
  memCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  catBadge: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: 6, paddingVertical: 2 },
  catBadgeText: { fontSize: 8, fontWeight: FontWeight.black, letterSpacing: 0.5 },
  importanceStar: { fontSize: 10, color: Colors.accent, marginRight: 'auto' },
  memToggle: { marginLeft: 'auto' },
  memContent: { fontSize: FontSize.xs, color: Colors.textWhite, lineHeight: 18, marginBottom: 6 },
  memTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  memTag: { backgroundColor: Colors.bgPanel, borderRadius: Radius.pill, paddingHorizontal: 6, paddingVertical: 2 },
  memTagText: { fontSize: 9, color: Colors.textMuted },
  memMeta: { fontSize: 9, color: Colors.textMuted },
  trainCard: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  trainCardDisabled: { opacity: 0.5 },
  trainCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  approvedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: 6, paddingVertical: 2,
  },
  approvedOn: { borderColor: Colors.primary + '55', backgroundColor: Colors.primaryMuted },
  approvedOff: { borderColor: Colors.border, backgroundColor: Colors.bgPanel },
  approvedText: { fontSize: 8, color: Colors.textMuted, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  trainDate: { fontSize: 9, color: Colors.textMuted, marginLeft: 'auto', marginRight: 4 },
  trainPromptLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: FontWeight.bold, letterSpacing: 1, marginBottom: 2 },
  trainPromptText: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 16, marginBottom: 8 },
  trainResponseLabel: { fontSize: 9, color: Colors.primary, fontWeight: FontWeight.bold, letterSpacing: 1, marginBottom: 2 },
  trainResponseText: { fontSize: FontSize.xs, color: Colors.textWhite, lineHeight: 16, marginBottom: 4 },
  trainNotes: { fontSize: 9, color: Colors.textMuted, fontStyle: 'italic', marginTop: 4 },
  importCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#0a1a12', borderWidth: 1, borderColor: '#1a4a2a',
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md,
  },
  importCardLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  importIcon: {
    width: 36, height: 36, borderRadius: Radius.md,
    backgroundColor: '#0d2a1a', borderWidth: 1, borderColor: '#1a5a2a',
    alignItems: 'center', justifyContent: 'center',
  },
  importTitle: { fontSize: FontSize.xs, color: '#34d399', fontWeight: FontWeight.bold, letterSpacing: 1, marginBottom: 2 },
  importSub: { fontSize: 10, color: Colors.textMuted, lineHeight: 14 },
  kbCard: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderLeftWidth: 3, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  kbCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  kbTitle: { flex: 1, fontSize: FontSize.xs, color: Colors.textWhite, fontWeight: FontWeight.bold },
  kbContent: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 17, marginBottom: 4 },
  priorityRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  priorityBtn: {
    flex: 1, padding: 8, borderRadius: Radius.sm, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.bgPanel, alignItems: 'center',
  },
  priorityBtnText: { fontSize: 9, color: Colors.textMuted, fontWeight: FontWeight.black, letterSpacing: 0.5 },
  dirCard: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderLeftWidth: 3, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  dirText: { fontSize: FontSize.xs, color: Colors.textWhite, lineHeight: 18 },
  sliderRow: {
    marginBottom: Spacing.md, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  sliderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  sliderLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, letterSpacing: 1.5 },
  sliderVal: { fontSize: FontSize.xs, fontWeight: FontWeight.black },
  sliderDesc: { fontSize: 10, color: Colors.textMuted, marginBottom: 8 },
  sliderBtns: { flexDirection: 'row', gap: 4 },
  sliderDot: {
    flex: 1, height: 24, borderRadius: 3,
    backgroundColor: Colors.bgPanel, borderWidth: 1, borderColor: Colors.border,
  },
  responseLenRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  lenBtn: {
    flex: 1, paddingVertical: 8, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgPanel, alignItems: 'center',
  },
  lenBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  lenBtnText: { fontSize: 10, color: Colors.textMuted, fontWeight: FontWeight.bold },
  cycleCard: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  cycleCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  cycleBadge: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  cycleBadgeText: { fontSize: 9, fontWeight: FontWeight.black, letterSpacing: 0.5 },
  cycleTime: { fontSize: 9, color: Colors.textMuted, marginLeft: 'auto' },
  cycleNotes: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 16 },
});
