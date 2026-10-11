// Mod suggestion card with risk indicator
import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../constants/theme';
import { ModSuggestion } from '../../types';
import { TerminalText } from '../ui/TerminalText';

interface ModCardProps {
  mod: ModSuggestion;
}

export function ModCard({ mod }: ModCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getRiskColor = () => {
    switch (mod.riskLevel) {
      case 'low': return theme.colors.success;
      case 'medium': return theme.colors.warning;
      case 'high': return theme.colors.danger;
      case 'extreme': return '#ff00ff'; // Magenta for chaos
      default: return theme.colors.text;
    }
  };

  return (
    <Pressable onPress={() => setExpanded(!expanded)} style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.riskBadge, { backgroundColor: getRiskColor() }]}>
          <TerminalText mono style={styles.riskText}>
            {mod.riskLevel.toUpperCase()}
          </TerminalText>
        </View>
        <TerminalText variant="bright" style={styles.title}>
          {mod.title}
        </TerminalText>
      </View>

      <TerminalText style={styles.description}>{mod.description}</TerminalText>

      {expanded && (
        <View style={styles.details}>
          <TerminalText variant="dim" style={styles.sectionTitle}>COMPONENTS:</TerminalText>
          {mod.components.map((comp, i) => (
            <TerminalText key={i} mono style={styles.listItem}>
              • {comp}
            </TerminalText>
          ))}

          <TerminalText variant="dim" style={styles.sectionTitle}>STEPS:</TerminalText>
          {mod.steps.map((step, i) => (
            <TerminalText key={i} style={styles.listItem}>
              {i + 1}. {step}
            </TerminalText>
          ))}

          <TerminalText variant="dim" style={styles.sectionTitle}>CAPABILITIES:</TerminalText>
          {mod.capabilities.map((cap, i) => (
            <TerminalText key={i} variant="success" style={styles.listItem}>
              ✓ {cap}
            </TerminalText>
          ))}

          {mod.warnings && mod.warnings.length > 0 && (
            <>
              <TerminalText variant="error" style={styles.sectionTitle}>WARNINGS:</TerminalText>
              {mod.warnings.map((warn, i) => (
                <TerminalText key={i} variant="error" style={styles.listItem}>
                  ⚠ {warn}
                </TerminalText>
              ))}
            </>
          )}
        </View>
      )}

      <TerminalText variant="dim" style={styles.tapHint}>
        {expanded ? '[TAP TO COLLAPSE]' : '[TAP FOR DETAILS]'}
      </TerminalText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  riskBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
  },
  riskText: {
    fontSize: 10,
    color: theme.colors.background,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  description: {
    marginBottom: theme.spacing.sm,
  },
  details: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 12,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  listItem: {
    fontSize: 13,
    marginBottom: theme.spacing.xs,
    paddingLeft: theme.spacing.sm,
  },
  tapHint: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
});
