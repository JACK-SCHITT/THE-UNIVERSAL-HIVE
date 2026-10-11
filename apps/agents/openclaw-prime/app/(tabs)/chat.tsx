import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { MessageBubble, TypingIndicator, ChatInput } from '@/components';
import { useChat } from '@/hooks/useChat';
import { Colors, Spacing, Typography, Radii } from '@/constants/theme';

const SESSION_ID = 'prime_main';

export default function PrimeChatScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { messages, isStreaming, sendUserMessage, loadHistory } = useChat(SESSION_ID, undefined);

  useEffect(() => { loadHistory(); }, []);
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages.length, isStreaming]);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.bottom}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.statusDot} />
          <View>
            <Text style={styles.headerTitle}>OPENCLAW PRIME</Text>
            <Text style={styles.headerSub}>Gateway Agent · All Systems Online</Text>
          </View>
        </View>
        <MaterialIcons name="auto-awesome" size={22} color={Colors.primary} />
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyLabel}>{'// AWAITING INPUT'}</Text>
            <Text style={styles.emptyTitle}>ASSIMILATE OR DIE</Text>
            <Text style={styles.emptyDesc}>
              Drop your app idea. Be blunt. I will route it to the right agent and build you a money-making machine.
            </Text>
            <View style={styles.promptChips}>
              {[
                'I want to build a subscription app for dog trainers',
                'Help me launch a marketplace for freelance designers',
                'I need a legal doc generator for small businesses',
              ].map((p, i) => (
                <Pressable
                  key={i}
                  onPress={() => sendUserMessage(p)}
                  style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.chipText} numberOfLines={2}>{p}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} agentColor={Colors.primary} />
        ))}

        {isStreaming && <TypingIndicator color={Colors.primary} />}
      </ScrollView>

      {/* Input */}
      <ChatInput
        onSend={sendUserMessage}
        disabled={isStreaming}
        placeholder="Tell OpenClaw Prime your idea..."
        accentColor={Colors.primary}
      />
      <View style={{ height: insets.bottom }} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bgSurface,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: Radii.full,
    backgroundColor: Colors.success,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  headerTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.primary, letterSpacing: 1 },
  headerSub: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 1 },

  scroll: { flex: 1 },
  scrollContent: { paddingTop: Spacing.md, paddingBottom: Spacing.sm },

  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyLabel: { fontSize: Typography.xs, color: Colors.textMuted, fontFamily: 'SpaceMono' },
  emptyTitle: {
    fontSize: Typography.xxl,
    fontWeight: Typography.black,
    color: Colors.primary,
    letterSpacing: 4,
  },
  emptyDesc: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  promptChips: { gap: Spacing.sm, width: '100%', marginTop: Spacing.sm },
  chip: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    padding: Spacing.md,
  },
  chipText: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 18 },
});
