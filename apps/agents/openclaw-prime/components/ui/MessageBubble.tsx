import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage } from '@/constants/storage';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';

interface Props {
  message: ChatMessage;
  agentColor?: string;
}

// Minimal markdown-to-RN renderer for bold, code blocks
function renderContent(text: string, isUser: boolean) {
  const lines = text.split('\n');
  return lines.map((line, li) => {
    const isCode = line.startsWith('```') || line.startsWith('    ');
    if (isCode) {
      return (
        <Text key={li} style={styles.codeText}>
          {line.replace(/```/g, '')}
        </Text>
      );
    }

    // Bold parsing
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <Text key={li} style={[styles.bodyText, isUser && styles.bodyTextUser, li > 0 && styles.newLine]}>
        {parts.map((part, pi) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <Text key={pi} style={styles.bold}>{part.slice(2, -2)}</Text>
          ) : (
            <Text key={pi}>{part}</Text>
          )
        )}
      </Text>
    );
  });
}

export function MessageBubble({ message, agentColor }: Props) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, isUser && styles.rowUser]}>
      {!isUser && (
        <View style={[styles.avatar, { backgroundColor: (agentColor || Colors.primary) + '22', borderColor: agentColor || Colors.primary }]}>
          <Text style={[styles.avatarText, { color: agentColor || Colors.primary }]}>
            {isUser ? 'U' : 'AI'}
          </Text>
        </View>
      )}

      <View style={[
        styles.bubble,
        isUser ? styles.bubbleUser : styles.bubbleAI,
        !isUser && agentColor && { borderColor: agentColor + '44' },
      ]}>
        {renderContent(message.content || '▋', isUser)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  rowUser: { flexDirection: 'row-reverse' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: Typography.xs, fontWeight: Typography.bold },
  bubble: {
    maxWidth: '80%',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDim,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: Colors.bgCard,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  bodyText: { fontSize: Typography.base, color: Colors.textPrimary, lineHeight: 22 },
  bodyTextUser: { color: Colors.textInverse },
  bold: { fontWeight: Typography.bold },
  newLine: { marginTop: 2 },
  codeText: {
    fontFamily: 'SpaceMono',
    fontSize: Typography.sm,
    color: Colors.success,
    backgroundColor: Colors.bg,
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    marginVertical: 2,
  },
});
