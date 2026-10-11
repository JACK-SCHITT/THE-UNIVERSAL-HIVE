import { WiFiSignal, HumanPose, DensePoseRegion, WiFiAntennaConfig } from '@/types/wifi-pose';

// Simulates WiFi CSI (Channel State Information) data
export class WiFiSignalSimulator {
  private antennas: WiFiAntennaConfig[];
  private samplingRate = 1000; // Hz
  
  constructor(numAntennas = 3) {
    this.antennas = Array.from({ length: numAntennas }, (_, i) => ({
      id: `antenna_${i}`,
      position: [
        Math.cos(i * (2 * Math.PI / numAntennas)) * 3,
        Math.sin(i * (2 * Math.PI / numAntennas)) * 3,
        2.5
      ] as [number, number, number],
      frequency: 2400,
      status: 'active' as const
    }));
  }

  generateSignal(numPeople: number): WiFiSignal {
    const subcarriers = 30;
    
    // Simulate amplitude and phase affected by human presence
    const amplitude = Array.from({ length: subcarriers }, (_, i) => {
      let base = 40 + Math.random() * 20; // Base signal strength
      
      // Add interference pattern from human bodies
      for (let p = 0; p < numPeople; p++) {
        const interference = 15 * Math.sin(i / 5 + p * Math.PI / 2) * (0.5 + Math.random() * 0.5);
        base -= Math.abs(interference);
      }
      
      return Math.max(10, base);
    });

    const phase = Array.from({ length: subcarriers }, (_, i) => {
      let basePhase = (i / subcarriers) * 2 * Math.PI;
      
      // Phase shifts from body movement/position
      for (let p = 0; p < numPeople; p++) {
        basePhase += (Math.random() - 0.5) * Math.PI / 4;
      }
      
      return basePhase % (2 * Math.PI);
    });

    return {
      timestamp: Date.now(),
      amplitude,
      phase,
      frequency: 2400,
      rssi: -40 - Math.random() * 10
    };
  }

  getAntennaConfig(): WiFiAntennaConfig[] {
    return this.antennas;
  }
}

// Simulates DensePose estimation from WiFi signals
export class DensePoseEstimator {
  private regionColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#AAB7B8',
    '#52C9B5', '#FF85A2', '#FFD93D', '#6BCB77', '#4D96FF'
  ];

  estimatePoses(signal: WiFiSignal, numPeople: number): HumanPose[] {
    const poses: HumanPose[] = [];

    for (let i = 0; i < numPeople; i++) {
      const baseX = 200 + i * 300;
      const baseY = 150;
      
      // Estimate from signal patterns (simulated)
      const confidence = 0.7 + Math.random() * 0.25;
      
      poses.push({
        id: `person_${i}`,
        confidence,
        keypoints: this.generateKeypoints(baseX, baseY, signal),
        denseRegions: this.generateDenseRegions(baseX, baseY, i),
        boundingBox: {
          x: baseX - 60,
          y: baseY - 80,
          width: 120,
          height: 280
        }
      });
    }

    return poses;
  }

  private generateKeypoints(baseX: number, baseY: number, signal: WiFiSignal) {
    // Simulate pose variation based on signal
    const avgAmplitude = signal.amplitude.reduce((a, b) => a + b, 0) / signal.amplitude.length;
    const movement = (avgAmplitude - 30) / 10;

    return {
      nose: { x: baseX, y: baseY, confidence: 0.95 },
      neck: { x: baseX, y: baseY + 40, confidence: 0.92 },
      right_shoulder: { x: baseX + 30, y: baseY + 45, confidence: 0.88 },
      left_shoulder: { x: baseX - 30, y: baseY + 45, confidence: 0.90 },
      right_elbow: { x: baseX + 40 + movement, y: baseY + 90, confidence: 0.85 },
      left_elbow: { x: baseX - 40 - movement, y: baseY + 90, confidence: 0.87 },
      right_wrist: { x: baseX + 45 + movement * 2, y: baseY + 130, confidence: 0.80 },
      left_wrist: { x: baseX - 45 - movement * 2, y: baseY + 130, confidence: 0.82 },
      right_hip: { x: baseX + 20, y: baseY + 110, confidence: 0.89 },
      left_hip: { x: baseX - 20, y: baseY + 110, confidence: 0.91 },
      right_knee: { x: baseX + 25, y: baseY + 170, confidence: 0.83 },
      left_knee: { x: baseX - 25, y: baseY + 170, confidence: 0.85 },
      right_ankle: { x: baseX + 30, y: baseY + 230, confidence: 0.78 },
      left_ankle: { x: baseX - 30, y: baseY + 230, confidence: 0.80 }
    };
  }

  private generateDenseRegions(baseX: number, baseY: number, personId: number): DensePoseRegion[] {
    const regions: DensePoseRegion[] = [];
    
    // Simulate UV coordinates for body regions
    const regionDefinitions = [
      { id: 1, name: 'head', center: [baseX, baseY], size: 25 },
      { id: 2, name: 'torso_front', center: [baseX, baseY + 70], size: 40 },
      { id: 3, name: 'left_upper_arm', center: [baseX - 35, baseY + 65], size: 15 },
      { id: 4, name: 'right_upper_arm', center: [baseX + 35, baseY + 65], size: 15 },
      { id: 5, name: 'left_forearm', center: [baseX - 42, baseY + 110], size: 12 },
      { id: 6, name: 'right_forearm', center: [baseX + 42, baseY + 110], size: 12 },
      { id: 7, name: 'left_thigh', center: [baseX - 22, baseY + 140], size: 18 },
      { id: 8, name: 'right_thigh', center: [baseX + 22, baseY + 140], size: 18 },
      { id: 9, name: 'left_calf', center: [baseX - 27, baseY + 200], size: 15 },
      { id: 10, name: 'right_calf', center: [baseX + 27, baseY + 200], size: 15 }
    ];

    regionDefinitions.forEach((def, idx) => {
      const uvPoints: [number, number][] = [];
      const numPoints = 8;
      
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;
        uvPoints.push([
          def.center[0] + Math.cos(angle) * def.size,
          def.center[1] + Math.sin(angle) * def.size
        ]);
      }

      regions.push({
        id: def.id,
        name: def.name,
        uvCoordinates: uvPoints,
        color: this.regionColors[idx % this.regionColors.length]
      });
    });

    return regions;
  }
}
