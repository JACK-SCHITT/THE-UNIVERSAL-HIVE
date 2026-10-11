import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { Message } from '@/services/conversations';

interface MessageBubbleProps {
  message: Message;
  agentColor: string;
}

export const MessageBubble = memo(function MessageBubble({ message, agentColor }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.agentContainer]}>
      {!isUser && <View style={[styles.indicator, { backgroundColor: agentColor }]} />}
      <View style={[
        styles.bubble,
        isUser ? styles.userBubble : [styles.agentBubble, { borderColor: `${agentColor}40` }],
      ]}>
        {!isUser && (
          <Text style={[styles.senderLabel, { color: agentColor }]}>OPENCLAW PRIME</Text>
        )}
        <Text style={[styles.text, isUser ? styles.userText : styles.agentText]}>
          {message.content}
        </Text>
        <Text style={styles.timestamp}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
});

interface StreamingBubbleProps {
  text: string;
  agentColor: string;
}

export const StreamingBubble = memo(function StreamingBubble({ text, agentColor }: StreamingBubbleProps) {
  return (
    <View style={[styles.container, styles.agentContainer]}>
      <View style={[styles.indicator, { backgroundColor: agentColor }]} />
      <View style={[styles.bubble, styles.agentBubble, { borderColor: `${agentColor}40` }]}>
        <Text style={[styles.senderLabel, { color: agentColor }]}>OPENCLAW PRIME</Text>
        <Text style={[styles.text, styles.agentText]}>{text || '...'}</Text>
        <View style={styles.cursor}>
          <View style={[styles.cursorBlock, { backgroundColor: agentColor }]} />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  agentContainer: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },
  indicator: {
    width: 2,
    borderRadius: 1,
    alignSelf: 'stretch',
    marginTop: 4,
    minHeight: 24,
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: 4,
  },
  userBubble: {
    backgroundColor: '#141408',
    borderWidth: 1,
    borderColor: `${Colors.primary}50`,
  },
  agentBubble: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
  },
  senderLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  text: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  userText: {
    color: Colors.textPrimary,
  },
  agentText: {
    color: '#d4d4d4',
  },
  timestamp: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  cursor: {
    flexDirection: 'row',
    marginTop: 4,
  },
  cursorBlock: {
    width: 8,
    height: 13,
    opacity: 0.9,
  },
});
