import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Image } from 'expo-image';
import { borderRadius } from '@/constants/theme';

interface AnimatedAvatarProps {
  uri: string;
  size?: number;
  accentColor: string;
  isActive?: boolean;   // speaking / streaming
  style?: object;
}

export function AnimatedAvatar({
  uri,
  size = 44,
  accentColor,
  isActive = false,
  style,
}: AnimatedAvatarProps) {
  // Breathing scale (always on, subtle)
  const breathe = useRef(new Animated.Value(1)).current;
  // Glow opacity (pulses when active)
  const glowOpacity = useRef(new Animated.Value(0.35)).current;
  // Ring scale (ring around avatar)
  const ringScale = useRef(new Animated.Value(1)).current;

  // Continuous breathing animation
  useEffect(() => {
    const breathingLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1.04,
          duration: 2400,
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 1,
          duration: 2400,
          useNativeDriver: true,
        }),
      ])
    );
    breathingLoop.start();
    return () => breathingLoop.stop();
  }, []);

  // Active glow pulse when AI is speaking/streaming
  useEffect(() => {
    if (isActive) {
      const glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, { toValue: 0.9, duration: 500, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.35, duration: 500, useNativeDriver: true }),
        ])
      );
      const ringLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(ringScale, { toValue: 1.12, duration: 700, useNativeDriver: true }),
          Animated.timing(ringScale, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      glowLoop.start();
      ringLoop.start();
      return () => {
        glowLoop.stop();
        ringLoop.stop();
      };
    } else {
      Animated.timing(glowOpacity, { toValue: 0.35, duration: 400, useNativeDriver: true }).start();
      Animated.timing(ringScale, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [isActive]);

  const borderRadius_ = size / 2;

  return (
    <View style={[{ width: size, height: size }, style]}>
      {/* Outer glow shadow layer */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            width: size + 16,
            height: size + 16,
            borderRadius: (size + 16) / 2,
            top: -8,
            left: -8,
            backgroundColor: accentColor,
            opacity: glowOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />
      {/* Secondary softer glow */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            width: size + 28,
            height: size + 28,
            borderRadius: (size + 28) / 2,
            top: -14,
            left: -14,
            backgroundColor: accentColor,
            opacity: Animated.multiply(glowOpacity, 0.25),
            transform: [{ scale: ringScale }],
          },
        ]}
      />
      {/* Avatar image with breathing */}
      <Animated.View
        style={{
          transform: [{ scale: breathe }],
          borderRadius: borderRadius_,
          overflow: 'hidden',
          width: size,
          height: size,
        }}
      >
        <Image
          source={{ uri }}
          style={{
            width: size,
            height: size,
            borderRadius: borderRadius_,
            borderWidth: 2,
            borderColor: accentColor,
          }}
          contentFit="cover"
          transition={200}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  glowRing: {
    position: 'absolute',
    // blur simulation via multiple transparent layers
  },
});
