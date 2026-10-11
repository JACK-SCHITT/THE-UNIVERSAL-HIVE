import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import type { Reaction } from '@/hooks/useReactions';
import { useConversationTheme } from '@/contexts/ThemeContext';

const REACTION_EMOJIS = ['❤️', '😍', '🌙', '✨', '😂', '🔥'];

interface MessageBubbleProps {
  id: string;
  message: string;
  sender: 'user' | 'ai';
  imageUrl?: string | null;
  avatar?: string;
  isStreaming?: boolean;
  reactions?: Record<string, Reaction>;
  onReact?: (emoji: string) => void;
}

export function MessageBubble({
  id,
  message,
  sender,
  imageUrl,
  avatar,
  isStreaming,
  reactions = {},
  onReact,
}: MessageBubbleProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const { activeTheme } = useConversationTheme();
  const isUser = sender === 'user';

  const handleSpeak = async () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      // Remove all emoji unicode characters
      const cleanText = message
        .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
        .replace(/[\u{2600}-\u{27BF}]/gu, '')
        .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
        .trim();

      Speech.speak(cleanText, {
        pitch: 1.8,
        rate: 0.75,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
      setIsSpeaking(true);
    }
  };

  const handleReact = (emoji: string) => {
    onReact?.(emoji);
    setShowReactionPicker(false);
  };

  const reactionEntries = Object.values(reactions);

  return (
    <View style={[styles.container, isUser && styles.containerUser]}>
      {!isUser && avatar && (
        <Image
          source={{ uri: avatar }}
          style={[styles.avatar, { borderColor: activeTheme.accentColor }]}
          contentFit="cover"
          transition={200}
        />
      )}

      <View style={styles.bubbleWrapper}>
        {/* Reaction Picker */}
        {showReactionPicker && (
          <View style={[styles.reactionPicker, isUser && styles.reactionPickerUser]}>
            {REACTION_EMOJIS.map(emoji => (
              <Pressable
                key={emoji}
                onPress={() => handleReact(emoji)}
                style={({ pressed }) => [styles.reactionOption, pressed && styles.reactionOptionPressed]}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable
          onLongPress={() => !isUser && setShowReactionPicker(p => !p)}
          style={({ pressed }) => [
            styles.bubble,
            isUser
              ? [styles.bubbleUser, { backgroundColor: activeTheme.accentColor }]
              : styles.bubbleAi,
            pressed && styles.bubblePressed,
          ]}
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          ) : null}

          {message ? (
            <Text style={[styles.text, isUser ? styles.textUser : styles.textAi]}>
              {message}
              {isStreaming ? <Text style={[styles.cursor, { color: activeTheme.accentColor }]}>▋</Text> : null}
            </Text>
          ) : null}

          {!isUser && !isStreaming && (
            <View style={styles.actions}>
              <Pressable
                onPress={handleSpeak}
                style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
              >
                <MaterialIcons
                  name={isSpeaking ? 'stop' : 'volume-up'}
                  size={16}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
          )}
        </Pressable>

        {/* Reactions display */}
        {reactionEntries.length > 0 && (
          <View style={[styles.reactionsRow, isUser && styles.reactionsRowUser]}>
            {reactionEntries.map(r => (
              <Pressable
                key={r.emoji}
                onPress={() => handleReact(r.emoji)}
                style={[
                  styles.reactionBadge,
                  r.userReacted && { borderColor: activeTheme.accentColor, borderWidth: 1 },
                ]}
              >
                <Text style={styles.reactionBadgeEmoji}>{r.emoji}</Text>
                {r.count > 1 ? <Text style={styles.reactionCount}>{r.count}</Text> : null}
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'flex-end',
  },
  containerUser: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    borderWidth: 2,
  },
  bubbleWrapper: {
    maxWidth: '75%',
  },
  bubble: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  bubblePressed: {
    opacity: 0.85,
  },
  bubbleUser: {
    borderRadius: borderRadius.md,
  },
  bubbleAi: {
    backgroundColor: colors.bgLight,
    borderWidth: 1,
    borderColor: colors.neonPurple + '30',
  },
  text: {
    ...typography.body,
  },
  textUser: {
    color: colors.textPrimary,
  },
  textAi: {
    color: colors.textSecondary,
  },
  cursor: {
    fontWeight: '700',
  },
  image: {
    width: 220,
    height: 180,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  actionButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  actionButtonPressed: { opacity: 0.5 },
  reactionPicker: {
    flexDirection: 'row',
    backgroundColor: colors.bgLight,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.neonPurple + '30',
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  reactionPickerUser: {
    alignSelf: 'flex-end',
  },
  reactionOption: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  reactionOptionPressed: { backgroundColor: colors.bgMid },
  reactionEmoji: { fontSize: 20 },
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  reactionsRowUser: { alignSelf: 'flex-end' },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reactionBadgeEmoji: { fontSize: 14 },
  reactionCount: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
});
