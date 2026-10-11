// KRACKERJACK AI — Repo Edit Screen

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { GlowButton } from '@/components';
import { useAlert } from '@/template';
import { fetchRepo, updateRepo, GitHubRepo } from '@/services/githubService';
import { loadGHToken } from '@/services/storageService';

export default function RepoEdit() {
  const { id, fullName } = useLocalSearchParams<{ id: string; fullName: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();

  const [repo, setRepo] = useState<GitHubRepo | null>(null);
  const [description, setDescription] = useState('');
  const [homepage, setHomepage] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fullName) return;
    const [owner, name] = fullName.split('/');
    if (!owner || !name) return;
    async function load() {
      const token = await loadGHToken();
      if (!token) { setError('No GitHub token. Add one in Config.'); setLoading(false); return; }
      const { data, error: err } = await fetchRepo(token, owner, name);
      if (err || !data) { setError(err || 'Failed to load repo'); setLoading(false); return; }
      setRepo(data);
      setDescription(data.description || '');
      setHomepage(data.homepage || '');
      setIsPrivate(data.private);
      setLoading(false);
    }
    load();
  }, [fullName]);

  const handleSave = async () => {
    if (!repo || !fullName) return;
    const [owner, name] = fullName.split('/');
    setSaving(true);
    const token = await loadGHToken();
    if (!token) {
      showAlert('No Token', 'Add your GitHub token in Config first.');
      setSaving(false);
      return;
    }
    const { data, error: err } = await updateRepo(token, owner, name, {
      description: description.trim() || undefined,
      homepage: homepage.trim() || undefined,
      private: isPrivate,
    });
    setSaving(false);
    if (err) {
      showAlert('Update Failed', err);
      return;
    }
    showAlert('Repo Updated', `${repo.name} has been updated in the Hive.`);
    router.back();
  };

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading repo data...</Text>
      </View>
    );
  }

  if (error || !repo) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <MaterialIcons name="error-outline" size={40} color={Colors.danger} />
        <Text style={styles.errorText}>{error || 'Repo not found'}</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: Spacing.md }}>
          <Text style={{ color: Colors.primary, fontWeight: FontWeight.bold }}>← BACK</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: Colors.bg }}
    >
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backPressable} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={20} color={Colors.primary} />
          <Text style={styles.backText}>BACK</Text>
        </Pressable>
        <Text style={styles.topBarTitle}>EDIT NODE</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Repo name banner */}
        <View style={styles.repoBanner}>
          <MaterialIcons name="hub" size={16} color={Colors.primary} />
          <Text style={styles.repoNameText}>{repo.full_name}</Text>
        </View>

        {/* Edit Fields */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>📝 REPO METADATA</Text>

          <Text style={styles.fieldLabel}>DESCRIPTION</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="What does this node do?"
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
            maxLength={350}
          />

          <Text style={styles.fieldLabel}>HOMEPAGE / URL</Text>
          <TextInput
            style={styles.inputSingle}
            value={homepage}
            onChangeText={setHomepage}
            placeholder="https://..."
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            keyboardType="url"
          />

          <Text style={styles.fieldLabel}>VISIBILITY</Text>
          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggleOption, !isPrivate && styles.toggleOptionActive]}
              onPress={() => setIsPrivate(false)}
            >
              <MaterialIcons name="public" size={14} color={!isPrivate ? Colors.textOnPrimary : Colors.textMuted} />
              <Text style={[styles.toggleOptionText, !isPrivate && styles.toggleOptionTextActive]}>PUBLIC</Text>
            </Pressable>
            <Pressable
              style={[styles.toggleOption, isPrivate && styles.toggleOptionAccent]}
              onPress={() => setIsPrivate(true)}
            >
              <MaterialIcons name="lock" size={14} color={isPrivate ? Colors.textOnAccent : Colors.textMuted} />
              <Text style={[styles.toggleOptionText, isPrivate && styles.toggleOptionTextAccent]}>PRIVATE</Text>
            </Pressable>
          </View>
        </View>

        {/* Read-only Info */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>📡 CURRENT NODE DATA</Text>
          {[
            ['NAME', repo.name],
            ['DEFAULT BRANCH', repo.default_branch],
            ['LANGUAGE', repo.language || 'Unknown'],
            ['STARS', String(repo.stargazers_count)],
            ['FORKS', String(repo.forks_count)],
          ].map(([k, v]) => (
            <View key={k} style={styles.infoRow}>
              <Text style={styles.infoKey}>{k}</Text>
              <Text style={styles.infoVal}>{v}</Text>
            </View>
          ))}
        </View>

        {/* Save */}
        <GlowButton
          label={saving ? '⟳ SAVING TO GITHUB...' : '💾 SAVE CHANGES TO HIVE'}
          onPress={handleSave}
          variant="primary"
          loading={saving}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { fontSize: FontSize.sm, color: Colors.textMuted },
  errorText: { fontSize: FontSize.sm, color: Colors.danger, textAlign: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bgPanel,
  },
  backPressable: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 64 },
  backText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.bold, letterSpacing: 1 },
  topBarTitle: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.black,
    color: Colors.textWhite,
    textAlign: 'center',
    letterSpacing: 2,
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  repoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  repoNameText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.bold },
  panel: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  panelTitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
  },
  fieldLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textWhite,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: Spacing.sm,
  },
  inputSingle: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    fontSize: FontSize.sm,
    color: Colors.textWhite,
    marginBottom: Spacing.sm,
  },
  toggleRow: { flexDirection: 'row', gap: Spacing.sm },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgPanel,
  },
  toggleOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toggleOptionAccent: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  toggleOptionText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.bold, letterSpacing: 1 },
  toggleOptionTextActive: { color: Colors.textOnPrimary },
  toggleOptionTextAccent: { color: Colors.textOnAccent },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoKey: { fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 1.2 },
  infoVal: { fontSize: FontSize.xs, color: Colors.primary },
});
