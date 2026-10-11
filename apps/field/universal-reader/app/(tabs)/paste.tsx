import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, Radius } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import { PressableScale } from '../../components/ui/PressableScale';
import { FileViewer } from '../../components/feature/FileViewer';
import { useFileContext } from '../../hooks/useFileContext';
import { useFileLoader } from '../../hooks/useFileLoader';

const LANGUAGE_HINTS = [
  'script.py', 'index.ts', 'main.go', 'lib.rs', 'App.java',
  'styles.css', 'query.sql', 'config.yaml', 'data.json', 'file.sh',
];

export default function PasteScreen() {
  const insets = useSafeAreaInsets();
  const { activeFile, setActiveFile, error, setError } = useFileContext();
  const { loadFromPaste } = useFileLoader();

  const [filename, setFilename] = useState('');
  const [content, setContent] = useState('');
  const [hintIdx, setHintIdx] = useState(0);
  const [contentFocused, setContentFocused] = useState(false);

  const hint = LANGUAGE_HINTS[hintIdx % LANGUAGE_HINTS.length];

  const handleRead = useCallback(() => {
    if (!content.trim()) {
      setError('Paste some code or text first.');
      return;
    }
    loadFromPaste(filename || hint, content);
  }, [content, filename, hint, loadFromPaste, setError]);

  const handleClear = useCallback(() => {
    setContent('');
    setFilename('');
    setError(null);
  }, [setError]);

  const handleClose = useCallback(() => {
    setActiveFile(null);
    setError(null);
  }, [setActiveFile, setError]);

  if (activeFile) {
    return <FileViewer file={activeFile} onClose={handleClose} />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <MaterialIcons name="content-paste" size={22} color={Colors.primary} />
            <Text style={styles.title}>Paste Code</Text>
          </View>
          <Text style={styles.subtitle}>Paste any code or text to read and explain it</Text>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.body}>

            {/* Filename */}
            <GlassCard style={styles.card}>
              <Text style={styles.fieldLabel}>File Name (optional)</Text>
              <View style={styles.filenameRow}>
                <MaterialIcons name="insert-drive-file" size={16} color={Colors.textMuted} />
                <TextInput
                  style={styles.filenameInput}
                  value={filename}
                  onChangeText={setFilename}
                  placeholder={hint}
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setHintIdx((i) => i + 1)}
                  selectionColor={Colors.primary}
                />
              </View>
              <Text style={styles.filenameHint}>
                Name determines syntax highlighting — e.g. "app.py" for Python
              </Text>
            </GlassCard>

            {/* Code Input */}
            <GlassCard style={[styles.card, contentFocused && styles.cardFocused]}>
              <View style={styles.codeHeader}>
                <Text style={styles.fieldLabel}>Code / Text</Text>
                {content.length > 0 && (
                  <Pressable onPress={handleClear} hitSlop={8}>
                    <Text style={styles.clearBtn}>Clear</Text>
                  </Pressable>
                )}
              </View>
              <TextInput
                style={styles.codeInput}
                value={content}
                onChangeText={setContent}
                placeholder={"// Paste your code or text here...\n// Any language, any format.\n// Try Python, JavaScript, SQL, JSON, YAML..."}
                placeholderTextColor={Colors.textMuted}
                multiline
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                onFocus={() => setContentFocused(true)}
                onBlur={() => setContentFocused(false)}
                selectionColor={Colors.primary}
                textAlignVertical="top"
                scrollEnabled={false}
              />
              {content.length > 0 && (
                <Text style={styles.charCount}>
                  {content.length.toLocaleString()} chars · {content.split('\n').length} lines
                </Text>
              )}
            </GlassCard>

            {/* Error */}
            {error ? (
              <View style={styles.errorBox}>
                <MaterialIcons name="error-outline" size={15} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Action */}
            <PressableScale
              onPress={handleRead}
              disabled={!content.trim()}
              style={[styles.readBtn, !content.trim() && styles.readBtnDisabled]}
            >
              <MaterialIcons name="auto-awesome" size={18} color={Colors.background} />
              <Text style={styles.readBtnText}>Read & Analyze</Text>
            </PressableScale>

            {/* Quick examples */}
            <Text style={styles.examplesLabel}>Paste examples and try</Text>
            <View style={styles.examples}>
              {[
                {
                  lang: 'Python',
                  code: 'import os\n\ndef greet(name: str) -> str:\n    """Return a greeting."""\n    return f"Hello, {name}!"\n\nif __name__ == "__main__":\n    print(greet("World"))',
                  filename: 'hello.py',
                },
                {
                  lang: 'TypeScript',
                  code: 'interface User {\n  id: number;\n  name: string;\n  email: string;\n}\n\nasync function fetchUser(id: number): Promise<User> {\n  const res = await fetch(`/api/users/${id}`);\n  return res.json();\n}',
                  filename: 'api.ts',
                },
                {
                  lang: 'JSON Config',
                  code: '{\n  "name": "my-app",\n  "version": "1.0.0",\n  "scripts": {\n    "start": "node index.js",\n    "test": "jest"\n  },\n  "dependencies": {\n    "express": "^4.18.0"\n  }\n}',
                  filename: 'package.json',
                },
                {
                  lang: 'SQL',
                  code: 'SELECT u.name, COUNT(o.id) as order_count\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nWHERE u.created_at > NOW() - INTERVAL \'30 days\'\nGROUP BY u.name\nHAVING COUNT(o.id) > 3\nORDER BY order_count DESC;',
                  filename: 'query.sql',
                },
              ].map((ex) => (
                <Pressable
                  key={ex.lang}
                  style={styles.exampleChip}
                  onPress={() => { setContent(ex.code); setFilename(ex.filename); }}
                >
                  <MaterialIcons name="bolt" size={13} color={Colors.primary} />
                  <Text style={styles.exampleLabel}>{ex.lang}</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ height: 100 }} />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  body: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  card: { gap: 8 },
  cardFocused: {
    borderColor: Colors.primary,
  },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  filenameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? 10 : 4,
    backgroundColor: Colors.surface,
  },
  filenameInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    includeFontPadding: false,
  } as any,
  filenameHint: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    lineHeight: 16,
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearBtn: {
    color: Colors.error,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  codeInput: {
    color: Colors.textCode,
    fontSize: FontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 20,
    minHeight: 200,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    includeFontPadding: false,
  } as any,
  charCount: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'right',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${Colors.error}22`,
    borderWidth: 1,
    borderColor: `${Colors.error}44`,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  errorText: {
    flex: 1,
    color: Colors.error,
    fontSize: FontSize.sm,
  },
  readBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    marginTop: Spacing.sm,
  },
  readBtnDisabled: { opacity: 0.4 },
  readBtnText: {
    color: Colors.background,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  examplesLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.sm,
  },
  examples: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primaryDim,
    backgroundColor: Colors.primaryDim,
  },
  exampleLabel: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
