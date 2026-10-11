import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

interface PaymentCardProps {
  recipient: string;
  amount: number;
}

const IMPACT_MESSAGES: { [key: number]: string } = {
  5: 'Helps fund scam awareness content',
  10: 'Supports 1 hour of scam investigation',
  25: 'Helps us analyze 5 scam cases',
  50: 'Funds tools to track scammers',
  100: 'Supports a full scam takedown operation',
};

function getImpactMessage(amount: number): string {
  const exactMatch = IMPACT_MESSAGES[amount];
  if (exactMatch) return exactMatch;
  
  if (amount < 5) return 'Every dollar helps fight scams';
  if (amount < 10) return 'Helps fund scam awareness content';
  if (amount < 25) return 'Supports scam investigation work';
  if (amount < 50) return 'Helps us analyze multiple scam cases';
  if (amount < 100) return 'Funds tools to track scammers';
  return 'Major support for scam elimination';
}

export function PaymentCard({ recipient, amount }: PaymentCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialIcons name="security" size={40} color={THEME.colors.primary} />
      </View>
      <Text style={styles.missionTitle}>Fight Online Scammers</Text>
      <Text style={styles.missionText}>
        Your donation helps fund projects to investigate, expose, and eliminate online scams
      </Text>
      <Text style={styles.label}>Donate via Cash App</Text>
      <Text style={styles.recipient}>{recipient}</Text>
      {amount > 0 && (
        <>
          <View style={styles.amountContainer}>
            <Text style={styles.currency}>$</Text>
            <Text style={styles.amount}>{amount.toFixed(2)}</Text>
          </View>
          <View style={styles.impactBadge}>
            <MaterialIcons name="volunteer-activism" size={16} color={THEME.colors.primary} />
            <Text style={styles.impactText}>{getImpactMessage(amount)}</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  missionTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.primary,
    marginBottom: THEME.spacing.sm,
    textAlign: 'center',
    includeFontPadding: false,
  },
  missionText: {
    ...THEME.typography.caption,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.sm,
    includeFontPadding: false,
  },
  label: {
    ...THEME.typography.caption,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.xs,
    includeFontPadding: false,
  },
  recipient: {
    ...THEME.typography.h2,
    color: THEME.colors.primary,
    marginBottom: THEME.spacing.lg,
    includeFontPadding: false,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: THEME.spacing.md,
  },
  currency: {
    ...THEME.typography.h2,
    color: THEME.colors.text,
    marginTop: 8,
    includeFontPadding: false,
  },
  amount: {
    fontSize: 48,
    fontWeight: '700',
    color: THEME.colors.text,
    includeFontPadding: false,
  },
  impactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceLight,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.full,
    marginTop: THEME.spacing.md,
    gap: THEME.spacing.xs,
  },
  impactText: {
    ...THEME.typography.caption,
    color: THEME.colors.text,
    includeFontPadding: false,
  },
});
