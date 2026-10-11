/**
 * Create Character Screen
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { Character } from '../types';
import { storageService } from '../services/storageService';
import Button from '../components/ui/Button';

export default function CreateCharacterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
  const [appearance, setAppearance] = useState('');
  const [personality, setPersonality] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !role.trim()) {
      return;
    }

    setCreating(true);

    const newCharacter: Character = {
      id: Date.now().toString(),
      name: name.trim(),
      role: role.trim(),
      description: description.trim() || 'A character in your story',
      appearance: appearance.trim() || 'To be defined',
      personality: personality.trim() || 'To be defined',
      createdAt: new Date(),
    };

    await storageService.saveCharacter(newCharacter);
    
    setTimeout(() => {
      setCreating(false);
      router.back();
    }, 500);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Create Character</Text>
      </View>

      <ScrollView contentContainerStyle={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Character Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter character name"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Role *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Hero, Villain, Mentor"
            placeholderTextColor={Colors.textMuted}
            value={role}
            onChangeText={setRole}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the character's background, goals, and motivations"
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Appearance</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe physical appearance, clothing, distinctive features"
            placeholderTextColor={Colors.textMuted}
            value={appearance}
            onChangeText={setAppearance}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Personality</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe personality traits, quirks, and behavior"
            placeholderTextColor={Colors.textMuted}
            value={personality}
            onChangeText={setPersonality}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <Button
          title="Create Character"
          onPress={handleCreate}
          variant="primary"
          loading={creating}
          disabled={!name.trim() || !role.trim()}
          fullWidth
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  title: {
    ...Typography.headline,
  },
  formContainer: {
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  label: {
    ...Typography.body,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
});
