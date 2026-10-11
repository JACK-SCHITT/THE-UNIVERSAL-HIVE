export interface SavedPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  accuracy?: number;
  voiceNote?: string; // base64 audio
  voiceNoteTranscript?: string;
  imageData?: string; // base64 image
  tags?: string[];
  createdAt: number;
  lastVisited?: number;
}

export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: number;
  voiceNote?: string;
  landmark?: string;
  heading?: number;
}

export interface SavedRoute {
  id: string;
  name: string;
  destinationPlaceId?: string;
  destinationName: string;
  points: RoutePoint[];
  totalDistance?: number;
  duration?: number;
  createdAt: number;
  useCount: number;
}

export interface NavigationState {
  active: boolean;
  paused: boolean;
  routeId?: string;
  destinationPlace?: SavedPlace;
  currentPointIndex: number;
  lastInstruction?: string;
  deviationDetected: boolean;
}

export interface AppSettings {
  voiceSpeed: number; // 0.5 - 2.0
  voicePitch: number;
  voiceVolume: number;
  language: string;
  aggressiveMode: boolean; // spicy language on/off
  compassEnabled: boolean;
  offlineTTS: boolean;
}

export type AppMode = 
  | 'idle'
  | 'listening'
  | 'navigating'
  | 'recording-route'
  | 'saving-place'
  | 'recording-voice-note'
  | 'settings'
  | 'places-list'
  | 'routes-list';

export interface CommandResult {
  action: string;
  params?: Record<string, string>;
  response: string;
}
