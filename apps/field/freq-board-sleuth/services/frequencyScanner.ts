// Real-time frequency scanner service
import { Audio } from 'expo-av';
import { FrequencyReading, FrequencyBand, AudioSettings, HarmonicData } from '../types';
import { 
  fft, 
  getMagnitude, 
  applyHammingWindow, 
  amplitudeToDb, 
  findPeaks, 
  detectHarmonics,
  padToPowerOfTwo 
} from '../utils/fft';

type ReadingCallback = (reading: FrequencyReading) => void;
type HarmonicsCallback = (harmonics: HarmonicData[]) => void;

class FrequencyScanner {
  private recording: Audio.Recording | null = null;
  private isActive = false;
  private callbacks: ReadingCallback[] = [];
  private harmonicsCallbacks: HarmonicsCallback[] = [];
  private currentBand: FrequencyBand = 'audio';
  private settings: AudioSettings = {
    fftSize: 2048,
    sensitivity: 0.5,
    peakThreshold: 0.3,
    smoothing: 0.7,
  };
  private previousMagnitudes: number[] = [];
  private sampleRate = 44100; // Default, will be updated from recording
  
  async startAudioScan(): Promise<void> {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio permission not granted');
      }
      
      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      // Create recording
      this.recording = new Audio.Recording();
      
      await this.recording.prepareToRecordAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/wav',
          bitsPerSecond: 128000,
        },
      });
      
      // Start recording
      await this.recording.startAsync();
      this.isActive = true;
      this.currentBand = 'audio';
      
      // Start processing loop
      this.processAudioLoop();
      
    } catch (error) {
      console.error('Failed to start audio scan:', error);
      throw error;
    }
  }
  
  private async processAudioLoop(): Promise<void> {
    while (this.isActive && this.recording) {
      try {
        // Get recording status
        const status = await this.recording.getStatusAsync();
        
        if (status.isRecording && status.durationMillis > 0) {
          // For now, we'll simulate FFT processing since expo-av doesn't provide direct PCM access
          // In a real implementation, you'd need to:
          // 1. Stop recording temporarily
          // 2. Read the audio file
          // 3. Extract PCM samples
          // 4. Process with FFT
          // 5. Resume recording
          
          // V1.0: Use simulated samples for demo
          await this.processMockAudioData();
        }
        
        // Wait before next iteration
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error('Audio processing error:', error);
      }
    }
  }
  
  private async processMockAudioData(): Promise<void> {
    // Generate mock audio samples (simulating mic input)
    // In real implementation, this would be actual PCM data from recording
    const numSamples = this.settings.fftSize;
    const samples: number[] = [];
    
    // Simulate a mix of frequencies (e.g., 440Hz A4, 880Hz A5, some noise)
    for (let i = 0; i < numSamples; i++) {
      const t = i / this.sampleRate;
      const signal = 
        0.5 * Math.sin(2 * Math.PI * 440 * t) + // 440 Hz
        0.3 * Math.sin(2 * Math.PI * 880 * t) + // 880 Hz (first harmonic)
        0.2 * Math.sin(2 * Math.PI * 1320 * t) + // 1320 Hz (second harmonic)
        0.1 * (Math.random() - 0.5); // Noise
      
      samples.push(signal * this.settings.sensitivity);
    }
    
    // Apply windowing
    const windowed = applyHammingWindow(samples);
    
    // Pad to power of 2 if needed
    const padded = padToPowerOfTwo(windowed);
    
    // Perform FFT
    const fftResult = fft(padded);
    
    // Get magnitudes
    const magnitudes = fftResult.slice(0, fftResult.length / 2).map(getMagnitude);
    
    // Apply smoothing
    const smoothed = this.applySmoothing(magnitudes);
    
    // Find peaks
    const peakIndices = findPeaks(smoothed, this.settings.peakThreshold);
    
    // Convert to frequency readings
    const binWidth = this.sampleRate / padded.length;
    const maxFreq = 20000; // 20 kHz limit for audio
    
    for (const peakIdx of peakIndices) {
      const frequency = peakIdx * binWidth;
      
      if (frequency <= maxFreq) {
        const amplitude = amplitudeToDb(smoothed[peakIdx]);
        
        this.callbacks.forEach(cb => cb({
          frequency,
          amplitude,
          band: this.currentBand,
          timestamp: Date.now(),
        }));
      }
    }
    
    // Detect harmonics if we have a strong fundamental
    if (peakIndices.length > 0) {
      const fundamentalIdx = peakIndices[0];
      const harmonics = detectHarmonics(smoothed, this.sampleRate, fundamentalIdx);
      
      if (harmonics.length > 1) {
        this.harmonicsCallbacks.forEach(cb => cb(
          harmonics.map(h => ({
            harmonic: h.harmonic,
            frequency: h.frequency,
            amplitude: amplitudeToDb(h.amplitude),
          }))
        ));
      }
    }
  }
  
  private applySmoothing(magnitudes: number[]): number[] {
    if (this.previousMagnitudes.length !== magnitudes.length) {
      this.previousMagnitudes = [...magnitudes];
      return magnitudes;
    }
    
    const smoothing = this.settings.smoothing;
    const smoothed = magnitudes.map((mag, i) => 
      mag * (1 - smoothing) + this.previousMagnitudes[i] * smoothing
    );
    
    this.previousMagnitudes = smoothed;
    return smoothed;
  }
  
  async startEMFScan(): Promise<void> {
    // EMF scanning uses magnetometer (already implemented in mock)
    this.currentBand = 'emf';
    this.isActive = true;
    this.mockScanLoop();
  }
  
  async startWiFiScan(): Promise<void> {
    // WiFi/BT scanning (mock for now)
    this.currentBand = 'wifi';
    this.isActive = true;
    this.mockScanLoop();
  }
  
  private mockScanLoop(): void {
    if (!this.isActive || this.currentBand === 'audio') return;
    
    const interval = setInterval(() => {
      if (!this.isActive) {
        clearInterval(interval);
        return;
      }
      
      // Generate mock readings based on band
      let frequency = 0;
      let amplitude = 0;
      
      if (this.currentBand === 'emf') {
        frequency = 50 + Math.random() * 100; // 50-150 Hz
        amplitude = -40 + Math.random() * 20;
      } else if (this.currentBand === 'wifi') {
        frequency = 2400000000 + Math.random() * 100000000; // 2.4 GHz
        amplitude = -60 + Math.random() * 30;
      }
      
      this.callbacks.forEach(cb => cb({
        frequency,
        amplitude,
        band: this.currentBand,
        timestamp: Date.now(),
      }));
    }, 100);
  }
  
  stopScan(): void {
    this.isActive = false;
    
    if (this.recording) {
      this.recording.stopAndUnloadAsync().catch(console.error);
      this.recording = null;
    }
    
    this.previousMagnitudes = [];
  }
  
  onReading(callback: ReadingCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }
  
  onHarmonics(callback: HarmonicsCallback): () => void {
    this.harmonicsCallbacks.push(callback);
    return () => {
      this.harmonicsCallbacks = this.harmonicsCallbacks.filter(cb => cb !== callback);
    };
  }
  
  updateSettings(settings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }
  
  getSettings(): AudioSettings {
    return { ...this.settings };
  }
  
  getCurrentBand(): FrequencyBand {
    return this.currentBand;
  }
  
  getSampleRate(): number {
    return this.sampleRate;
  }
}

export const frequencyScanner = new FrequencyScanner();
