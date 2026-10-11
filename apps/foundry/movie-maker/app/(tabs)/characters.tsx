/**
 * Characters Screen - Character Studio
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { Character } from '../../types';
import { storageService } from '../../services/storageService';
import CharacterCard from '../../components/character/CharacterCard';
import EmptyState from '../../components/ui/EmptyState';

export default function CharactersScreen() {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadCharacters();
    }, [])
  );

  const loadCharacters = async () => {
    setLoading(true);
    const data = await storageService.getCharacters();
    setCharacters(data);
    setLoading(false);
  };

  const handleCreateCharacter = () => {
    router.push('/create-character');
  };

  const handleCharacterPress = (character: Character) => {
    router.push(`/character/${character.id}`);
  };

  if (!loading && characters.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Character Studio</Text>
        </View>
        
        <EmptyState
          image={require('../../assets/images/character-placeholder.png')}
          title="No Characters Yet"
          description="Create memorable characters with detailed personalities and appearances for your movies"
          actionLabel="Create First Character"
          onAction={handleCreateCharacter}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Character Studio</Text>
        <Pressable style={styles.createButton} onPress={handleCreateCharacter}>
          <MaterialIcons name="add-circle" size={32} color={Colors.primary} />
        </Pressable>
      </View>

      <FlatList
        data={characters}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CharacterCard
            character={item}
            onPress={() => handleCharacterPress(item)}
          />
        )}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...Typography.title,
  },
  createButton: {
    padding: Spacing.xs,
  },
  list: {
    padding: Spacing.md,
  },
  row: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
});
