/**
 * Home Screen - Stories & Books Dashboard
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { Story, Book } from '../../types';
import { storageService } from '../../services/storageService';
import StoryCard from '../../components/story/StoryCard';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';

export default function HomeScreen() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'books' | 'movies'>('books');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    const [s, b] = await Promise.all([
      storageService.getStories(),
      storageService.getBooks(),
    ]);
    setStories(s);
    setBooks(b);
    setLoading(false);
  };

  const isEmpty = books.length === 0 && stories.length === 0;

  if (!loading && isEmpty) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.heroSection}>
          <Image
            source={require('../../assets/images/hero-movie-studio.png')}
            style={styles.heroImage}
            contentFit="contain"
            transition={200}
          />
          <Text style={styles.appTitle}>AI Movie Maker</Text>
          <Text style={styles.tagline}>Your 790-page book becomes a cinematic masterpiece</Text>
        </View>

        <EmptyState
          image={require('../../assets/images/empty-story.png')}
          title="Ready to Adapt Your Book"
          description="Import your manuscript and AI will extract characters, build scenes, and generate your full movie"
          actionLabel="Import Your Book"
          onAction={() => router.push('/import-book')}
        />

        <View style={styles.altActions}>
          <Text style={styles.orText}>or start from scratch</Text>
          <Pressable
            style={styles.altBtn}
            onPress={() => router.push('/create-story')}
          >
            <MaterialIcons name="edit" size={18} color={Colors.textSecondary} />
            <Text style={styles.altBtnText}>Write a New Story</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Studio</Text>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.importBtn}
            onPress={() => router.push('/import-book')}
          >
            <MaterialIcons name="upload-file" size={20} color={Colors.primary} />
            <Text style={styles.importBtnText}>Import Book</Text>
          </Pressable>
          <Pressable style={styles.addBtn} onPress={() => router.push('/create-story')}>
            <MaterialIcons name="add" size={24} color={Colors.text} />
          </Pressable>
        </View>
      </View>

      {/* Tab toggle */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabBtn, activeTab === 'books' && styles.tabBtnActive]}
          onPress={() => setActiveTab('books')}
        >
          <MaterialIcons name="auto-stories" size={16} color={activeTab === 'books' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.tabBtnText, activeTab === 'books' && styles.tabBtnTextActive]}>
            Books ({books.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, activeTab === 'movies' && styles.tabBtnActive]}
          onPress={() => setActiveTab('movies')}
        >
          <MaterialIcons name="movie" size={16} color={activeTab === 'movies' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.tabBtnText, activeTab === 'movies' && styles.tabBtnTextActive]}>
            Movies ({stories.length})
          </Text>
        </Pressable>
      </View>

      {/* Books tab */}
      {activeTab === 'books' && (
        books.length === 0 ? (
          <View style={styles.emptyTab}>
            <MaterialIcons name="auto-stories" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTabText}>No books imported yet</Text>
            <Button
              title="Import Your Book"
              onPress={() => router.push('/import-book')}
              variant="outline"
              icon="upload-file"
            />
          </View>
        ) : (
          <FlatList
            data={books}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.bookCard, pressed && styles.pressed]}
                onPress={() => router.push(`/book/${item.id}`)}
              >
                <View style={styles.bookIcon}>
                  <MaterialIcons name="auto-stories" size={28} color={Colors.primary} />
                </View>
                <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.bookMeta}>
                    {item.pageCount} pages · {item.chapters.length} chapters · {item.characters.length} characters
                  </Text>
                  <Text style={styles.bookGenre}>{item.genre} · {item.contentRating}</Text>
                </View>
                <View style={styles.bookArrow}>
                  <MaterialIcons name="chevron-right" size={24} color={Colors.textMuted} />
                </View>
              </Pressable>
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )
      )}

      {/* Movies tab */}
      {activeTab === 'movies' && (
        stories.length === 0 ? (
          <View style={styles.emptyTab}>
            <MaterialIcons name="movie" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTabText}>No movies generated yet</Text>
            <Text style={styles.emptyTabHint}>Import a book and generate your first movie</Text>
          </View>
        ) : (
          <FlatList
            data={stories}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <StoryCard
                story={item}
                onPress={() => router.push(`/story/${item.id}`)}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  heroSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  heroImage: {
    width: 100,
    height: 100,
    marginBottom: Spacing.sm,
  },
  appTitle: {
    ...Typography.title,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  tagline: {
    ...Typography.caption,
    textAlign: 'center',
    color: Colors.textSecondary,
    lineHeight: 20,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  title: { ...Typography.title },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  importBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  tabBtnActive: { backgroundColor: Colors.surfaceElevated },
  tabBtnText: { fontSize: 13, fontWeight: '500', color: Colors.textMuted },
  tabBtnTextActive: { color: Colors.primary, fontWeight: '700' },

  list: { padding: Spacing.md, gap: Spacing.md },
  emptyTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  emptyTabText: { ...Typography.body, color: Colors.textMuted },
  emptyTabHint: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center' },

  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  pressed: { opacity: 0.75 },
  bookIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookInfo: { flex: 1, gap: 3 },
  bookTitle: { ...Typography.body, fontWeight: '700' },
  bookMeta: { ...Typography.caption, color: Colors.textSecondary },
  bookGenre: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  bookArrow: {},

  altActions: { alignItems: 'center', gap: Spacing.sm, paddingBottom: Spacing.xl },
  orText: { ...Typography.caption, color: Colors.textMuted },
  altBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
  },
  altBtnText: { ...Typography.caption, color: Colors.textSecondary },
});
