import React, { memo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '@/constants/theme';

interface TypingIndicatorProps {
  agentColor: string;
  label?: string;
}

export const TypingIndicator = memo(function TypingIndicator({ agentColor, label = 'PROCESSING' }: TypingIndicatorProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.indicator, { backgroundColor: agentColor }]} />
      <View style={styles.bubble}>
        <Text style={[styles.label, { color: agentColor }]}>{label}</Text>
        <View style={styles.dots}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.dot, { backgroundColor: agentColor, opacity: 0.3 + i * 0.3 }]} />
          ))}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  indicator: {
    width: 2,
    height: 32,
    borderRadius: 1,
  },
  bubble: {
    backgroundColor: '#0f0f0f',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: 'monospace',
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});
