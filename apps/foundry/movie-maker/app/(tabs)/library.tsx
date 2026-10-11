/**
 * Library Screen - Generated Movies
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { Story } from '../../types';
import { storageService } from '../../services/storageService';
import EmptyState from '../../components/ui/EmptyState';

export default function LibraryScreen() {
  const [completedStories, setCompletedStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadCompletedStories();
    }, [])
  );

  const loadCompletedStories = async () => {
    setLoading(true);
    const stories = await storageService.getStories();
    const completed = stories.filter(s => s.status === 'completed');
    setCompletedStories(completed);
    setLoading(false);
  };

  if (!loading && completedStories.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Movie Library</Text>
        </View>
        
        <EmptyState
          image={require('../../assets/images/empty-story.png')}
          title="No Movies Yet"
          description="Your generated movies will appear here once they are ready to watch"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Movie Library</Text>
      </View>

      <Text style={styles.comingSoon}>Coming Soon: Watch and Export</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  title: {
    ...Typography.title,
  },
  comingSoon: {
    ...Typography.subtitle,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
});
