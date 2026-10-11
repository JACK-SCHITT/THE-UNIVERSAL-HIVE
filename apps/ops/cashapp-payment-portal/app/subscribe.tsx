import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { useSubscription } from '@/hooks/useSubscription';
import { SUBSCRIPTION_TIERS } from '@/services/subscriptionService';
import { Button } from '@/components/ui/Button';
import { useAlert } from '@/template';

function TierCard({ 
  tier, 
  name, 
  amount, 
  benefits, 
  isActive,
  onSelect 
}: { 
  tier: string;
  name: string; 
  amount: number; 
  benefits: string[];
  isActive: boolean;
  onSelect: () => void;
}) {
  const tierColors: Record<string, string> = {
    supporter: '#00D632',
    defender: '#FFA726',
    guardian: '#FFD700',
  };

  return (
    <Pressable 
      style={[styles.tierCard, isActive && styles.tierCardActive]} 
      onPress={onSelect}
    >
      <View style={styles.tierHeader}>
        <Text style={styles.tierName}>{name}</Text>
        <View style={styles.amountContainer}>
          <Text style={styles.tierAmount}>${amount}</Text>
          <Text style={styles.perMonth}>/month</Text>
        </View>
      </View>
      
      <View style={styles.benefitsContainer}>
        {benefits.map((benefit, index) => (
          <View key={index} style={styles.benefitItem}>
            <MaterialIcons name="check-circle" size={18} color={tierColors[tier]} />
            <Text style={styles.benefitText}>{benefit}</Text>
          </View>
        ))}
      </View>
      
      {isActive && (
        <View style={styles.activeBadge}>
          <MaterialIcons name="star" size={16} color="#FFD700" />
          <Text style={styles.activeText}>Current Plan</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function SubscribeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { subscription, loading, subscribe, cancel, hasActive } = useSubscription();

  const handleSubscribe = async (tier: keyof typeof SUBSCRIPTION_TIERS) => {
    const success = await subscribe(tier);
    if (success) {
      showAlert(
        'Subscription Active!',
        `You are now a ${SUBSCRIPTION_TIERS[tier].name}. Thank you for your ongoing support!`,
        [{ text: 'Done', onPress: () => router.back() }]
      );
    } else {
      showAlert('Subscription Failed', 'Unable to process subscription. Please try again.');
    }
  };

  const handleCancel = () => {
    showAlert(
      'Cancel Subscription?',
      'You will lose access to exclusive benefits. Are you sure?',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            cancel();
            showAlert('Subscription Cancelled', 'Your subscription has been cancelled.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <MaterialIcons name="auto-awesome" size={48} color={THEME.colors.primary} />
          <Text style={styles.title}>Recurring Donations</Text>
          <Text style={styles.subtitle}>
            Become a monthly supporter and receive exclusive updates on our scam-fighting impact
          </Text>
        </View>

        {subscription && subscription.status === 'active' && (
          <View style={styles.currentPlanCard}>
            <View style={styles.planHeader}>
              <MaterialIcons name="check-circle" size={32} color={THEME.colors.success} />
              <View style={styles.planInfo}>
                <Text style={styles.planTitle}>Active Subscription</Text>
                <Text style={styles.planDetails}>
                  ${subscription.amount}/month · Total donated: ${subscription.totalPaid}
                </Text>
              </View>
            </View>
            <Text style={styles.nextBilling}>
              Next billing: {new Date(subscription.nextBillingDate).toLocaleDateString()}
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Choose Your Tier</Text>

        {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => (
          <TierCard
            key={key}
            tier={key}
            name={tier.name}
            amount={tier.amount}
            benefits={tier.benefits}
            isActive={subscription?.tier === key && subscription.status === 'active'}
            onSelect={() => handleSubscribe(key as keyof typeof SUBSCRIPTION_TIERS)}
          />
        ))}

        <View style={styles.impactSection}>
          <MaterialIcons name="trending-up" size={24} color={THEME.colors.primary} />
          <Text style={styles.impactTitle}>Your Monthly Impact</Text>
          <Text style={styles.impactText}>
            Recurring donations provide stable funding for ongoing scam investigations, allowing us to plan and execute long-term takedown operations.
          </Text>
        </View>

        {hasActive && (
          <Button
            title="Cancel Subscription"
            onPress={handleCancel}
            variant="outline"
            style={styles.cancelButton}
          />
        )}
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
    alignItems: 'center',
    marginBottom: THEME.spacing.xl,
  },
  title: {
    ...THEME.typography.h1,
    color: THEME.colors.text,
    marginTop: THEME.spacing.md,
    includeFontPadding: false,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: THEME.spacing.sm,
    lineHeight: 22,
    includeFontPadding: false,
  },
  currentPlanCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    borderWidth: 2,
    borderColor: THEME.colors.success,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  planInfo: {
    flex: 1,
    marginLeft: THEME.spacing.md,
  },
  planTitle: {
    ...THEME.typography.body,
    color: THEME.colors.text,
    fontWeight: '600',
    includeFontPadding: false,
  },
  planDetails: {
    ...THEME.typography.caption,
    color: THEME.colors.textSecondary,
    marginTop: THEME.spacing.xs / 2,
    includeFontPadding: false,
  },
  nextBilling: {
    ...THEME.typography.caption,
    color: THEME.colors.textSecondary,
    includeFontPadding: false,
  },
  sectionTitle: {
    ...THEME.typography.h3,
    color: THEME.colors.text,
    marginBottom: THEME.spacing.md,
    includeFontPadding: false,
  },
  tierCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    borderWidth: 2,
    borderColor: THEME.colors.border,
  },
  tierCardActive: {
    borderColor: THEME.colors.primary,
  },
  tierHeader: {
    marginBottom: THEME.spacing.md,
  },
  tierName: {
    ...THEME.typography.h2,
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
    includeFontPadding: false,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tierAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: THEME.colors.primary,
    includeFontPadding: false,
  },
  perMonth: {
    ...THEME.typography.caption,
    color: THEME.colors.textSecondary,
    marginLeft: THEME.spacing.xs,
    includeFontPadding: false,
  },
  benefitsContainer: {
    gap: THEME.spacing.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  benefitText: {
    ...THEME.typography.body,
    color: THEME.colors.text,
    flex: 1,
    includeFontPadding: false,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  activeText: {
    ...THEME.typography.caption,
    color: '#FFD700',
    fontWeight: '600',
    includeFontPadding: false,
  },
  impactSection: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginTop: THEME.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  impactTitle: {
    ...THEME.typography.body,
    color: THEME.colors.text,
    fontWeight: '600',
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
    includeFontPadding: false,
  },
  impactText: {
    ...THEME.typography.caption,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    includeFontPadding: false,
  },
  cancelButton: {
    marginTop: THEME.spacing.xl,
  },
});
