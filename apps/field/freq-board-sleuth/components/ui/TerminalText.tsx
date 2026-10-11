// Terminal-style text component
import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

interface TerminalTextProps {
  children: React.ReactNode;
  variant?: 'normal' | 'bright' | 'dim' | 'success' | 'warning' | 'error';
  mono?: boolean;
  style?: TextStyle;
}

export function TerminalText({ children, variant = 'normal', mono = false, style }: TerminalTextProps) {
  const getColor = () => {
    switch (variant) {
      case 'bright': return theme.colors.textBright;
      case 'dim': return theme.colors.textDim;
      case 'success': return theme.colors.success;
      case 'warning': return theme.colors.warning;
      case 'error': return theme.colors.error;
      default: return theme.colors.text;
    }
  };

  return (
    <Text style={[
      styles.text,
      { color: getColor() },
      mono && styles.mono,
      style,
    ]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
  },
  mono: {
    fontFamily: theme.fonts.mono,
  },
});
