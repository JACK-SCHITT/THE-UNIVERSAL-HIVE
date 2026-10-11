/**
 * Book Detail Screen — chapters, characters, generate movie
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { Book, Story, MovieGenerationProgress } from '../../types';
import { storageService } from '../../services/storageService';
import { movieGenerationService } from '../../services/movieGenerationService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

type Tab = 'overview' | 'characters' | 'chapters' | 'scenes';

export default function BookDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState<MovieGenerationProgress | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadBook();
    }, [id])
  );

  const loadBook = async () => {
    if (!id) return;
    const data = await storageService.getBook(id);
    setBook(data);
  };

  const handleGenerateMovie = async () => {
    if (!book) return;
    setGenerating(true);

    // Create story from book
    const story: Story = {
      id: `story_${book.id}`,
      title: book.title,
      genre: book.genre,
      synopsis: book.synopsis,
      scenes: book.chapters.flatMap(ch => ch.scenes),
      characters: book.characters,
      duration: Math.round(book.wordCount / 1000),
      bookId: book.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'generating',
    };

    await storageService.saveStory(story);

    const videoUrl = await movieGenerationService.generateMovie(story, (progress) => {
      setGenProgress(progress);
    });

    story.status = 'completed';
    story.videoUrl = videoUrl;
    await storageService.saveStory(story);

    setGenerating(false);
    setGenProgress(null);
    router.push(`/story/${story.id}`);
  };

  if (!book) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading book...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalScenes = book.chapters.reduce((sum, ch) => sum + ch.scenes.length, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
          <Text style={styles.bookAuthor}>by {book.author}</Text>
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>{book.contentRating}</Text>
        </View>
      </View>

      {/* Stats strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsStrip}>
        <View style={styles.statsRow}>
          {[
            { icon: 'menu-book', label: `${book.pageCount} pages` },
            { icon: 'text-fields', label: `${book.wordCount.toLocaleString()} words` },
            { icon: 'list', label: `${book.chapters.length} chapters` },
            { icon: 'people', label: `${book.characters.length} characters` },
            { icon: 'movie', label: `~${Math.round(book.wordCount / 1000)} min film` },
          ].map((s, i) => (
            <View key={i} style={styles.statChip}>
              <MaterialIcons name={s.icon as any} size={14} color={Colors.primary} />
              <Text style={styles.statChipText}>{s.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['overview', 'characters', 'chapters', 'scenes'] as Tab[]).map(tab => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'overview' && (
          <View style={styles.section}>
            <View style={styles.synopsisBox}>
              <Text style={styles.sectionTitle}>Synopsis</Text>
              <Text style={styles.synopsis}>{book.synopsis}</Text>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoCell}>
                <Text style={styles.infoCellLabel}>Genre</Text>
                <Text style={styles.infoCellValue}>{book.genre}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoCellLabel}>Rating</Text>
                <Text style={styles.infoCellValue}>{book.contentRating}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoCellLabel}>Import</Text>
                <Text style={styles.infoCellValue}>{book.importMethod}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoCellLabel}>Added</Text>
                <Text style={styles.infoCellValue}>
                  {new Date(book.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'characters' && (
          <View style={styles.section}>
            {book.characters.length === 0 ? (
              <Text style={styles.emptyNote}>No characters extracted yet</Text>
            ) : (
              book.characters.map((char, i) => (
                <Card key={char.id} elevated style={styles.characterCard}>
                  <View style={styles.characterHeader}>
                    <View style={styles.characterAvatar}>
                      <Text style={styles.avatarText}>{char.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.characterInfo}>
                      <Text style={styles.characterName}>{char.name}</Text>
                      <Text style={styles.characterRole}>{char.role}</Text>
                    </View>
                  </View>
                  {char.description ? (
                    <Text style={styles.characterDesc} numberOfLines={2}>
                      {char.description}
                    </Text>
                  ) : null}
                </Card>
              ))
            )}
          </View>
        )}

        {activeTab === 'chapters' && (
          <View style={styles.section}>
            {book.chapters.map((chapter, i) => (
              <View key={chapter.id} style={styles.chapterRow}>
                <View style={styles.chapterNum}>
                  <Text style={styles.chapterNumText}>{chapter.number}</Text>
                </View>
                <View style={styles.chapterInfo}>
                  <Text style={styles.chapterTitle}>{chapter.title}</Text>
                  <Text style={styles.chapterMeta}>
                    {chapter.wordCount.toLocaleString()} words · ~{chapter.estimatedDuration} min
                  </Text>
                </View>
                <View style={[styles.processedDot, chapter.processed && styles.processedDotDone]} />
              </View>
            ))}
          </View>
        )}

        {activeTab === 'scenes' && (
          <View style={styles.section}>
            {totalScenes === 0 ? (
              <View style={styles.noScenes}>
                <MaterialIcons name="movie-creation" size={40} color={Colors.textMuted} />
                <Text style={styles.noScenesText}>
                  Scenes will be generated when you create your movie
                </Text>
              </View>
            ) : (
              book.chapters.flatMap(ch => ch.scenes).map((scene, i) => (
                <View key={scene.id} style={styles.sceneRow}>
                  <Text style={styles.sceneNum}>{i + 1}</Text>
                  <View style={styles.sceneInfo}>
                    <Text style={styles.sceneTitle}>{scene.title}</Text>
                    <Text style={styles.sceneMeta}>{scene.mood} · {Math.round(scene.duration / 60)} min</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Generate Movie CTA */}
      {!generating ? (
        <View style={styles.footer}>
          <Button
            title="Generate Movie"
            onPress={handleGenerateMovie}
            variant="primary"
            fullWidth
            size="large"
            icon="movie-creation"
          />
        </View>
      ) : (
        <View style={styles.generatingFooter}>
          <View style={styles.genProgressRow}>
            <Text style={styles.genTask}>{genProgress?.currentTask || 'Preparing...'}</Text>
            <Text style={styles.genPct}>{Math.round(genProgress?.progress || 0)}%</Text>
          </View>
          <View style={styles.genTrack}>
            <View style={[styles.genFill, { width: `${genProgress?.progress || 0}%` }]} />
          </View>
          <Text style={styles.genDetail}>
            Scene {genProgress?.currentScene || 0} / {genProgress?.totalScenes || 0}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...Typography.body, color: Colors.textMuted },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: { padding: Spacing.xs, marginTop: 2 },
  headerText: { flex: 1, gap: 2 },
  bookTitle: { ...Typography.headline, fontSize: 20, lineHeight: 26 },
  bookAuthor: { ...Typography.caption, color: Colors.textSecondary },
  ratingBadge: {
    backgroundColor: Colors.primary + '20',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  ratingText: { fontSize: 11, fontWeight: '700', color: Colors.primary },

  statsStrip: { flexGrow: 0 },
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.sm },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statChipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },

  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  tab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  section: { gap: Spacing.md },

  synopsisBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: { ...Typography.body, fontWeight: '700', color: Colors.primary },
  synopsis: { ...Typography.body, color: Colors.textSecondary, lineHeight: 24 },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  infoCell: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flex: 1,
    minWidth: '45%',
    gap: 4,
  },
  infoCellLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
  infoCellValue: { ...Typography.body, fontWeight: '600' },

  emptyNote: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xl },

  characterCard: { padding: Spacing.md, gap: Spacing.sm },
  characterHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  characterAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  characterInfo: { flex: 1 },
  characterName: { ...Typography.body, fontWeight: '700' },
  characterRole: { ...Typography.caption, color: Colors.primary },
  characterDesc: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 },

  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chapterNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterNumText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  chapterInfo: { flex: 1 },
  chapterTitle: { ...Typography.body, fontWeight: '600', fontSize: 14 },
  chapterMeta: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  processedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  processedDotDone: { backgroundColor: Colors.success },

  noScenes: { alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.xxl },
  noScenesText: { ...Typography.body, color: Colors.textMuted, textAlign: 'center' },
  sceneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sceneNum: { ...Typography.caption, color: Colors.textMuted, width: 24, textAlign: 'center' },
  sceneInfo: { flex: 1 },
  sceneTitle: { ...Typography.body, fontSize: 14, fontWeight: '600' },
  sceneMeta: { ...Typography.caption, color: Colors.textMuted, textTransform: 'capitalize' },

  footer: { padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  generatingFooter: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  genProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  genTask: { ...Typography.caption, color: Colors.textSecondary, flex: 1 },
  genPct: { ...Typography.body, fontWeight: '700', color: Colors.primary },
  genTrack: {
    height: 6,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  genFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  genDetail: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center' },
});
