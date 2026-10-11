import { SavedPlace, SavedRoute, AppSettings } from '@/types';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '@/constants';

// ---- PLACES ----
export function getPlaces(): SavedPlace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLACES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePlace(place: SavedPlace): void {
  const places = getPlaces();
  const idx = places.findIndex(p => p.id === place.id);
  if (idx >= 0) {
    places[idx] = place;
  } else {
    places.push(place);
  }
  localStorage.setItem(STORAGE_KEYS.PLACES, JSON.stringify(places));
}

export function deletePlace(id: string): void {
  const places = getPlaces().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.PLACES, JSON.stringify(places));
}

export function findPlaceByName(query: string): SavedPlace | undefined {
  const places = getPlaces();
  const q = query.toLowerCase().trim();
  // exact match first
  let match = places.find(p => p.name.toLowerCase() === q);
  if (match) return match;
  // partial match
  match = places.find(p => p.name.toLowerCase().includes(q) || q.includes(p.name.toLowerCase()));
  return match;
}

export function findNearestPlace(lat: number, lng: number): { place: SavedPlace; distance: number } | null {
  const places = getPlaces();
  if (!places.length) return null;
  let nearest: SavedPlace | null = null;
  let minDist = Infinity;
  for (const p of places) {
    const d = getDistance(lat, lng, p.lat, p.lng);
    if (d < minDist) {
      minDist = d;
      nearest = p;
    }
  }
  return nearest ? { place: nearest, distance: minDist } : null;
}

// ---- ROUTES ----
export function getRoutes(): SavedRoute[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ROUTES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRoute(route: SavedRoute): void {
  const routes = getRoutes();
  const idx = routes.findIndex(r => r.id === route.id);
  if (idx >= 0) {
    routes[idx] = route;
  } else {
    routes.push(route);
  }
  localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(routes));
}

export function deleteRoute(id: string): void {
  const routes = getRoutes().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(routes));
}

export function findRouteByName(query: string): SavedRoute | undefined {
  const routes = getRoutes();
  const q = query.toLowerCase().trim();
  let match = routes.find(r => r.name.toLowerCase() === q);
  if (!match) match = routes.find(r => r.name.toLowerCase().includes(q) || q.includes(r.name.toLowerCase()));
  return match;
}

// ---- SETTINGS ----
export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function isOnboarded(): boolean {
  return localStorage.getItem(STORAGE_KEYS.ONBOARDED) === 'true';
}

export function setOnboarded(): void {
  localStorage.setItem(STORAGE_KEYS.ONBOARDED, 'true');
}

// ---- UTILS ----
export function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const lat1R = (lat1 * Math.PI) / 180;
  const lat2R = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2R);
  const x = Math.cos(lat1R) * Math.sin(lat2R) - Math.sin(lat1R) * Math.cos(lat2R) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function bearingToDirection(bearing: number): string {
  const dirs = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
  return dirs[Math.round(bearing / 45) % 8];
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function metersToFeet(m: number): number {
  return Math.round(m * 3.28084);
}

export function exportData(): void {
  const data = {
    places: getPlaces(),
    routes: getRoutes(),
    exportedAt: new Date().toISOString(),
    version: '1.0',
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `blindman-backup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
