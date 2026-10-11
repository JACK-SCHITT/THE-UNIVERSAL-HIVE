// Mod Suggestions Tab
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../../constants/theme';
import { TerminalText } from '../../components/ui/TerminalText';
import { ModCard } from '../../components/feature/ModCard';
import { modSuggester } from '../../services/modSuggester';
import { ModSuggestion } from '../../types';

// Mock board analysis for V1.0
const mockBoardAnalysis = {
  id: 'demo',
  timestamp: Date.now(),
  imageUri: '',
  components: [
    { id: 'c1', name: 'ATmega328P', category: 'ic' as const, confidence: 0.9 },
  ],
  capabilities: [],
};

export default function ModsScreen() {
  const [mods, setMods] = useState<ModSuggestion[]>([]);
  const [riskFilter, setRiskFilter] = useState<'low' | 'medium' | 'high' | 'extreme'>('extreme');

  useEffect(() => {
    // Generate mods based on mock board
    const allMods = modSuggester.generateMods(mockBoardAnalysis);
    setMods(allMods);
  }, []);

  const filteredMods = modSuggester.filterByRisk(mods, riskFilter);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TerminalText variant="bright" mono style={styles.title}>
            ╔═══════════════════╗
          </TerminalText>
          <TerminalText variant="bright" mono style={styles.title}>
            ║ MOD SUGGESTER    ║
          </TerminalText>
          <TerminalText variant="bright" mono style={styles.title}>
            ╚═══════════════════╝
          </TerminalText>
          <TerminalText variant="dim" style={styles.subtitle}>
            FULL CHAOS MODE ENABLED
          </TerminalText>
        </View>

        {/* Risk Filter */}
        <View style={styles.filterSection}>
          <TerminalText variant="dim" mono style={styles.filterLabel}>
            MAX RISK LEVEL:
          </TerminalText>
          <View style={styles.filterButtons}>
            {(['low', 'medium', 'high', 'extreme'] as const).map(level => (
              <Pressable
                key={level}
                onPress={() => setRiskFilter(level)}
                style={[
                  styles.filterButton,
                  riskFilter === level && styles.filterButtonActive,
                ]}
              >
                <TerminalText
                  mono
                  variant={riskFilter === level ? 'bright' : 'dim'}
                  style={styles.filterButtonText}
                >
                  {level.toUpperCase()}
                </TerminalText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Mod Cards */}
        <TerminalText variant="dim" mono style={styles.resultsLabel}>
          SHOWING {filteredMods.length} MOD{filteredMods.length !== 1 ? 'S' : ''}:
        </TerminalText>
        
        {filteredMods.map(mod => (
          <ModCard key={mod.id} mod={mod} />
        ))}

        {filteredMods.length === 0 && (
          <View style={styles.noResults}>
            <TerminalText variant="dim" style={styles.noResultsText}>
              No mods match current risk filter.{'\n'}
              Increase risk level to see more options.
            </TerminalText>
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <TerminalText variant="error" mono style={styles.disclaimerTitle}>
            ⚠ FULL CHAOS MODE ⚠
          </TerminalText>
          <TerminalText variant="dim" style={styles.disclaimerText}>
            Mods rated HIGH or EXTREME can brick devices, cause fires, or shock you. You asked for no safety nets—these suggestions assume you know what you're doing. Test with multimeter, discharge caps, use protection. No hand-holding.
          </TerminalText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
  },
  subtitle: {
    marginTop: theme.spacing.sm,
    fontSize: 12,
  },
  filterSection: {
    marginBottom: theme.spacing.lg,
  },
  filterLabel: {
    fontSize: 12,
    marginBottom: theme.spacing.sm,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  filterButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  filterButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceLight,
  },
  filterButtonText: {
    fontSize: 12,
  },
  resultsLabel: {
    fontSize: 12,
    marginBottom: theme.spacing.md,
  },
  noResults: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  noResultsText: {
    textAlign: 'center',
  },
  disclaimer: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.sm,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.danger,
  },
  disclaimerTitle: {
    fontSize: 14,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 16,
  },
});
