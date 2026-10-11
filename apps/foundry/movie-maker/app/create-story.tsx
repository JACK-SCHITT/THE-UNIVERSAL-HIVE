/**
 * Create Story Screen - Multiple Input Methods
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { StoryInputMethod, Story, Scene } from '../types';
import { storageService } from '../services/storageService';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

type InputMethodCard = {
  method: StoryInputMethod;
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
};

const INPUT_METHODS: InputMethodCard[] = [
  {
    method: 'freeText',
    icon: 'description',
    title: 'Free Text Story',
    description: 'Write your story naturally and let AI break it into scenes',
  },
  {
    method: 'sceneByScene',
    icon: 'view-list',
    title: 'Scene by Scene',
    description: 'Build your story one scene at a time with full control',
  },
  {
    method: 'template',
    icon: 'library-books',
    title: 'Use Template',
    description: 'Start with a story template and customize it',
  },
  {
    method: 'characterFirst',
    icon: 'people',
    title: 'Character First',
    description: 'Choose characters and let AI create a story for them',
  },
];

export default function CreateStoryScreen() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<StoryInputMethod | null>(null);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [storyText, setStoryText] = useState('');
  const [creating, setCreating] = useState(false);

  const handleMethodSelect = (method: StoryInputMethod) => {
    setSelectedMethod(method);
  };

  const handleCreate = async () => {
    if (!title.trim() || !genre.trim()) {
      return;
    }

    setCreating(true);

    // Create mock story
    const newStory: Story = {
      id: Date.now().toString(),
      title: title.trim(),
      genre: genre.trim(),
      synopsis: storyText.trim() || 'A story waiting to be told...',
      scenes: generateMockScenes(storyText),
      characters: [],
      duration: 60, // Default 60 minutes
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'draft',
    };

    await storageService.saveStory(newStory);
    
    setTimeout(() => {
      setCreating(false);
      router.back();
    }, 500);
  };

  const generateMockScenes = (text: string): Scene[] => {
    // Mock scene generation from text
    const sceneCount = Math.max(3, Math.floor(text.length / 200));
    return Array.from({ length: Math.min(sceneCount, 10) }, (_, i) => ({
      id: `scene_${i}`,
      title: `Scene ${i + 1}`,
      description: text.slice(i * 200, (i + 1) * 200) || 'Scene description',
      duration: 360, // 6 minutes per scene
      characters: [],
      setting: 'To be defined',
      mood: 'neutral',
      action: 'To be defined',
      order: i,
    }));
  };

  if (!selectedMethod) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.title}>Create New Story</Text>
        </View>

        <ScrollView contentContainerStyle={styles.methodsContainer}>
          <Text style={styles.subtitle}>Choose how you want to create</Text>
          {INPUT_METHODS.map((item) => (
            <Card
              key={item.method}
              onPress={() => handleMethodSelect(item.method)}
              elevated
              style={styles.methodCard}
            >
              <View style={styles.methodContent}>
                <View style={styles.iconContainer}>
                  <MaterialIcons name={item.icon} size={32} color={Colors.primary} />
                </View>
                <View style={styles.methodText}>
                  <Text style={styles.methodTitle}>{item.title}</Text>
                  <Text style={styles.methodDescription}>{item.description}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={Colors.textMuted} />
              </View>
            </Card>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => setSelectedMethod(null)} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Free Text Story</Text>
      </View>

      <ScrollView contentContainerStyle={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Story Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your story title"
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Genre *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Sci-Fi, Drama, Adventure"
            placeholderTextColor={Colors.textMuted}
            value={genre}
            onChangeText={setGenre}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Your Story</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Write your story here... AI will automatically break it into scenes and suggest characters."
            placeholderTextColor={Colors.textMuted}
            value={storyText}
            onChangeText={setStoryText}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
          />
          <Text style={styles.hint}>
            Minimum 500 characters recommended for best results
          </Text>
        </View>

        <Button
          title="Create Story"
          onPress={handleCreate}
          variant="primary"
          loading={creating}
          disabled={!title.trim() || !genre.trim()}
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
  subtitle: {
    ...Typography.subtitle,
    marginBottom: Spacing.lg,
  },
  methodsContainer: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  methodCard: {
    padding: Spacing.md,
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodText: {
    flex: 1,
  },
  methodTitle: {
    ...Typography.headline,
    fontSize: 16,
    marginBottom: 4,
  },
  methodDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
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
    minHeight: 200,
    paddingTop: Spacing.md,
  },
  hint: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
});
