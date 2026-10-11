import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Platform, Share } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, Radius } from '../../constants/theme';
import { FileRecord } from '../../services/types';
import {
  formatFileSize, countLines, getLanguageLabel, formatTimestamp,
} from '../../services/fileService';
import { FileTypeIcon } from './FileTypeIcon';
import { useFileContext } from '../../hooks/useFileContext';

interface Props {
  file: FileRecord;
  onClose: () => void;
}

export const FileInfoBar = memo(function FileInfoBar({ file, onClose }: Props) {
  const { saveActive } = useFileContext();
  const lines = countLines(file.content);
  const lang = getLanguageLabel(file.fileType);

  const handleSave = () => {
    saveActive();
    if (Platform.OS !== 'web') {
      Alert.alert('Saved', `"${file.name}" saved to your library.`);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: file.content, title: file.name });
    } catch {}
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <FileTypeIcon fileType={file.fileType} size="sm" />
        <View style={styles.info}>
          <Text style={styles.filename} numberOfLines={1}>{file.name}</Text>
          <Text style={styles.meta}>{lang} · {lines.toLocaleString()} lines · {formatFileSize(file.size)}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.iconBtn} onPress={handleShare} hitSlop={8}>
          <MaterialIcons name="share" size={19} color={Colors.textSecondary} />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={handleSave} hitSlop={8}>
          <MaterialIcons name="bookmark-add" size={19} color={Colors.primary} />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={onClose} hitSlop={8}>
          <MaterialIcons name="close" size={19} color={Colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    gap: Spacing.sm,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  info: { flex: 1 },
  filename: {
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  meta: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    padding: 8,
    borderRadius: Radius.sm,
  },
});
