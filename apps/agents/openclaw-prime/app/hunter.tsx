/**
 * HunterPrime Screen
 * Sends scan commands and shows live recon results with polling.
 * Uses hunterConnection service for quickScan + subscribeToHunterActivity.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { hunterConnection, HunterResult } from '@/services/hunterConnection';
import { Colors, Spacing, Typography, Radii } from '@/constants/theme';

const QUICK_SCAN_PRESETS = [
  'multi-agent frameworks OR RAG memory systems',
  'zero-knowledge app builders monetization',
  'AI SaaS micro-niches 2025',
  'viral growth hacks for indie founders',
  'emerging React Native libraries',
];

export default function HunterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [activeScanId, setActiveScanId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [history, setHistory] = useState<HunterResult[]>([]);
  const [selectedScan, setSelectedScan] = useState<HunterResult | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Load history on mount
  useEffect(() => {
    hunterConnection.getScanHistory(15).then(h => {
      setHistory(h);
      setLoadingHistory(false);
    });
  }, []);

  // Subscribe to live hunter activity
  useEffect(() => {
    const unsub = hunterConnection.subscribeToHunterActivity(({ new: result }) => {
      setHistory(prev => {
        const exists = prev.find(h => h.id === result.id);
        if (exists) return prev.map(h => h.id === result.id ? result : h);
        return [result, ...prev];
      });

      // If this is our active scan, clear loading
      if (result.id === activeScanId) {
        setScanning(false);
        setActiveScanId(null);
        setSelectedScan(result);
      }
    });
    return unsub;
  }, [activeScanId]);

  const handleScan = useCallback(async () => {
    const q = query.trim();
    if (!q || scanning) return;

    setScanning(true);
    setSelectedScan(null);

    const { scanId, error } = await hunterConnection.quickScan(q);

    if (error || !scanId) {
      console.error('[HunterScreen] Scan error:', error);
      setScanning(false);
      return;
    }

    setActiveScanId(scanId);
    setQuery('');

    // Add placeholder to history immediately
    setHistory(prev => [{
      id: scanId,
      query: q,
      findings: '',
      targets: [],
      status: 'scanning',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, ...prev]);
  }, [query, scanning]);

  const handlePreset = (preset: string) => setQuery(preset);

  const statusColor = (status: HunterResult['status']) => {
    if (status === 'complete') return '#69F0AE';
    if (status === 'error') return '#FF4444';
    return Colors.primary;
  };

  const statusLabel = (status: HunterResult['status']) => {
    if (status === 'complete') return 'COMPLETE';
    if (status === 'error') return 'ERROR';
    return 'SCANNING...';
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.textSecondary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.headerBadge}>
            <MaterialIcons name="radar" size={14} color="#FF4444" />
            <Text style={styles.headerBadgeText}>HUNTERPRIME</Text>
          </View>
          <Text style={styles.headerSub}>// RECON & INTEL UNIT</Text>
        </View>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.body}>
        {/* Scan Input Panel */}
        <View style={styles.scanPanel}>
          <Text style={styles.panelLabel}>{'// SCAN COMMAND'}</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Enter scan target or query..."
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
              onSubmitEditing={handleScan}
              returnKeyType="search"
            />
            <Pressable
              onPress={handleScan}
              disabled={!query.trim() || scanning}
              style={({ pressed }) => [
                styles.scanBtn,
                (!query.trim() || scanning) && styles.scanBtnDisabled,
                pressed && { opacity: 0.8 },
              ]}
            >
              {scanning ? (
                <ActivityIndicator size="small" color="#FF4444" />
              ) : (
                <MaterialIcons name="search" size={22} color="#FF4444" />
              )}
            </Pressable>
          </View>

          {/* Presets */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presets} contentContainerStyle={styles.presetsContent}>
            {QUICK_SCAN_PRESETS.map((p, i) => (
              <Pressable key={i} onPress={() => handlePreset(p)} style={({ pressed }) => [styles.preset, pressed && { opacity: 0.7 }]}>
                <MaterialIcons name="flash-on" size={12} color="#FF4444" />
                <Text style={styles.presetText} numberOfLines={1}>{p}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.columns}>
          {/* Scan History */}
          <View style={styles.historyCol}>
            <Text style={styles.colLabel}>{'// SCAN LOG'}</Text>
            {loadingHistory ? (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: Spacing.md }} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {history.length === 0 ? (
                  <Text style={styles.emptyText}>No scans yet. Fire a command.</Text>
                ) : (
                  history.map(scan => (
                    <Pressable
                      key={scan.id}
                      onPress={() => setSelectedScan(scan)}
                      style={({ pressed }) => [
                        styles.historyItem,
                        selectedScan?.id === scan.id && styles.historyItemActive,
                        pressed && { opacity: 0.75 },
                      ]}
                    >
                      <View style={styles.historyItemTop}>
                        {scan.status === 'scanning' ? (
                          <ActivityIndicator size="small" color="#FF4444" />
                        ) : (
                          <MaterialIcons
                            name={scan.status === 'complete' ? 'check-circle' : 'error'}
                            size={14}
                            color={statusColor(scan.status)}
                          />
                        )}
                        <Text style={[styles.historyStatus, { color: statusColor(scan.status) }]}>
                          {statusLabel(scan.status)}
                        </Text>
                      </View>
                      <Text style={styles.historyQuery} numberOfLines={2}>{scan.query}</Text>
                      {scan.targets.length > 0 && (
                        <Text style={styles.historyTargets}>{scan.targets.length} targets found</Text>
                      )}
                    </Pressable>
                  ))
                )}
              </ScrollView>
            )}
          </View>

          {/* Scan Results */}
          <View style={styles.resultsCol}>
            <Text style={styles.colLabel}>{'// RECON REPORT'}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {!selectedScan ? (
                <View style={styles.emptyResults}>
                  <MaterialIcons name="radar" size={48} color={Colors.border} />
                  <Text style={styles.emptyResultsText}>
                    {'SELECT A SCAN\nTO VIEW INTEL'}
                  </Text>
                </View>
              ) : selectedScan.status === 'scanning' ? (
                <View style={styles.emptyResults}>
                  <ActivityIndicator size="large" color="#FF4444" />
                  <Text style={[styles.emptyResultsText, { color: '#FF4444', marginTop: Spacing.md }]}>
                    {'HUNTING...\nSTAND BY'}
                  </Text>
                </View>
              ) : (
                <View style={styles.reportContainer}>
                  <Text style={styles.reportQuery}>TARGET: {selectedScan.query}</Text>

                  {selectedScan.targets.length > 0 && (
                    <View style={styles.targetsContainer}>
                      <Text style={styles.targetsLabel}>ACQUIRED TARGETS</Text>
                      {selectedScan.targets.map((t, i) => (
                        <View key={i} style={styles.targetItem}>
                          <Text style={styles.targetIndex}>{String(i + 1).padStart(2, '0')}</Text>
                          <Text style={styles.targetText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <Text style={styles.reportFindings}>
                    {/* Strip TARGETS_JSON line from display */}
                    {selectedScan.findings.replace(/TARGETS_JSON:\s*\[.*?\]/s, '').trim()}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#FF444430',
    backgroundColor: '#FF44440A',
  },
  backBtn: { width: 30, alignItems: 'flex-start' },
  headerCenter: { alignItems: 'center', gap: 2 },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FF444420',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: '#FF444440',
  },
  headerBadgeText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: '#FF4444', letterSpacing: 2 },
  headerSub: { fontSize: Typography.xs, color: Colors.textMuted, fontFamily: 'SpaceMono' },

  body: { flex: 1 },

  scanPanel: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  panelLabel: { fontSize: Typography.xs, color: Colors.textMuted, fontFamily: 'SpaceMono' },
  inputRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#FF444440',
    paddingHorizontal: Spacing.md,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  scanBtn: {
    width: 48,
    height: 48,
    borderRadius: Radii.md,
    backgroundColor: '#FF444420',
    borderWidth: 1,
    borderColor: '#FF444440',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBtnDisabled: { opacity: 0.4 },

  presets: { marginTop: -Spacing.xs },
  presetsContent: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: 2 },
  preset: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    backgroundColor: '#FF44441A',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: '#FF444430',
    maxWidth: 200,
  },
  presetText: { fontSize: 11, color: '#FF4444', fontFamily: 'SpaceMono' },

  columns: { flex: 1, flexDirection: 'row' },

  historyCol: {
    width: 160,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    padding: Spacing.sm,
  },
  colLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: 'SpaceMono',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  emptyText: { fontSize: Typography.xs, color: Colors.textMuted, fontStyle: 'italic', lineHeight: 18 },

  historyItem: {
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    gap: 4,
  },
  historyItemActive: { borderColor: '#FF444460', backgroundColor: '#FF44440D' },
  historyItemTop: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  historyStatus: { fontSize: 10, fontWeight: Typography.bold, fontFamily: 'SpaceMono' },
  historyQuery: { fontSize: 11, color: Colors.textSecondary, lineHeight: 15 },
  historyTargets: { fontSize: 10, color: '#FF4444' },

  resultsCol: { flex: 1, padding: Spacing.md },

  emptyResults: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: Spacing.md },
  emptyResultsText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 1,
  },

  reportContainer: { gap: Spacing.md },
  reportQuery: {
    fontSize: Typography.xs,
    color: '#FF4444',
    fontFamily: 'SpaceMono',
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: '#FF444430',
    paddingBottom: Spacing.sm,
  },

  targetsContainer: {
    backgroundColor: '#FF44440D',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#FF444430',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  targetsLabel: { fontSize: 10, fontWeight: Typography.bold, color: '#FF4444', fontFamily: 'SpaceMono', letterSpacing: 1 },
  targetItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  targetIndex: { fontSize: Typography.xs, color: '#FF444480', fontFamily: 'SpaceMono', width: 20 },
  targetText: { flex: 1, fontSize: Typography.sm, color: Colors.textPrimary, lineHeight: 18 },

  reportFindings: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
