import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, Radius } from '../../constants/theme';
import { FileRecord } from '../../services/types';
import { FileInfoBar } from './FileInfoBar';
import { CodeViewer } from './CodeViewer';
import { ExplainPanel } from './ExplainPanel';
import { ZipBrowser } from './FileBrowser';

interface Props {
  file: FileRecord;
  onClose: () => void;
}

type ViewMode = 'code' | 'explain';

export const FileViewer = memo(function FileViewer({ file, onClose }: Props) {
  const [mode, setMode] = useState<ViewMode>('code');

  // ZIP files → show the ZIP browser
  if (file.isZip && file.zipEntries) {
    return <ZipBrowser file={file} onClose={onClose} />;
  }

  return (
    <View style={styles.container}>
      <FileInfoBar file={file} onClose={onClose} />

      {/* Mode Toggle */}
      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggleBtn, mode === 'code' && styles.toggleActive]}
          onPress={() => setMode('code')}
        >
          <MaterialIcons name="code" size={15} color={mode === 'code' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.toggleLabel, mode === 'code' && styles.toggleLabelActive]}>
            Code View
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggleBtn, mode === 'explain' && styles.toggleActive]}
          onPress={() => setMode('explain')}
        >
          <MaterialIcons name="auto-awesome" size={15} color={mode === 'explain' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.toggleLabel, mode === 'explain' && styles.toggleLabelActive]}>
            Explain
          </Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        {mode === 'code' ? (
          <CodeViewer content={file.content} fileType={file.fileType} />
        ) : (
          <ExplainPanel content={file.content} fileType={file.fileType} filename={file.name} />
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  toggleRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  toggleActive: {
    borderBottomColor: Colors.primary,
  },
  toggleLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  toggleLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  content: { flex: 1 },
});
