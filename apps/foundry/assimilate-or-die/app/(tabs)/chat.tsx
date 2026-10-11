import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { getSupabaseClient, useAuth, useAlert } from '@/template';
import { FunctionsHttpError } from '@supabase/supabase-js';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  created_at: string;
}

type ChatMode = 'COMMANDER' | 'TEACHER';

const TEACHER_EMAIL = 'jackschitt1134@gmail.com';
const ARCHITECT_EMAIL = 'krackerjack1134@gmail.com';

const INIT_MSG: Message = {
  id: 'init',
  role: 'ai',
  content: 'AI COMMANDER ONLINE. I am the intelligence at the core of the Foundry. Ask me anything — strategy, code, creation, domination. What do you need?',
  created_at: new Date().toISOString(),
};

const TEACHER_INIT_MSG: Message = {
  id: 'init-teacher',
  role: 'ai',
  content: '[TEACHER MODE ACTIVE] — JACKSCHITT1134 has authorized this session. Ask your question and I will break it down step by step. No hand-holding, but complete understanding.',
  created_at: new Date().toISOString(),
};

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { incrementChat, addXP } = useApp();
  const { user: authUser } = useAuth();
  const { showAlert } = useAlert();
  const supabase = getSupabaseClient();

  const [mode, setMode] = useState<ChatMode>('COMMANDER');
  const [messages, setMessages] = useState<Message[]>([INIT_MSG]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const listRef = useRef<FlatList>(null);

  const canAccessTeacherMode = authUser?.email === TEACHER_EMAIL
    || authUser?.email === ARCHITECT_EMAIL;

  // Load chat history from Supabase
  useEffect(() => {
    if (!authUser) return;
    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(100);

        if (!error && data && data.length > 0) {
          const initMsg = mode === 'TEACHER' ? TEACHER_INIT_MSG : INIT_MSG;
          setMessages([initMsg, ...data]);
        }
      } catch (e) {
        console.log('History load error:', e);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, [authUser, mode]);

  const switchMode = (newMode: ChatMode) => {
    if (newMode === 'TEACHER' && !canAccessTeacherMode) {
      showAlert(
        'TEACHER MODE LOCKED',
        'Only JACKSCHITT1134 or users with a verified access code can activate Teacher Mode. Redeem a code from your Profile.',
        [{ text: 'UNDERSTOOD', style: 'cancel' }]
      );
      return;
    }
    setMode(newMode);
    setMessages([newMode === 'TEACHER' ? TEACHER_INIT_MSG : INIT_MSG]);
  };

  const saveMessage = async (msg: { role: string; content: string; created_at: string }) => {
    if (!authUser) return;
    try {
      await supabase.from('chat_messages').insert({
        role: msg.role,
        content: msg.content,
      });
    } catch (e) {
      console.log('Save message error:', e);
    }
  };

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isThinking) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);
    incrementChat();
    saveMessage({ role: 'user', content: text, created_at: userMsg.created_at });
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const history = messages
        .filter(m => m.id !== 'init' && m.id !== 'init-teacher')
        .slice(-12)
        .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }));
      history.push({ role: 'user', content: text });

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { messages: history, mode },
      });

      let aiContent = '';
      if (error) {
        let errorMessage = error.message;
        if (error instanceof FunctionsHttpError) {
          try {
            const textContent = await error.context?.text();
            errorMessage = textContent || error.message;
          } catch { /* empty */ }
        }
        aiContent = '[SIGNAL DISRUPTED] — Neural link degraded. Retry your transmission.';
        console.error('AI chat error:', errorMessage);
      } else {
        aiContent = data?.content || '[NO RESPONSE]';
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: aiContent,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMsg]);
      saveMessage({ role: 'ai', content: aiContent, created_at: aiMsg.created_at });
      addXP(10);
    } catch (err) {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: '[CONNECTION SEVERED] — The Foundry is temporarily unreachable.',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsThinking(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [input, isThinking, messages, mode, incrementChat, addXP]);

  const handleClearHistory = async () => {
    showAlert('CLEAR HISTORY', 'Wipe all transmissions from the database?', [
      { text: 'CANCEL', style: 'cancel' },
      {
        text: 'WIPE', style: 'destructive', onPress: async () => {
          if (!authUser) return;
          try {
            await supabase.from('chat_messages').delete().eq('user_id', authUser.id);
            setMessages([mode === 'TEACHER' ? TEACHER_INIT_MSG : INIT_MSG]);
          } catch (e) {
            console.log('Clear error:', e);
          }
        }
      }
    ]);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    const isTeacher = mode === 'TEACHER';
    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser ? (
          <View style={[styles.aiAvatar, isTeacher && { borderColor: Colors.cyanPulse }]}>
            <MaterialIcons
              name={isTeacher ? 'school' : 'psychology'}
              size={16}
              color={isTeacher ? Colors.cyanPulse : Colors.crimson}
            />
          </View>
        ) : null}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi, isTeacher && !isUser && styles.bubbleTeacher]}>
          {!isUser ? (
            <Text style={[styles.aiLabel, isTeacher && { color: Colors.cyanPulse }]}>
              {isTeacher ? 'TEACHER MODE' : 'AI COMMANDER'}
            </Text>
          ) : null}
          <Text style={[styles.msgText, isUser && styles.msgTextUser]}>{item.content}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.statusDot, mode === 'TEACHER' && { backgroundColor: Colors.cyanPulse }]} />
          <View>
            <Text style={styles.headerTitle}>{mode === 'TEACHER' ? 'TEACHER MODE' : 'AI COMMANDER'}</Text>
            <Text style={styles.headerSub}>{mode === 'TEACHER' ? 'JACKSCHITT1134 AUTHORIZED' : 'FOUNDRY INTELLIGENCE — ONLINE'}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.xpPill}>
            <MaterialIcons name="bolt" size={12} color={Colors.crimson} />
            <Text style={styles.xpPillText}>+10 XP</Text>
          </View>
          {authUser ? (
            <Pressable style={styles.clearBtn} onPress={handleClearHistory}>
              <MaterialIcons name="delete-outline" size={18} color={Colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Mode Switcher */}
      <View style={styles.modeSwitcher}>
        {(['COMMANDER', 'TEACHER'] as ChatMode[]).map(m => (
          <Pressable
            key={m}
            style={[
              styles.modeChip,
              mode === m && { backgroundColor: m === 'TEACHER' ? Colors.cyanDim : Colors.crimson, borderColor: m === 'TEACHER' ? Colors.cyanPulse : Colors.crimson }
            ]}
            onPress={() => switchMode(m)}
          >
            <MaterialIcons
              name={m === 'TEACHER' ? 'school' : 'psychology'}
              size={12}
              color={mode === m ? '#fff' : Colors.textMuted}
            />
            <Text style={[styles.modeChipText, mode === m && { color: '#fff' }]}>{m}</Text>
            {m === 'TEACHER' && !canAccessTeacherMode ? (
              <MaterialIcons name="lock" size={10} color={Colors.textMuted} />
            ) : null}
          </Pressable>
        ))}
      </View>

      {loadingHistory ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.crimson} size="small" />
          <Text style={styles.loadingText}>LOADING TRANSMISSION HISTORY...</Text>
        </View>
      ) : null}

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
        ListFooterComponent={isThinking ? (
          <View style={styles.thinkingWrap}>
            <View style={styles.aiAvatar}>
              <MaterialIcons name={mode === 'TEACHER' ? 'school' : 'psychology'} size={16} color={mode === 'TEACHER' ? Colors.cyanPulse : Colors.crimson} />
            </View>
            <View style={styles.bubbleAi}>
              <Text style={[styles.aiLabel, mode === 'TEACHER' && { color: Colors.cyanPulse }]}>
                {mode === 'TEACHER' ? 'TEACHER MODE' : 'AI COMMANDER'}
              </Text>
              <View style={styles.thinkingDots}>
                <ActivityIndicator size="small" color={mode === 'TEACHER' ? Colors.cyanPulse : Colors.crimson} />
                <Text style={styles.thinkingText}>PROCESSING...</Text>
              </View>
            </View>
          </View>
        ) : null}
      />

      {!authUser ? (
        <View style={styles.guestNotice}>
          <MaterialIcons name="info-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.guestNoticeText}>Login to save your chat history permanently</Text>
        </View>
      ) : null}

      {/* Input */}
      <View style={[styles.inputWrap, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={mode === 'TEACHER' ? 'Ask your question...' : 'Command the AI...'}
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={500}
        />
        <Pressable
          style={({ pressed }) => [styles.sendBtn, pressed && { opacity: 0.8 }, (!input.trim() || isThinking) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || isThinking}
        >
          <LinearGradient
            colors={mode === 'TEACHER' ? [Colors.cyanDim, '#006680'] : [Colors.crimson, Colors.bloodRed]}
            style={styles.sendGradient}
          >
            <MaterialIcons name="send" size={20} color="#fff" />
          </LinearGradient>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.void },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#27AE60',
    shadowColor: '#27AE60', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6,
  },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.md, fontWeight: Typography.black, letterSpacing: 2 },
  headerSub: { color: Colors.textMuted, fontSize: 9, letterSpacing: 1.5, marginTop: 1 },
  xpPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill,
  },
  xpPillText: { color: Colors.textSecondary, fontSize: 10, fontWeight: Typography.bold },
  clearBtn: { padding: 4 },

  // Mode switcher
  modeSwitcher: {
    flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
  },
  modeChipText: { color: Colors.textMuted, fontSize: 10, fontWeight: Typography.black, letterSpacing: 1.5 },

  loadingWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  loadingText: { color: Colors.textMuted, fontSize: Typography.xs, letterSpacing: 1 },

  messageList: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: 12 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  msgRowUser: { flexDirection: 'row-reverse' },
  aiAvatar: {
    width: 32, height: 32, borderRadius: 2, backgroundColor: Colors.surfaceRaised,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  bubble: { maxWidth: '80%', borderRadius: Radius.sm, padding: Spacing.sm + 4, borderWidth: 1 },
  bubbleAi: { backgroundColor: Colors.surfaceRaised, borderColor: Colors.border },
  bubbleTeacher: { backgroundColor: '#001a1a', borderColor: Colors.cyanDim },
  bubbleUser: { backgroundColor: '#1a0000', borderColor: Colors.bloodRed },
  aiLabel: { color: Colors.crimson, fontSize: 9, fontWeight: Typography.black, letterSpacing: 2, marginBottom: 4 },
  msgText: { color: Colors.textSecondary, fontSize: Typography.sm, lineHeight: Typography.sm * 1.55 },
  msgTextUser: { color: Colors.textPrimary },
  timestamp: { color: Colors.textMuted, fontSize: 9, marginTop: 6, textAlign: 'right' },

  thinkingWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 4, paddingHorizontal: Spacing.md },
  thinkingDots: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  thinkingText: { color: Colors.textMuted, fontSize: Typography.xs, letterSpacing: 1 },

  guestNotice: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: 6, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  guestNoticeText: { color: Colors.textMuted, fontSize: 10 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border, gap: 8, backgroundColor: Colors.abyss,
  },
  input: {
    flex: 1, backgroundColor: Colors.surfaceRaised, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: 10,
    color: Colors.textPrimary, fontSize: Typography.sm, maxHeight: 120,
  },
  sendBtn: { borderRadius: Radius.sm, overflow: 'hidden' },
  sendBtnDisabled: { opacity: 0.4 },
  sendGradient: { padding: 12, alignItems: 'center', justifyContent: 'center' },
});
