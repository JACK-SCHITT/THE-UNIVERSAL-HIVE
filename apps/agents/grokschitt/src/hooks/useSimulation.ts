/**
 * Real-time simulation engine for RuView WiFi sensing, Robotics, and Smart Building
 * Uses physically-based algorithms to generate realistic data
 */
import { create } from 'zustand';

// ── WiFi CSI Signal Simulation ────────────────────────────────────────────
export interface Person {
  id: number;
  x: number;  // 0-1 normalized position
  y: number;
  vx: number; // velocity
  vy: number;
  heartRate: number;
  breathingRate: number;
  hrv: number;
  spo2: number;
  status: 'normal' | 'warning' | 'alert';
  poseKeypoints: number[][]; // 17 keypoints [x,y]
}

export interface ESP32Node {
  id: string;
  name: string;
  x: number;
  y: number;
  csiQuality: number;
  batteryLevel: number;
  temperature: number;
  firmwareVersion: string;
  online: boolean;
  packetsPerSecond: number;
}

export interface RobotUnit {
  id: string;
  type: 'cobot' | 'amr';
  x: number;
  y: number;
  heading: number;
  speed: number;
  status: 'idle' | 'operating' | 'slow' | 'stopped';
  safetyZone: number; // radius in meters
  detectedHumans: number[];
  collisionsPrevented: number;
}

export interface BuildingRoom {
  id: string;
  name: string;
  zone: string;
  occupied: boolean;
  peopleCount: number;
  temperature: number;
  targetTemp: number;
  hvacActive: boolean;
  lightLevel: number; // 0-100%
  energyWatts: number;
}

interface SimulationState {
  // RuView
  persons: Person[];
  nodes: ESP32Node[];
  csiQuality: number;
  totalDetections: number;
  avgHeartRate: number;
  avgBreathingRate: number;
  
  // Robotics
  robots: RobotUnit[];
  totalCollisionsPrevented: number;
  safetyAlerts: number;
  
  // Building
  rooms: BuildingRoom[];
  totalEnergySavings: number;
  buildingOccupancy: number;
  
  // Tick
  tick: number;
  update: () => void;
  startSimulation: () => void;
  stopSimulation: () => void;
  _intervalId: ReturnType<typeof setInterval> | null;
}

// ── Physically-based vital signs simulation ────────────────────────────────
function simulateVitals(person: Person, tick: number): Partial<Person> {
  const t = tick / 100;
  // Breathing: 0.1-0.5 Hz bandpass → 6-30 BPM
  const breathing = person.breathingRate + 1.5 * Math.sin(t * 0.3 + person.id);
  // Heart rate: 0.8-2.0 Hz bandpass → 40-120 BPM  
  const hr = person.heartRate + 4 * Math.sin(t * 0.8 + person.id * 1.3);
  const hrClamped = Math.max(50, Math.min(115, hr));
  const status: Person['status'] = hrClamped > 100 ? 'warning' : 'normal';
  return {
    heartRate: hrClamped,
    breathingRate: Math.max(8, Math.min(28, breathing)),
    hrv: person.hrv + 0.5 * Math.sin(t * 0.15),
    status,
  };
}

// ── Pose keypoints simulation (17-point COCO skeleton) ─────────────────────
function simulatePose(person: Person, tick: number): number[][] {
  const t = tick / 100;
  const cx = person.x;
  const cy = person.y;
  const breathAmp = 0.005 * Math.sin(t * person.breathingRate * 0.1);
  
  // Simplified 17-keypoint skeleton
  return [
    [cx, cy - 0.12 + breathAmp],         // 0: nose
    [cx - 0.015, cy - 0.13 + breathAmp], // 1: left_eye
    [cx + 0.015, cy - 0.13 + breathAmp], // 2: right_eye
    [cx - 0.03, cy - 0.115 + breathAmp], // 3: left_ear
    [cx + 0.03, cy - 0.115 + breathAmp], // 4: right_ear
    [cx - 0.06, cy - 0.05 + breathAmp],  // 5: left_shoulder
    [cx + 0.06, cy - 0.05 + breathAmp],  // 6: right_shoulder
    [cx - 0.07, cy + 0.02],               // 7: left_elbow
    [cx + 0.07, cy + 0.02],               // 8: right_elbow
    [cx - 0.06, cy + 0.08],               // 9: left_wrist
    [cx + 0.06, cy + 0.08],               // 10: right_wrist
    [cx - 0.04, cy + 0.04],               // 11: left_hip
    [cx + 0.04, cy + 0.04],               // 12: right_hip
    [cx - 0.04 + 0.01 * Math.sin(t * 2 + person.id), cy + 0.1], // 13: left_knee
    [cx + 0.04 - 0.01 * Math.sin(t * 2 + person.id), cy + 0.1], // 14: right_knee
    [cx - 0.04, cy + 0.16],               // 15: left_ankle
    [cx + 0.04, cy + 0.16],               // 16: right_ankle
  ];
}

