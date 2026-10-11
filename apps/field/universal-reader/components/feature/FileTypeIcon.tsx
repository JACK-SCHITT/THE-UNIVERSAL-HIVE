import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radius } from '../../constants/theme';
import { getFileIconName } from '../../services/fileService';

interface Props {
  fileType: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm: { box: 32, icon: 16, fontSize: 8 },
  md: { box: 44, icon: 22, fontSize: 9 },
  lg: { box: 56, icon: 28, fontSize: 10 },
};

const TYPE_COLORS: Record<string, string> = {
  javascript: '#f7df1e',
  typescript: '#3178c6',
  python: '#3572A5',
  go: '#00ADD8',
  rust: '#FF4500',
  cpp: '#659ad2',
  c: '#A8B9CC',
  java: '#b07219',
  kotlin: '#7F52FF',
  csharp: '#512BD4',
  php: '#777BB4',
  swift: '#F05138',
  ruby: '#CC342D',
  bash: '#89e051',
  html: '#e34c26',
  css: '#563d7c',
  vue: '#42b883',
  svelte: '#ff3e00',
  sql: '#e38c00',
  graphql: '#e10098',
  dart: '#00B4AB',
  json: '#00d4ff',
  yaml: '#cb171e',
  xml: '#f60',
  csv: '#237346',
  markdown: '#ccc',
  text: '#aaa',
  config: '#888',
  default: '#00d4ff',
};

export const FileTypeIcon = memo(function FileTypeIcon({ fileType, size = 'md' }: Props) {
  const { box, icon } = SIZE_MAP[size];
  const color = TYPE_COLORS[fileType] || TYPE_COLORS.default;
  const iconName = getFileIconName(fileType) as any;

  return (
    <View style={[styles.box, { width: box, height: box, borderRadius: Radius.sm, backgroundColor: `${color}22`, borderColor: `${color}44` }]}>
      <MaterialIcons name={iconName} size={icon} color={color} />
    </View>
  );
});

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
