export interface WiFiSignal {
  timestamp: number;
  amplitude: number[];
  phase: number[];
  frequency: number; // MHz
  rssi: number; // dBm
}

export interface PoseKeypoint {
  x: number;
  y: number;
  confidence: number;
}

export interface DensePoseRegion {
  id: number;
  name: string;
  uvCoordinates: [number, number][];
  color: string;
}

export interface HumanPose {
  id: string;
  keypoints: Record<string, PoseKeypoint>;
  denseRegions: DensePoseRegion[];
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface WiFiAntennaConfig {
  id: string;
  position: [number, number, number]; // x, y, z in meters
  frequency: number; // 2.4 or 5 GHz
  status: 'active' | 'inactive';
}

export const BODY_REGIONS = [
  'head', 'torso_front', 'torso_back', 
  'left_upper_arm', 'right_upper_arm',
  'left_forearm', 'right_forearm',
  'left_hand', 'right_hand',
  'left_thigh', 'right_thigh',
  'left_calf', 'right_calf',
  'left_foot', 'right_foot'
] as const;

export type BodyRegion = typeof BODY_REGIONS[number];
