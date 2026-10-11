// KRACKERJACK AI — Repo Detail Screen

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { GlowButton } from '@/components';
import {
  fetchRepo,
  fetchRepoCommits,
  fetchRepoLanguages,
  fetchRepoReadme,
  GitHubRepo,
  GitHubCommit,
  GitHubLanguages,
  timeAgo,
} from '@/services/githubService';
import {
  loadGHToken,
  loadRepoNotes,
  addRepoNote,
  deleteRepoNote,
  HiveNote,
} from '@/services/storageService';
import { useHunter } from '@/hooks/useHunter';

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5',
  Rust: '#dea584', Go: '#00ADD8', Swift: '#F05138', Kotlin: '#A97BFF',
  Java: '#b07219', 'C++': '#f34b7d', C: '#555555', Ruby: '#701516',
};

export default function RepoDetail() {
  const { id, fullName } = useLocalSearchParams<{ id: string; fullName: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { assimilatedIds, assimilateSingle } = useHunter();

  const [repo, setRepo] = useState<GitHubRepo | null>(null);
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [languages, setLanguages] = useState<GitHubLanguages>({});
  const [readme, setReadme] = useState<string | null>(null);
  const [showReadme, setShowReadme] = useState(false);
  const [readmeLoading, setReadmeLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hive Intel Notes
  const [notes, setNotes] = useState<HiveNote[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [noteTag, setNoteTag] = useState<HiveNote['tag']>('intel');
  const [addingNote, setAddingNote] = useState(false);
  const [showNotes, setShowNotes] = useState(true);

  const isAssimilated = id ? assimilatedIds.has(id) : false;

  useEffect(() => {
    if (!fullName) return;
    const [owner, name] = fullName.split('/');
    if (!owner || !name) return;

    async function loadData() {
      setLoading(true);
      // Load notes in parallel
      loadRepoNotes(id).then(n => setNotes(n));
      const token = await loadGHToken();
      if (!token) {
        setError('No GitHub token. Add one in Config.');
        setLoading(false);
        return;
      }
      const [repoRes, commitsRes, langsRes] = await Promise.all([
        fetchRepo(token, owner, name),
        fetchRepoCommits(token, owner, name),
        fetchRepoLanguages(token, owner, name),
      ]);
      if (repoRes.error) { setError(repoRes.error); setLoading(false); return; }
      setRepo(repoRes.data);
      setCommits(commitsRes.data ?? []);
      setLanguages(langsRes.data ?? {});
      setLoading(false);
      // Load README in background

      const readmeRes = await fetchRepoReadme(token, owner, name);
      if (readmeRes.content) setReadme(readmeRes.content);
    }
    loadData();
  }, [fullName]);

  const totalLangBytes = Object.values(languages).reduce((s, v) => s + v, 0);

  const handleAddNote = async () => {
    if (!noteInput.trim() || !id) return;
    setAddingNote(true);
    const note = await addRepoNote(id, noteInput.trim(), noteTag);
    setNotes(prev => [note, ...prev]);
    setNoteInput('');
    setAddingNote(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!id) return;
    await deleteRepoNote(id, noteId);
    setNotes(prev => prev.filter(n => n.id !== noteId));
  };

  const NOTE_TAG_CONFIG: Record<HiveNote['tag'], { label: string; color: string; icon: string }> = {
    intel: { label: 'INTEL', color: Colors.primary, icon: 'info' },
    plan: { label: 'PLAN', color: Colors.info, icon: 'map' },
    bug: { label: 'BUG', color: Colors.danger, icon: 'bug-report' },
    idea: { label: 'IDEA', color: Colors.accent, icon: 'lightbulb' },
    warn: { label: 'WARN', color: '#ff9800', icon: 'warning' },
    done: { label: 'DONE', color: Colors.success, icon: 'check-circle' },
  };

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Connecting to GitHub grid...</Text>
      </View>
    );
  }

  if (error || !repo) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <MaterialIcons name="error-outline" size={40} color={Colors.danger} />
        <Text style={styles.errorText}>{error || 'Repo not found'}</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← BACK TO HIVE</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Fixed Header */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backPressable} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={20} color={Colors.primary} />
          <Text style={styles.backText}>HIVE</Text>
        </Pressable>
        <Text style={styles.topBarTitle} numberOfLines={1}>{repo.name}</Text>
        <Pressable onPress={() => Linking.openURL(repo.html_url)} hitSlop={8}>
          <MaterialIcons name="open-in-new" size={18} color={Colors.textMuted} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Repo Header Card */}
        <View style={[styles.panel, styles.heroPanel]}>
          <View style={styles.heroTop}>
            <View style={styles.heroNameGroup}>
              <MaterialIcons
                name={isAssimilated ? 'hub' : 'gps-not-fixed'}
                size={18}
                color={isAssimilated ? Colors.primary : Colors.textMuted}
              />
              <Text style={styles.heroName}>{repo.name}</Text>
              {repo.private ? (
                <View style={styles.badge}>
                  <MaterialIcons name="lock" size={10} color={Colors.accent} />
                  <Text style={[styles.badgeText, { color: Colors.accent }]}>PRIVATE</Text>
                </View>
              ) : null}
              {repo.fork ? (
                <View style={styles.badge}>
                  <MaterialIcons name="call-split" size={10} color={Colors.info} />
                  <Text style={[styles.badgeText, { color: Colors.info }]}>FORK</Text>
                </View>
              ) : null}
              {repo.archived ? (
                <View style={styles.badge}>
                  <MaterialIcons name="archive" size={10} color={Colors.textMuted} />
                  <Text style={[styles.badgeText, { color: Colors.textMuted }]}>ARCHIVED</Text>
                </View>
              ) : null}
            </View>
          </View>
          <Text style={styles.heroOwner}>{repo.full_name}</Text>
          {repo.description ? (
            <Text style={styles.heroDesc}>{repo.description}</Text>
          ) : null}
          {repo.homepage ? (
            <Pressable onPress={() => repo.homepage && Linking.openURL(repo.homepage)} style={styles.homepageRow}>
              <MaterialIcons name="link" size={12} color={Colors.primary} />
              <Text style={styles.homepageText} numberOfLines={1}>{repo.homepage}</Text>
            </Pressable>
          ) : null}
          {repo.topics && repo.topics.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicsScroll}
              contentContainerStyle={styles.topicsContent}>
              {repo.topics.map(topic => (
                <View key={topic} style={styles.topicChip}>
                  <Text style={styles.topicText}>{topic}</Text>
                </View>
              ))}
            </ScrollView>
          ) : null}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { icon: 'star', val: repo.stargazers_count, color: Colors.accent, label: 'Stars' },
            { icon: 'call-split', val: repo.forks_count, color: Colors.info, label: 'Forks' },
            { icon: 'remove-red-eye', val: repo.watchers_count, color: Colors.primary, label: 'Watchers' },
            { icon: 'bug-report', val: repo.open_issues_count, color: Colors.danger, label: 'Issues' },
          ].map(s => (
            <View key={s.label} style={styles.statBox}>
              <MaterialIcons name={s.icon as any} size={16} color={s.color} />
              <Text style={[styles.statNum, { color: s.color }]}>{s.val}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Meta Info */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>📡 NODE INFO</Text>
          {[
            ['DEFAULT BRANCH', repo.default_branch, 'account-tree'],
            ['LAST PUSH', timeAgo(repo.pushed_at), 'schedule'],
            ['LAST UPDATE', timeAgo(repo.updated_at), 'update'],
            ['SIZE', `${(repo.size / 1024).toFixed(1)} MB`, 'storage'],
            ['LANGUAGE', repo.language || 'Unknown', 'code'],
          ].map(([key, val, icon]) => (
            <View key={key as string} style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <MaterialIcons name={icon as any} size={13} color={Colors.textMuted} />
                <Text style={styles.infoKey}>{key as string}</Text>
              </View>
              <Text style={styles.infoVal}>{val as string}</Text>
            </View>
          ))}
        </View>

        {/* Languages */}
        {Object.keys(languages).length > 0 ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>💻 LANGUAGES</Text>
            <View style={styles.langBar}>
              {Object.entries(languages).map(([lang, bytes]) => {
                const pct = (bytes / totalLangBytes) * 100;
                if (pct < 1) return null;
                const color = LANG_COLORS[lang] || Colors.textSecondary;
                return (
                  <View key={lang} style={[styles.langBarSegment, { width: `${pct}%` as any, backgroundColor: color }]} />
                );
              })}
            </View>
            {Object.entries(languages).map(([lang, bytes]) => {
              const pct = ((bytes / totalLangBytes) * 100).toFixed(1);
              const color = LANG_COLORS[lang] || Colors.textSecondary;
              return (
                <View key={lang} style={styles.langLegendRow}>
                  <View style={[styles.langDot, { backgroundColor: color }]} />
                  <Text style={styles.langName}>{lang}</Text>
                  <Text style={styles.langPct}>{pct}%</Text>
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Commits */}
        {commits.length > 0 ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>📦 RECENT COMMITS</Text>
            {commits.map(commit => (
              <Pressable
                key={commit.sha}
                style={styles.commitRow}
                onPress={() => Linking.openURL(commit.html_url)}
              >
                <View style={styles.commitDot} />
                <View style={styles.commitCenter}>
                  <Text style={styles.commitMsg} numberOfLines={2}>
                    {commit.commit.message.split('\n')[0]}
                  </Text>
                  <Text style={styles.commitMeta}>
                    {commit.commit.author.name} · {timeAgo(commit.commit.author.date)}
                  </Text>
                </View>
                <Text style={styles.commitSha}>{commit.sha.slice(0, 7)}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* README Section */}
        {readme ? (
          <View style={styles.panel}>
            <Pressable
              style={styles.readmeToggle}
              onPress={() => setShowReadme(!showReadme)}
            >
              <View style={styles.readmeToggleLeft}>
                <MaterialIcons name="description" size={16} color={Colors.accent} />
                <Text style={styles.readmePanelTitle}>README.md</Text>
              </View>
              <MaterialIcons
                name={showReadme ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={18}
                color={Colors.textMuted}
              />
            </Pressable>
            {showReadme ? (
              <ScrollView
                style={styles.readmeScroll}
                nestedScrollEnabled
                showsVerticalScrollIndicator
              >
                <Text style={styles.readmeText} selectable>
                  {readme}
                </Text>
              </ScrollView>
            ) : (
              <Text style={styles.readmePreview} numberOfLines={3}>
                {readme}
              </Text>
            )}
          </View>
        ) : null}

        {/* Hive Intel Notes */}
        <View style={styles.panel}>
          <Pressable
            style={styles.notesToggleRow}
            onPress={() => setShowNotes(!showNotes)}
          >
            <View style={styles.notesToggleLeft}>
              <MaterialIcons name="sticky-note-2" size={16} color={Colors.accent} />
              <Text style={styles.notesPanelTitle}>HIVE INTEL</Text>
              {notes.length > 0 ? (
                <View style={styles.noteCountBadge}>
                  <Text style={styles.noteCountText}>{notes.length}</Text>
                </View>
              ) : null}
            </View>
            <MaterialIcons
              name={showNotes ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={18}
              color={Colors.textMuted}
            />
          </Pressable>

          {showNotes ? (
            <>
              {/* Tag selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                style={styles.tagScroll} contentContainerStyle={styles.tagContent}>
                {(Object.keys(NOTE_TAG_CONFIG) as HiveNote['tag'][]).map(tag => {
                  const tc = NOTE_TAG_CONFIG[tag];
                  const isSelected = noteTag === tag;
                  return (
                    <Pressable
                      key={tag}
                      style={[styles.tagChip, isSelected && { borderColor: tc.color, backgroundColor: tc.color + '22' }]}
                      onPress={() => setNoteTag(tag)}
                    >
                      <MaterialIcons name={tc.icon as any} size={11} color={isSelected ? tc.color : Colors.textMuted} />
                      <Text style={[styles.tagChipText, isSelected && { color: tc.color }]}>{tc.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Note input */}
              <View style={styles.noteInputRow}>
                <TextInput
                  style={styles.noteInput}
                  value={noteInput}
                  onChangeText={setNoteInput}
                  placeholder="Add hive intel, plans, bugs, ideas..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  maxLength={500}
                />
                <Pressable
                  style={[styles.noteAddBtn, (!noteInput.trim() || addingNote) && { opacity: 0.5 }]}
                  onPress={handleAddNote}
                  disabled={!noteInput.trim() || addingNote}
                >
                  <MaterialIcons name="add" size={18} color="#000" />
                </Pressable>
              </View>

              {/* Notes list */}
              {notes.length === 0 ? (
                <View style={styles.notesEmpty}>
                  <MaterialIcons name="sticky-note-2" size={24} color={Colors.textMuted} />
                  <Text style={styles.notesEmptyText}>No intel logged. Add your first note.</Text>
                </View>
              ) : (
                notes.map(note => {
                  const tc = NOTE_TAG_CONFIG[note.tag];
                  return (
                    <View key={note.id} style={[styles.noteCard, { borderLeftColor: tc.color }]}>
                      <View style={styles.noteCardHeader}>
                        <View style={[styles.noteTagPill, { backgroundColor: tc.color + '22', borderColor: tc.color + '55' }]}>
                          <MaterialIcons name={tc.icon as any} size={10} color={tc.color} />
                          <Text style={[styles.noteTagText, { color: tc.color }]}>{tc.label}</Text>
                        </View>
                        <Text style={styles.noteTimestamp}>
                          {new Date(note.timestamp).toLocaleDateString()}
                        </Text>
                        <Pressable onPress={() => handleDeleteNote(note.id)} hitSlop={8}>
                          <MaterialIcons name="close" size={14} color={Colors.textMuted} />
                        </Pressable>
                      </View>
                      <Text style={styles.noteContent} selectable>{note.content}</Text>
                    </View>
                  );
                })
              )}
            </>
          ) : null}
        </View>

        {/* Actions */}
        <View style={styles.actionsPanel}>
          {!isAssimilated ? (
            <GlowButton
              label="⚡ ASSIMILATE THIS NODE"
              onPress={() => id && assimilateSingle(parseInt(id))}
              variant="danger"
              style={styles.actionBtn}
            />
          ) : (
            <View style={styles.assimilatedBadge}>
              <MaterialIcons name="hub" size={16} color={Colors.primary} />
              <Text style={styles.assimilatedText}>NODE ASSIMILATED INTO HIVE</Text>
            </View>
          )}
          <GlowButton
            label="OPEN ON GITHUB"
            onPress={() => Linking.openURL(repo.html_url)}
            variant="ghost"
            style={styles.actionBtn}
          />
          <GlowButton
            label="EDIT REPO"
            onPress={() => router.push({ pathname: '/repo/edit', params: { id: String(repo.id), fullName: repo.full_name } })}
            variant="accent"
            style={styles.actionBtn}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { fontSize: FontSize.sm, color: Colors.textMuted },
  errorText: { fontSize: FontSize.sm, color: Colors.danger, textAlign: 'center', paddingHorizontal: Spacing.xl },
  backBtn: { marginTop: Spacing.md },
  backBtnText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.bold },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bgPanel,
    gap: Spacing.sm,
  },
  backPressable: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.bold, letterSpacing: 1 },
  topBarTitle: { flex: 1, fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textWhite, textAlign: 'center' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  panel: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  heroPanel: { borderColor: Colors.primaryMuted },
  panelTitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
  },
  heroTop: { marginBottom: 4 },
  heroNameGroup: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  heroName: { fontSize: FontSize.lg, fontWeight: FontWeight.black, color: Colors.textWhite },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.bgPanel,
    borderRadius: Radius.pill,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeText: { fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  heroOwner: { fontSize: FontSize.xs, color: Colors.primary, marginBottom: 6, letterSpacing: 0.5 },
  heroDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: 8 },
  homepageRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  homepageText: { fontSize: FontSize.xs, color: Colors.primary, flex: 1 },
  topicsScroll: { marginTop: 4 },
  topicsContent: { gap: 6, paddingVertical: 2 },
  topicChip: {
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  topicText: { fontSize: 10, color: Colors.primary },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  statNum: { fontSize: FontSize.md, fontWeight: FontWeight.black },
  statLbl: { fontSize: 9, color: Colors.textMuted, letterSpacing: 0.5 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoKey: { fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 1.2 },
  infoVal: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.medium },
  langBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  langBarSegment: { height: '100%' },
  langLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  langDot: { width: 10, height: 10, borderRadius: 5 },
  langName: { flex: 1, fontSize: FontSize.xs, color: Colors.textWhite },
  langPct: { fontSize: FontSize.xs, color: Colors.textMuted },
  commitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  commitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 5,
  },
  commitCenter: { flex: 1 },
  commitMsg: { fontSize: FontSize.xs, color: Colors.textWhite, lineHeight: 16 },
  commitMeta: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  commitSha: {
    fontSize: 10,
    color: Colors.accent,
    fontFamily: 'monospace',
    backgroundColor: Colors.bgPanel,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  actionsPanel: { gap: Spacing.sm, marginBottom: Spacing.lg },
  actionBtn: { marginBottom: 0 },
  assimilatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  assimilatedText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
  },
  readmeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  readmeToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  readmePanelTitle: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  readmeScroll: {
    maxHeight: 420,
    marginTop: 4,
  },
  readmeText: {
    fontSize: 12,
    color: '#cccccc',
    lineHeight: 19,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  readmePreview: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  // ── Notes / Hive Intel ────────────────────────────────────────────────────
  notesToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  notesToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notesPanelTitle: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  noteCountBadge: {
    backgroundColor: Colors.accentMuted,
    borderWidth: 1,
    borderColor: Colors.accent + '55',
    borderRadius: Radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  noteCountText: { fontSize: 9, color: Colors.accent, fontWeight: FontWeight.bold },
  tagScroll: { marginBottom: 8 },
  tagContent: { gap: 6, paddingVertical: 2 },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgPanel,
  },
  tagChipText: { fontSize: 9, color: Colors.textMuted, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  noteInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  noteInput: {
    flex: 1,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.xs,
    color: Colors.textWhite,
    minHeight: 40,
    maxHeight: 100,
  },
  noteAddBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesEmpty: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  notesEmptyText: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  noteCard: {
    backgroundColor: Colors.bgPanel,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  noteCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  noteTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  noteTagText: { fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  noteTimestamp: { fontSize: 9, color: Colors.textMuted, marginLeft: 'auto', marginRight: 4 },
  noteContent: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
});
