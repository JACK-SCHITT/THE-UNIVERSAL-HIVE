import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme';
import { useChat } from '@/hooks/useChat';
import { MessageBubble, StreamingBubble } from '@/components/ui/MessageBubble';
import { TypingIndicator } from '@/components/ui/TypingIndicator';
import { Message } from '@/services/conversations';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, agentId, agentColor, agentName } = useLocalSearchParams<{
    id: string;
    agentId: string;
    agentColor: string;
    agentName: string;
  }>();

  const color = decodeURIComponent(agentColor ?? '#FFB300');
  const name = decodeURIComponent(agentName ?? 'OPENCLAW');

  const { messages, loading, streaming, streamingText, loadMessages, sendMessage } = useChat(
    id ?? '',
    agentId ?? 'architect'
  );

  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
  }, [id]);

  useEffect(() => {
    if (messages.length > 0 || streaming) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, streaming, streamingText]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    await sendMessage(text);
  };

  type ListItem = Message | { type: 'streaming' } | { type: 'typing' };

  const listData: ListItem[] = [
    ...messages,
    ...(streaming && streamingText ? [{ type: 'streaming' as const }] : []),
    ...(streaming && !streamingText ? [{ type: 'typing' as const }] : []),
  ];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.xs }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.textSecondary} />
        </Pressable>
        <View style={styles.headerInfo}>
          <View style={[styles.agentDot, { backgroundColor: color }]} />
          <View>
            <Text style={[styles.headerAgent, { color }]}>{name}</Text>
            <Text style={styles.headerStatus}>
              {streaming ? 'PROCESSING...' : 'ONLINE'}
            </Text>
          </View>
        </View>
        <View style={[styles.statusLight, { backgroundColor: streaming ? Colors.primary : Colors.green }]} />
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={listData}
          keyExtractor={(item, idx) => ('id' in item ? item.id : `special-${idx}`)}
          contentContainerStyle={[styles.messageList, { paddingBottom: Spacing.md }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyChat}>
                <View style={[styles.emptyChatIcon, { borderColor: color }]}>
                  <MaterialIcons name="terminal" size={32} color={color} />
                </View>
                <Text style={[styles.emptyChatTitle, { color }]}>{name} ONLINE</Text>
                <Text style={styles.emptyChatBody}>
                  Describe your app idea, ask for architecture,{'\n'}code, marketing strategy, or anything else.
                </Text>
                <Text style={styles.emptyChatHint}>ASSIMILATE OR DIE.</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            if ('type' in item && item.type === 'streaming') {
              return <StreamingBubble text={streamingText} agentColor={color} />;
            }
            if ('type' in item && item.type === 'typing') {
              return <TypingIndicator agentColor={color} label={`${name} PROCESSING`} />;
            }
            return <MessageBubble message={item as Message} agentColor={color} />;
          }}
        />

        {/* Input */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + Spacing.sm }]}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={`Message ${name}...`}
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={2000}
              returnKeyType="default"
            />
            <Pressable
              onPress={handleSend}
              disabled={!inputText.trim() || streaming}
              style={({ pressed }) => [
                styles.sendBtn,
                { backgroundColor: color },
                pressed && styles.sendPressed,
                (!inputText.trim() || streaming) && styles.sendDisabled,
              ]}
            >
              <MaterialIcons
                name={streaming ? 'hourglass-empty' : 'send'}
                size={18}
                color={Colors.black}
              />
            </Pressable>
          </View>
          <Text style={styles.inputHint}>OPENCLAW PRIME · {name}</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  agentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  headerAgent: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.black,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  headerStatus: {
    color: Colors.textMuted,
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  statusLight: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  messageList: {
    paddingTop: Spacing.md,
    gap: 0,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  emptyChatIcon: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceCard,
  },
  emptyChatTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.black,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  emptyChatBody: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontFamily: 'monospace',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyChatHint: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  inputBar: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
    gap: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingTop: 12,
    paddingBottom: 12,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontFamily: 'monospace',
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  sendDisabled: {
    opacity: 0.35,
  },
  inputHint: {
    color: Colors.textMuted,
    fontSize: 9,
    letterSpacing: 1,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
});
