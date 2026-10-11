import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, Radius } from '../../constants/theme';
import { FileRecord } from '../../services/types';
import { formatFileSize, getLanguageLabel, countLines, formatTimestamp } from '../../services/fileService';
import { FileTypeIcon } from './FileTypeIcon';
import { PressableScale } from '../ui/PressableScale';

interface Props {
  file: FileRecord;
  onOpen: (file: FileRecord) => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
}

const sourceIcons: Record<string, string> = {
  picker: 'folder',
  paste: 'content-paste',
  url: 'link',
};

export const SavedFileCard = memo(function SavedFileCard({ file, onOpen, onDelete, onPin }: Props) {
  const lines = countLines(file.content);
  const lang = getLanguageLabel(file.fileType);

  return (
    <PressableScale onPress={() => onOpen(file)} style={styles.card}>
      <View style={styles.header}>
        <FileTypeIcon fileType={file.fileType} size="md" />
        <View style={styles.info}>
          <Text style={styles.filename} numberOfLines={1}>{file.name}</Text>
          <View style={styles.metaRow}>
            <MaterialIcons name={sourceIcons[file.source] as any || 'insert-drive-file'} size={11} color={Colors.textMuted} />
            <Text style={styles.meta}>{lang} · {lines} lines · {formatFileSize(file.size)}</Text>
          </View>
        </View>
        {file.pinned && (
          <MaterialIcons name="push-pin" size={14} color={Colors.primary} />
        )}
      </View>
      <View style={styles.footer}>
        <Text style={styles.time}>{formatTimestamp(file.savedAt)}</Text>
        <View style={styles.actions}>
          <Pressable style={styles.actionBtn} onPress={() => onPin(file.id)} hitSlop={8}>
            <MaterialIcons
              name={file.pinned ? 'push-pin' : 'push-pin'}
              size={15}
              color={file.pinned ? Colors.primary : Colors.textMuted}
            />
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => onDelete(file.id)} hitSlop={8}>
            <MaterialIcons name="delete-outline" size={15} color={Colors.error} />
          </Pressable>
        </View>
      </View>
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.sm,
  },
  info: { flex: 1 },
  filename: {
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  meta: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  time: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 4,
  },
});
