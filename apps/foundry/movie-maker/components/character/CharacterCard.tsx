/**
 * Character Card Component
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Character } from '../../types';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import Card from '../ui/Card';

interface CharacterCardProps {
  character: Character;
  onPress: () => void;
}

export default function CharacterCard({ character, onPress }: CharacterCardProps) {
  return (
    <Card onPress={onPress} elevated style={styles.card}>
      <View style={styles.imageContainer}>
        <Image
          source={character.imageUrl ? { uri: character.imageUrl } : require('../../assets/images/character-placeholder.png')}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {character.name}
        </Text>
        <Text style={styles.role} numberOfLines={1}>
          {character.role}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {character.description}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.surfaceElevated,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: Spacing.md,
  },
  name: {
    ...Typography.headline,
    fontSize: 18,
    marginBottom: 4,
  },
  role: {
    ...Typography.caption,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
