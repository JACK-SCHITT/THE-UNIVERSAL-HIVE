import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Conversation } from '@/services/conversations';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme';
import { AGENTS } from '@/constants/agents';

interface ProjectCardProps {
  conversation: Conversation;
  onPress: () => void;
  onDelete: () => void;
}

export const ProjectCard = memo(function ProjectCard({ conversation, onPress, onDelete }: ProjectCardProps) {
  const agent = AGENTS.find(a => a.id === conversation.agent_id);
  const agentColor = agent?.color ?? Colors.primary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.colorBar, { backgroundColor: agentColor }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.agentBadge, { borderColor: `${agentColor}60`, backgroundColor: `${agentColor}15` }]}>
            <MaterialIcons name={(agent?.icon ?? 'smart-toy') as any} size={12} color={agentColor} />
            <Text style={[styles.agentName, { color: agentColor }]}>{conversation.agent_name}</Text>
          </View>
          <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteBtn}>
            <MaterialIcons name="close" size={16} color={Colors.textMuted} />
          </Pressable>
        </View>
        <Text style={styles.title} numberOfLines={1}>{conversation.title}</Text>
        {conversation.last_message ? (
          <Text style={styles.preview} numberOfLines={2}>{conversation.last_message}</Text>
        ) : null}
        <Text style={styles.date}>
          {new Date(conversation.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.75,
  },
  colorBar: {
    width: 3,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  agentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  agentName: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  deleteBtn: {
    padding: 2,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  preview: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  date: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 2,
  },
});
