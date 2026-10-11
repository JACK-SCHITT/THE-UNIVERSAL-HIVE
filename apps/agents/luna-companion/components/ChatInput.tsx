import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Text,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useConversationTheme } from '@/contexts/ThemeContext';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isRecording?: boolean;
  isTranscribing?: boolean;
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
}

export function ChatInput({
  onSend,
  disabled,
  isRecording,
  isTranscribing,
  onVoiceStart,
  onVoiceStop,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const insets = useSafeAreaInsets();
  const { activeTheme } = useConversationTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
    }
  };

  const handleVoicePress = () => {
    if (isRecording) {
      onVoiceStop?.();
    } else {
      onVoiceStart?.();
    }
  };

  const showVoice = !!onVoiceStart;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <View style={[styles.container, { paddingBottom: insets.bottom || spacing.md }]}>
        {isRecording ? (
          <View style={styles.recordingBar}>
            <Animated.View style={[styles.recordingDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.recordingText}>Recording... tap mic to stop</Text>
            <Pressable onPress={handleVoicePress} style={styles.stopRecordBtn}>
              <MaterialIcons name="stop" size={22} color="#ef4444" />
            </Pressable>
          </View>
        ) : isTranscribing ? (
          <View style={styles.recordingBar}>
            <MaterialIcons name="hourglass-top" size={18} color={activeTheme.accentColor} />
            <Text style={styles.recordingText}>Transcribing...</Text>
          </View>
        ) : (
          <View style={[styles.inputContainer, { borderColor: activeTheme.accentColor + '50' }]}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Type a message..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={1000}
              editable={!disabled}
            />

            {showVoice && !text.trim() ? (
              <Pressable
                onPress={handleVoicePress}
                disabled={disabled}
                style={({ pressed }) => [
                  styles.voiceButton,
                  { backgroundColor: activeTheme.accentColor + '20' },
                  pressed && styles.btnPressed,
                ]}
              >
                <MaterialIcons name="mic" size={22} color={activeTheme.accentColor} />
              </Pressable>
            ) : null}

            <Pressable
              onPress={handleSend}
              disabled={!text.trim() || disabled}
              style={({ pressed }) => [
                styles.sendButton,
                { backgroundColor: text.trim() && !disabled ? activeTheme.accentColor : colors.bgLight },
                pressed && styles.btnPressed,
              ]}
            >
              <MaterialIcons
                name="send"
                size={20}
                color={text.trim() && !disabled ? colors.textPrimary : colors.textMuted}
              />
            </Pressable>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgDark,
    borderTopWidth: 1,
    borderTopColor: colors.neonPurple + '20',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.bgMid,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButton: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPressed: { opacity: 0.75, transform: [{ scale: 0.95 }] },
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgMid,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  recordingText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  stopRecordBtn: {
    padding: spacing.xs,
  },
});
