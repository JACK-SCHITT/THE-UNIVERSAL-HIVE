// KRACKERJACK AI — GitHub Search Screen

import React, { useState, useCallback, useRef } from 'react';
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
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { searchRepos, GitHubRepo, timeAgo } from '@/services/githubService';
import { loadGHToken } from '@/services/storageService';
import { useHunter } from '@/hooks/useHunter';

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5',
  Rust: '#dea584', Go: '#00ADD8', Swift: '#F05138', Kotlin: '#A97BFF',
  Java: '#b07219', 'C++': '#f34b7d', C: '#555555', Ruby: '#701516',
  PHP: '#4F5D95', Shell: '#89e051', HTML: '#e34c26', CSS: '#563d7c',
};

const SORT_OPTIONS = [
  { key: 'stars', label: '⭐ Stars' },
  { key: 'forks', label: '🍴 Forks' },
  { key: 'updated', label: '🕐 Updated' },
  { key: 'best-match', label: '🎯 Best Match' },
] as const;

type SortOption = typeof SORT_OPTIONS[number]['key'];

const QUICK_SEARCHES = [
  'stars:>10000 language:TypeScript',
  'grok api',
  'ai cli tool',
  'free tier saas',
  'react native',
  'gentoo linux tools',
  'termux utilities',
];

