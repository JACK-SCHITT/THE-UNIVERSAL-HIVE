import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';

interface AmountButtonProps {
  amount: number;
  selected: boolean;
  onPress: () => void;
}

export function AmountButton({ amount, selected, onPress }: AmountButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.text, selected && styles.selectedText]}>
        ${amount}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    height: 60,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 2,
    borderColor: THEME.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: THEME.spacing.xs,
  },
  selected: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  text: {
    ...THEME.typography.h3,
    color: THEME.colors.text,
    includeFontPadding: false,
  },
  selectedText: {
    color: THEME.colors.background,
  },
});
