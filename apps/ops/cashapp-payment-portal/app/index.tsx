import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { usePayment } from '@/hooks/usePayment';
import { PaymentCard } from '@/components/feature/PaymentCard';
import { AmountButton } from '@/components/ui/AmountButton';
import { Button } from '@/components/ui/Button';
import { useAlert } from '@/template';

const PRESET_AMOUNTS = [5, 10, 25, 50, 100];
const RECIPIENT = '$JACKSCHITT1134';

const MISSION_STATS = [
  { icon: 'shield', label: 'Scams Investigated', value: '500+' },
  { icon: 'people', label: 'People Protected', value: '10K+' },
  { icon: 'gavel', label: 'Takedowns', value: '50+' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { amount, setAmount, isProcessing, history, processDonation } = usePayment();
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  const handlePresetSelect = (preset: number) => {
    setSelectedPreset(preset);
    setAmount(preset.toString());
  };

  const handleCustomAmount = (text: string) => {
    // Only allow numbers and decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    
    setAmount(cleaned);
    setSelectedPreset(null);
  };

  const handleDonate = async () => {
    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      showAlert('Invalid Amount', 'Please enter a valid donation amount.');
      return;
    }

    if (numAmount > 10000) {
      showAlert('Amount Too Large', 'Maximum donation amount is $10,000.');
      return;
    }

    try {
      const result = await processDonation(numAmount);
      if (result.success) {
        router.push({
          pathname: '/success',
          params: { amount: numAmount.toString(), transactionId: result.transactionId || '' },
        });
        setAmount('');
        setSelectedPreset(null);
      }
    } catch (error) {
      showAlert('Donation Failed', 'Unable to process donation. Please try again.');
    }
  };

  const currentAmount = parseFloat(amount) || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Scam Fighter Fund</Text>
            <Text style={styles.subtitle}>Help eliminate online scammers</Text>
          </View>
          <View style={styles.headerIcons}>
            <Pressable onPress={() => router.push('/subscribe')} style={styles.iconButton}>
              <MaterialIcons name="auto-awesome" size={24} color={THEME.colors.primary} />
            </Pressable>
            <Pressable onPress={() => router.push('/reports')} style={styles.iconButton}>
              <MaterialIcons name="assessment" size={24} color={THEME.colors.text} />
            </Pressable>
            <Pressable onPress={() => router.push('/leaderboard')} style={styles.iconButton}>
              <MaterialIcons name="emoji-events" size={24} color={THEME.colors.text} />
            </Pressable>
            <Pressable onPress={() => router.push('/history')} style={styles.iconButton}>
              <MaterialIcons name="history" size={24} color={THEME.colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Mission Stats */}
        <View style={styles.statsContainer}>
          {MISSION_STATS.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <MaterialIcons name={stat.icon as any} size={24} color={THEME.colors.primary} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Donation Card */}
        <PaymentCard recipient={RECIPIENT} amount={currentAmount} />

        {/* Preset Amounts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Select</Text>
          <View style={styles.presetRow}>
            {PRESET_AMOUNTS.slice(0, 3).map((preset) => (
              <AmountButton
                key={preset}
                amount={preset}
                selected={selectedPreset === preset}
                onPress={() => handlePresetSelect(preset)}
              />
            ))}
          </View>
          <View style={styles.presetRow}>
            {PRESET_AMOUNTS.slice(3).map((preset) => (
              <AmountButton
                key={preset}
                amount={preset}
                selected={selectedPreset === preset}
                onPress={() => handlePresetSelect(preset)}
              />
            ))}
          </View>
        </View>

        {/* Custom Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Amount</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={handleCustomAmount}
              placeholder="0.00"
              placeholderTextColor={THEME.colors.textSecondary}
              keyboardType="decimal-pad"
              maxLength={10}
            />
          </View>
        </View>

        {/* History Preview */}
        {history.length > 0 && (
          <View style={styles.section}>
            <View style={styles.historyHeader}>
              <Text style={styles.sectionTitle}>Recent Donations</Text>
              <Pressable onPress={() => router.push('/history')}>
                <Text style={styles.viewAll}>View All</Text>
              </Pressable>
            </View>
            <View style={styles.historyPreview}>
              <MaterialIcons name="favorite" size={20} color={THEME.colors.primary} />
              <View style={styles.historyInfo}>
                <Text style={styles.historyRecipient}>Scam Fighter Fund</Text>
                <Text style={styles.historyDate}>
                  {new Date(history[0].timestamp).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.historyAmount}>${history[0].amount.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* Donate Button */}
        <Button
          title={isProcessing ? 'Processing...' : `Donate $${currentAmount.toFixed(2)}`}
          onPress={handleDonate}
          disabled={!amount || currentAmount <= 0 || isProcessing}
          loading={isProcessing}
          style={styles.donateButton}
        />
        
        <Text style={styles.disclaimer}>
          100% of donations support scam investigation and prevention projects
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: THEME.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  title: {
    ...THEME.typography.h1,
    color: THEME.colors.text,
    includeFontPadding: false,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
  },
  iconButton: {
    padding: THEME.spacing.xs,
  },
  subtitle: {
    ...THEME.typography.caption,
    color: THEME.colors.textSecondary,
    marginTop: THEME.spacing.xs / 2,
    includeFontPadding: false,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  statValue: {
    ...THEME.typography.h3,
    color: THEME.colors.text,
    marginTop: THEME.spacing.xs,
    includeFontPadding: false,
  },
  statLabel: {
    fontSize: 10,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: THEME.spacing.xs / 2,
    includeFontPadding: false,
  },
  section: {
    marginTop: THEME.spacing.lg,
  },
  sectionTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text,
    marginBottom: THEME.spacing.md,
    includeFontPadding: false,
  },
  presetRow: {
    flexDirection: 'row',
    marginHorizontal: -THEME.spacing.xs,
    marginBottom: THEME.spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 2,
    borderColor: THEME.colors.border,
    paddingHorizontal: THEME.spacing.md,
    height: 70,
  },
  currencySymbol: {
    ...THEME.typography.h1,
    color: THEME.colors.text,
    marginRight: THEME.spacing.sm,
    includeFontPadding: false,
  },
  input: {
    flex: 1,
    ...THEME.typography.h1,
    color: THEME.colors.text,
    includeFontPadding: false,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  viewAll: {
    ...THEME.typography.caption,
    color: THEME.colors.primary,
    fontWeight: '600',
    includeFontPadding: false,
  },
  historyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  historyInfo: {
    flex: 1,
    marginLeft: THEME.spacing.md,
  },
  historyRecipient: {
    ...THEME.typography.body,
    color: THEME.colors.text,
    fontWeight: '600',
    marginBottom: THEME.spacing.xs / 2,
    includeFontPadding: false,
  },
  historyDate: {
    ...THEME.typography.caption,
    color: THEME.colors.textSecondary,
    includeFontPadding: false,
  },
  historyAmount: {
    ...THEME.typography.body,
    color: THEME.colors.primary,
    fontWeight: '600',
    includeFontPadding: false,
  },
  donateButton: {
    marginTop: THEME.spacing.xl,
  },
  disclaimer: {
    ...THEME.typography.caption,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: THEME.spacing.md,
    lineHeight: 18,
    includeFontPadding: false,
  },
});
