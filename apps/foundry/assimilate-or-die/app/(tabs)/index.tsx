import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { AI_TOOLS, CATEGORIES, AITool } from '@/constants/data';

type TierFilter = 'ALL' | 'CORE' | 'ADVANCED' | 'APEX';
type SortOption = 'power' | 'name' | 'tier';

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'power', label: 'POWER' },
  { key: 'name', label: 'NAME' },
  { key: 'tier', label: 'TIER' },
];

export default function FoundryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [tierFilter, setTierFilter] = useState<TierFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('power');
  const [powerMin, setPowerMin] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const tierColor = (tier: AITool['tier']) => {
    if (tier === 'APEX') return Colors.crimson;
    if (tier === 'ADVANCED') return Colors.cyanPulse;
    return Colors.textSecondary;
  };

  const TIER_RANK: Record<string, number> = { APEX: 3, ADVANCED: 2, CORE: 1 };

  const filtered = AI_TOOLS
    .filter(t => {
      const matchCat = activeCategory === 'ALL' || t.category === activeCategory;
      const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
      const matchTier = tierFilter === 'ALL' || t.tier === tierFilter;
      const matchPower = t.power >= powerMin;
      return matchCat && matchSearch && matchTier && matchPower;
    })
    .sort((a, b) => {
      if (sortBy === 'power') return b.power - a.power;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'tier') return (TIER_RANK[b.tier] || 0) - (TIER_RANK[a.tier] || 0);
      return 0;
    });

  const renderTool = useCallback(({ item }: { item: AITool }) => (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
      onPress={() => router.push(`/tool/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.tierBadge, { borderColor: tierColor(item.tier) }]}>
          <Text style={[styles.tierText, { color: tierColor(item.tier) }]}>{item.tier}</Text>
        </View>
        {item.isNew ? (
          <View style={styles.newBadge}><Text style={styles.newText}>NEW</Text></View>
        ) : null}
        <Text style={styles.powerNum}>{item.power}</Text>
      </View>

      <Text style={styles.toolName}>{item.name}</Text>
      <Text style={styles.toolCategory}>{item.category}</Text>
      <Text style={styles.toolDesc} numberOfLines={2}>{item.description}</Text>

      <View style={styles.cardFooter}>
        <View style={styles.powerBar}>
          <View style={[styles.powerFill, { width: `${item.power}%` as any, backgroundColor: tierColor(item.tier) }]} />
        </View>
        <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
      </View>

      <View style={styles.tagRow}>
        {item.tags.map(tag => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  ), [router]);

  const activeFilterCount = [
    tierFilter !== 'ALL',
    sortBy !== 'power',
    powerMin > 0,
  ].filter(Boolean).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>[ AI APP FOUNDRY ]</Text>
          <Text style={styles.headerTitle}>THE FOUNDRY</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filtered.length}</Text>
            <Text style={styles.countLabel}>/{AI_TOOLS.length}</Text>
          </View>
          <Pressable
            style={[styles.filterToggle, showFilters && styles.filterToggleActive]}
            onPress={() => setShowFilters(v => !v)}
          >
            <MaterialIcons name="tune" size={18} color={showFilters ? Colors.crimson : Colors.textSecondary} />
            {activeFilterCount > 0 ? (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="SEARCH TOOLS, TAGS..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {search.length > 0 ? (
          <Pressable onPress={() => setSearch('')}>
            <MaterialIcons name="close" size={18} color={Colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Advanced Filters Panel */}
      {showFilters ? (
        <View style={styles.filtersPanel}>
          {/* Tier Filter */}
          <Text style={styles.filterSectionLabel}>TIER</Text>
          <View style={styles.tierFilterRow}>
            {(['ALL', 'CORE', 'ADVANCED', 'APEX'] as TierFilter[]).map(t => (
              <Pressable
                key={t}
                style={[
                  styles.tierChip,
                  tierFilter === t && {
                    borderColor: t === 'ALL' ? Colors.textSecondary : t === 'APEX' ? Colors.crimson : t === 'ADVANCED' ? Colors.cyanPulse : Colors.textSecondary,
                    backgroundColor: t === 'ALL' ? '#111' : t === 'APEX' ? '#1a0000' : t === 'ADVANCED' ? '#001a1a' : '#111',
                  }
                ]}
                onPress={() => setTierFilter(t)}
              >
                <Text style={[
                  styles.tierChipText,
                  tierFilter === t && {
                    color: t === 'ALL' ? Colors.textPrimary : t === 'APEX' ? Colors.crimson : t === 'ADVANCED' ? Colors.cyanPulse : Colors.textSecondary
                  }
                ]}>{t}</Text>
              </Pressable>
            ))}
          </View>

          {/* Sort */}
          <Text style={styles.filterSectionLabel}>SORT BY</Text>
          <View style={styles.sortRow}>
            {SORT_OPTIONS.map(opt => (
              <Pressable
                key={opt.key}
                style={[styles.sortChip, sortBy === opt.key && styles.sortChipActive]}
                onPress={() => setSortBy(opt.key)}
              >
                <Text style={[styles.sortChipText, sortBy === opt.key && styles.sortChipTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Power Range */}
          <Text style={styles.filterSectionLabel}>MIN POWER RATING: {powerMin}+</Text>
          <View style={styles.powerSliderRow}>
            {[0, 25, 50, 70, 85].map(val => (
              <Pressable
                key={val}
                style={[styles.powerBtn, powerMin === val && styles.powerBtnActive]}
                onPress={() => setPowerMin(val)}
              >
                <Text style={[styles.powerBtnText, powerMin === val && styles.powerBtnTextActive]}>
                  {val === 0 ? 'ANY' : `${val}+`}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Reset */}
          {activeFilterCount > 0 ? (
            <Pressable
              style={styles.resetBtn}
              onPress={() => { setTierFilter('ALL'); setSortBy('power'); setPowerMin(0); }}
            >
              <MaterialIcons name="refresh" size={14} color={Colors.crimson} />
              <Text style={styles.resetText}>RESET FILTERS</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map(cat => {
            const isActive = cat === activeCategory;
            return (
              <Pressable
                key={cat}
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                  {cat === 'ALL' ? 'ALL TOOLS' : cat.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Tools List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderTool}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="search-off" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>NO TOOLS MATCH FILTERS</Text>
            <Pressable onPress={() => { setSearch(''); setTierFilter('ALL'); setPowerMin(0); setActiveCategory('ALL'); }}>
              <Text style={styles.emptyReset}>CLEAR ALL FILTERS</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.void },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerEyebrow: { color: Colors.crimson, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 2, marginBottom: 2 },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.xxl, fontWeight: Typography.black, letterSpacing: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  countBadge: { flexDirection: 'row', alignItems: 'baseline', borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.sm },
  countText: { color: Colors.crimson, fontSize: Typography.lg, fontWeight: Typography.black },
  countLabel: { color: Colors.textMuted, fontSize: Typography.xs, marginLeft: 2 },
  filterToggle: {
    width: 40, height: 40, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  filterToggleActive: { borderColor: Colors.crimson, backgroundColor: '#1a0000' },
  filterBadge: {
    position: 'absolute', top: -4, right: -4, width: 16, height: 16,
    borderRadius: 8, backgroundColor: Colors.crimson, alignItems: 'center', justifyContent: 'center',
  },
  filterBadgeText: { color: '#fff', fontSize: 9, fontWeight: Typography.black },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceRaised,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: Typography.sm, letterSpacing: 1 },
  filtersPanel: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    padding: Spacing.md,
  },
  filterSectionLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: Typography.black, letterSpacing: 2, marginBottom: 6, marginTop: 8 },
  tierFilterRow: { flexDirection: 'row', gap: 6 },
  tierChip: {
    flex: 1, paddingVertical: 7, alignItems: 'center', borderWidth: 1,
    borderColor: Colors.border, borderRadius: 2, backgroundColor: Colors.surface,
  },
  tierChipText: { color: Colors.textMuted, fontSize: 9, fontWeight: Typography.black, letterSpacing: 1 },
  sortRow: { flexDirection: 'row', gap: 6 },
  sortChip: {
    flex: 1, paddingVertical: 7, alignItems: 'center', borderWidth: 1,
    borderColor: Colors.border, borderRadius: 2, backgroundColor: Colors.surface,
  },
  sortChipActive: { borderColor: Colors.crimson, backgroundColor: '#1a0000' },
  sortChipText: { color: Colors.textMuted, fontSize: 9, fontWeight: Typography.black, letterSpacing: 1 },
  sortChipTextActive: { color: Colors.crimson },
  powerSliderRow: { flexDirection: 'row', gap: 6 },
  powerBtn: {
    flex: 1, paddingVertical: 7, alignItems: 'center', borderWidth: 1,
    borderColor: Colors.border, borderRadius: 2, backgroundColor: Colors.surface,
  },
  powerBtnActive: { borderColor: Colors.cyanPulse, backgroundColor: '#001a1a' },
  powerBtnText: { color: Colors.textMuted, fontSize: 9, fontWeight: Typography.black, letterSpacing: 1 },
  powerBtnTextActive: { color: Colors.cyanPulse },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end', marginTop: Spacing.sm },
  resetText: { color: Colors.crimson, fontSize: 10, fontWeight: Typography.bold, letterSpacing: 1 },
  categoryContainer: { height: 52 },
  categoryScroll: { paddingHorizontal: Spacing.md, alignItems: 'center', gap: 8 },
  categoryChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1,
    borderColor: Colors.border, borderRadius: Radius.sm, backgroundColor: Colors.surface,
  },
  categoryChipActive: { borderColor: Colors.crimson, backgroundColor: '#1a0000' },
  categoryChipText: { color: Colors.textMuted, fontSize: 10, fontWeight: Typography.bold, letterSpacing: 1 },
  categoryChipTextActive: { color: Colors.crimson },
  list: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: 100 },
  card: {
    backgroundColor: Colors.surfaceRaised, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: 8 },
  tierBadge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 2 },
  tierText: { fontSize: 9, fontWeight: Typography.black, letterSpacing: 2 },
  newBadge: { backgroundColor: Colors.crimson, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2 },
  newText: { color: '#fff', fontSize: 9, fontWeight: Typography.black, letterSpacing: 1 },
  powerNum: { marginLeft: 'auto', color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.bold },
  toolName: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: Typography.black, letterSpacing: 2, marginBottom: 2 },
  toolCategory: { color: Colors.textSecondary, fontSize: Typography.xs, letterSpacing: 1, marginBottom: Spacing.sm },
  toolDesc: { color: Colors.textSecondary, fontSize: Typography.sm, lineHeight: Typography.sm * 1.5, marginBottom: Spacing.sm },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
  powerBar: { flex: 1, height: 3, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  powerFill: { height: 3, borderRadius: 2 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 2 },
  tagText: { color: Colors.textMuted, fontSize: 9, letterSpacing: 1 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: Colors.textMuted, fontSize: Typography.sm, letterSpacing: 2 },
  emptyReset: { color: Colors.crimson, fontSize: Typography.xs, letterSpacing: 2, textDecorationLine: 'underline' },
});