// ── Initial state ──────────────────────────────────────────────────────────
const INITIAL_PERSONS: Person[] = [
  { id: 1, x: 0.25, y: 0.35, vx: 0.0008, vy: 0.0005, heartRate: 72, breathingRate: 16, hrv: 45, spo2: 98, status: 'normal', poseKeypoints: [] },
  { id: 2, x: 0.65, y: 0.45, vx: -0.0006, vy: 0.0003, heartRate: 68, breathingRate: 14, hrv: 52, spo2: 97, status: 'normal', poseKeypoints: [] },
  { id: 3, x: 0.45, y: 0.7, vx: 0.0004, vy: -0.0007, heartRate: 85, breathingRate: 20, hrv: 38, spo2: 96, status: 'warning', poseKeypoints: [] },
];

const INITIAL_NODES: ESP32Node[] = [
  { id: 'node-1', name: 'Node Alpha', x: 0.05, y: 0.05, csiQuality: 98, batteryLevel: 94, temperature: 42, firmwareVersion: '2.3.1', online: true, packetsPerSecond: 54000 },
  { id: 'node-2', name: 'Node Beta', x: 0.95, y: 0.05, csiQuality: 96, batteryLevel: 87, temperature: 44, firmwareVersion: '2.3.1', online: true, packetsPerSecond: 52800 },
  { id: 'node-3', name: 'Node Gamma', x: 0.05, y: 0.95, csiQuality: 94, batteryLevel: 71, temperature: 43, firmwareVersion: '2.3.0', online: true, packetsPerSecond: 51200 },
  { id: 'node-4', name: 'Node Delta', x: 0.95, y: 0.95, csiQuality: 97, batteryLevel: 98, temperature: 41, firmwareVersion: '2.3.1', online: true, packetsPerSecond: 53600 },
  { id: 'node-5', name: 'Node Epsilon', x: 0.5, y: 0.05, csiQuality: 91, batteryLevel: 55, temperature: 46, firmwareVersion: '2.2.9', online: true, packetsPerSecond: 49800 },
  { id: 'node-6', name: 'Node Zeta', x: 0.5, y: 0.95, csiQuality: 88, batteryLevel: 32, temperature: 48, firmwareVersion: '2.2.9', online: false, packetsPerSecond: 0 },
];

const INITIAL_ROBOTS: RobotUnit[] = [
  { id: 'cobot-01', type: 'cobot', x: 0.2, y: 0.3, heading: 0, speed: 0.2, status: 'operating', safetyZone: 1.5, detectedHumans: [], collisionsPrevented: 23 },
  { id: 'cobot-02', type: 'cobot', x: 0.7, y: 0.3, heading: Math.PI, speed: 0.15, status: 'slow', safetyZone: 1.5, detectedHumans: [1], collisionsPrevented: 31 },
  { id: 'amr-01', type: 'amr', x: 0.1, y: 0.7, heading: Math.PI / 4, speed: 0.8, status: 'operating', safetyZone: 2.0, detectedHumans: [], collisionsPrevented: 47 },
  { id: 'amr-02', type: 'amr', x: 0.5, y: 0.5, heading: -Math.PI / 3, speed: 0.6, status: 'operating', safetyZone: 2.0, detectedHumans: [], collisionsPrevented: 46 },
];

