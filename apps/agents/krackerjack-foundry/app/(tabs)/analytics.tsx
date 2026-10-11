// KRACKERJACK AI — Hive Analytics Tab

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { useHunter } from '@/hooks/useHunter';

const { width } = Dimensions.get('window');

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Ruby: '#701516',
  PHP: '#4F5D95',
};

export default function HiveAnalytics() {
  const insets = useSafeAreaInsets();
  const {
    repos,
    hiveStrength,
    assimilatedCount,
    pendingCount,
    totalStars,
    topLanguages,
    githubUser,
    assimilatedIds,
  } = useHunter();

  const totalForks = repos.reduce((sum, r) => sum + r.forks_count, 0);
  const privateCount = repos.filter(r => r.private).length;
  const forkedCount = repos.filter(r => r.fork).length;
  const archivedCount = repos.filter(r => r.archived).length;
  const totalIssues = repos.reduce((sum, r) => sum + r.open_issues_count, 0);
  const totalSize = repos.reduce((sum, r) => sum + r.size, 0);

  const topStarred = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 5);
  const recentlyUpdated = [...repos].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 5);

  const maxLangCount = topLanguages.length > 0 ? topLanguages[0][1] : 1;

  function formatSize(kb: number): string {
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }

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
        <MaterialIcons name="bar-chart" size={20} color={Colors.accent} />
        <View>
          <Text style={styles.headerTitle}>HIVE ANALYTICS</Text>
          {githubUser ? (
            <Text style={styles.headerSub}>@{githubUser.login}</Text>
          ) : null}
        </View>
      </View>

      {/* Hive Strength */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>⚡ HIVE POWER LEVEL</Text>
        <View style={styles.strengthRow}>
          <Text style={styles.strengthValue}>{hiveStrength}%</Text>
          <Text style={styles.strengthLabel}>ASSIMILATION RATE</Text>
        </View>
        <View style={styles.powerBarBg}>
          <View style={[styles.powerBarFill, { width: `${hiveStrength}%` as any }]} />
        </View>
        <Text style={styles.powerBarCaption}>
          {assimilatedCount} of {repos.length} nodes under Hive control
        </Text>
      </View>

      {/* Key Stats Grid */}
      <View style={styles.statsGrid}>
        {[
          { label: 'TOTAL REPOS', value: repos.length, icon: 'code', color: Colors.primary },
          { label: 'TOTAL STARS', value: totalStars, icon: 'star', color: Colors.accent },
          { label: 'TOTAL FORKS', value: totalForks, icon: 'call-split', color: Colors.info },
          { label: 'OPEN ISSUES', value: totalIssues, icon: 'bug-report', color: Colors.danger },
          { label: 'PRIVATE', value: privateCount, icon: 'lock', color: Colors.accent },
          { label: 'FORKED', value: forkedCount, icon: 'call-split', color: Colors.textMuted },
          { label: 'ARCHIVED', value: archivedCount, icon: 'archive', color: Colors.textMuted },
          { label: 'TOTAL SIZE', value: formatSize(totalSize), icon: 'storage', color: Colors.info },
        ].map(({ label, value, icon, color }) => (
          <View key={label} style={[styles.statCard, { borderColor: color + '44' }]}>
            <MaterialIcons name={icon as any} size={18} color={color} />
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Language Breakdown */}
      {topLanguages.length > 0 ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>💻 LANGUAGE BREAKDOWN</Text>
          {topLanguages.map(([lang, count]) => {
            const color = LANG_COLORS[lang] || Colors.textSecondary;
            const pct = Math.round((count / repos.length) * 100);
            return (
              <View key={lang} style={styles.langRow}>
                <View style={[styles.langDot, { backgroundColor: color }]} />
                <Text style={styles.langName}>{lang}</Text>
                <View style={styles.langBarBg}>
                  <View style={[styles.langBarFill, {
                    width: `${Math.round((count / maxLangCount) * 100)}%` as any,
                    backgroundColor: color,
                  }]} />
                </View>
                <Text style={styles.langCount}>{count} ({pct}%)</Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {/* Top Starred */}
      {topStarred.length > 0 && totalStars > 0 ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>⭐ TOP STARRED NODES</Text>
          {topStarred.filter(r => r.stargazers_count > 0).map((repo, i) => (
            <View key={repo.id} style={styles.rankRow}>
              <Text style={styles.rankNum}>#{i + 1}</Text>
              <View style={styles.rankCenter}>
                <Text style={styles.rankName}>{repo.name}</Text>
                {repo.description ? (
                  <Text style={styles.rankDesc} numberOfLines={1}>{repo.description}</Text>
                ) : null}
              </View>
              <View style={styles.rankRight}>
                <MaterialIcons name="star" size={12} color={Colors.accent} />
                <Text style={styles.rankStat}>{repo.stargazers_count}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* Recent Activity */}
      {recentlyUpdated.length > 0 ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>🕐 RECENT ACTIVITY</Text>
          {recentlyUpdated.map(repo => {
            const assimilated = assimilatedIds.has(String(repo.id));
            return (
              <View key={repo.id} style={styles.actRow}>
                <MaterialIcons
                  name={assimilated ? 'hub' : 'gps-not-fixed'}
                  size={12}
                  color={assimilated ? Colors.primary : Colors.textMuted}
                />
                <View style={styles.actCenter}>
                  <Text style={styles.actName}>{repo.name}</Text>
                  <Text style={styles.actTime}>{new Date(repo.updated_at).toLocaleDateString()}</Text>
                </View>
                {repo.language ? (
                  <View style={[styles.langPill, { borderColor: (LANG_COLORS[repo.language] || Colors.border) + '88' }]}>
                    <Text style={[styles.langPillText, { color: LANG_COLORS[repo.language] || Colors.textMuted }]}>
                      {repo.language}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}

      {/* GitHub Profile Card */}
      {githubUser ? (
        <View style={[styles.panel, styles.profilePanel]}>
          <Text style={styles.panelTitle}>👤 ARCHITECT PROFILE</Text>
          <View style={styles.profileRow}>
            <View>
              <Text style={styles.profileName}>{githubUser.name || githubUser.login}</Text>
              <Text style={styles.profileLogin}>@{githubUser.login}</Text>
              {githubUser.bio ? (
                <Text style={styles.profileBio}>{githubUser.bio}</Text>
              ) : null}
            </View>
            <View style={styles.profileStats}>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatVal}>{githubUser.followers}</Text>
                <Text style={styles.profileStatLabel}>FOLLOWERS</Text>
              </View>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatVal}>{githubUser.following}</Text>
                <Text style={styles.profileStatLabel}>FOLLOWING</Text>
              </View>
            </View>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    color: Colors.accent,
    letterSpacing: 3,
  },
  headerSub: { fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 0.5 },
  panel: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  profilePanel: { borderColor: Colors.accentMuted },
  panelTitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  strengthValue: {
    fontSize: 40,
    fontWeight: FontWeight.black,
    color: Colors.accent,
    lineHeight: 44,
  },
  strengthLabel: { fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 2 },
  powerBarBg: {
    height: 10,
    backgroundColor: Colors.bgPanel,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    marginBottom: 6,
  },
  powerBarFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: Radius.pill,
  },
  powerBarCaption: { fontSize: FontSize.xs, color: Colors.textMuted },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: (width - Spacing.md * 2 - Spacing.sm * 3) / 4,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { fontSize: FontSize.md, fontWeight: FontWeight.black },
  statLabel: { fontSize: 8, color: Colors.textMuted, letterSpacing: 0.8, textAlign: 'center' },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  langDot: { width: 10, height: 10, borderRadius: 5 },
  langName: { fontSize: FontSize.xs, color: Colors.textWhite, width: 80 },
  langBarBg: { flex: 1, height: 6, backgroundColor: Colors.bgPanel, borderRadius: Radius.pill, overflow: 'hidden' },
  langBarFill: { height: '100%', borderRadius: Radius.pill, opacity: 0.85 },
  langCount: { fontSize: FontSize.xs, color: Colors.textMuted, width: 60, textAlign: 'right' },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rankNum: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: FontWeight.black, width: 24 },
  rankCenter: { flex: 1 },
  rankName: { fontSize: FontSize.sm, color: Colors.textWhite, fontWeight: FontWeight.bold },
  rankDesc: { fontSize: FontSize.xs, color: Colors.textMuted },
  rankRight: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rankStat: { fontSize: FontSize.xs, color: Colors.accent, fontWeight: FontWeight.bold },
  actRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actCenter: { flex: 1 },
  actName: { fontSize: FontSize.sm, color: Colors.textWhite },
  actTime: { fontSize: FontSize.xs, color: Colors.textMuted },
  langPill: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  langPillText: { fontSize: 9, fontWeight: FontWeight.bold },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  profileName: { fontSize: FontSize.md, color: Colors.textWhite, fontWeight: FontWeight.bold },
  profileLogin: { fontSize: FontSize.xs, color: Colors.primary, marginTop: 2 },
  profileBio: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4, lineHeight: 16, maxWidth: 200 },
  profileStats: { gap: Spacing.sm },
  profileStat: { alignItems: 'center' },
  profileStatVal: { fontSize: FontSize.md, fontWeight: FontWeight.black, color: Colors.accent },
  profileStatLabel: { fontSize: 9, color: Colors.textMuted, letterSpacing: 1 },
});
