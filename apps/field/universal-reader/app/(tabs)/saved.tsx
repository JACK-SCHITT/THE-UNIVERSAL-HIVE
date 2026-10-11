import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors, FontSize, Spacing, Radius } from '../../constants/theme';
import { SavedFileCard } from '../../components/feature/SavedFileCard';
import { FileViewer } from '../../components/feature/FileViewer';
import { useFileContext } from '../../hooks/useFileContext';
import { FileRecord } from '../../services/types';

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const { savedFiles, activeFile, setActiveFile, deleteFile, pinFile, setError } = useFileContext();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pinned'>('all');

  const filtered = useMemo(() => {
    let files = savedFiles;
    if (filter === 'pinned') files = files.filter(f => f.pinned);
    // Sort: pinned first, then by date
    files = [...files].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.savedAt - a.savedAt;
    });
    return files;
  }, [savedFiles, filter]);

  const handleOpen = useCallback((file: FileRecord) => {
    setActiveFile(file);
  }, [setActiveFile]);

  const handleDelete = useCallback((id: string) => {
    if (Platform.OS === 'web') {
      deleteFile(id);
    } else {
      Alert.alert('Delete File', 'Remove this file from your saved library?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteFile(id) },
      ]);
    }
  }, [deleteFile]);

  const handlePin = useCallback((id: string) => {
    pinFile(id);
  }, [pinFile]);

  const handleClose = useCallback(() => {
    setActiveFile(null);
    setError(null);
  }, [setActiveFile, setError]);

  if (activeFile) {
    return <FileViewer file={activeFile} onClose={handleClose} />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialIcons name="bookmarks" size={22} color={Colors.primary} />
          <Text style={styles.title}>Saved Files</Text>
        </View>
        <Text style={styles.subtitle}>{savedFiles.length} file{savedFiles.length !== 1 ? 's' : ''} in your library</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'pinned'] as const).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterLabel, filter === f && styles.filterLabelActive]}>
              {f === 'all' ? `All (${savedFiles.length})` : `Pinned (${savedFiles.filter(x => x.pinned).length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Image
            source={require('../../assets/images/empty-state.png')}
            style={styles.emptyImage}
            contentFit="contain"
            transition={200}
          />
          <Text style={styles.emptyTitle}>
            {filter === 'pinned' ? 'No pinned files' : 'No saved files yet'}
          </Text>
          <Text style={styles.emptyDesc}>
            {filter === 'pinned'
              ? 'Pin important files to find them here quickly'
              : 'Open a file and tap the bookmark icon to save it here'}
          </Text>
          {filter === 'pinned' && savedFiles.length > 0 && (
            <Pressable onPress={() => setFilter('all')} style={styles.showAllBtn}>
              <Text style={styles.showAllText}>Show all files</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SavedFileCard
              file={item}
              onOpen={handleOpen}
              onDelete={handleDelete}
              onPin={handlePin}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  filterBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryDim,
  },
  filterLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  filterLabelActive: {
    color: Colors.primary,
  },
  listContent: {
    paddingBottom: 100,
    paddingTop: Spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: 80,
  },
  emptyImage: {
    width: 160,
    height: 160,
    marginBottom: Spacing.lg,
    opacity: 0.7,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyDesc: {
    color: Colors.textMuted,
    fontSize: FontSize.base,
    textAlign: 'center',
    lineHeight: 22,
  },
  showAllBtn: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  showAllText: {
    color: Colors.primary,
    fontSize: FontSize.base,
    fontWeight: '600',
  },
});
