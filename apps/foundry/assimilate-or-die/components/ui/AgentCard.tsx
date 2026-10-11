import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Agent } from '@/constants/agents';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme';

interface AgentCardProps {
  agent: Agent;
  onPress: () => void;
}

export const AgentCard = memo(function AgentCard({ agent, onPress }: AgentCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={[styles.iconContainer, { borderColor: agent.color, shadowColor: agent.color }]}>
        <MaterialIcons name={agent.icon as any} size={28} color={agent.color} />
      </View>

      <View style={styles.info}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: agent.color }]}>{agent.name}</Text>
          <View style={[styles.badge, { borderColor: agent.color, backgroundColor: `${agent.color}18` }]}>
            <Text style={[styles.badgeText, { color: agent.color }]}>{agent.capability}</Text>
          </View>
        </View>
        <Text style={styles.title}>{agent.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{agent.description}</Text>
      </View>

      <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  name: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  description: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
});
