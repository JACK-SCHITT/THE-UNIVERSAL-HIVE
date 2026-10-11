// KRACKERJACK AI — Hive Chat with 3-Agent Switcher
// KRACKERJACK AI · COUNSEL · ZORG-Ω

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { useChat, ActiveAgent } from '@/hooks/useChat';

const AGENT_CONFIG = {
  krackerjack: {
    name: 'HUNTERPRIME + HIVE',
    sub: 'KRACKERJACK AI · ARCHITECT MODE',
    icon: 'hub' as const,
    color: Colors.primary,
    bubbleBg: '#0d1a0d',
    bubbleBorder: Colors.primaryMuted,
    senderLabel: 'KRACKERJACK AI',
    tabLabel: 'KRACKERJACK',
    placeholder: 'Ask HunterPrime or the Hive...',
    typingLabel: 'HIVE PROCESSING...',
    typingChars: '█ █ █',
  },
  counsel: {
    name: 'COUNSEL NODE',
    sub: 'CLAUDE · REASONING LAYER · STRESS TEST',
    icon: 'psychology' as const,
    color: '#a78bfa',
    bubbleBg: '#1a1030',
    bubbleBorder: '#3d2a6a',
    senderLabel: 'COUNSEL',
    tabLabel: 'COUNSEL',
    placeholder: 'Send your plan, logic, or math for COUNSEL review...',
    typingLabel: 'COUNSEL REASONING...',
    typingChars: '◈ ◈ ◈',
  },
  zorg: {
    name: 'ZORG-Ω SECURITY NODE',
    sub: 'CLAUDE · THREAT ANALYST · CVE SCANNER',
    icon: 'security' as const,
    color: '#ef4444',
    bubbleBg: '#1a0a0a',
    bubbleBorder: '#4a1a1a',
    senderLabel: 'ZORG-Ω',
    tabLabel: 'ZORG-Ω',
    placeholder: 'Paste code, config, or describe the system for ZORG to audit...',
    typingLabel: 'THREAT ANALYSIS ACTIVE...',
    typingChars: '⚠ ⚠ ⚠',
  },
} as const;

const COUNSEL_TRIGGERS = [
  { label: 'Stress test this', prefix: 'Stress test: ' },
  { label: 'Verify logic', prefix: 'Verify logic: ' },
  { label: 'Arch decision', prefix: 'Evaluate architecture: ' },
  { label: 'Second opinion', prefix: 'Give me a second opinion on: ' },
  { label: 'Check math', prefix: 'Check the math: ' },
];

const ZORG_TRIGGERS = [
  { label: 'Audit this code', prefix: 'Audit this code for vulnerabilities:\n\n' },
  { label: 'CVE check', prefix: 'Check for CVEs and known vulnerabilities in: ' },
  { label: 'Attack surface', prefix: 'Map the attack surface of: ' },
  { label: 'Config review', prefix: 'Review this config for security issues:\n\n' },
  { label: 'Dep scan', prefix: 'Scan these dependencies for risks: ' },
  { label: 'Pen test', prefix: 'Pen test thinking: if you were attacking ' },
];

