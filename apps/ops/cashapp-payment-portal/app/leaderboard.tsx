import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { DonorProfile } from '@/services/leaderboardService';

const TIER_COLORS = {
  hero: '#FFD700',
  guardian: '#E6E6FA',
  defender: '#CD7F32',
  supporter: '#00D632',
};

const TIER_ICONS = {
  hero: 'emoji-events',
  guardian: 'shield',
  defender: 'security',
  supporter: 'volunteer-activism',
};

function DonorCard({ donor, rank }: { donor: DonorProfile; rank: number }) {
  const tierColor = TIER_COLORS[donor.tier];
  const tierIcon = TIER_ICONS[donor.tier];

  return (
    <View style={styles.donorCard}>
      <View style={styles.rankContainer}>
        <Text style={styles.rank}>#{rank}</Text>
      </View>
      
      <View style={[styles.avatarContainer, { borderColor: tierColor }]}>
        <MaterialIcons name={tierIcon as any} size={28} color={tierColor} />
      </View>
      
      <View style={styles.donorInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.donorName}>{donor.name}</Text>
          {rank <= 3 && (
            <MaterialIcons 
              name={rank === 1 ? 'workspace-premium' : 'star'} 
              size={20} 
              color={rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32'} 
            />
          )}
        </View>
        <Text style={styles.tierText}>{donor.tier.charAt(0).toUpperCase() + donor.tier.slice(1)}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statText}>{donor.donationCount} donations</Text>
          {donor.badges.length > 0 && (
            <Text style={styles.badgeCount}>🏆 {donor.badges.length}</Text>
          )}
        </View>
      </View>
      
      <Text style={styles.amount}>${donor.totalDonated.toFixed(0)}</Text>
    </View>
  );
}

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { topDonors, loading, refresh } = useLeaderboard();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <MaterialIcons name="emoji-events" size={32} color={THEME.colors.primary} />
        <View style={styles.headerText}>
          <Text style={styles.title}>Top Contributors</Text>
          <Text style={styles.subtitle}>Heroes fighting scams</Text>
        </View>
        <Pressable onPress={refresh}>
          <MaterialIcons name="refresh" size={24} color={THEME.colors.text} />
        </Pressable>
      </View>

      {topDonors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="leaderboard" size={80} color={THEME.colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Donors Yet</Text>
          <Text style={styles.emptyText}>Be the first to join the leaderboard!</Text>
        </View>
      ) : (
        <FlatList
          data={topDonors}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <DonorCard donor={item} rank={index + 1} />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 16 },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  headerText: {
    flex: 1,
    marginLeft: THEME.spacing.md,
  },
  title: {
    ...THEME.typography.h2,
    color: THEME.colors.text,
    includeFontPadding: false,
  },
  subtitle: {
    ...THEME.typography.caption,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    includeFontPadding: false,
  },
  listContent: {
    padding: THEME.spacing.md,
  },
  donorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
  },
  rank: {
    ...THEME.typography.h3,
    color: THEME.colors.textSecondary,
    includeFontPadding: false,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: THEME.spacing.sm,
    borderWidth: 2,
  },
  donorInfo: {
    flex: 1,
    marginLeft: THEME.spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  donorName: {
    ...THEME.typography.body,
    color: THEME.colors.text,
    fontWeight: '600',
    includeFontPadding: false,
  },
  tierText: {
    ...THEME.typography.caption,
    color: THEME.colors.primary,
    marginTop: 2,
    includeFontPadding: false,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.xs,
  },
  statText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    includeFontPadding: false,
  },
  badgeCount: {
    fontSize: 12,
    color: THEME.colors.text,
    includeFontPadding: false,
  },
  amount: {
    ...THEME.typography.h3,
    color: THEME.colors.primary,
    fontWeight: '700',
    includeFontPadding: false,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.xl,
  },
  emptyTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text,
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.sm,
    includeFontPadding: false,
  },
  emptyText: {
    ...THEME.typography.body,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
