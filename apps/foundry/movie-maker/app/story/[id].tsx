/**
 * Story/Movie Detail — view generated movie
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { Story } from '../../types';
import { storageService } from '../../services/storageService';
import Button from '../../components/ui/Button';

export default function StoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [story, setStory] = useState<Story | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadStory();
    }, [id])
  );

  const loadStory = async () => {
    if (!id) return;
    const data = await storageService.getStory(id);
    setStory(data);
  };

  const player = useVideoPlayer(
    story?.videoUrl ? { uri: story.videoUrl } : null,
    p => { p.loop = false; }
  );

  if (!story) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{story.title}</Text>
        <View style={[styles.statusBadge, story.status === 'completed' && styles.statusBadgeDone]}>
          <Text style={styles.statusText}>{story.status}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Video Player */}
        {story.videoUrl ? (
          <View style={styles.videoContainer}>
            <VideoView
              player={player}
              style={styles.video}
              contentFit="contain"
              nativeControls
            />
          </View>
        ) : (
          <View style={styles.noVideo}>
            <MaterialIcons name="movie" size={48} color={Colors.textMuted} />
            <Text style={styles.noVideoText}>Movie not generated yet</Text>
          </View>
        )}

        <View style={styles.content}>
          {/* Genre + Duration */}
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <MaterialIcons name="local-movies" size={14} color={Colors.primary} />
              <Text style={styles.metaText}>{story.genre}</Text>
            </View>
            <View style={styles.metaChip}>
              <MaterialIcons name="schedule" size={14} color={Colors.primary} />
              <Text style={styles.metaText}>{story.duration} min</Text>
            </View>
            <View style={styles.metaChip}>
              <MaterialIcons name="movie" size={14} color={Colors.primary} />
              <Text style={styles.metaText}>{story.scenes.length} scenes</Text>
            </View>
          </View>

          {/* Synopsis */}
          <View style={styles.synopsisBox}>
            <Text style={styles.sectionLabel}>Synopsis</Text>
            <Text style={styles.synopsis}>{story.synopsis}</Text>
          </View>

          {/* Characters */}
          {story.characters.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Characters</Text>
              <View style={styles.characterList}>
                {story.characters.map((char) => (
                  <View key={char.id} style={styles.characterChip}>
                    <View style={styles.charAvatar}>
                      <Text style={styles.charAvatarText}>{char.name.charAt(0)}</Text>
                    </View>
                    <View>
                      <Text style={styles.charName}>{char.name}</Text>
                      <Text style={styles.charRole}>{char.role}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Scenes */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Scene List</Text>
            {story.scenes.slice(0, 20).map((scene, i) => (
              <View key={scene.id} style={styles.sceneRow}>
                <Text style={styles.sceneIdx}>{i + 1}</Text>
                <View style={styles.sceneInfo}>
                  <Text style={styles.sceneName}>{scene.title}</Text>
                  <Text style={styles.sceneMeta}>
                    {scene.mood} · {Math.round(scene.duration / 60)} min · {scene.setting}
                  </Text>
                </View>
              </View>
            ))}
            {story.scenes.length > 20 && (
              <Text style={styles.moreScenes}>+{story.scenes.length - 20} more scenes</Text>
            )}
          </View>

          {story.status === 'completed' && story.videoUrl && (
            <Button
              title="Watch Full Movie"
              onPress={() => player?.play()}
              variant="primary"
              fullWidth
              size="large"
              icon="play-arrow"
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...Typography.body, color: Colors.textMuted },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: { padding: Spacing.xs },
  title: { ...Typography.headline, flex: 1, fontSize: 18 },
  statusBadge: {
    backgroundColor: Colors.textMuted + '30',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeDone: { backgroundColor: Colors.success + '30' },
  statusText: { fontSize: 11, fontWeight: '700', color: Colors.text, textTransform: 'capitalize' },

  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  video: { width: '100%', height: '100%' },
  noVideo: {
    height: 200,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  noVideoText: { ...Typography.body, color: Colors.textMuted },

  content: { padding: Spacing.md, gap: Spacing.lg },
  metaRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metaText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },

  synopsisBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sectionLabel: { ...Typography.caption, color: Colors.primary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  synopsis: { ...Typography.body, color: Colors.textSecondary, lineHeight: 24 },

  section: { gap: Spacing.md },
  characterList: { gap: Spacing.sm },
  characterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  charAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  charAvatarText: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  charName: { ...Typography.body, fontWeight: '600' },
  charRole: { ...Typography.caption, color: Colors.primary },

  sceneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sceneIdx: { ...Typography.caption, color: Colors.textMuted, width: 24, textAlign: 'center', marginTop: 2 },
  sceneInfo: { flex: 1 },
  sceneName: { ...Typography.body, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  sceneMeta: { ...Typography.caption, color: Colors.textMuted, textTransform: 'capitalize' },
  moreScenes: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', paddingTop: Spacing.sm },
});
