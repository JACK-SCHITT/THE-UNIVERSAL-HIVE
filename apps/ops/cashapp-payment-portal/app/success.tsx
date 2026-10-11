import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { THEME } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { shareService } from '@/services/shareService';

export default function SuccessScreen() {
  const router = useRouter();
  const { amount, transactionId } = useLocalSearchParams<{ amount: string; transactionId: string }>();
  
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.2, { damping: 3 }),
      withSpring(1, { damping: 8 })
    );
    opacity.value = withTiming(1, { duration: 300 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, animatedStyle]}>
          <MaterialIcons name="check-circle" size={100} color={THEME.colors.success} />
        </Animated.View>

        <Text style={styles.title}>Thank You!</Text>
        <Text style={styles.subtitle}>Your donation helps fight online scammers and protect vulnerable people</Text>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>${parseFloat(amount || '0').toFixed(2)}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fund</Text>
            <Text style={styles.detailValue}>Scam Fighter Fund</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cash App</Text>
            <Text style={styles.detailValue}>$JACKSCHITT1134</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={[styles.detailValue, styles.transactionId]} numberOfLines={1}>
              {transactionId}
            </Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            title="Share Donation"
            onPress={() => shareService.shareDonation(parseFloat(amount || '0'))}
            style={styles.button}
          />
          <Button
            title="Done"
            onPress={() => router.back()}
            variant="outline"
            style={styles.button}
          />
          <Button
            title="View Donations"
            onPress={() => {
              router.back();
              router.push('/history');
            }}
            variant="outline"
            style={styles.button}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  content: {
    flex: 1,
    padding: THEME.spacing.md,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: THEME.spacing.xl,
  },
  title: {
    ...THEME.typography.h1,
    color: THEME.colors.text,
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
    includeFontPadding: false,
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.xl,
    includeFontPadding: false,
  },
  detailsCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm,
  },
  detailLabel: {
    ...THEME.typography.body,
    color: THEME.colors.textSecondary,
    includeFontPadding: false,
  },
  detailValue: {
    ...THEME.typography.body,
    color: THEME.colors.text,
    fontWeight: '600',
    includeFontPadding: false,
  },
  transactionId: {
    fontSize: 12,
    maxWidth: '60%',
  },
  separator: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: THEME.spacing.xs,
  },
  footer: {
    marginTop: THEME.spacing.xl,
    gap: THEME.spacing.md,
  },
  button: {
    width: '100%',
  },
});
