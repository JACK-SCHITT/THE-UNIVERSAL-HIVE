/**
 * Backend API Client with WebSocket Support
 * Connects to FastAPI backend for real WiFi DensePose, Fraud Detection, RF scanning
 */

export interface BackendConfig {
  apiUrl: string;
  wsUrl: string;
}

export interface WiFiCSIData {
  amplitude: number[][][];
  phase: number[][][];
  timestamp: number;
  antenna_count: number;
  subcarrier_count: number;
}

export interface PoseEstimation {
  person_id: number;
  confidence: number;
  uv_coordinates: Array<{
    region_id: number;
    u: number;
    v: number;
    confidence: number;
  }>;
  timestamp: number;
}

export interface TransactionRequest {
  user_id: string;
  amount: number;
  merchant: string;
  device_id: string;
  location?: [number, number];
  biometric_confidence?: number;
}

export interface FraudDecision {
  action: 'approve' | 'step_up' | 'review' | 'block';
  confidence: number;
  risk_score: number;
  reasoning: string[];
  trust_state: {
    user_trust: number;
    policy_confidence: number;
    deviation: number;
  };
}

export interface RFSignal {
  frequency: number;
  bandwidth: number;
  strength: number;
  modulation: string;
  decoded?: string;
}

export class BackendClient {
  private config: BackendConfig;
  private ws: WebSocket | null = null;
  private wsCallbacks: Map<string, (data: any) => void> = new Map();

  constructor(config?: Partial<BackendConfig>) {
    // Default to localhost, override in production
    this.config = {
      apiUrl: config?.apiUrl || 'http://localhost:8000',
      wsUrl: config?.wsUrl || 'ws://localhost:8000/ws/realtime'
    };
  }

  // ============================================================================
  // REST API Methods
  // ============================================================================

  async detectPose(csiData: WiFiCSIData): Promise<PoseEstimation[]> {
    const response = await fetch(`${this.config.apiUrl}/api/wifi/detect-pose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(csiData)
    });

    if (!response.ok) {
      throw new Error(`Pose detection failed: ${response.statusText}`);
    }

    return response.json();
  }

  async evaluateFraud(transaction: TransactionRequest): Promise<FraudDecision> {
    const response = await fetch(`${this.config.apiUrl}/api/fraud/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction)
    });

    if (!response.ok) {
      throw new Error(`Fraud evaluation failed: ${response.statusText}`);
    }

    return response.json();
  }

  async scanSpectrum(params: {
    start_freq: number;
    end_freq: number;
    bandwidth: number;
    duration: number;
  }): Promise<RFSignal[]> {
    const response = await fetch(`${this.config.apiUrl}/api/radio/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`RF scan failed: ${response.statusText}`);
    }

    return response.json();
  }

  async healthCheck() {
    const response = await fetch(`${this.config.apiUrl}/api/health`);
    return response.json();
  }

  // ============================================================================
  // WebSocket Real-Time Streaming
  // ============================================================================

  connectWebSocket(onMessage?: (data: any) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected to backend');
          resolve();
        };

        this.ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          // Call registered callback for this message type
          const callback = this.wsCallbacks.get(data.type);
          if (callback) {
            callback(data);
          }

          // Also call generic message handler
          if (onMessage) {
            onMessage(data);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.ws = null;
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnectWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Send WiFi CSI data for real-time pose detection
  sendWiFiCSI(csiData: WiFiCSIData) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    this.ws.send(JSON.stringify({
      type: 'wifi_csi',
      data: csiData,
      timestamp: Date.now()
    }));
  }

  // Start continuous RF scanning
  startRFScan(params: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    this.ws.send(JSON.stringify({
      type: 'start_scan',
      params
    }));
  }

  // Register callback for specific message type
  on(messageType: string, callback: (data: any) => void) {
    this.wsCallbacks.set(messageType, callback);
  }

  off(messageType: string) {
    this.wsCallbacks.delete(messageType);
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
let backendClient: BackendClient | null = null;

export function getBackendClient(config?: Partial<BackendConfig>): BackendClient {
  if (!backendClient) {
    backendClient = new BackendClient(config);
  }
  return backendClient;
}

export function setBackendUrl(apiUrl: string, wsUrl: string) {
  backendClient = new BackendClient({ apiUrl, wsUrl });
}
