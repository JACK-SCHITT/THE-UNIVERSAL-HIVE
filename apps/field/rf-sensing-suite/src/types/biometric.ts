export interface FaceDetection {
  id: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks: {
    leftEye: [number, number];
    rightEye: [number, number];
    nose: [number, number];
    mouth: [number, number];
  };
  confidence: number;
  descriptor: Float32Array; // 128-dim face embedding
  recognizedAs?: string; // Matched identity
}

export interface VoiceRecognition {
  transcript: string;
  confidence: number;
  timestamp: number;
  speakerEmbedding?: Float32Array; // Voice fingerprint
  recognizedSpeaker?: string;
  command?: VoiceCommand;
}

export interface VoiceCommand {
  action: 'start_scan' | 'stop_scan' | 'change_band' | 'record' | 'analyze' | 'identify';
  parameters?: Record<string, any>;
}

export interface BiometricProfile {
  id: string;
  name: string;
  faceDescriptors: Float32Array[];
  voiceEmbedding?: Float32Array;
  trustScore: number; // 0-1, for fraud detection integration
  lastSeen: number;
  accessLevel: 'admin' | 'operator' | 'viewer';
}

// Fraud Detection Types (Demo/Educational)
export interface TransactionContext {
  userId: string;
  amount: number;
  merchant: string;
  location: [number, number]; // lat, lng
  deviceId: string;
  timestamp: number;
  biometricConfidence?: number; // From face/voice
}

export interface FraudDecision {
  action: 'approve' | 'step_up' | 'review' | 'block';
  confidence: number;
  riskScore: number;
  reasoning: string[];
  rlOverride: boolean; // Was RL overridden by safety rules?
  trustState: {
    userTrust: number;
    policyConfidence: number;
    deviation: number; // From personal baseline
  };
}

export interface UserBehaviorProfile {
  userId: string;
  avgTransaction: number;
  stdDeviation: number;
  typicalMerchants: string[];
  typicalLocations: [number, number][];
  trustScore: number; // Evolves slowly
  transactionHistory: number; // Count
}