const INITIAL_ROOMS: BuildingRoom[] = [
  { id: 'conf-a', name: 'Conference A', zone: 'Floor 1', occupied: true, peopleCount: 6, temperature: 22.3, targetTemp: 22, hvacActive: true, lightLevel: 100, energyWatts: 2400 },
  { id: 'conf-b', name: 'Conference B', zone: 'Floor 1', occupied: false, peopleCount: 0, temperature: 18.1, targetTemp: 18, hvacActive: false, lightLevel: 0, energyWatts: 50 },
  { id: 'office-1', name: 'Office 1', zone: 'Floor 1', occupied: true, peopleCount: 12, temperature: 21.8, targetTemp: 22, hvacActive: true, lightLevel: 90, energyWatts: 3200 },
  { id: 'office-2', name: 'Office 2', zone: 'Floor 1', occupied: true, peopleCount: 8, temperature: 22.1, targetTemp: 22, hvacActive: true, lightLevel: 85, energyWatts: 2800 },
  { id: 'break-room', name: 'Break Room', zone: 'Floor 2', occupied: false, peopleCount: 0, temperature: 19.5, targetTemp: 19, hvacActive: false, lightLevel: 0, energyWatts: 80 },
  { id: 'office-3', name: 'Office 3', zone: 'Floor 2', occupied: true, peopleCount: 4, temperature: 22.5, targetTemp: 22, hvacActive: true, lightLevel: 75, energyWatts: 1800 },
  { id: 'lab', name: 'Lab', zone: 'Floor 2', occupied: false, peopleCount: 0, temperature: 20.2, targetTemp: 20, hvacActive: false, lightLevel: 0, energyWatts: 120 },
  { id: 'reception', name: 'Reception', zone: 'Floor 1', occupied: true, peopleCount: 2, temperature: 21.5, targetTemp: 22, hvacActive: true, lightLevel: 100, energyWatts: 900 },
];