export default function GitHubSearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { assimilatedIds, assimilateSingle } = useHunter();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GitHubRepo[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [sort, setSort] = useState<SortOption>('stars');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const doSearch = useCallback(async (q?: string) => {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;
    setError(null);
    setLoading(true);
    setSearched(true);

    const token = await loadGHToken();
    if (!token) {
      setError('No GitHub token. Add one in Config tab first.');
      setLoading(false);
      return;
    }

    const { data, error: err } = await searchRepos(token, searchQuery.trim(), sort, 30);
    setLoading(false);

    if (err || !data) {
      setError(err || 'Search failed');
      return;
    }

    setResults(data.items);
    setTotalCount(data.total_count);
  }, [query, sort]);

  const handleQuickSearch = (q: string) => {
    setQuery(q);
    doSearch(q);
    inputRef.current?.blur();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <MaterialIcons name="search" size={20} color={Colors.primary} />
        <Text style={styles.headerTitle}>GITHUB SEARCH</Text>
        {searched && totalCount > 0 ? (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{totalCount.toLocaleString()}</Text>
          </View>
        ) : null}
      </View>

      {/* Search bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={16} color={Colors.textMuted} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="stars:>1000 language:TypeScript..."
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => doSearch()}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => { setQuery(''); setResults([]); setSearched(false); }} hitSlop={8}>
              <MaterialIcons name="close" size={14} color={Colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          style={({ pressed }) => [styles.searchBtn, pressed && { opacity: 0.8 }]}
          onPress={() => doSearch()}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator size="small" color={Colors.bg} />
            : <MaterialIcons name="search" size={18} color={Colors.bg} />
          }
        </Pressable>
      </View>

      {/* Sort options */}
      <View style={styles.sortSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortContent}>
          {SORT_OPTIONS.map(opt => (
            <Pressable
              key={opt.key}
              style={[styles.sortChip, sort === opt.key && styles.sortChipActive]}
              onPress={() => setSort(opt.key)}
            >
              <Text style={[styles.sortChipText, sort === opt.key && styles.sortChipTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Error state */}
        {error ? (
          <View style={styles.errorBox}>
            <MaterialIcons name="error-outline" size={20} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Quick searches (shown when no results yet) */}
        {!searched && !loading ? (
          <View style={styles.quickSection}>
            <Text style={styles.sectionLabel}>🔥 QUICK SEARCHES</Text>
            {QUICK_SEARCHES.map(qs => (
              <Pressable
                key={qs}
                style={({ pressed }) => [styles.quickItem, pressed && { opacity: 0.7 }]}
                onPress={() => handleQuickSearch(qs)}
              >
                <MaterialIcons name="bolt" size={14} color={Colors.accent} />
                <Text style={styles.quickItemText}>{qs}</Text>
                <MaterialIcons name="arrow-forward" size={14} color={Colors.textMuted} />
              </Pressable>
            ))}

            <View style={styles.tipsBox}>
              <Text style={styles.tipsTitle}>🎯 SEARCH SYNTAX</Text>
              <Text style={styles.tipLine}>language:TypeScript</Text>
              <Text style={styles.tipLine}>stars:{">"} 1000</Text>
              <Text style={styles.tipLine}>topic:machine-learning</Text>
              <Text style={styles.tipLine}>user:JACK-SCHITT</Text>
              <Text style={styles.tipLine}>is:public archived:false</Text>
            </View>
          </View>
        ) : null}

        {/* Loading state */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Scanning GitHub grid...</Text>
          </View>
        ) : null}

        {/* Results */}
        {!loading && results.length > 0 ? (
          <>
            <Text style={styles.resultsHeader}>
              {totalCount.toLocaleString()} REPOS FOUND — TOP {results.length}
            </Text>
            {results.map((repo, idx) => {
              const langColor = repo.language ? (LANG_COLORS[repo.language] || Colors.textMuted) : Colors.textMuted;
              const isAssimilated = assimilatedIds.has(String(repo.id));

              return (
                <Pressable
                  key={repo.id}
                  style={({ pressed }) => [styles.resultCard, pressed && { opacity: 0.85 }]}
                  onPress={() => router.push({ pathname: '/repo/[id]', params: { id: String(repo.id), fullName: repo.full_name } })}
                >
                  {/* Rank badge */}
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{idx + 1}</Text>
                  </View>

                  {/* Content */}
                  <View style={styles.resultContent}>
                    <View style={styles.resultTopRow}>
                      <Text style={styles.resultName} numberOfLines={1}>{repo.full_name}</Text>
                      {isAssimilated ? (
                        <View style={styles.assimBadge}>
                          <MaterialIcons name="hub" size={10} color={Colors.primary} />
                          <Text style={styles.assimBadgeText}>HIVE</Text>
                        </View>
                      ) : null}
                    </View>

                    {repo.description ? (
                      <Text style={styles.resultDesc} numberOfLines={2}>{repo.description}</Text>
                    ) : null}

                    {/* Topics */}
                    {repo.topics && repo.topics.length > 0 ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}
                        style={styles.topicsScroll}
                        contentContainerStyle={styles.topicsContent}>
                        {repo.topics.slice(0, 5).map(topic => (
                          <View key={topic} style={styles.topicChip}>
                            <Text style={styles.topicText}>{topic}</Text>
                          </View>
                        ))}
                      </ScrollView>
                    ) : null}

                    {/* Meta */}
                    <View style={styles.resultMeta}>
                      {repo.language ? (
                        <View style={styles.langGroup}>
                          <View style={[styles.langDot, { backgroundColor: langColor }]} />
                          <Text style={styles.metaText}>{repo.language}</Text>
                        </View>
                      ) : null}
                      <View style={styles.metaGroup}>
                        <MaterialIcons name="star" size={12} color={Colors.accent} />
                        <Text style={[styles.metaText, { color: Colors.accent }]}>
                          {repo.stargazers_count.toLocaleString()}
                        </Text>
                      </View>
                      {repo.forks_count > 0 ? (
                        <View style={styles.metaGroup}>
                          <MaterialIcons name="call-split" size={12} color={Colors.textMuted} />
                          <Text style={styles.metaText}>{repo.forks_count.toLocaleString()}</Text>
                        </View>
                      ) : null}
                      <Text style={styles.timeText}>{timeAgo(repo.updated_at)}</Text>
                    </View>

                    {/* Assimilate action */}
                    {!isAssimilated ? (
                      <Pressable
                        style={({ pressed }) => [styles.assimBtn, pressed && { opacity: 0.7 }]}
                        onPress={(e) => { e.stopPropagation?.(); assimilateSingle(repo.id); }}
                      >
                        <MaterialIcons name="add-circle-outline" size={13} color={Colors.danger} />
                        <Text style={styles.assimBtnText}>ASSIMILATE INTO HIVE</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </>
        ) : null}

        {/* No results */}
        {searched && !loading && results.length === 0 && !error ? (
          <View style={styles.emptyBox}>
            <MaterialIcons name="search-off" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No repos found for "{query}"</Text>
            <Text style={styles.emptySub}>Try broader search terms or different filters</Text>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    color: Colors.primary,
    letterSpacing: 3,
    flex: 1,
  },
  countBadge: {
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.bold },
  searchSection: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bg,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textWhite,
    paddingVertical: Spacing.sm,
  },
  searchBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortSection: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.sm,
  },
  sortContent: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  sortChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgPanel,
  },
  sortChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  sortChipText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.bold },
  sortChipTextActive: { color: Colors.primary },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.dangerMuted,
    borderWidth: 1,
    borderColor: Colors.danger + '44',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: { fontSize: FontSize.sm, color: Colors.danger, flex: 1 },
  quickSection: { gap: Spacing.sm },
  sectionLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
  },
  quickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  quickItemText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary },
  tipsBox: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.accentMuted,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    gap: 4,
  },
  tipsTitle: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  tipLine: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  loadingBox: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md },
  loadingText: { fontSize: FontSize.sm, color: Colors.textMuted },
  resultsHeader: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  resultCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  rankBadge: {
    width: 28,
    alignItems: 'center',
    paddingTop: 2,
  },
  rankText: { fontSize: FontSize.xs, color: Colors.accent, fontWeight: FontWeight.black },
  resultContent: { flex: 1 },
  resultTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  resultName: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textWhite,
    fontWeight: FontWeight.bold,
  },
  assimBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
    borderRadius: Radius.pill,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  assimBadgeText: { fontSize: 8, color: Colors.primary, fontWeight: FontWeight.bold },
  resultDesc: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 16,
    marginBottom: 6,
  },
  topicsScroll: { marginBottom: 6 },
  topicsContent: { gap: 4 },
  topicChip: {
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
    borderRadius: Radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  topicText: { fontSize: 9, color: Colors.primary },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  langGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  langDot: { width: 8, height: 8, borderRadius: 4 },
  metaGroup: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: FontSize.xs, color: Colors.textMuted },
  timeText: { fontSize: FontSize.xs, color: Colors.textMuted, marginLeft: 'auto' },
  assimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  assimBtnText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
  emptySub: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
});
