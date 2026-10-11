import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { useRef } from 'react';
import { useAuth } from '@/template';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading } = useAuth();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)');
    }
  }, [user, loading]);

  const handleEnter = () => {
    if (user) {
      router.replace('/(tabs)');
    } else {
      router.push('/login');
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/onboarding_hero.png')}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        transition={300}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)', '#000000']}
        style={StyleSheet.absoluteFillObject}
        locations={[0, 0.35, 0.65, 1]}
      />

      <Animated.View style={[styles.content, { paddingBottom: insets.bottom + 40, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.tagline}>
          <Text style={styles.taglineText}>[ AI APP FOUNDRY ]</Text>
        </View>

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Text style={styles.title}>ASSIMILATE</Text>
          <Text style={styles.titleOr}>OR</Text>
          <Text style={styles.titleDie}>DIE</Text>
        </Animated.View>

        <Text style={styles.subtitle}>
          The most powerful AI tools, apps, and knowledge — forged into one command center. You either evolve or you fall.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
          onPress={handleEnter}
        >
          <LinearGradient
            colors={[Colors.crimson, Colors.bloodRed]}
            style={styles.ctaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.ctaText}>ENTER THE FOUNDRY</Text>
          </LinearGradient>
        </Pressable>

        <Text style={styles.disclaimer}>No mercy. No limits. Pure AI dominance.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.void },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
  },
  tagline: {
    borderWidth: 1,
    borderColor: Colors.crimson,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  taglineText: {
    color: Colors.crimson,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    letterSpacing: 3,
  },
  title: {
    fontSize: Typography.display,
    fontWeight: Typography.black,
    color: Colors.textPrimary,
    letterSpacing: 6,
    lineHeight: Typography.display * 1.1,
  },
  titleOr: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textSecondary,
    letterSpacing: 8,
    marginVertical: 2,
  },
  titleDie: {
    fontSize: Typography.display,
    fontWeight: Typography.black,
    color: Colors.crimson,
    letterSpacing: 10,
    lineHeight: Typography.display * 1.1,
    textShadowColor: Colors.crimson,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    lineHeight: Typography.base * 1.6,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  ctaButton: { borderRadius: 2, overflow: 'hidden', marginBottom: Spacing.md },
  ctaGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#fff',
    fontSize: Typography.md,
    fontWeight: Typography.black,
    letterSpacing: 4,
  },
  disclaimer: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    textAlign: 'center',
    letterSpacing: 1,
  },
});
