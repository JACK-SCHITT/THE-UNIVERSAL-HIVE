// Component Code Decoder Tab
import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { TerminalText } from '../../components/ui/TerminalText';
import { Button } from '../../components/ui/Button';
import {
  componentCodeDecoder,
  ComponentCodeCategory,
  DecodedComponent,
} from '../../services/componentCodeDecoder';

const CATEGORIES: ComponentCodeCategory[] = [
  'auto',
  'resistor_smd',
  'capacitor',
  'ic',
  'voltage_regulator',
  'transistor',
  'diode',
  'inductor',
  'crystal',
  'resistor_thru',
];

// Color band picker colors
const BAND_COLORS = [
  { name: 'black',  display: '#111111', text: '#ffffff' },
  { name: 'brown',  display: '#6D4C41', text: '#ffffff' },
  { name: 'red',    display: '#E53935', text: '#ffffff' },
  { name: 'orange', display: '#FB8C00', text: '#000000' },
  { name: 'yellow', display: '#FDD835', text: '#000000' },
  { name: 'green',  display: '#43A047', text: '#ffffff' },
  { name: 'blue',   display: '#1E88E5', text: '#ffffff' },
  { name: 'violet', display: '#8E24AA', text: '#ffffff' },
  { name: 'grey',   display: '#757575', text: '#ffffff' },
  { name: 'white',  display: '#F5F5F5', text: '#000000' },
  { name: 'gold',   display: '#FFD700', text: '#000000' },
  { name: 'silver', display: '#BDBDBD', text: '#000000' },
  { name: 'none',   display: '#0a0a0a', text: '#888888' },
];

type BandMode = 4 | 5;

