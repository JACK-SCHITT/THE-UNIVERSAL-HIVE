import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCharacter } from '@/hooks/useCharacter';
import { AnimatedAvatar } from '@/components/AnimatedAvatar';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';

// Per-character accent colors for preset characters
const CHARACTER_ACCENTS: Record<string, string> = {
  'Grok': '#22d3ee',   // neon cyan — bold & raw
  'Luna': '#a855f7',   // purple — dreamy & mystical
};

function getCharacterAccent(name: string): string {
  return CHARACTER_ACCENTS[name] || '#a855f7';
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200',
  'https://images.unsplash.com/photo-1545912453-7b2ad4994c7a?w=200',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200',
  'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=200',
];

const PERSONALITY_OPTIONS = ['Dreamy', 'Bold', 'Gentle', 'Witty', 'Wise', 'Playful', 'Mysterious'];
const TAG_OPTIONS = ['mystical', 'romantic', 'artistic', 'philosophical', 'adventurous', 'playful', 'protective', 'bold', 'raw', 'loyal'];

export default function GalleryScreen() {
  const router = useRouter();
  const { characters, currentCharacter, selectCharacter, loading, createCharacter, deleteCharacter } = useCharacter();
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [personality, setPersonality] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setSystemPrompt('');
    setPersonality('');
    setSelectedTags([]);
    setSelectedAvatar(PRESET_AVATARS[0]);
    setCreating(false);
  };

  const handleSave = async () => {
    if (!name.trim() || !description.trim() || !systemPrompt.trim() || !personality.trim()) return;
    setSaving(true);
    await createCharacter({
      name: name.trim(),
      description: description.trim(),
      system_prompt: systemPrompt.trim(),
      personality: personality.trim(),
      avatar: selectedAvatar,
      tags: selectedTags,
    });
    setSaving(false);
    resetForm();
  };

  const handleSelect = (char: any) => {
    selectCharacter(char);
    router.push('/(tabs)');
  };

  const handleDelete = (charId: string) => {
    deleteCharacter(charId);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <LinearGradient colors={['#0a0a0f', '#12121a']} style={styles.gradient}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Characters</Text>
          <Pressable
            onPress={() => setCreating(v => !v)}
            style={({ pressed }) => [styles.createBtn, pressed && styles.pressed]}
          >
            <MaterialIcons name={creating ? 'close' : 'add'} size={22} color={colors.textPrimary} />
            <Text style={styles.createBtnText}>{creating ? 'Cancel' : 'Create'}</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Create Character Form */}
          {creating ? (
            <View style={styles.createForm}>
              <Text style={styles.sectionTitle}>New Character</Text>

              <Text style={styles.label}>Choose Avatar</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarRow}>
                {PRESET_AVATARS.map(url => (
                  <Pressable key={url} onPress={() => setSelectedAvatar(url)} style={styles.avatarOption}>
                    <Image
                      source={{ uri: url }}
                      style={[styles.avatarThumb, selectedAvatar === url && styles.avatarThumbSelected]}
                      contentFit="cover"
                    />
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Aurora"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.label}>Personality *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {PERSONALITY_OPTIONS.map(p => (
                  <Pressable
                    key={p}
                    onPress={() => setPersonality(p)}
                    style={[styles.chip, personality === p && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, personality === p && styles.chipTextActive]}>{p}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.label}>Description * (20-50 chars)</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. A cosmic guide who speaks in starlight"
                placeholderTextColor={colors.textMuted}
                maxLength={80}
              />

              <Text style={styles.label}>System Prompt * (defines behavior)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={systemPrompt}
                onChangeText={setSystemPrompt}
                placeholder="You are [name], a... Describe their personality, tone, and how they interact."
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={500}
              />

              <Text style={styles.label}>Tags</Text>
              <View style={styles.tagsWrap}>
                {TAG_OPTIONS.map(tag => (
                  <Pressable
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    style={[styles.chip, selectedTags.includes(tag) && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, selectedTags.includes(tag) && styles.chipTextActive]}>
                      {tag}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                onPress={handleSave}
                disabled={saving || !name.trim() || !description.trim() || !systemPrompt.trim() || !personality.trim()}
                style={({ pressed }) => [
                  styles.saveBtn,
                  (saving || !name.trim()) && styles.saveBtnDisabled,
                  pressed && styles.pressed,
                ]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.textPrimary} />
                ) : (
                  <Text style={styles.saveBtnText}>Save Character</Text>
                )}
              </Pressable>
            </View>
          ) : null}

          {/* Character List */}
          <Text style={styles.sectionTitle}>Your Characters</Text>

          {loading ? (
            <ActivityIndicator color={colors.neonPurple} style={{ marginTop: spacing.xl }} />
          ) : (
            characters.map(char => {
              const isActive = currentCharacter?.id === char.id;
              const accent = getCharacterAccent(char.name);

              return (
                <Pressable
                  key={char.id}
                  onPress={() => handleSelect(char)}
                  style={({ pressed }) => [
                    styles.characterCard,
                    { borderColor: isActive ? accent : accent + '25' },
                    isActive && { backgroundColor: colors.bgMid },
                    pressed && styles.pressed,
                  ]}
                >
                  {isActive ? (
                    <AnimatedAvatar
                      uri={char.avatar}
                      size={64}
                      accentColor={accent}
                      isActive={false}
                    />
                  ) : (
                    <Image
                      source={{ uri: char.avatar }}
                      style={[styles.charAvatar, { borderColor: accent + '60' }]}
                      contentFit="cover"
                      transition={200}
                    />
                  )}
                  <View style={styles.charInfo}>
                    <View style={styles.charNameRow}>
                      <Text style={styles.charName}>{char.name}</Text>
                      {isActive ? (
                        <View style={[styles.activeBadge, { backgroundColor: accent }]}>
                          <Text style={styles.activeBadgeText}>Active</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.charPersonality, { color: accent }]}>{char.personality}</Text>
                    <Text style={styles.charDescription} numberOfLines={2}>{char.description}</Text>
                    {char.tags && char.tags.length > 0 ? (
                      <View style={styles.tagRow}>
                        {char.tags.slice(0, 3).map(t => (
                          <View key={t} style={[styles.tagBadge, { borderColor: accent + '40' }]}>
                            <Text style={[styles.tagBadgeText, { color: accent + 'cc' }]}>{t}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                  {(char as any).created_by ? (
                    <Pressable
                      onPress={() => handleDelete(char.id)}
                      style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
                      hitSlop={8}
                    >
                      <MaterialIcons name="delete-outline" size={20} color={colors.textMuted} />
                    </Pressable>
                  ) : null}
                </Pressable>
              );
            })
          )}

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neonPurple + '20',
  },
  title: { ...typography.h2, color: colors.textPrimary },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.neonPurple,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  createBtnText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  pressed: { opacity: 0.75 },
  createForm: {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.bgLight,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neonPurple + '30',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  label: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  input: {
    ...typography.body,
    backgroundColor: colors.bgMid,
    borderWidth: 1,
    borderColor: colors.neonPurple + '30',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  avatarRow: { marginBottom: spacing.sm },
  avatarOption: { marginRight: spacing.sm },
  avatarThumb: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarThumbSelected: { borderColor: colors.neonPurple },
  chipRow: { marginBottom: spacing.sm },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bgMid,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.neonPurple + '30',
    marginRight: spacing.xs,
  },
  chipActive: { backgroundColor: colors.neonPurple, borderColor: colors.neonPurple },
  chipText: { ...typography.caption, color: colors.textSecondary },
  chipTextActive: { color: colors.textPrimary },
  saveBtn: {
    backgroundColor: colors.neonPurple,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { ...typography.button, color: colors.textPrimary },
  characterCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.bgLight,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  charAvatar: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    borderWidth: 2,
  },
  charInfo: { flex: 1 },
  charNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2 },
  charName: { ...typography.h3, color: colors.textPrimary },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  activeBadgeText: { fontSize: 11, color: colors.textPrimary, fontWeight: '600' },
  charPersonality: { ...typography.caption, marginBottom: 4 },
  charDescription: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  tagRow: { flexDirection: 'row', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.bgMid,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  tagBadgeText: { fontSize: 11 },
  deleteBtn: { padding: spacing.xs, marginTop: 2 },
});
