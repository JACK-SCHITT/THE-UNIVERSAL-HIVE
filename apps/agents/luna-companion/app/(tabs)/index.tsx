import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { AnimatedAvatar } from '@/components/AnimatedAvatar';
import { useAuth, useAlert } from '@/template';
import { useCharacter } from '@/hooks/useCharacter';
import { useChat } from '@/hooks/useChat';
import { useReactions } from '@/hooks/useReactions';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useConversationTheme, CONVERSATION_THEMES } from '@/contexts/ThemeContext';
import { shareService } from '@/services/shareService';
import { MessageBubble } from '@/components/MessageBubble';
import { TypingIndicator } from '@/components/TypingIndicator';
import { ChatInput } from '@/components/ChatInput';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';

const CHARACTER_ACCENTS: Record<string, string> = {
  'Grok': '#22d3ee',
  'Luna': '#a855f7',
};
function getCharacterAccent(name?: string): string {
  if (!name) return '#a855f7';
  return CHARACTER_ACCENTS[name] || '#a855f7';
}

export default function ChatScreen() {
  const { logout } = useAuth();
  const { showAlert } = useAlert();
  const { currentCharacter } = useCharacter();
  const { messages, loading, isStreaming, sendMessage, clearChat } = useChat();
  const { reactions, loadReactionsForMessage, toggleReaction } = useReactions();
  const { isRecording, isTranscribing, startRecording, stopRecording } = useVoiceInput();
  const { activeTheme, setTheme } = useConversationTheme();
  const characterAccent = getCharacterAccent(currentCharacter?.name);
  const flatListRef = useRef<FlatList>(null);
  const [showThemes, setShowThemes] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  // Load reactions when messages change
  useEffect(() => {
    const aiMessages = messages.filter(m => m.sender === 'ai' && m.id && !m.id.startsWith('streaming-'));
    aiMessages.forEach(m => {
      if (!reactions[m.id]) loadReactionsForMessage(m.id);
    });
  }, [messages.length]);

  const handleVoiceStart = useCallback(async () => {
    await startRecording();
  }, []);

  const handleVoiceStop = useCallback(async () => {
    const transcript = await stopRecording();
    if (transcript) sendMessage(transcript);
  }, [stopRecording, sendMessage]);

  const handleClearChat = () => {
    showAlert('Clear all messages?', 'This action cannot be undone', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearChat },
    ]);
  };

  const handleExport = async () => {
    setShowMenu(false);
    if (!currentCharacter) return;
    const result = await shareService.exportChatAsText(messages, currentCharacter.name);
    if (!result.success) showAlert(result.error || 'Export failed');
  };

  const handleLogout = () => {
    setShowMenu(false);
    showAlert('Logout?', 'You will need to log in again', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          const { error } = await logout();
          if (error) showAlert(error);
        },
      },
    ]);
  };

  if (!currentCharacter) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.neonPurple} />
      </View>
    );
  }

  return (
    <LinearGradient colors={activeTheme.bgGradient} style={styles.gradient}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: activeTheme.accentColor + '25' }]}>
          <View style={styles.headerLeft}>
            <AnimatedAvatar
              uri={currentCharacter.avatar}
              size={44}
              accentColor={characterAccent}
              isActive={isStreaming}
              style={styles.headerAvatarWrapper}
            />
            <View>
              <Text style={styles.headerName}>{currentCharacter.name}</Text>
              <Text style={[styles.headerTheme, { color: activeTheme.accentColor }]}>
                {activeTheme.icon === 'auto-awesome' ? '✨' : ''} {activeTheme.name} Mode
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            {/* Theme Toggle */}
            <Pressable
              onPress={() => setShowThemes(v => !v)}
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            >
              <MaterialIcons name="palette" size={22} color={activeTheme.accentColor} />
            </Pressable>

            {/* Clear Chat */}
            <Pressable
              onPress={handleClearChat}
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            >
              <MaterialIcons name="delete-outline" size={22} color={colors.textSecondary} />
            </Pressable>

            {/* Menu */}
            <Pressable
              onPress={() => setShowMenu(v => !v)}
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            >
              <MaterialIcons name="more-vert" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Dropdown Menu */}
        {showMenu ? (
          <View style={styles.dropdownMenu}>
            <Pressable
              onPress={handleExport}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <MaterialIcons name="share" size={18} color={colors.textSecondary} />
              <Text style={styles.menuItemText}>Export & Share Chat</Text>
            </Pressable>
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <MaterialIcons name="logout" size={18} color="#ef4444" />
              <Text style={[styles.menuItemText, { color: '#ef4444' }]}>Logout</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Theme Picker */}
        {showThemes ? (
          <View style={styles.themeStrip}>
            {CONVERSATION_THEMES.map(theme => (
              <Pressable
                key={theme.id}
                onPress={() => { setTheme(theme); setShowThemes(false); }}
                style={[
                  styles.themeChip,
                  activeTheme.id === theme.id && { borderColor: theme.accentColor, borderWidth: 2 },
                ]}
              >
                <MaterialIcons name={theme.icon as any} size={18} color={theme.accentColor} />
                <Text style={[styles.themeChipText, { color: theme.accentColor }]}>{theme.name}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* Messages */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={activeTheme.accentColor} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <MessageBubble
                id={item.id}
                message={item.message_text}
                sender={item.sender}
                imageUrl={item.image_url}
                avatar={item.sender === 'ai' ? currentCharacter.avatar : undefined}
                isStreaming={(item as any).isStreaming}
                reactions={reactions[item.id]}
                onReact={emoji => toggleReaction(item.id, emoji)}
              />
            )}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Start a conversation with {currentCharacter.name}</Text>
                <Text style={styles.emptyHint}>Try: "Tell me about your dreams" or "Draw a starry night"</Text>
              </View>
            }
            ListFooterComponent={isStreaming ? <TypingIndicator /> : null}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        <ChatInput
          onSend={sendMessage}
          disabled={isStreaming}
          isRecording={isRecording}
          isTranscribing={isTranscribing}
          onVoiceStart={handleVoiceStart}
          onVoiceStop={handleVoiceStop}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerAvatarWrapper: {
    marginRight: 4,
  },
  headerName: { ...typography.h3, color: colors.textPrimary },
  headerTheme: { ...typography.caption, marginTop: 2 },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonPressed: { opacity: 0.6 },
  dropdownMenu: {
    position: 'absolute',
    top: 90,
    right: spacing.md,
    backgroundColor: colors.bgLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neonPurple + '30',
    zIndex: 100,
    overflow: 'hidden',
    minWidth: 190,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  menuItemPressed: { backgroundColor: colors.bgMid },
  menuItemText: { ...typography.body, color: colors.textSecondary },
  themeStrip: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.bgDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.neonPurple + '15',
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.bgLight,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeChipText: { ...typography.caption, fontWeight: '600' },
  messageList: {
    paddingVertical: spacing.md,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 80,
  },
  emptyText: {
    ...typography.h3,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptyHint: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
