import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Agent } from '@/constants/config';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';

interface Props {
  agent: Agent;
  onPress: () => void;
  compact?: boolean;
}

export function AgentCard({ agent, onPress, compact }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact && styles.cardCompact,
        pressed && styles.pressed,
      ]}
    >
      {/* Accent stripe */}
      <View style={[styles.stripe, { backgroundColor: agent.color }]} />

      <View style={[styles.iconWrap, { backgroundColor: agent.color + '22' }]}>
        <MaterialIcons name={agent.icon as any} size={compact ? 22 : 26} color={agent.color} />
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: agent.color }]}>{agent.name}</Text>
        <Text style={styles.title} numberOfLines={1}>{agent.title}</Text>
        {!compact && (
          <Text style={styles.tagline} numberOfLines={2}>{agent.tagline}</Text>
        )}
      </View>

      <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardCompact: {
    padding: Spacing.sm + 2,
    gap: Spacing.sm,
  },
  stripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderRadius: 2,
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: Typography.sm, fontWeight: Typography.bold, letterSpacing: 0.5 },
  title: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary, marginTop: 1 },
  tagline: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 3, lineHeight: 18 },
});
