// KRACKERJACK AI — Repo Card Component (Real GitHub Data)

import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { GitHubRepo, timeAgo } from '@/services/githubService';

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
  CSS: '#563d7c',
  HTML: '#e34c26',
  Shell: '#89e051',
};

interface RepoCardProps {
  repo: GitHubRepo;
  isAssimilated: boolean;
  onAssimilate: (id: number) => void;
}

export const RepoCard = memo(function RepoCard({ repo, isAssimilated, onAssimilate }: RepoCardProps) {
  const router = useRouter();
  const langColor = repo.language ? (LANG_COLORS[repo.language] || Colors.textMuted) : Colors.textMuted;

  const statusColor = isAssimilated ? Colors.primary : Colors.textMuted;
  const statusLabel = isAssimilated ? 'ASSIMILATED' : 'TARGET';
  const statusIcon = isAssimilated ? 'hub' : 'gps-not-fixed';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push({ pathname: '/repo/[id]', params: { id: String(repo.id), fullName: repo.full_name } })}
    >
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.nameGroup}>
          <MaterialIcons name={statusIcon as any} size={14} color={statusColor} />
          <Text style={styles.repoName} numberOfLines={1}>{repo.name}</Text>
          {repo.private ? (
            <View style={styles.privateBadge}>
              <MaterialIcons name="lock" size={10} color={Colors.accent} />
              <Text style={styles.privateTxt}>PRIVATE</Text>
            </View>
          ) : null}
          {repo.fork ? (
            <View style={styles.forkBadge}>
              <MaterialIcons name="call-split" size={10} color={Colors.info} />
            </View>
          ) : null}
        </View>
        <View style={[styles.statusPill, { borderColor: statusColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {/* Description */}
      {repo.description ? (
        <Text style={styles.description} numberOfLines={2}>{repo.description}</Text>
      ) : null}

      {/* Meta row */}
      <View style={styles.metaRow}>
        {repo.language ? (
          <View style={styles.langGroup}>
            <View style={[styles.langDot, { backgroundColor: langColor }]} />
            <Text style={styles.metaText}>{repo.language}</Text>
          </View>
        ) : null}
        {repo.stargazers_count > 0 ? (
          <View style={styles.metaGroup}>
            <MaterialIcons name="star-outline" size={12} color={Colors.accent} />
            <Text style={styles.metaText}>{repo.stargazers_count}</Text>
          </View>
        ) : null}
        {repo.forks_count > 0 ? (
          <View style={styles.metaGroup}>
            <MaterialIcons name="call-split" size={12} color={Colors.textMuted} />
            <Text style={styles.metaText}>{repo.forks_count}</Text>
          </View>
        ) : null}
        <Text style={styles.timeText}>{timeAgo(repo.updated_at)}</Text>
      </View>

      {/* Assimilate button for pending repos */}
      {!isAssimilated ? (
        <Pressable
          style={({ pressed }) => [styles.assimBtn, pressed && { opacity: 0.7 }]}
          onPress={(e) => { e.stopPropagation?.(); onAssimilate(repo.id); }}
        >
          <MaterialIcons name="add-circle-outline" size={13} color={Colors.danger} />
          <Text style={styles.assimBtnText}>ASSIMILATE</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgPanel,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardPressed: {
    borderColor: Colors.primaryMuted,
    opacity: 0.88,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  repoName: {
    fontSize: FontSize.sm,
    color: Colors.textWhite,
    fontWeight: FontWeight.bold,
    flex: 1,
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.accentMuted,
    borderRadius: Radius.pill,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  privateTxt: {
    fontSize: 8,
    color: Colors.accent,
    letterSpacing: 0.5,
    fontWeight: FontWeight.bold,
  },
  forkBadge: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.pill,
    padding: 2,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 8,
    fontWeight: FontWeight.black,
    letterSpacing: 0.8,
  },
  description: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 16,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  langGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  langDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  timeText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginLeft: 'auto',
  },
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
});
