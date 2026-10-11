import { VoiceRecognition, VoiceCommand, BiometricProfile } from '@/types/biometric';

export class VoiceRecognitionEngine {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private knownVoices: Map<string, BiometricProfile> = new Map();

  constructor() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionAPI();
      
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
    }
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  startListening(
    onResult: (result: VoiceRecognition) => void,
    onError?: (error: string) => void
  ) {
    if (!this.recognition) {
      onError?.('Speech recognition not supported');
      return;
    }

    this.recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript.trim();
      const confidence = event.results[last][0].confidence;

      // Generate voice embedding (simulated - in production use speaker recognition model)
      const speakerEmbedding = this.generateVoiceEmbedding(transcript);
      
      const result: VoiceRecognition = {
        transcript,
        confidence,
        timestamp: Date.now(),
        speakerEmbedding,
        recognizedSpeaker: this.recognizeSpeaker(speakerEmbedding),
        command: this.parseCommand(transcript)
      };

      onResult(result);
    };

    this.recognition.onerror = (event) => {
      onError?.(event.error);
    };

    this.recognition.start();
    this.isListening = true;
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  private parseCommand(transcript: string): VoiceCommand | undefined {
    const lower = transcript.toLowerCase();

    // Scan control
    if (lower.includes('start scan') || lower.includes('begin scan')) {
      return { action: 'start_scan' };
    }
    if (lower.includes('stop scan') || lower.includes('end scan')) {
      return { action: 'stop_scan' };
    }

    // Band selection
    const bandMatch = lower.match(/(?:change|switch|select|tune)\s+(?:to\s+)?(\w+)/);
    if (bandMatch) {
      return {
        action: 'change_band',
        parameters: { band: bandMatch[1] }
      };
    }

    // Recording
    if (lower.includes('record') || lower.includes('start recording')) {
      return { action: 'record' };
    }

    // Analysis
    if (lower.includes('analyze') || lower.includes('identify')) {
      return { action: 'analyze' };
    }

    return undefined;
  }

  // Simulate voice embedding generation (in production: use speaker recognition CNN)
  private generateVoiceEmbedding(text: string): Float32Array {
    const embedding = new Float32Array(256);
    
    // Seed based on text characteristics (simulated)
    let seed = 0;
    for (let i = 0; i < text.length; i++) {
      seed += text.charCodeAt(i);
    }
    
    for (let i = 0; i < 256; i++) {
      embedding[i] = Math.sin(seed + i) * 0.5;
    }
    
    return embedding;
  }

  private recognizeSpeaker(embedding: Float32Array): string | undefined {
    let bestMatch: string | undefined;
    let bestDistance = Infinity;
    const threshold = 0.4;

    for (const [id, profile] of this.knownVoices.entries()) {
      if (profile.voiceEmbedding) {
        const distance = this.cosineSimilarity(embedding, profile.voiceEmbedding);
        if (distance < bestDistance && distance < threshold) {
          bestDistance = distance;
          bestMatch = profile.name;
        }
      }
    }

    return bestMatch;
  }

  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return 1 - (dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)));
  }

  registerVoice(profile: BiometricProfile) {
    this.knownVoices.set(profile.id, profile);
  }

  getVoiceProfiles(): BiometricProfile[] {
    return Array.from(this.knownVoices.values());
  }
}
