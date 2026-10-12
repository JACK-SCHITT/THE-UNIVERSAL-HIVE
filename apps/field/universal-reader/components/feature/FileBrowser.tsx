import React, { memo, useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, Radius } from '../../constants/theme';
import { FileRecord, ZipEntry } from '../../services/types';
import {
  formatFileSize, getLanguageLabel, detectFileType, generateId, getFileExtension,
} from '../../services/fileService';
import { FileViewer } from './FileViewer';
import { useFileContext } from '../../hooks/useFileContext';

// ─── ZIP Browser ─────────────────────────────────────────────────────────────

interface ZipBrowserProps {
  file: FileRecord;
  onClose: () => void;
}

function getEntryIcon(entry: ZipEntry): string {
  if (entry.isDirectory) return 'folder';
  const ext = entry.extension.toLowerCase();
  const codeExts = new Set(['js', 'ts', 'tsx', 'jsx', 'py', 'go', 'rs', 'java', 'kt', 'swift', 'rb', 'php', 'cpp', 'c', 'cs', 'dart', 'lua', 'r', 'sh', 'bash']);
  const dataExts = new Set(['json', 'yaml', 'yml', 'xml', 'csv', 'toml', 'ini', 'env']);
  const docExts = new Set(['md', 'txt', 'rst', 'log']);
  const imgExts = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico']);
  if (codeExts.has(ext)) return 'code';
  if (dataExts.has(ext)) return 'data-object';
  if (docExts.has(ext)) return 'article';
  if (imgExts.has(ext)) return 'image';
  return 'insert-drive-file';
}

function getEntryColor(entry: ZipEntry): string {
  if (entry.isDirectory) return '#e5c07b';
  if (entry.fileType === 'binary') return Colors.textMuted;
  return Colors.primary;
}

export const ZipBrowser = memo(function ZipBrowser({ file, onClose }: ZipBrowserProps) {
  const { setActiveFile } = useFileContext();
  const [search, setSearch] = useState('');
  const [openedEntry, setOpenedEntry] = useState<FileRecord | null>(null);
  const [currentDir, setCurrentDir] = useState('');

  const entries = file.zipEntries || [];

  // Get entries in current directory
  const visibleEntries = useMemo(() => {
    const withPath = (e: ZipEntry) => ({ ...e, path: e.path ?? '' });
    let list = (entries || []).map(withPath);
    if (search.trim()) {
      const q = search.toLowerCase();
      return list.filter((e) => e.path.toLowerCase().includes(q) || e.name.toLowerCase().includes(q));
    }
    // Show only direct children of currentDir
    return list.filter((e) => {
      if (!currentDir) {
        // Root: entries with no slash or only trailing slash
        const parts = (e.path||"").replace(/\/$/, '').split('/');
        return parts.length === 1;
      }
      const prefix = currentDir.endsWith('/') ? currentDir : currentDir + '/';
      if (!e.path.startsWith(prefix)) return false;
      const rest = e.path.slice(prefix.length).replace(/\/$/, '');
      return rest.split('/').length === 1 && rest.length > 0;
    });
  }, [entries, search, currentDir]);

  const handleEntryPress = useCallback((entry: ZipEntry) => {
    const ep = (entry?.path ?? '') as string;
    if (entry.isDirectory) {
      const dirPath = ep.replace(/\/$/, '');
      setCurrentDir(dirPath);
      return;
    }
    if (entry.content.startsWith('[Binary') || entry.content.startsWith('[Could not read')) {
      // Show as text anyway
    }
    const record: FileRecord = {
      id: generateId(),
      name: entry.name,
      extension: entry.extension,
      fileType: entry.fileType,
      content: entry.content,
      size: entry.size,
      savedAt: Date.now(),
      source: 'picker',
    };
    setOpenedEntry(record);
  }, [setCurrentDir]);

  const handleBack = useCallback(() => {
    if (currentDir.includes('/')) {
      setCurrentDir(currentDir.split('/').slice(0, -1).join('/'));
    } else {
      setCurrentDir('');
    }
  }, [currentDir]);

  if (openedEntry) {
    return (
      <FileViewer
        file={openedEntry}
        onClose={() => setOpenedEntry(null)}
      />
    );
  }

  const totalFiles = entries.filter((e) => !e.isDirectory).length;
  const totalDirs = entries.filter((e) => e.isDirectory).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={onClose} style={styles.backBtn} hitSlop={8}>
            <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
          </Pressable>
          <View style={styles.zipIcon}>
            <MaterialIcons name="folder-zip" size={22} color="#e5c07b" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.zipName} numberOfLines={1}>{file.name}</Text>
            <Text style={styles.zipMeta}>
              {totalFiles} files · {totalDirs} folders · {formatFileSize(file.size)}
            </Text>
          </View>
        </View>
      </View>

      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <Pressable onPress={() => setCurrentDir('')} hitSlop={4}>
          <Text style={[styles.breadcrumbPart, !currentDir && styles.breadcrumbCurrent]}>
            root
          </Text>
        </Pressable>
        {currentDir.split('/').filter(Boolean).map((part, idx, arr) => (
          <React.Fragment key={idx}>
            <MaterialIcons name="chevron-right" size={14} color={Colors.textMuted} />
            <Pressable
              onPress={() => setCurrentDir(arr.slice(0, idx + 1).join('/'))}
              hitSlop={4}
            >
              <Text style={[styles.breadcrumbPart, idx === arr.length - 1 && styles.breadcrumbCurrent]}>
                {part}
              </Text>
            </Pressable>
          </React.Fragment>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <MaterialIcons name="search" size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search files in ZIP..."
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          selectionColor={Colors.primary}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <MaterialIcons name="close" size={15} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Back button if inside dir */}
      {currentDir && !search && (
        <Pressable style={styles.upBtn} onPress={handleBack}>
          <MaterialIcons name="arrow-upward" size={15} color={Colors.textSecondary} />
          <Text style={styles.upBtnText}>.. (up one level)</Text>
        </Pressable>
      )}

      {/* File list */}
      <FlatList
        data={visibleEntries}
        keyExtractor={(item) => item.path}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.entryRow, pressed && styles.entryRowPressed]}
            onPress={() => handleEntryPress(item)}
          >
            <View style={[styles.entryIconWrap, item.isDirectory && styles.entryIconDir]}>
              <MaterialIcons
                name={getEntryIcon(item) as any}
                size={18}
                color={getEntryColor(item)}
              />
            </View>
            <View style={styles.entryInfo}>
              <Text style={styles.entryName} numberOfLines={1}>
                {item.name}
                {item.isDirectory ? '/' : ''}
              </Text>
              {search && (
                <Text style={styles.entryPath} numberOfLines={1}>{item.path}</Text>
              )}
              {!item.isDirectory && (
                <Text style={styles.entryMeta}>
                  {getLanguageLabel(item.fileType)}
                  {item.size > 0 ? ` · ${formatFileSize(item.size)}` : ''}
                </Text>
              )}
            </View>
            {!item.isDirectory && (
              <MaterialIcons name="chevron-right" size={18} color={Colors.textMuted} />
            )}
            {item.isDirectory && (
              <MaterialIcons name="chevron-right" size={18} color="#e5c07b" />
            )}
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="search-off" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No files found</Text>
          </View>
        }
      />
    </View>
  );
});

