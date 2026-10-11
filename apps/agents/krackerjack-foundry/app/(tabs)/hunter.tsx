// KRACKERJACK AI — HunterPrime Tab (Real GitHub)

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { GlowButton, TerminalLog, RepoCard } from '@/components';
import { useHunter } from '@/hooks/useHunter';

const FILTER_OPTIONS = ['ALL', 'ASSIMILATED', 'TARGETS', 'PRIVATE', 'FORKED'] as const;
type FilterOption = typeof FILTER_OPTIONS[number];

export default function HunterPrime() {
  const insets = useSafeAreaInsets();
  const {
    repos,
    log,
    isAssimilating,
    isScanning,
    isLoading,
    assimilatedCount,
    pendingCount,
    assimilatedIds,
    githubUser,
    assimilateAll,
    scanTargets,
    assimilateSingle,
  } = useHunter();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('ALL');

  const filteredRepos = repos.filter(r => {
    const matchesSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(search.toLowerCase());
    const assimilated = assimilatedIds.has(String(r.id));
    const matchesFilter =
      activeFilter === 'ALL' ? true :
      activeFilter === 'ASSIMILATED' ? assimilated :
      activeFilter === 'TARGETS' ? !assimilated :
      activeFilter === 'PRIVATE' ? r.private :
      activeFilter === 'FORKED' ? r.fork : true;
    return matchesSearch && matchesFilter;
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + 90 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="gps-fixed" size={20} color={Colors.primary} />
          <View>
            <Text style={styles.headerTitle}>HUNTERPRIME</Text>
            {githubUser ? (
              <Text style={styles.headerSub}>@{githubUser.login} · {githubUser.public_repos} repos</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{assimilatedCount}/{repos.length}</Text>
        </View>
      </View>

      {/* Control Panel */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>⚡ ASSIMILATION CONTROL</Text>
        <GlowButton
          label={isAssimilating ? '⟳ ASSIMILATING...' : '⚡ ASSIMILATE ALL REPOS'}
          onPress={assimilateAll}
          variant="danger"
          loading={isAssimilating}
          style={styles.mainBtn}
        />
        <GlowButton
          label={isScanning || isLoading ? '⟳ SCANNING...' : '🔍 SCAN / REFRESH'}
          onPress={scanTargets}
          variant="ghost"
          loading={isScanning || isLoading}
        />
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statChip, { borderColor: Colors.primary }]}>
          <Text style={[styles.statChipValue, { color: Colors.primary }]}>{assimilatedCount}</Text>
          <Text style={styles.statChipLabel}>ASSIMILATED</Text>
        </View>
        <View style={[styles.statChip, { borderColor: Colors.danger }]}>
          <Text style={[styles.statChipValue, { color: Colors.danger }]}>{pendingCount}</Text>
          <Text style={styles.statChipLabel}>REMAINING</Text>
        </View>
        <View style={[styles.statChip, { borderColor: Colors.accent }]}>
          <Text style={[styles.statChipValue, { color: Colors.accent }]}>{repos.length}</Text>
          <Text style={styles.statChipLabel}>TOTAL</Text>
        </View>
      </View>

      {/* Assimilation Log */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>📋 ASSIMILATION LOG</Text>
        <TerminalLog entries={log} height={180} />
      </View>

      {/* Repo List */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>🔗 HIVE NODES</Text>

        {/* Search */}
        <View style={styles.searchRow}>
          <MaterialIcons name="search" size={16} color={Colors.textMuted} style={{ marginLeft: Spacing.sm }} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search repos..."
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} style={{ padding: Spacing.sm }}>
              <MaterialIcons name="close" size={14} color={Colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}
          contentContainerStyle={styles.filterContent}>
          {FILTER_OPTIONS.map(f => (
            <Pressable
              key={f}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>
                {f}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Connecting to GitHub grid...</Text>
          </View>
        ) : filteredRepos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="gps-not-fixed" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>
              {repos.length === 0 ? 'Add GitHub token in Config to load repos.' : 'No repos match this filter.'}
            </Text>
          </View>
        ) : (
          filteredRepos.map(repo => (
            <RepoCard
              key={repo.id}
              repo={repo}
              isAssimilated={assimilatedIds.has(String(repo.id))}
              onAssimilate={assimilateSingle}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    color: Colors.primary,
    letterSpacing: 3,
  },
  headerSub: { fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 0.5 },
  headerBadge: {
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  headerBadgeText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.bold },
  panel: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  panelTitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
  },
  mainBtn: { marginBottom: Spacing.sm },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  statChip: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  statChipValue: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  statChipLabel: { fontSize: 9, color: Colors.textMuted, letterSpacing: 1, marginTop: 2, textAlign: 'center' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textWhite,
  },
  filterBar: { marginBottom: Spacing.md },
  filterContent: { gap: Spacing.sm, paddingVertical: 4 },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgPanel,
  },
  filterChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  filterChipText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.bold, letterSpacing: 0.8 },
  filterChipTextActive: { color: Colors.primary },
  loadingContainer: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  loadingText: { fontSize: FontSize.xs, color: Colors.textMuted },
  emptyContainer: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
});
