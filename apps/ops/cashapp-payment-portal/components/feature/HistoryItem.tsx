import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

interface HistoryItemProps {
  amount: number;
  timestamp: number;
  recipient: string;
  transactionId: string;
}

export function HistoryItem({ amount, timestamp, recipient, transactionId }: HistoryItemProps) {
  const formatDate = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialIcons name="favorite" size={24} color={THEME.colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={styles.recipient}>Scam Fighter Fund</Text>
        <Text style={styles.date}>{formatDate(timestamp)}</Text>
        <Text style={styles.transactionId}>ID: {transactionId}</Text>
      </View>
      <Text style={styles.amount}>${amount.toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: THEME.spacing.md,
  },
  content: {
    flex: 1,
  },
  recipient: {
    ...THEME.typography.body,
    color: THEME.colors.text,
    fontWeight: '600',
    marginBottom: THEME.spacing.xs / 2,
    includeFontPadding: false,
  },
  date: {
    ...THEME.typography.caption,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.xs / 2,
    includeFontPadding: false,
  },
  transactionId: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    includeFontPadding: false,
  },
  amount: {
    ...THEME.typography.h3,
    color: THEME.colors.primary,
    includeFontPadding: false,
  },
});
