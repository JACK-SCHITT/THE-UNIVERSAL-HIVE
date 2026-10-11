// Core types for FreqBoard Sleuth

export type FrequencyBand = 'audio' | 'emf' | 'wifi' | 'bluetooth' | 'fm';

export interface FrequencyReading {
  frequency: number;
  amplitude: number;
  band: FrequencyBand;
  timestamp: number;
}

export interface AudioSettings {
  fftSize: number; // 256, 512, 1024, 2048, 4096
  sensitivity: number; // 0.1 to 1.0
  peakThreshold: number; // 0.1 to 1.0
  smoothing: number; // 0 to 1
}

export interface HarmonicData {
  harmonic: number;
  frequency: number;
  amplitude: number;
}

export interface ComponentType {
  id: string;
  name: string;
  category: 'resistor' | 'capacitor' | 'ic' | 'transistor' | 'inductor' | 'connector' | 'crystal' | 'diode' | 'unknown';
  confidence: number;
  bounds?: { x: number; y: number; width: number; height: number };
  specs?: Record<string, string>;
  function?: string;
}

export interface BoardAnalysis {
  id: string;
  timestamp: number;
  imageUri: string;
  components: ComponentType[];
  capabilities: string[];
  modelGuess?: string;
}

export interface ModSuggestion {
  id: string;
  title: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  components: string[];
  steps: string[];
  capabilities: string[];
  warnings?: string[];
}

export interface ScanMode {
  type: 'freq' | 'board' | 'mod';
  active: boolean;
}