export default function CodesScreen() {
  const [activeCategory, setActiveCategory] = useState<ComponentCodeCategory>('auto');
  const [inputCode, setInputCode] = useState('');
  const [result, setResult] = useState<DecodedComponent | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [history, setHistory] = useState<{ code: string; result: DecodedComponent }[]>([]);

  // Color band mode
  const [bandMode, setBandMode] = useState<BandMode>(4);
  const [selectedBands, setSelectedBands] = useState<(string | null)[]>([null, null, null, null]);
  const [activeBandIndex, setActiveBandIndex] = useState<number | null>(null);

  const handleDecode = useCallback(() => {
    if (activeCategory === 'resistor_thru') {
      const validBands = selectedBands.filter(Boolean) as string[];
      if (validBands.length < 3) return;
      const decoded = componentCodeDecoder.decodeColorBands(validBands);
      setResult(decoded);
      setHasSearched(true);
      if (decoded) {
        const bandStr = validBands.join('/');
        setHistory(prev => [{ code: bandStr, result: decoded }, ...prev.slice(0, 9)]);
      }
    } else {
      if (!inputCode.trim()) return;
      const decoded = componentCodeDecoder.decode(inputCode.trim(), activeCategory);
      setResult(decoded);
      setHasSearched(true);
      if (decoded) {
        setHistory(prev => [{ code: inputCode.trim(), result: decoded }, ...prev.slice(0, 9)]);
      }
    }
  }, [inputCode, activeCategory, selectedBands]);

  const handleCategoryChange = (cat: ComponentCodeCategory) => {
    setActiveCategory(cat);
    setResult(null);
    setHasSearched(false);
    setInputCode('');
    setSelectedBands([null, null, null, null]);
    setActiveBandIndex(null);
  };

  const handleBandModeChange = (mode: BandMode) => {
    setBandMode(mode);
    setSelectedBands(new Array(mode).fill(null));
    setActiveBandIndex(null);
    setResult(null);
    setHasSearched(false);
  };

  const selectBandColor = (colorName: string) => {
    if (activeBandIndex === null) return;
    const updated = [...selectedBands];
    updated[activeBandIndex] = colorName;
    setSelectedBands(updated);
    // Auto-advance to next band
    if (activeBandIndex < bandMode - 1) {
      setActiveBandIndex(activeBandIndex + 1);
    } else {
      setActiveBandIndex(null);
    }
  };

  const getRiskColor = (risk?: string) => {
    if (!risk) return theme.colors.primary;
    if (risk.includes('extreme')) return theme.colors.danger;
    if (risk.includes('high')) return '#ff8800';
    if (risk.includes('medium')) return theme.colors.warning;
    return theme.colors.primary;
  };

  const examples = componentCodeDecoder.getExamples(activeCategory);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TerminalText variant="bright" mono style={styles.title}>
            ╔═══════════════════════╗
          </TerminalText>
          <TerminalText variant="bright" mono style={styles.title}>
            ║  COMPONENT DECODER   ║
          </TerminalText>
          <TerminalText variant="bright" mono style={styles.title}>
            ╚═══════════════════════╝
          </TerminalText>
          <TerminalText variant="dim" style={styles.subtitle}>
            PCB MARKINGS ➜ PLAIN ENGLISH
          </TerminalText>
        </View>

        {/* Category Selector */}
        <View style={styles.categorySection}>
          <TerminalText variant="dim" mono style={styles.sectionLabel}>
            COMPONENT TYPE:
          </TerminalText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map(cat => (
              <Pressable
                key={cat}
                onPress={() => handleCategoryChange(cat)}
                style={[
                  styles.categoryChip,
                  activeCategory === cat && styles.categoryChipActive,
                ]}
              >
                <TerminalText
                  mono
                  variant={activeCategory === cat ? 'bright' : 'dim'}
                  style={styles.categoryChipText}
                >
                  {componentCodeDecoder.getCategoryLabel(cat)}
                </TerminalText>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Input Area */}
        {activeCategory === 'resistor_thru' ? (
          <View style={styles.colorBandSection}>
            <View style={styles.bandModeRow}>
              <TerminalText variant="dim" mono style={styles.sectionLabel}>
                BAND COUNT:
              </TerminalText>
              <View style={styles.bandModeButtons}>
                {([4, 5] as BandMode[]).map(mode => (
                  <Pressable
                    key={mode}
                    onPress={() => handleBandModeChange(mode)}
                    style={[styles.bandModeBtn, bandMode === mode && styles.bandModeBtnActive]}
                  >
                    <TerminalText mono variant={bandMode === mode ? 'bright' : 'dim'} style={styles.bandModeBtnText}>
                      {mode}-BAND
                    </TerminalText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Resistor visual */}
            <View style={styles.resistorBody}>
              <View style={styles.resistorLeg} />
              <View style={styles.resistorCylinder}>
                {selectedBands.map((band, i) => {
                  const colorObj = BAND_COLORS.find(c => c.name === band);
                  return (
                    <Pressable
                      key={i}
                      onPress={() => setActiveBandIndex(i)}
                      style={[
                        styles.bandStripe,
                        { backgroundColor: colorObj ? colorObj.display : '#333' },
                        activeBandIndex === i && styles.bandStripeActive,
                        i === bandMode - 1 && styles.bandStripeTolerance,
                      ]}
                    >
                      <TerminalText style={[styles.bandLabel, { color: colorObj ? colorObj.text : '#888' }]} mono>
                        {i + 1}
                      </TerminalText>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.resistorLeg} />
            </View>

            {activeBandIndex !== null && (
              <View style={styles.colorPickerSection}>
                <TerminalText variant="dim" mono style={styles.sectionLabel}>
                  SELECT BAND {activeBandIndex + 1} COLOR{activeBandIndex === bandMode - 1 ? ' (TOLERANCE)' : ''}:
                </TerminalText>
                <View style={styles.colorGrid}>
                  {BAND_COLORS.map(c => (
                    <Pressable
                      key={c.name}
                      onPress={() => selectBandColor(c.name)}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: c.display, borderColor: c.display === '#111111' ? '#555' : c.display },
                        selectedBands[activeBandIndex] === c.name && styles.colorSwatchSelected,
                      ]}
                    >
                      <TerminalText style={[styles.colorSwatchText, { color: c.text }]} mono>
                        {c.name.substring(0, 3).toUpperCase()}
                      </TerminalText>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Band summary */}
            <View style={styles.bandSummary}>
              {selectedBands.map((band, i) => (
                <View key={i} style={styles.bandSummaryItem}>
                  <TerminalText mono variant="dim" style={styles.bandSummaryIdx}>B{i + 1}</TerminalText>
                  <View style={[
                    styles.bandSummaryColor,
                    { backgroundColor: BAND_COLORS.find(c => c.name === band)?.display || '#333' },
                  ]} />
                  <TerminalText mono variant={band ? 'bright' : 'dim'} style={styles.bandSummaryName}>
                    {band ? band.toUpperCase() : '---'}
                  </TerminalText>
                </View>
              ))}
            </View>

            <Button
              title="DECODE BANDS"
              onPress={handleDecode}
              disabled={selectedBands.filter(Boolean).length < 3}
              style={styles.decodeButton}
            />
          </View>
        ) : (
          <View style={styles.inputSection}>
            <TerminalText variant="dim" mono style={styles.sectionLabel}>
              ENTER CODE:
            </TerminalText>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.codeInput}
                value={inputCode}
                onChangeText={setInputCode}
                placeholder="e.g. NE555, 104, 2N2222..."
                placeholderTextColor={theme.colors.textDim}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handleDecode}
              />
              <Pressable onPress={() => { setInputCode(''); setResult(null); setHasSearched(false); }} style={styles.clearBtn}>
                <MaterialIcons name="close" size={18} color={theme.colors.textDim} />
              </Pressable>
            </View>

            {/* Examples */}
            {examples.length > 0 && (
              <View style={styles.examplesRow}>
                <TerminalText variant="dim" mono style={styles.examplesLabel}>EXAMPLES: </TerminalText>
                {examples.map(ex => (
                  <Pressable key={ex} onPress={() => setInputCode(ex)} style={styles.exampleChip}>
                    <TerminalText mono variant="dim" style={styles.exampleChipText}>{ex}</TerminalText>
                  </Pressable>
                ))}
              </View>
            )}

            <Button
              title="DECODE"
              onPress={handleDecode}
              disabled={!inputCode.trim()}
              style={styles.decodeButton}
            />
          </View>
        )}

        {/* Result */}
        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <TerminalText variant="warning" mono style={styles.resultTitle}>
                DECODED:
              </TerminalText>
              <View style={[styles.categoryBadge, { borderColor: theme.colors.primary }]}>
                <TerminalText mono variant="bright" style={styles.categoryBadgeText}>
                  {componentCodeDecoder.getCategoryLabel(result.category)}
                </TerminalText>
              </View>
            </View>

            {/* Value */}
            <View style={styles.valueRow}>
              <TerminalText variant="bright" mono style={styles.resultValue}>
                {result.value}
              </TerminalText>
              {result.unit ? (
                <TerminalText variant="primary" mono style={styles.resultUnit}>
                  {result.unit}
                </TerminalText>
              ) : null}
              {result.tolerance ? (
                <TerminalText variant="dim" mono style={styles.resultTolerance}>
                  {result.tolerance}
                </TerminalText>
              ) : null}
            </View>

            <TerminalText style={styles.resultDescription}>
              {result.description}
            </TerminalText>

            {/* Details table */}
            <View style={styles.detailsTable}>
              {Object.entries(result.details).map(([key, val]) => (
                <View key={key} style={styles.detailRow}>
                  <TerminalText mono variant="dim" style={styles.detailKey}>{key}:</TerminalText>
                  <TerminalText mono variant="bright" style={styles.detailVal}>{val}</TerminalText>
                </View>
              ))}
            </View>

            {/* Hack Notes */}
            {result.hackNotes && (
              <View style={styles.hackNotesBox}>
                <TerminalText variant="warning" mono style={styles.hackNotesTitle}>
                  ⚡ HACK POTENTIAL:
                </TerminalText>
                <TerminalText style={styles.hackNotesText}>
                  {result.hackNotes}
                </TerminalText>
              </View>
            )}
          </View>
        )}

        {hasSearched && !result && (
          <View style={styles.noResult}>
            <MaterialIcons name="help-outline" size={32} color={theme.colors.textDim} />
            <TerminalText variant="dim" mono style={styles.noResultText}>
              CODE NOT RECOGNIZED
            </TerminalText>
            <TerminalText variant="dim" style={styles.noResultHint}>
              Try switching category or check code spelling.{'\n'}
              Submit to FCC database or datasheet sites for obscure parts.
            </TerminalText>
          </View>
        )}

        {/* History */}
        {history.length > 0 && (
          <View style={styles.historySection}>
            <TerminalText variant="dim" mono style={styles.sectionLabel}>
              RECENT DECODES:
            </TerminalText>
            {history.map((item, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  if (activeCategory !== 'resistor_thru') {
                    setInputCode(item.code);
                  }
                  setResult(item.result);
                  setHasSearched(true);
                }}
                style={styles.historyItem}
              >
                <TerminalText mono variant="bright" style={styles.historyCode}>{item.code}</TerminalText>
                <TerminalText mono variant="dim" style={styles.historyResult} numberOfLines={1}>
                  → {item.result.value}{item.result.unit ? ` ${item.result.unit}` : ''}
                </TerminalText>
              </Pressable>
            ))}
          </View>
        )}

        {/* Quick Reference */}
        <View style={styles.quickRef}>
          <TerminalText variant="dim" mono style={styles.sectionLabel}>QUICK REFERENCE:</TerminalText>
          <View style={styles.refGrid}>
            {[
              { code: 'NE555', hint: 'Timer IC' },
              { code: '7805', hint: '+5V Reg' },
              { code: '104', hint: '100nF Cap' },
              { code: '1N4148', hint: 'Signal Diode' },
              { code: '2N2222', hint: 'NPN BJT' },
              { code: 'LM317', hint: 'Adj Reg' },
            ].map(item => (
              <Pressable
                key={item.code}
                onPress={() => {
                  setInputCode(item.code);
                  handleCategoryChange('auto');
                  const decoded = componentCodeDecoder.decode(item.code, 'auto');
                  setResult(decoded);
                  setHasSearched(true);
                }}
                style={styles.refItem}
              >
                <TerminalText mono variant="bright" style={styles.refCode}>{item.code}</TerminalText>
                <TerminalText mono variant="dim" style={styles.refHint}>{item.hint}</TerminalText>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: theme.spacing.lg },
  title: { fontSize: 16, lineHeight: 20 },
  subtitle: { marginTop: theme.spacing.sm, fontSize: 12 },

  // Category
  categorySection: { marginBottom: theme.spacing.md },
  sectionLabel: { fontSize: 11, marginBottom: theme.spacing.sm, letterSpacing: 1 },
  categoryScroll: { gap: theme.spacing.xs, paddingRight: theme.spacing.md },
  categoryChip: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  categoryChipActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceLight },
  categoryChipText: { fontSize: 11 },

  // Input
  inputSection: { marginBottom: theme.spacing.md },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  codeInput: {
    flex: 1,
    color: theme.colors.textBright,
    fontFamily: theme.fonts.mono,
    fontSize: 20,
    padding: theme.spacing.md,
    letterSpacing: 2,
  },
  clearBtn: { padding: theme.spacing.md },
  examplesRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: theme.spacing.sm },
  examplesLabel: { fontSize: 10 },
  exampleChip: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  exampleChipText: { fontSize: 11 },
  decodeButton: { marginTop: theme.spacing.xs },

  // Color Band
  colorBandSection: { marginBottom: theme.spacing.md },
  bandModeRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.md },
  bandModeButtons: { flexDirection: 'row', gap: theme.spacing.sm },
  bandModeBtn: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  bandModeBtnActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceLight },
  bandModeBtnText: { fontSize: 12 },

  resistorBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    height: 64,
  },
  resistorLeg: {
    flex: 1,
    height: 2,
    backgroundColor: theme.colors.border,
  },
  resistorCylinder: {
    flexDirection: 'row',
    backgroundColor: '#d4a96a',
    borderRadius: 8,
    overflow: 'hidden',
    height: 48,
    alignItems: 'stretch',
    minWidth: 200,
  },
  bandStripe: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  bandStripeActive: { borderColor: theme.colors.primary, borderWidth: 2 },
  bandStripeTolerance: { marginLeft: 4 },
  bandLabel: { fontSize: 10, fontWeight: '700' },

  colorPickerSection: { marginBottom: theme.spacing.md },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: theme.spacing.xs,
  },
  colorSwatch: {
    width: 52,
    height: 36,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchSelected: { borderColor: theme.colors.primary, borderWidth: 3 },
  colorSwatchText: { fontSize: 9, fontWeight: '700' },

  bandSummary: { flexDirection: 'row', gap: theme.spacing.xs, marginBottom: theme.spacing.sm },
  bandSummaryItem: { flex: 1, alignItems: 'center', gap: 3 },
  bandSummaryIdx: { fontSize: 9 },
  bandSummaryColor: { width: 20, height: 20, borderRadius: 3, borderWidth: 1, borderColor: '#444' },
  bandSummaryName: { fontSize: 9 },

  // Result
  resultCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.warning,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  resultTitle: { fontSize: 11, letterSpacing: 1 },
  categoryBadge: {
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryBadgeText: { fontSize: 10 },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  resultValue: { fontSize: 36, fontWeight: '700' },
  resultUnit: { fontSize: 22, color: theme.colors.primary },
  resultTolerance: { fontSize: 14 },
  resultDescription: { fontSize: 13, color: theme.colors.text, marginBottom: theme.spacing.md },

  detailsTable: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  detailKey: { width: 120, fontSize: 11, color: theme.colors.textDim },
  detailVal: { flex: 1, fontSize: 11 },

  hackNotesBox: {
    backgroundColor: theme.colors.surfaceLight,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.warning,
    padding: theme.spacing.sm,
    borderRadius: 4,
  },
  hackNotesTitle: { fontSize: 11, marginBottom: 4 },
  hackNotesText: { fontSize: 13, lineHeight: 20, color: theme.colors.text },

  // No result
  noResult: { alignItems: 'center', padding: theme.spacing.xl, gap: theme.spacing.sm },
  noResultText: { fontSize: 14, letterSpacing: 2 },
  noResultHint: { textAlign: 'center', fontSize: 12, lineHeight: 18 },

  // History
  historySection: { marginTop: theme.spacing.md, marginBottom: theme.spacing.md },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  historyCode: { fontSize: 14, minWidth: 80 },
  historyResult: { flex: 1, fontSize: 12 },

  // Quick Ref
  quickRef: { marginTop: theme.spacing.md },
  refGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  refItem: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    minWidth: '30%',
    alignItems: 'center',
  },
  refCode: { fontSize: 14, marginBottom: 2 },
  refHint: { fontSize: 10 },
});
