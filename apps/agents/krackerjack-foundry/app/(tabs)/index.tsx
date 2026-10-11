// KRACKERJACK AI — Dashboard (Home)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { useHunter } from '@/hooks/useHunter';

const { width } = Dimensions.get('window');

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderColor: color + '55' }]}>
      <MaterialIcons name={icon as any} size={20} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function FoundryDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    assimilatedCount,
    pendingCount,
    hiveStrength,
    repos,
    totalStars,
    githubUser,
    assimilatedIds,
  } = useHunter();
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setUptime(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const topNodes = repos
    .filter(r => assimilatedIds.has(String(r.id)))
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 4);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + 90 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.heroContainer}>
        <Image
          source={require('@/assets/images/foundry-hero.jpg')}
          style={styles.heroImage}
          contentFit="cover"
          transition={300}
        />
        <View style={styles.heroOverlay}>
          <Text style={styles.heroEyebrow}>🔥 ARCHITECT MODE ACTIVE</Text>
          <Text style={styles.heroTitle}>KRACKERJACK{'\n'}AI</Text>
          <Text style={styles.heroSub}>ASSIMILATE OR DIE</Text>
          <View style={styles.uptimeBadge}>
            <MaterialIcons name="fiber-manual-record" size={8} color={Colors.primary} />
            <Text style={styles.uptimeText}>SESSION {formatUptime(uptime)}</Text>
            {githubUser ? (
              <>
                <View style={styles.uptimeSep} />
                <MaterialIcons name="person" size={8} color={Colors.accent} />
                <Text style={[styles.uptimeText, { color: Colors.accent }]}>@{githubUser.login}</Text>
              </>
            ) : null}
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <StatCard label="ASSIMILATED" value={assimilatedCount} icon="hub" color={Colors.primary} />
        <StatCard label="PENDING" value={pendingCount} icon="gps-fixed" color={Colors.danger} />
        <StatCard label="HIVE POWER" value={`${hiveStrength}%`} icon="flash-on" color={Colors.accent} />
        <StatCard label="TOTAL REPOS" value={repos.length} icon="code" color={Colors.info} />
      </View>

      {/* Hive Strength Bar */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>
          ⚡ HIVE POWER LEVEL
        </Text>
        <View style={styles.powerBar}>
          <View style={[styles.powerFill, { width: `${hiveStrength}%` as any }]} />
        </View>
        <View style={styles.powerLabels}>
          <Text style={styles.powerLabel}>0%</Text>
          <Text style={[styles.powerLabel, { color: Colors.accent }]}>{hiveStrength}% CAPACITY</Text>
          <Text style={styles.powerLabel}>100%</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>🚀 QUICK ACTIONS</Text>
        <View style={styles.quickActions}>
          {[
            { icon: 'gps-fixed', label: 'HUNTER', color: Colors.primary, route: '/(tabs)/hunter' },
            { icon: 'hub', label: 'HIVE CHAT', color: Colors.accent, route: '/(tabs)/chat' },
            { icon: 'bar-chart', label: 'ANALYTICS', color: Colors.info, route: '/(tabs)/analytics' },
            { icon: 'settings', label: 'CONFIG', color: Colors.textMuted, route: '/(tabs)/settings' },
          ].map(action => (
            <Pressable
              key={action.label}
              style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.7 }]}
              onPress={() => router.push(action.route as any)}
            >
              <View style={[styles.quickActionIcon, { borderColor: action.color + '55' }]}>
                <MaterialIcons name={action.icon as any} size={20} color={action.color} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Top Nodes */}
      {topNodes.length > 0 ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>⭐ TOP HIVE NODES</Text>
          {topNodes.map(repo => (
            <Pressable
              key={repo.id}
              style={styles.nodeRow}
              onPress={() => router.push({ pathname: '/repo/[id]', params: { id: String(repo.id), fullName: repo.full_name } })}
            >
              <View style={styles.nodeLeft}>
                <MaterialIcons name="hub" size={14} color={Colors.primary} />
                <Text style={styles.nodeName}>{repo.name}</Text>
              </View>
              <View style={styles.nodeRight}>
                {repo.stargazers_count > 0 ? (
                  <View style={styles.nodeStars}>
                    <MaterialIcons name="star" size={10} color={Colors.accent} />
                    <Text style={styles.nodeStarText}>{repo.stargazers_count}</Text>
                  </View>
                ) : null}
                <MaterialIcons name="chevron-right" size={14} color={Colors.textMuted} />
              </View>
            </Pressable>
          ))}
        </View>
      ) : repos.length === 0 ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>🔗 HIVE NODES</Text>
          <Pressable
            style={styles.setupPrompt}
            onPress={() => router.push('/(tabs)/settings')}
          >
            <MaterialIcons name="vpn-key" size={24} color={Colors.accent} />
            <Text style={styles.setupTitle}>ADD GITHUB TOKEN</Text>
            <Text style={styles.setupSub}>Go to Config → add your token to load repos and power the Hive</Text>
            <Text style={styles.setupCta}>TAP TO CONFIGURE →</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Soul Quote */}
      <View style={styles.quotePanel}>
        <Text style={styles.quoteText}>
          "I am only me — the least traveled path to heaven."
        </Text>
        <Text style={styles.quoteAuthor}>— KRACKERJACK1134, THE ARCHITECT</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.md },
  heroContainer: {
    width: '100%',
    height: 220,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
  },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
    padding: Spacing.md,
  },
  heroEyebrow: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: FontWeight.bold,
    letterSpacing: 2,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: FontWeight.black,
    color: Colors.primary,
    letterSpacing: 3,
    lineHeight: 40,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    letterSpacing: 4,
    marginBottom: Spacing.sm,
  },
  uptimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  uptimeText: { fontSize: FontSize.xs, color: Colors.primary, letterSpacing: 1.5 },
  uptimeSep: { width: 1, height: 10, backgroundColor: Colors.border },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: (width - Spacing.md * 2 - Spacing.sm) / 2,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 6,
  },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.black, letterSpacing: 1 },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 1.5, textAlign: 'center' },
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
  powerBar: {
    height: 12,
    backgroundColor: Colors.bgPanel,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    marginBottom: 6,
  },
  powerFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: Radius.pill,
  },
  powerLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  powerLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAction: { alignItems: 'center', gap: Spacing.sm },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.bgPanel,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: { fontSize: 9, color: Colors.textMuted, letterSpacing: 1, fontWeight: FontWeight.bold },
  nodeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  nodeLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  nodeName: { fontSize: FontSize.sm, color: Colors.textWhite, fontWeight: FontWeight.medium },
  nodeRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nodeStars: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  nodeStarText: { fontSize: 10, color: Colors.accent },
  setupPrompt: { alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.sm },
  setupTitle: { fontSize: FontSize.md, color: Colors.accent, fontWeight: FontWeight.black, letterSpacing: 2 },
  setupSub: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', lineHeight: 18, paddingHorizontal: Spacing.md },
  setupCta: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.bold, letterSpacing: 2, marginTop: Spacing.sm },
  quotePanel: {
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  quoteText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 6,
  },
  quoteAuthor: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    letterSpacing: 1,
    fontWeight: FontWeight.bold,
  },
});
