import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors, FontSize, Spacing, Radius } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import { PressableScale } from '../../components/ui/PressableScale';
import { FileViewer } from '../../components/feature/FileViewer';
import { MultiBrowser } from '../../components/feature/FileBrowser';
import { useFileContext } from '../../hooks/useFileContext';
import { useFileLoader } from '../../hooks/useFileLoader';

const QUICK_URLS = [
  {
    label: 'React package.json',
    url: 'https://raw.githubusercontent.com/facebook/react/main/package.json',
  },
  {
    label: 'Tailwind config',
    url: 'https://raw.githubusercontent.com/tailwindlabs/tailwindcss/master/stubs/config.full.js',
  },
  {
    label: 'ESLint config',
    url: 'https://raw.githubusercontent.com/eslint/eslint/main/package.json',
  },
];

export default function ReaderScreen() {
  const insets = useSafeAreaInsets();
  const { activeFile, setActiveFile, multiFiles, clearMultiFiles, loading, error, setError } = useFileContext();
  const { loadFromPicker, loadFromURL } = useFileLoader();
  const [urlInput, setUrlInput] = useState('');
  const [urlFocused, setUrlFocused] = useState(false);

  const handleURLLoad = useCallback(() => {
    if (urlInput.trim()) loadFromURL(urlInput.trim());
  }, [urlInput, loadFromURL]);

  const handleClose = useCallback(() => {
    setActiveFile(null);
    setError(null);
  }, [setActiveFile, setError]);

  const handleMultiClose = useCallback(() => {
    clearMultiFiles();
    setError(null);
  }, [clearMultiFiles, setError]);

  // Show multi-file browser
  if (multiFiles.length > 0) {
    return <MultiBrowser files={multiFiles} onClose={handleMultiClose} />;
  }

  // Show single file viewer
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
          <View style={styles.logoRow}>
            <MaterialIcons name="code" size={22} color={Colors.primary} />
            <Text style={styles.appTitle}>Universal Reader</Text>
          </View>
          <Text style={styles.subtitle}>Read · Understand · Any File</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Hero Banner */}
          <View style={styles.heroBanner}>
            <Image
              source={require('../../assets/images/hero-banner.png')}
              style={styles.heroImage}
              contentFit="cover"
              transition={300}
            />
            <View style={styles.heroOverlay}>
              <Text style={styles.heroLabel}>
                Open any file and get an instant human-readable explanation
              </Text>
            </View>
          </View>

          {/* Pick a Single File */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>From Device</Text>
            <View style={styles.pickGroup}>
              <PressableScale onPress={() => loadFromPicker(false)} disabled={loading} style={styles.pickPrimary}>
                <GlassCard style={styles.pickCard} elevated>
                  <View style={styles.pickIcon}>
                    <MaterialIcons name="insert-drive-file" size={26} color={Colors.primary} />
                  </View>
                  <View style={styles.pickText}>
                    <Text style={styles.pickTitle}>Open a File</Text>
                    <Text style={styles.pickSub}>Any file type — code, config, ZIP, data, docs</Text>
                  </View>
                  {loading ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <MaterialIcons name="chevron-right" size={22} color={Colors.primary} />
                  )}
                </GlassCard>
              </PressableScale>

              <PressableScale onPress={() => loadFromPicker(true)} disabled={loading} style={styles.pickSecondary}>
                <GlassCard style={styles.pickCardSmall}>
                  <MaterialIcons name="folder-open" size={22} color={Colors.accent} />
                  <View style={styles.pickText}>
                    <Text style={styles.pickTitleSm}>Multiple Files</Text>
                    <Text style={styles.pickSubSm}>Select several files at once to browse</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={18} color={Colors.accent} />
                </GlassCard>
              </PressableScale>

              <PressableScale
                onPress={() => loadFromPicker(false)}
                disabled={loading}
                style={styles.pickSecondary}
              >
                <GlassCard style={styles.pickCardSmall}>
                  <MaterialIcons name="folder-zip" size={22} color="#e5c07b" />
                  <View style={styles.pickText}>
                    <Text style={styles.pickTitleSm}>Open ZIP Archive</Text>
                    <Text style={styles.pickSubSm}>Browse and read files inside any ZIP</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={18} color="#e5c07b" />
                </GlassCard>
              </PressableScale>
            </View>
          </View>

          {/* Load from URL */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>From URL</Text>
            <GlassCard>
              <View style={[styles.urlInputRow, urlFocused && styles.urlInputRowFocused]}>
                <MaterialIcons name="link" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.urlInput}
                  value={urlInput}
                  onChangeText={setUrlInput}
                  placeholder="https://raw.githubusercontent.com/..."
                  placeholderTextColor={Colors.textMuted}
                  onFocus={() => setUrlFocused(true)}
                  onBlur={() => setUrlFocused(false)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  returnKeyType="go"
                  onSubmitEditing={handleURLLoad}
                  selectionColor={Colors.primary}
                />
                {urlInput.length > 0 && (
                  <Pressable onPress={() => setUrlInput('')} hitSlop={8}>
                    <MaterialIcons name="close" size={16} color={Colors.textMuted} />
                  </Pressable>
                )}
              </View>
              <PressableScale
                onPress={handleURLLoad}
                disabled={!urlInput.trim() || loading}
                style={[styles.fetchBtn, (!urlInput.trim() || loading) && styles.fetchBtnDisabled]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.background} />
                ) : (
                  <>
                    <MaterialIcons name="download" size={16} color={Colors.background} />
                    <Text style={styles.fetchBtnText}>Load from URL</Text>
                  </>
                )}
              </PressableScale>
            </GlassCard>

            {/* Quick examples */}
            <View style={[styles.quickRow, { marginTop: Spacing.sm }]}>
              {QUICK_URLS.map((item) => (
                <Pressable
                  key={item.label}
                  style={styles.quickChip}
                  onPress={() => { setUrlInput(item.url); loadFromURL(item.url); }}
                >
                  <MaterialIcons name="bolt" size={13} color={Colors.accent} />
                  <Text style={styles.quickChipText}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Supported types */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>What You Can Open</Text>
            <GlassCard>
              {[
                { icon: 'code', label: 'Code Files', desc: 'JS, TS, Python, Go, Rust, Java, C++, Swift, Kotlin, PHP, Ruby, Dart, SQL, Bash and 20+ more' },
                { icon: 'folder-zip', label: 'ZIP Archives', desc: 'Browse and read every file inside any ZIP — full folder tree navigation' },
                { icon: 'data-object', label: 'Data & Config', desc: 'JSON, YAML, XML, CSV, TOML, INI, .env and all config file formats' },
                { icon: 'article', label: 'Documents', desc: 'Markdown, plain text, logs, RST, README and documentation files' },
                { icon: 'auto-awesome', label: 'AI Explain', desc: 'Switch to the Explain tab for a plain-English breakdown of any file' },
              ].map((item, idx) => (
                <View key={item.label} style={[styles.featureRow, idx > 0 && styles.featureRowBorder]}>
                  <View style={styles.featureIcon}>
                    <MaterialIcons name={item.icon as any} size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={styles.featureLabel}>{item.label}</Text>
                    <Text style={styles.featureDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </GlassCard>
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={() => setError(null)} hitSlop={8}>
                <MaterialIcons name="close" size={16} color={Colors.error} />
              </Pressable>
            </View>
          ) : null}

          <View style={{ height: 100 }} />
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
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
    letterSpacing: 1,
  },
  heroBanner: {
    marginHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    height: 130,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,8,16,0.55)',
    justifyContent: 'flex-end',
    padding: Spacing.md,
  },
  heroLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    fontWeight: '600',
    lineHeight: 22,
  },
  section: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  pickGroup: {
    gap: Spacing.sm,
  },
  pickPrimary: {},
  pickSecondary: {},
  pickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  pickCardSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: 12,
  },
  pickIcon: {
    width: 50,
    height: 50,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryGlow,
  },
  pickText: { flex: 1 },
  pickTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  pickSub: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  pickTitleSm: {
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  pickSubSm: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 1,
  },
  urlInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? 10 : 4,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  urlInputRowFocused: {
    borderColor: Colors.primary,
  },
  urlInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    includeFontPadding: false,
  } as any,
  fetchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 12,
  },
  fetchBtnDisabled: { opacity: 0.4 },
  fetchBtnText: {
    color: Colors.background,
    fontSize: FontSize.base,
    fontWeight: '700',
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.accentDim,
    backgroundColor: Colors.accentDim,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
  quickChipText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: Spacing.sm,
  },
  featureRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featureText: { flex: 1 },
  featureLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  featureDesc: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
    lineHeight: 18,
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
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    flex: 1,
    color: Colors.error,
    fontSize: FontSize.sm,
  },
});
