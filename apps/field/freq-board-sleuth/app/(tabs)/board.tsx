// Board Scanner Tab
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../../constants/theme';
import { TerminalText } from '../../components/ui/TerminalText';
import { Button } from '../../components/ui/Button';
import { ComponentOverlay } from '../../components/feature/ComponentOverlay';
import { useBoardScanner } from '../../hooks/useBoardScanner';
import { ComponentType } from '../../types';

// Mock image for V1.0 demo
const DEMO_BOARD_URI = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800';

export default function BoardScannerScreen() {
  const { isScanning, analysis, error, scanBoard, clearAnalysis } = useBoardScanner();
  const [selectedComponent, setSelectedComponent] = useState<ComponentType | null>(null);

  const handleCapture = async () => {
    // V1.0: Use demo image
    // Phase 2: Implement expo-camera for real capture
    await scanBoard(DEMO_BOARD_URI);
  };

  const handleComponentPress = (comp: ComponentType) => {
    setSelectedComponent(comp);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TerminalText variant="bright" mono style={styles.title}>
            ╔═════════════════╗
          </TerminalText>
          <TerminalText variant="bright" mono style={styles.title}>
            ║ BOARD SCANNER  ║
          </TerminalText>
          <TerminalText variant="bright" mono style={styles.title}>
            ╚═════════════════╝
          </TerminalText>
          <TerminalText variant="dim" style={styles.subtitle}>
            AI COMPONENT DECODER
          </TerminalText>
        </View>

        {!analysis && (
          <>
            <TerminalText variant="dim" style={styles.instructions}>
              Snap a photo of your board to identify components, decode capabilities, and get mod suggestions.
            </TerminalText>
            
            <Button
              title={isScanning ? 'ANALYZING...' : 'CAPTURE BOARD'}
              onPress={handleCapture}
              disabled={isScanning}
              style={styles.captureButton}
            />
            
            {error && (
              <TerminalText variant="error" style={styles.error}>
                ERROR: {error}
              </TerminalText>
            )}
          </>
        )}

        {analysis && (
          <>
            {/* Component Overlay */}
            <ComponentOverlay
              imageUri={analysis.imageUri}
              components={analysis.components}
              onComponentPress={handleComponentPress}
            />

            {/* Board Info */}
            <View style={styles.boardInfo}>
              <TerminalText variant="dim" mono style={styles.infoLabel}>
                MODEL GUESS:
              </TerminalText>
              <TerminalText variant="bright" style={styles.modelGuess}>
                {analysis.modelGuess || 'Unknown board'}
              </TerminalText>
              
              <TerminalText variant="dim" mono style={[styles.infoLabel, { marginTop: theme.spacing.md }]}>
                COMPONENTS DETECTED: {analysis.components.length}
              </TerminalText>
            </View>

            {/* Capabilities */}
            <View style={styles.capabilities}>
              <TerminalText variant="dim" mono style={styles.infoLabel}>
                CAPABILITIES:
              </TerminalText>
              {analysis.capabilities.map((cap, i) => (
                <TerminalText key={i} variant="success" style={styles.capability}>
                  ✓ {cap}
                </TerminalText>
              ))}
            </View>

            {/* Selected Component Details */}
            {selectedComponent && (
              <View style={styles.componentDetail}>
                <TerminalText variant="warning" mono style={styles.detailTitle}>
                  {selectedComponent.name}
                </TerminalText>
                <TerminalText variant="dim" mono style={styles.detailLabel}>
                  CONFIDENCE: {(selectedComponent.confidence * 100).toFixed(0)}%
                </TerminalText>
                
                {selectedComponent.function && (
                  <>
                    <TerminalText variant="dim" mono style={[styles.detailLabel, { marginTop: theme.spacing.sm }]}>
                      FUNCTION:
                    </TerminalText>
                    <TerminalText style={styles.detailText}>
                      {selectedComponent.function}
                    </TerminalText>
                  </>
                )}

                {selectedComponent.specs && (
                  <>
                    <TerminalText variant="dim" mono style={[styles.detailLabel, { marginTop: theme.spacing.sm }]}>
                      SPECS:
                    </TerminalText>
                    {Object.entries(selectedComponent.specs).map(([key, val]) => (
                      <TerminalText key={key} mono style={styles.specItem}>
                        {key}: {val}
                      </TerminalText>
                    ))}
                  </>
                )}
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                title="VIEW MODS"
                onPress={() => {
                  // Navigate to mods tab (implement navigation)
                  Alert.alert('Mods', 'Switch to Mods tab to see suggestions');
                }}
                variant="secondary"
                style={styles.actionButton}
              />
              <Button
                title="NEW SCAN"
                onPress={clearAnalysis}
                style={styles.actionButton}
              />
            </View>
          </>
        )}

        {/* V1.0 Note */}
        <View style={styles.disclaimer}>
          <TerminalText variant="dim" style={styles.disclaimerText}>
            V1.0: Demo image with mock AI detection
          </TerminalText>
          <TerminalText variant="dim" style={styles.disclaimerText}>
            Phase 2: Live camera + TensorFlow Lite models
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
  instructions: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  captureButton: {
    marginBottom: theme.spacing.md,
  },
  error: {
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  boardInfo: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: theme.spacing.xs,
  },
  modelGuess: {
    fontSize: 16,
  },
  capabilities: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  capability: {
    fontSize: 13,
    marginBottom: theme.spacing.xs,
  },
  componentDetail: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.warning,
  },
  detailTitle: {
    fontSize: 18,
    marginBottom: theme.spacing.sm,
  },
  detailLabel: {
    fontSize: 11,
    marginBottom: theme.spacing.xs,
  },
  detailText: {
    fontSize: 13,
  },
  specItem: {
    fontSize: 12,
    marginBottom: 2,
    paddingLeft: theme.spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  disclaimer: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.secondary,
  },
  disclaimerText: {
    fontSize: 11,
    marginBottom: 4,
  },
});