export const useSimulation = create<SimulationState>((set, get) => ({
  persons: INITIAL_PERSONS.map(p => ({ ...p, poseKeypoints: simulatePose(p, 0) })),
  nodes: INITIAL_NODES,
  csiQuality: 95,
  totalDetections: 0,
  avgHeartRate: 75,
  avgBreathingRate: 16,

  robots: INITIAL_ROBOTS,
  totalCollisionsPrevented: 147,
  safetyAlerts: 0,

  rooms: INITIAL_ROOMS,
  totalEnergySavings: 24,
  buildingOccupancy: 32,

  tick: 0,
  _intervalId: null,

  update: () => {
    const state = get();
    const tick = state.tick + 1;

    // ── Update persons (physics + vitals + pose) ──
    const persons = state.persons.map(p => {
      // Brownian motion-like movement
      let nx = p.x + p.vx + (Math.random() - 0.5) * 0.001;
      let ny = p.y + p.vy + (Math.random() - 0.5) * 0.001;
      let nvx = p.vx;
      let nvy = p.vy;

      // Bounce off walls
      if (nx < 0.05 || nx > 0.95) { nvx = -nvx; nx = Math.max(0.05, Math.min(0.95, nx)); }
      if (ny < 0.05 || ny > 0.95) { nvy = -nvy; ny = Math.max(0.05, Math.min(0.95, ny)); }

      const vitals = simulateVitals({ ...p, x: nx, y: ny }, tick);
      const pose = simulatePose({ ...p, x: nx, y: ny }, tick);

      return { ...p, x: nx, y: ny, vx: nvx, vy: nvy, ...vitals, poseKeypoints: pose };
    });

    const avgHR = persons.reduce((s, p) => s + p.heartRate, 0) / persons.length;
    const avgBR = persons.reduce((s, p) => s + p.breathingRate, 0) / persons.length;

    // ── Update nodes ──
    const nodes = state.nodes.map(n => ({
      ...n,
      csiQuality: n.online ? Math.min(100, Math.max(70, n.csiQuality + (Math.random() - 0.5) * 0.5)) : 0,
      batteryLevel: n.online ? Math.max(0, n.batteryLevel - 0.001) : n.batteryLevel,
      packetsPerSecond: n.online ? Math.round(54000 + (Math.random() - 0.5) * 2000) : 0,
      temperature: n.online ? Math.max(35, Math.min(65, n.temperature + (Math.random() - 0.5) * 0.3)) : n.temperature,
    }));

    const avgCSI = nodes.filter(n => n.online).reduce((s, n) => s + n.csiQuality, 0) / nodes.filter(n => n.online).length;

    // ── Update robots (path + safety) ──
    let safetyAlerts = 0;
    const robots = state.robots.map(r => {
      // Move robot along its heading
      const speed = r.speed * 0.001;
      let nx = r.x + Math.cos(r.heading) * speed;
      let ny = r.y + Math.sin(r.heading) * speed;
      let heading = r.heading + (Math.random() - 0.5) * 0.05;

      if (nx < 0.05 || nx > 0.95) { heading = Math.PI - heading; nx = Math.max(0.05, Math.min(0.95, nx)); }
      if (ny < 0.05 || ny > 0.95) { heading = -heading; ny = Math.max(0.05, Math.min(0.95, ny)); }

      // Detect nearby humans (WiFi sensing)
      const detectedHumans = persons
        .filter(p => {
          const dist = Math.sqrt(Math.pow(p.x - nx, 2) + Math.pow(p.y - ny, 2));
          return dist < r.safetyZone / 10;
        })
        .map(p => p.id);

      let status: RobotUnit['status'] = 'operating';
      if (detectedHumans.length > 0) {
        status = detectedHumans.length > 1 ? 'stopped' : 'slow';
        safetyAlerts++;
      }

      return { ...r, x: nx, y: ny, heading, status, detectedHumans };
    });

    // ── Update rooms (HVAC + occupancy simulation) ──
    const rooms = state.rooms.map(r => {
      // Occasionally toggle occupancy
      let occupied = r.occupied;
      let peopleCount = r.peopleCount;

      if (tick % 500 === 0 && Math.random() < 0.3) {
        occupied = !occupied;
        peopleCount = occupied ? Math.floor(Math.random() * 10) + 1 : 0;
      }

      // HVAC logic: heat/cool toward target
      const hvacActive = occupied;
      const tempDelta = occupied
        ? (r.targetTemp - r.temperature) * 0.01
        : (18 - r.temperature) * 0.005; // Eco mode when empty

      const lightLevel = occupied ? Math.min(100, r.lightLevel + 1) : Math.max(0, r.lightLevel - 2);
      const energyWatts = occupied ? r.energyWatts + (Math.random() - 0.5) * 50 : r.energyWatts * 0.98;

      return {
        ...r,
        occupied,
        peopleCount,
        hvacActive,
        temperature: Math.round((r.temperature + tempDelta) * 10) / 10,
        lightLevel: Math.round(lightLevel),
        energyWatts: Math.round(Math.max(30, energyWatts)),
      };
    });

    const occupiedRooms = rooms.filter(r => r.occupied).length;
    const totalPeople = rooms.reduce((s, r) => s + r.peopleCount, 0);
    const maxPossibleEnergy = rooms.reduce((s, r) => s + (r.energyWatts * 1.3), 0);
    const actualEnergy = rooms.reduce((s, r) => s + r.energyWatts, 0);
    const savings = Math.round((1 - actualEnergy / maxPossibleEnergy) * 100);

    set({
      tick,
      persons,
      nodes,
      csiQuality: Math.round(avgCSI),
      avgHeartRate: Math.round(avgHR),
      avgBreathingRate: Math.round(avgBR),
      totalDetections: state.totalDetections + persons.length,
      robots,
      safetyAlerts,
      totalCollisionsPrevented: state.totalCollisionsPrevented + (safetyAlerts > 0 ? 1 : 0),
      rooms,
      totalEnergySavings: savings,
      buildingOccupancy: totalPeople,
    });
  },

  startSimulation: () => {
    const state = get();
    if (state._intervalId) return;
    const id = setInterval(() => get().update(), 100);
    set({ _intervalId: id });
  },

  stopSimulation: () => {
    const state = get();
    if (state._intervalId) {
      clearInterval(state._intervalId);
      set({ _intervalId: null });
    }
  },
}));
