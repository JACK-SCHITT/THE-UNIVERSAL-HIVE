// FreqBoard Sleuth - Main Scanner Tab
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert, Slider } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../../constants/theme';
import { TerminalText } from '../../components/ui/TerminalText';
import { Button } from '../../components/ui/Button';
import { FrequencyWaterfall } from '../../components/feature/FrequencyWaterfall';
import { useFrequencyScanner } from '../../hooks/useFrequencyScanner';
import { FrequencyBand, AudioSettings, HarmonicData } from '../../types';
import { frequencyScanner } from '../../services/frequencyScanner';
import { csvExporter } from '../../services/csvExporter';

export default function ScannerScreen() {
  const { isScanning, readings, currentBand, startScan, stopScan } = useFrequencyScanner();
  const [selectedBand, setSelectedBand] = useState<FrequencyBand>('audio');
  const [settings, setSettings] = useState<AudioSettings>(frequencyScanner.getSettings());
  const [harmonics, setHarmonics] = useState<HarmonicData[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  useEffect(() => {
    const unsubscribe = frequencyScanner.onHarmonics((h) => {
      setHarmonics(h);
    });
    return unsubscribe;
  }, []);
  
  const handleExportCSV = async () => {
    if (readings.length === 0) {
      Alert.alert('No Data', 'No frequency readings to export');
      return;
    }
    
    setIsExporting(true);
    try {
      await csvExporter.exportReadings(readings, {
        band: currentBand,
        sampleRate: frequencyScanner.getSampleRate(),
        timestamp: Date.now(),
      });
      Alert.alert('Success', 'Frequency data exported');
    } catch (error) {
      Alert.alert('Export Failed', 'Could not export data');
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleExportHarmonics = async () => {
    if (harmonics.length === 0) {
      Alert.alert('No Harmonics', 'No harmonics detected yet');
      return;
    }
    
    const fundamental = harmonics[0];
    setIsExporting(true);
    try {
      await csvExporter.exportHarmonics(harmonics, fundamental.frequency);
      Alert.alert('Success', 'Harmonics data exported');
    } catch (error) {
      Alert.alert('Export Failed', 'Could not export harmonics');
    } finally {
      setIsExporting(false);
    }
  };
  
  const updateSetting = (key: keyof AudioSettings, value: number) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    frequencyScanner.updateSettings(newSettings);
  };

  const bands: { type: FrequencyBand; label: string; range: string }[] = [
    { type: 'audio', label: 'AUDIO', range: '20Hz-20kHz' },
    { type: 'emf', label: 'EMF', range: '0-300Hz' },
    { type: 'wifi', label: 'WiFi', range: '2.4/5GHz' },
    { type: 'bluetooth', label: 'BT', range: '2.4GHz' },
  ];

  const handleScan = () => {
    if (isScanning) {
      stopScan();
    } else {
      startScan(selectedBand);
    }
  };

  const getPeakFrequency = () => {
    if (readings.length === 0) return null;
    const peak = readings.reduce((max, r) => r.amplitude > max.amplitude ? r : max, readings[0]);
    return peak;
  };

  const peak = getPeakFrequency();

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
            ║ FREQBOARD SLEUTH 1.0 ║
          </TerminalText>
          <TerminalText variant="bright" mono style={styles.title}>
            ╚═══════════════════════╝
          </TerminalText>
          <TerminalText variant="dim" style={styles.subtitle}>
            REAL-TIME FREQUENCY SCANNER
          </TerminalText>
        </View>

        {/* Band Selection */}
        <View style={styles.bandSelector}>
          <TerminalText variant="dim" mono style={styles.sectionLabel}>
            SELECT BAND:
          </TerminalText>
          <View style={styles.bandButtons}>
            {bands.map(band => (
              <Pressable
                key={band.type}
                onPress={() => setSelectedBand(band.type)}
                style={[
                  styles.bandButton,
                  selectedBand === band.type && styles.bandButtonActive,
                ]}
              >
                <TerminalText
                  mono
                  variant={selectedBand === band.type ? 'bright' : 'dim'}
                  style={styles.bandLabel}
                >
                  {band.label}
                </TerminalText>
                <TerminalText
                  mono
                  variant="dim"
                  style={styles.bandRange}
                >
                  {band.range}
                </TerminalText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Scan Control */}
        <Button
          title={isScanning ? 'STOP SCAN' : 'START SCAN'}
          onPress={handleScan}
          variant={isScanning ? 'danger' : 'primary'}
          style={styles.scanButton}
        />

        {/* Status */}
        <View style={styles.status}>
          <TerminalText mono variant={isScanning ? 'success' : 'dim'}>
            STATUS: {isScanning ? '█ SCANNING' : '○ IDLE'}
          </TerminalText>
          <TerminalText mono variant="dim">
            SAMPLES: {readings.length}
          </TerminalText>
        </View>

        {/* Waterfall Display */}
        {isScanning && <FrequencyWaterfall readings={readings} />}

        {/* Peak Info */}
        {peak && (
          <View style={styles.peakInfo}>
            <TerminalText variant="warning" mono style={styles.peakLabel}>
              PEAK DETECTED:
            </TerminalText>
            <TerminalText variant="bright" mono style={styles.peakFreq}>
              {peak.frequency >= 1000000
                ? `${(peak.frequency / 1000000).toFixed(2)} MHz`
                : peak.frequency >= 1000
                ? `${(peak.frequency / 1000).toFixed(2)} kHz`
                : `${peak.frequency.toFixed(0)} Hz`}
            </TerminalText>
            <TerminalText variant="dim" mono>
              AMPLITUDE: {peak.amplitude.toFixed(1)} dB
            </TerminalText>
            
            {/* Capability hint */}
            <View style={styles.capability}>
              <TerminalText variant="success" style={styles.capabilityText}>
                ✓ Capabilities: {getCapabilityHint(peak.frequency, currentBand)}
              </TerminalText>
            </View>
          </View>
        )}

        {/* Settings Panel */}
        <Pressable
          onPress={() => setShowSettings(!showSettings)}
          style={styles.settingsToggle}
        >
          <TerminalText mono variant="dim">
            {showSettings ? '▼' : '▶'} ADVANCED SETTINGS
          </TerminalText>
        </Pressable>
        
        {showSettings && selectedBand === 'audio' && (
          <View style={styles.settingsPanel}>
            <View style={styles.settingRow}>
              <TerminalText mono variant="dim" style={styles.settingLabel}>
                FFT SIZE: {settings.fftSize}
              </TerminalText>
              <View style={styles.settingButtons}>
                {[256, 512, 1024, 2048, 4096].map(size => (
                  <Pressable
                    key={size}
                    onPress={() => updateSetting('fftSize', size)}
                    style={[
                      styles.settingButton,
                      settings.fftSize === size && styles.settingButtonActive,
                    ]}
                  >
                    <TerminalText
                      mono
                      variant={settings.fftSize === size ? 'bright' : 'dim'}
                      style={styles.settingButtonText}
                    >
                      {size}
                    </TerminalText>
                  </Pressable>
                ))}
              </View>
            </View>
            
            <View style={styles.settingRow}>
              <TerminalText mono variant="dim" style={styles.settingLabel}>
                SENSITIVITY: {(settings.sensitivity * 100).toFixed(0)}%
              </TerminalText>
              <Slider
                style={styles.slider}
                minimumValue={0.1}
                maximumValue={1.0}
                step={0.1}
                value={settings.sensitivity}
                onValueChange={(v) => updateSetting('sensitivity', v)}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.border}
                thumbTintColor={theme.colors.primary}
              />
            </View>
            
            <View style={styles.settingRow}>
              <TerminalText mono variant="dim" style={styles.settingLabel}>
                PEAK THRESHOLD: {(settings.peakThreshold * 100).toFixed(0)}%
              </TerminalText>
              <Slider
                style={styles.slider}
                minimumValue={0.1}
                maximumValue={1.0}
                step={0.1}
                value={settings.peakThreshold}
                onValueChange={(v) => updateSetting('peakThreshold', v)}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.border}
                thumbTintColor={theme.colors.primary}
              />
            </View>
            
            <View style={styles.settingRow}>
              <TerminalText mono variant="dim" style={styles.settingLabel}>
                SMOOTHING: {(settings.smoothing * 100).toFixed(0)}%
              </TerminalText>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1.0}
                step={0.1}
                value={settings.smoothing}
                onValueChange={(v) => updateSetting('smoothing', v)}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.border}
                thumbTintColor={theme.colors.primary}
              />
            </View>
          </View>
        )}
        
        {/* Harmonics Display */}
        {harmonics.length > 0 && (
          <View style={styles.harmonicsPanel}>
            <TerminalText variant="warning" mono style={styles.harmonicsTitle}>
              HARMONICS DETECTED:
            </TerminalText>
            <View style={styles.harmonicsList}>
              {harmonics.slice(0, 5).map((h, i) => (
                <View key={i} style={styles.harmonicItem}>
                  <TerminalText mono variant="dim" style={styles.harmonicLabel}>
                    H{h.harmonic}
                  </TerminalText>
                  <TerminalText mono variant="bright">
                    {h.frequency.toFixed(1)} Hz
                  </TerminalText>
                  <TerminalText mono variant="dim">
                    {h.amplitude.toFixed(1)} dB
                  </TerminalText>
                </View>
              ))}
            </View>
            <Button
              title="EXPORT HARMONICS"
              onPress={handleExportHarmonics}
              disabled={isExporting}
              variant="secondary"
              style={styles.exportButton}
            />
          </View>
        )}
        
        {/* Export Controls */}
        <View style={styles.exportPanel}>
          <Button
            title={isExporting ? 'EXPORTING...' : 'EXPORT TO CSV'}
            onPress={handleExportCSV}
            disabled={isExporting || readings.length === 0}
            variant="secondary"
          />
        </View>
        
        {/* V1.0 Disclaimer */}
        <View style={styles.disclaimer}>
          <TerminalText variant="dim" style={styles.disclaimerText}>
            Real FFT audio analysis • Up to 20kHz
          </TerminalText>
          <TerminalText variant="dim" style={styles.disclaimerText}>
            Harmonics detection • CSV export enabled
          </TerminalText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getCapabilityHint(freq: number, band: FrequencyBand): string {
  if (band === 'audio') {
    if (freq < 100) return 'Subsonic—mechanical vibration detection';
    if (freq < 20000) return 'Audio range—speaker testing, harmonics analysis';
    return 'Ultrasonic—possible coil whine or HF noise';
  }
  
  if (band === 'emf') {
    if (Math.abs(freq - 60) < 5) return 'AC power line hum—shielding test';
    return 'EMF disturbance—transformer, motor, or interference';
  }

  if (band === 'wifi' || band === 'bluetooth') {
    return 'Wireless signal—channel analysis, interference mapping';
  }

  return 'Unknown signal type';
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
  bandSelector: {
    marginBottom: theme.spacing.md,
  },
  sectionLabel: {
    fontSize: 12,
    marginBottom: theme.spacing.sm,
  },
  bandButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  bandButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  bandButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceLight,
  },
  bandLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  bandRange: {
    fontSize: 10,
  },
  scanButton: {
    marginBottom: theme.spacing.md,
  },
  status: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  peakInfo: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.warning,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  peakLabel: {
    fontSize: 12,
    marginBottom: theme.spacing.xs,
  },
  peakFreq: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  capability: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  capabilityText: {
    fontSize: 13,
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
  settingsToggle: {
    paddingVertical: theme.spacing.sm,
    marginVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  settingsPanel: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  settingRow: {
    marginBottom: theme.spacing.md,
  },
  settingLabel: {
    fontSize: 12,
    marginBottom: theme.spacing.xs,
  },
  settingButtons: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  settingButton: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.xs,
    alignItems: 'center',
  },
  settingButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceLight,
  },
  settingButtonText: {
    fontSize: 11,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  harmonicsPanel: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.warning,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  harmonicsTitle: {
    fontSize: 12,
    marginBottom: theme.spacing.sm,
  },
  harmonicsList: {
    gap: theme.spacing.xs,
  },
  harmonicItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  harmonicLabel: {
    width: 40,
  },
  exportButton: {
    marginTop: theme.spacing.sm,
  },
  exportPanel: {
    marginTop: theme.spacing.md,
  },
});