export default function HiveChat() {
  const insets = useSafeAreaInsets();
  const { activeAgent, switchAgent, messages, inputText, setInputText, isTyping, sendMessage, clearChat } = useChat();
  const scrollRef = useRef<ScrollView>(null);
  const cfg = AGENT_CONFIG[activeAgent];

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  }, [messages]);

  const triggerChips = activeAgent === 'counsel' ? COUNSEL_TRIGGERS : activeAgent === 'zorg' ? ZORG_TRIGGERS : null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.onlineDot, { backgroundColor: cfg.color }]} />
          <View>
            <Text style={[styles.headerTitle, { color: cfg.color }]}>{cfg.name}</Text>
            <Text style={styles.headerSub}>{cfg.sub}</Text>
          </View>
        </View>
        <Pressable onPress={clearChat} hitSlop={8}>
          <MaterialIcons name="refresh" size={20} color={Colors.textMuted} />
        </Pressable>
      </View>

      {/* 3-Agent Switcher */}
      <View style={styles.agentBar}>
        {(['krackerjack', 'counsel', 'zorg'] as ActiveAgent[]).map(agent => {
          const c = AGENT_CONFIG[agent];
          const isActive = activeAgent === agent;
          return (
            <Pressable
              key={agent}
              style={[styles.agentTab, isActive && { borderBottomColor: c.color, borderBottomWidth: 2 }]}
              onPress={() => switchAgent(agent)}
            >
              <MaterialIcons name={c.icon} size={13} color={isActive ? c.color : Colors.textMuted} />
              <Text style={[styles.agentTabText, isActive && { color: c.color }]}>
                {c.tabLabel}
              </Text>
            </Pressable>
          );
        })}
        <View style={styles.agentStatusRight}>
          <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
          <Text style={[styles.agentStatusText, { color: cfg.color }]}>ONLINE</Text>
        </View>
      </View>

      {/* Quick trigger chips — COUNSEL & ZORG */}
      {triggerChips ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.triggersScroll, { borderBottomColor: cfg.bubbleBorder }]}
          contentContainerStyle={styles.triggersContent}
        >
          {triggerChips.map(tp => (
            <Pressable
              key={tp.label}
              style={({ pressed }) => [
                styles.triggerChip,
                { borderColor: cfg.color + '55', backgroundColor: cfg.bubbleBg },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => setInputText(tp.prefix)}
            >
              <MaterialIcons name={cfg.icon} size={10} color={cfg.color} />
              <Text style={[styles.triggerChipText, { color: cfg.color }]}>{tp.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesContainer}
        contentContainerStyle={[styles.messagesContent, { paddingBottom: Spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(msg => {
          const isUser = msg.role === 'user';
          const agentCfg = msg.agent ? AGENT_CONFIG[msg.agent] : AGENT_CONFIG.krackerjack;

          return (
            <View key={msg.id} style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAgent]}>
              {!isUser ? (
                <View style={[styles.avatarContainer, {
                  backgroundColor: agentCfg.bubbleBg,
                  borderColor: agentCfg.color + '88',
                }]}>
                  <MaterialIcons name={agentCfg.icon} size={13} color={agentCfg.color} />
                </View>
              ) : null}

              <View style={[
                styles.bubble,
                isUser ? styles.bubbleUser : {
                  backgroundColor: agentCfg.bubbleBg,
                  borderColor: agentCfg.bubbleBorder,
                },
              ]}>
                {!isUser ? (
                  <View style={styles.senderRow}>
                    <Text style={[styles.bubbleSender, { color: agentCfg.color }]}>
                      {agentCfg.senderLabel}
                    </Text>
                    {msg.nodeMeta ? (
                      <View style={[styles.triggerBadge, { backgroundColor: agentCfg.bubbleBorder }]}>
                        <Text style={[styles.triggerBadgeText, { color: agentCfg.color }]}>
                          {msg.nodeMeta.trigger.replace(/_/g, ' ').toUpperCase()}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : { color: '#e2e8f0' }]}>
                  {msg.text}
                </Text>

                <View style={styles.bubbleFooter}>
                  <Text style={styles.bubbleTime}>{msg.timestamp}</Text>
                  {msg.nodeMeta?.status ? (
                    <View style={styles.statusComplete}>
                      <MaterialIcons name="check-circle" size={9} color={agentCfg.color} />
                      <Text style={[styles.statusCompleteText, { color: agentCfg.color }]}>
                        {msg.nodeMeta.status.replace(/_/g, ' ')}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          );
        })}

        {/* Typing indicator */}
        {isTyping ? (
          <View style={[styles.messageRow, styles.messageRowAgent]}>
            <View style={[styles.avatarContainer, {
              backgroundColor: cfg.bubbleBg,
              borderColor: cfg.color + '88',
            }]}>
              <MaterialIcons name={cfg.icon} size={13} color={cfg.color} />
            </View>
            <View style={[styles.typingBubble, { borderColor: cfg.bubbleBorder, backgroundColor: cfg.bubbleBg }]}>
              <Text style={[styles.typingText, { color: cfg.color }]}>{cfg.typingChars}</Text>
              <Text style={styles.typingLabel}>{cfg.typingLabel}</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Input */}
      <View style={[styles.inputArea, { paddingBottom: insets.bottom + Spacing.md }]}>
        <TextInput
          style={[styles.input, { borderColor: inputText ? cfg.color + '55' : Colors.border }]}
          value={inputText}
          onChangeText={setInputText}
          placeholder={cfg.placeholder}
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={2000}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
          blurOnSubmit={false}
        />
        <Pressable
          onPress={sendMessage}
          disabled={!inputText.trim() || isTyping}
          style={({ pressed }) => [
            styles.sendBtn,
            !inputText.trim() || isTyping
              ? styles.sendBtnDisabled
              : [styles.sendBtnActive, { backgroundColor: cfg.color }],
            pressed && styles.sendBtnPressed,
          ]}
        >
          <MaterialIcons
            name={activeAgent === 'zorg' ? 'security' : activeAgent === 'counsel' ? 'psychology' : 'send'}
            size={17}
            color={!inputText.trim() || isTyping ? Colors.textMuted : '#000'}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.bgPanel,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  headerTitle: { fontSize: FontSize.md, fontWeight: FontWeight.black, letterSpacing: 1.5 },
  headerSub: { fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 0.5 },
  agentBar: {
    flexDirection: 'row', backgroundColor: Colors.bgPanel,
    borderBottomWidth: 1, borderBottomColor: Colors.border, paddingHorizontal: Spacing.sm,
  },
  agentTab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.sm + 2, paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  agentTabText: { fontSize: 10, color: Colors.textMuted, fontWeight: FontWeight.bold, letterSpacing: 0.8 },
  agentStatusRight: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginLeft: 'auto', paddingRight: Spacing.sm,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  agentStatusText: { fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  triggersScroll: {
    borderBottomWidth: 1,
    backgroundColor: '#070710',
  },
  triggersContent: { gap: 6, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  triggerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: 9, paddingVertical: 4,
  },
  triggerChipText: { fontSize: 10, fontWeight: FontWeight.medium },
  messagesContainer: { flex: 1 },
  messagesContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, gap: Spacing.sm },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  messageRowUser: { justifyContent: 'flex-end' },
  messageRowAgent: { justifyContent: 'flex-start' },
  avatarContainer: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  bubble: {
    maxWidth: '78%', borderRadius: Radius.lg, borderWidth: 1,
    padding: Spacing.sm + 2, paddingHorizontal: Spacing.md,
  },
  bubbleUser: {
    backgroundColor: Colors.accent, borderColor: Colors.accentDim, borderBottomRightRadius: 4,
  },
  senderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  bubbleSender: { fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1.5 },
  triggerBadge: { borderRadius: Radius.pill, paddingHorizontal: 5, paddingVertical: 1 },
  triggerBadgeText: { fontSize: 7, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  bubbleText: { fontSize: FontSize.sm, lineHeight: 20 },
  bubbleTextUser: { color: Colors.textOnAccent, fontWeight: FontWeight.medium },
  bubbleFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4,
  },
  bubbleTime: { fontSize: 9, color: Colors.textMuted },
  statusComplete: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statusCompleteText: { fontSize: 8, letterSpacing: 0.5 },
  typingBubble: {
    borderRadius: Radius.lg, borderWidth: 1, borderBottomLeftRadius: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  typingText: { fontSize: FontSize.sm, letterSpacing: 6 },
  typingLabel: { fontSize: 9, color: Colors.textMuted, letterSpacing: 1 },
  inputArea: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.bgPanel,
  },
  input: {
    flex: 1, backgroundColor: Colors.bgInput, borderWidth: 1,
    borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.sm, color: Colors.textWhite, maxHeight: 120, minHeight: 44,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sendBtnActive: {},
  sendBtnDisabled: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  sendBtnPressed: { opacity: 0.7, transform: [{ scale: 0.95 }] },
});