// ─── Multi-file browser ───────────────────────────────────────────────────────

interface MultiBrowserProps {
  files: FileRecord[];
  onClose: () => void;
}

export const MultiBrowser = memo(function MultiBrowser({ files, onClose }: MultiBrowserProps) {
  const [openedFile, setOpenedFile] = useState<FileRecord | null>(null);

  if (openedFile) {
    return <FileViewer file={openedFile} onClose={() => setOpenedFile(null)} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={onClose} style={styles.backBtn} hitSlop={8}>
            <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
          </Pressable>
          <View style={styles.zipIcon}>
            <MaterialIcons name="folder-open" size={22} color={Colors.primary} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.zipName}>{files.length} Files Selected</Text>
            <Text style={styles.zipMeta}>Tap any file to open it</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={files}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.entryRow, pressed && styles.entryRowPressed]}
            onPress={() => {
              if (item.isZip) {
                setOpenedFile(item); // Will open ZipBrowser via FileViewer
              } else {
                setOpenedFile(item);
              }
            }}
          >
            <View style={styles.entryIconWrap}>
              <MaterialIcons
                name={(item.isZip ? 'folder-zip' : 'insert-drive-file') as any}
                size={18}
                color={item.isZip ? '#e5c07b' : Colors.primary}
              />
            </View>
            <View style={styles.entryInfo}>
              <Text style={styles.entryName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.entryMeta}>
                {item.isZip ? 'ZIP Archive' : getLanguageLabel(item.fileType)}
                {item.size > 0 ? ` · ${formatFileSize(item.size)}` : ''}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={18} color={Colors.textMuted} />
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  backBtn: {
    padding: 6,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
  },
  zipIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: `${'#e5c07b'}22`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${'#e5c07b'}44`,
  },
  headerInfo: { flex: 1 },
  zipName: {
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    fontWeight: '700',
  },
  zipMeta: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 1,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    gap: 2,
  },
  breadcrumbPart: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  breadcrumbCurrent: {
    color: Colors.primary,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    includeFontPadding: false,
  } as any,
  upBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  upBtnText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  listContent: {
    paddingBottom: 80,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.surfaceBorder}88`,
  },
  entryRowPressed: {
    backgroundColor: Colors.surface,
  },
  entryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  entryIconDir: {
    backgroundColor: `${'#e5c07b'}18`,
  },
  entryInfo: {
    flex: 1,
    overflow: 'hidden',
  },
  entryName: {
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    fontWeight: '500',
  },
  entryPath: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    marginTop: 1,
  },
  entryMeta: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.base,
  },
});
