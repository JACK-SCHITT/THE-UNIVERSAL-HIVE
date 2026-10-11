/**
 * Story Card Component
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Story } from '../../types';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import Card from '../ui/Card';

interface StoryCardProps {
  story: Story;
  onPress: () => void;
}

export default function StoryCard({ story, onPress }: StoryCardProps) {
  const statusColors = {
    draft: Colors.textMuted,
    generating: Colors.warning,
    completed: Colors.success,
  };

  const statusIcons = {
    draft: 'edit' as const,
    generating: 'movie-creation' as const,
    completed: 'check-circle' as const,
  };

  return (
    <Card onPress={onPress} elevated>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {story.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[story.status] + '20' }]}>
            <MaterialIcons
              name={statusIcons[story.status]}
              size={14}
              color={statusColors[story.status]}
            />
            <Text style={[styles.statusText, { color: statusColors[story.status] }]}>
              {story.status}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.genre}>{story.genre}</Text>
      <Text style={styles.synopsis} numberOfLines={2}>
        {story.synopsis}
      </Text>

      <View style={styles.footer}>
        <View style={styles.stat}>
          <MaterialIcons name="person" size={16} color={Colors.textMuted} />
          <Text style={styles.statText}>{story.characters.length} characters</Text>
        </View>
        <View style={styles.stat}>
          <MaterialIcons name="movie" size={16} color={Colors.textMuted} />
          <Text style={styles.statText}>{story.scenes.length} scenes</Text>
        </View>
        <View style={styles.stat}>
          <MaterialIcons name="schedule" size={16} color={Colors.textMuted} />
          <Text style={styles.statText}>{story.duration} min</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  title: {
    ...Typography.headline,
    fontSize: 18,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  genre: {
    ...Typography.caption,
    color: Colors.primary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  synopsis: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    ...Typography.caption,
    fontSize: 12,
  },
});
