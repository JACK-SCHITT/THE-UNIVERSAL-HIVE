// KRACKERJACK FOUNDRY — Terminal Log Component

import React, { memo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize } from '@/constants/theme';
import { LogEntry } from '@/services/mockData';

interface TerminalLogProps {
  entries: LogEntry[];
  height?: number;
}

export const TerminalLog = memo(function TerminalLog({
  entries,
  height = 220,
}: TerminalLogProps) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [entries]);

  const getColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return Colors.primary;
      case 'warning': return Colors.accent;
      case 'danger': return Colors.danger;
      default: return Colors.textSecondary;
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {entries.map(entry => (
          <View key={entry.id} style={styles.row}>
            <Text style={styles.timestamp}>[{entry.timestamp}]</Text>
            <Text style={[styles.message, { color: getColor(entry.type) }]}>
              {entry.message}
            </Text>
          </View>
        ))}
        <Text style={styles.cursor}>█</Text>
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 6,
    overflow: 'hidden',
  },
  content: {
    padding: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 3,
    gap: 6,
  },
  timestamp: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  message: {
    fontSize: FontSize.xs,
    fontFamily: 'monospace',
    flex: 1,
  },
  cursor: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    marginTop: 4,
  },
});
