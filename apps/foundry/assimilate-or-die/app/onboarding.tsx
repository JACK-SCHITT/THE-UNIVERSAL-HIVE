import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    image: require('@/assets/images/onboarding_hero.png'),
    tag: 'OPENCLAW PRIME',
    headline: 'ASSIMILATE\nOR DIE',
    body: 'The autonomous AI foundry that builds, launches, and profits — so you never stagnate.',
  },
  {
    image: require('@/assets/onboarding2.png'),
    tag: 'MULTI-AGENT SYSTEM',
    headline: 'SIX AGENTS.\nONE MISSION.',
    body: 'Architect. Developer. DevOps. Marketer. Legal. Billing. All wired to build your app.',
  },
  {
    image: require('@/assets/onboarding3.png'),
    tag: 'ZERO KNOWLEDGE REQUIRED',
    headline: 'YOUR IDEA\nLAUNCHED.',
    body: 'You bring the vision. OpenClaw handles everything else. Revenue share. Buyout. Done.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      router.replace('/login');
    }
  };

  const handleSkip = () => router.replace('/login');

  return (
    <View style={styles.root}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Image
              source={item.image}
              style={styles.bgImage}
              contentFit="cover"
              transition={400}
            />
            {/* Gradient overlay */}
            <View style={styles.overlay} />

            {/* Content */}
            <View style={[styles.content, { paddingBottom: insets.bottom + 160 }]}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.tag}</Text>
              </View>
              <Text style={styles.headline}>{item.headline}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>
          </View>
        )}
      />

      {/* Bottom Controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + Spacing.xl }]}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* CTA */}
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          <Text style={styles.ctaText}>
            {activeIndex === SLIDES.length - 1 ? 'ASSIMILATE →' : 'CONTINUE →'}
          </Text>
        </Pressable>

        {/* Skip */}
        {activeIndex < SLIDES.length - 1 ? (
          <Pressable onPress={handleSkip}>
            <Text style={styles.skip}>SKIP</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.void,
  },
  slide: {
    width,
    height,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  tag: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.crimson,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    color: Colors.crimson,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  headline: {
    color: Colors.textPrimary,
    fontSize: 40,
    fontWeight: Typography.black,
    letterSpacing: -1,
    lineHeight: 44,
  },
  body: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    lineHeight: 24,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    height: 3,
    borderRadius: 2,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.crimson,
  },
  dotInactive: {
    width: 8,
    backgroundColor: Colors.textMuted,
  },
  cta: {
    width: '100%',
    backgroundColor: Colors.crimson,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  ctaText: {
    color: '#fff',
    fontSize: Typography.base,
    fontWeight: Typography.black,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  skip: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
});
