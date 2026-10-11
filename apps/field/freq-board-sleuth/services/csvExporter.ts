// CSV export service for frequency analysis data
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { FrequencyReading } from '../types';

export class CSVExporter {
  static async exportReadings(
    readings: FrequencyReading[],
    metadata?: {
      band?: string;
      sampleRate?: number;
      timestamp?: number;
    }
  ): Promise<void> {
    try {
      // Generate CSV content
      let csv = '';
      
      // Add metadata as comments
      if (metadata) {
        csv += `# FreqBoard Sleuth Export\n`;
        csv += `# Date: ${new Date(metadata.timestamp || Date.now()).toISOString()}\n`;
        if (metadata.band) csv += `# Band: ${metadata.band}\n`;
        if (metadata.sampleRate) csv += `# Sample Rate: ${metadata.sampleRate} Hz\n`;
        csv += `#\n`;
      }
      
      // CSV header
      csv += 'Frequency (Hz),Amplitude (dB),Timestamp (ms)\n';
      
      // Data rows
      for (const reading of readings) {
        csv += `${reading.frequency},${reading.amplitude},${reading.timestamp}\n`;
      }
      
      // Generate filename
      const filename = `freqboard_${Date.now()}.csv`;
      const fileUri = FileSystem.documentDirectory + filename;
      
      // Write file
      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      // Share file
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Frequency Analysis',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        throw new Error('Sharing not available on this device');
      }
    } catch (error) {
      console.error('CSV export failed:', error);
      throw error;
    }
  }
  
  static async exportHarmonics(
    harmonics: { harmonic: number; frequency: number; amplitude: number }[],
    fundamentalFreq: number
  ): Promise<void> {
    try {
      let csv = '';
      
      csv += `# Harmonics Analysis\n`;
      csv += `# Fundamental Frequency: ${fundamentalFreq.toFixed(2)} Hz\n`;
      csv += `# Date: ${new Date().toISOString()}\n`;
      csv += `#\n`;
      csv += 'Harmonic,Expected Frequency (Hz),Detected Frequency (Hz),Amplitude (dB),Deviation (Hz)\n';
      
      for (const h of harmonics) {
        const expected = fundamentalFreq * h.harmonic;
        const deviation = h.frequency - expected;
        csv += `${h.harmonic},${expected.toFixed(2)},${h.frequency.toFixed(2)},${h.amplitude.toFixed(2)},${deviation.toFixed(2)}\n`;
      }
      
      const filename = `harmonics_${Date.now()}.csv`;
      const fileUri = FileSystem.documentDirectory + filename;
      
      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Harmonics Analysis',
        });
      }
    } catch (error) {
      console.error('Harmonics export failed:', error);
      throw error;
    }
  }
}

export const csvExporter = new CSVExporter();
