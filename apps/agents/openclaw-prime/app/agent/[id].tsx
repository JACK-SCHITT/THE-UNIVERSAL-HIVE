import React, { useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { MessageBubble, TypingIndicator, ChatInput } from '@/components';
import { useChat } from '@/hooks/useChat';
import { AGENT_MAP } from '@/constants/config';
import { Colors, Spacing, Typography, Radii } from '@/constants/theme';
import { useAlert } from '@/template';

export default function AgentChatScreen() {
  const { id, init } = useLocalSearchParams<{ id: string; init?: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const scrollRef = useRef<ScrollView>(null);

  const agent = AGENT_MAP[id as any];
  const sessionId = `agent_${id}`;
  const { messages, isStreaming, sendUserMessage, clearHistory, loadHistory } = useChat(sessionId, id);

  useEffect(() => {
    loadHistory().then(() => {
      // Auto-send wizard init message if provided and no history
      if (init) {
        const decoded = decodeURIComponent(init);
        setTimeout(() => sendUserMessage(decoded), 300);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages.length, isStreaming]);

  const handleClear = useCallback(() => {
    showAlert('Clear History', 'Remove all messages with this agent?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearHistory },
    ]);
  }, [showAlert, clearHistory]);

  if (!agent) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Agent not found</Text>
      </View>
    );
  }

  const accentColor = agent.color;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.bottom}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: accentColor + '44' }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.textSecondary} />
        </Pressable>

        <View style={[styles.agentBadge, { backgroundColor: accentColor + '22' }]}>
          <MaterialIcons name={agent.icon as any} size={18} color={accentColor} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: accentColor }]}>{agent.name.toUpperCase()}</Text>
          <Text style={styles.headerSub}>{agent.title}</Text>
        </View>

        <Pressable onPress={handleClear} hitSlop={8}>
          <MaterialIcons name="delete-outline" size={20} color={Colors.textMuted} />
        </Pressable>
      </View>

      {/* Capabilities strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.capStrip}>
        <View style={styles.capInner}>
          {agent.capabilities.map(cap => (
            <View key={cap} style={[styles.capChip, { borderColor: accentColor + '55' }]}>
              <Text style={[styles.capText, { color: accentColor }]}>{cap}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

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
            <View style={[styles.emptyIcon, { backgroundColor: accentColor + '22', borderColor: accentColor + '55' }]}>
              <MaterialIcons name={agent.icon as any} size={40} color={accentColor} />
            </View>
            <Text style={[styles.emptyName, { color: accentColor }]}>{agent.name.toUpperCase()} ONLINE</Text>
            <Text style={styles.emptyTagline}>{agent.tagline}</Text>
            <Text style={styles.emptyDesc}>{agent.description}</Text>
          </View>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} agentColor={accentColor} />
        ))}

        {isStreaming && <TypingIndicator color={accentColor} />}
      </ScrollView>

      {/* Input */}
      <ChatInput
        onSend={sendUserMessage}
        disabled={isStreaming}
        placeholder={`Ask ${agent.name}...`}
        accentColor={accentColor}
      />
      <View style={{ height: insets.bottom }} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  notFoundText: { color: Colors.textSecondary },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    backgroundColor: Colors.bgSurface,
  },
  backBtn: { padding: 4 },
  agentBadge: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: Typography.base, fontWeight: Typography.bold, letterSpacing: 1 },
  headerSub: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 1 },

  // Capabilities
  capStrip: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    maxHeight: 44,
    minHeight: 44,
  },
  capInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  capChip: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Radii.full,
    borderWidth: 1,
    backgroundColor: Colors.bgCard,
  },
  capText: { fontSize: Typography.xs, fontWeight: Typography.medium, letterSpacing: 0.3 },

  scroll: { flex: 1 },
  scrollContent: { paddingTop: Spacing.md, paddingBottom: Spacing.sm },

  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: Radii.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyName: { fontSize: Typography.lg, fontWeight: Typography.black, letterSpacing: 2 },
  emptyTagline: { fontSize: Typography.base, color: Colors.textPrimary, fontWeight: Typography.semibold, textAlign: 'center' },
  emptyDesc: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
});
