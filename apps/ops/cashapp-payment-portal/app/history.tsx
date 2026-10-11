import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { usePayment } from '@/hooks/usePayment';
import { HistoryItem } from '@/components/feature/HistoryItem';
import { Button } from '@/components/ui/Button';
import { useAlert } from '@/template';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { history, clearHistory } = usePayment();

  const handleClearHistory = () => {
    showAlert('Clear History?', 'This will remove all donation records. This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => clearHistory(),
      },
    ]);
  };

  const totalPaid = history.reduce((sum, item) => sum + item.amount, 0);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="volunteer-activism" size={80} color={THEME.colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Donation History</Text>
          <Text style={styles.emptyText}>Your contributions to fight scammers will appear here</Text>
        </View>
      ) : (
        <>
          <View style={styles.summaryCard}>
            <MaterialIcons name="favorite" size={32} color={THEME.colors.primary} style={{ marginBottom: THEME.spacing.sm }} />
            <Text style={styles.summaryLabel}>Total Donated</Text>
            <Text style={styles.summaryAmount}>${totalPaid.toFixed(2)}</Text>
            <Text style={styles.summaryCount}>{history.length} {history.length === 1 ? 'donation' : 'donations'}</Text>
            <Text style={styles.impactMessage}>Fighting scams together!</Text>
          </View>

          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <HistoryItem
                amount={item.amount}
                timestamp={item.timestamp}
                recipient={item.recipient}
                transactionId={item.id}
              />
            )}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 80 },
            ]}
            showsVerticalScrollIndicator={false}
          />

          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <Button
              title="Clear History"
              onPress={handleClearHistory}
              variant="outline"
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  summaryCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    margin: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
  },
  summaryLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.xs,
    includeFontPadding: false,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: THEME.colors.primary,
    marginBottom: THEME.spacing.xs,
    includeFontPadding: false,
  },
  summaryCount: {
    ...THEME.typography.caption,
    color: THEME.colors.textSecondary,
    includeFontPadding: false,
  },
  impactMessage: {
    ...THEME.typography.caption,
    color: THEME.colors.primary,
    marginTop: THEME.spacing.sm,
    fontWeight: '600',
    includeFontPadding: false,
  },
  listContent: {
    padding: THEME.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.xl,
  },
  emptyTitle: {
    ...THEME.typography.h2,
    color: THEME.colors.text,
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.sm,
    includeFontPadding: false,
  },
  emptyText: {
    ...THEME.typography.body,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    includeFontPadding: false,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.background,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
});
