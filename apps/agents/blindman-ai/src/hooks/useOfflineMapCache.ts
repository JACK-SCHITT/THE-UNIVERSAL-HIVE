import { useCallback, useEffect, useRef, useState } from 'react';
import { SavedPlace } from '@/types';
import { getPlaces } from '@/lib/storage';

const TILE_CACHE_NAME = 'blindman-map-tiles-v1';
const TILE_ZOOM = 16; // zoom level for caching

/** Convert lat/lng to tile x/y at a given zoom level (OSM formula). */
function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

/** Build tile URLs for a 3×3 grid around a lat/lng (covers ~500m radius at zoom 16). */
function getTileUrls(lat: number, lng: number, zoom = TILE_ZOOM): string[] {
  const { x, y } = latLngToTile(lat, lng, zoom);
  const urls: string[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      urls.push(`https://tile.openstreetmap.org/${zoom}/${x + dx}/${y + dy}.png`);
    }
  }
  return urls;
}

export interface CacheStatus {
  total: number;
  cached: number;
  isSupported: boolean;
}

export function useOfflineMapCache() {
  const [status, setStatus] = useState<CacheStatus>({ total: 0, cached: 0, isSupported: false });
  const [isCaching, setIsCaching] = useState(false);
  const abortRef = useRef(false);

  useEffect(() => {
    setStatus(s => ({ ...s, isSupported: 'caches' in window }));
  }, []);

  const cacheAllPlaces = useCallback(async (): Promise<{ cached: number; total: number }> => {
    if (!('caches' in window)) return { cached: 0, total: 0 };

    const places = getPlaces();
    if (!places.length) return { cached: 0, total: 0 };

    setIsCaching(true);
    abortRef.current = false;

    // Collect all tile URLs
    const allUrls: string[] = [];
    for (const place of places) {
      allUrls.push(...getTileUrls(place.lat, place.lng));
    }

    const uniqueUrls = [...new Set(allUrls)];
    setStatus(s => ({ ...s, total: uniqueUrls.length, cached: 0 }));

    let cachedCount = 0;
    const cache = await caches.open(TILE_CACHE_NAME);

    for (const url of uniqueUrls) {
      if (abortRef.current) break;
      try {
        const existing = await cache.match(url);
        if (!existing) {
          const response = await fetch(url, { mode: 'no-cors' });
          await cache.put(url, response);
        }
        cachedCount++;
        setStatus(s => ({ ...s, cached: cachedCount }));
      } catch (err) {
        console.warn('[OfflineMap] Failed to cache:', url, err);
        cachedCount++;
        setStatus(s => ({ ...s, cached: cachedCount }));
      }
    }

    setIsCaching(false);
    return { cached: cachedCount, total: uniqueUrls.length };
  }, []);

  const cacheSinglePlace = useCallback(async (place: SavedPlace): Promise<boolean> => {
    if (!('caches' in window)) return false;
    try {
      const cache = await caches.open(TILE_CACHE_NAME);
      const urls = getTileUrls(place.lat, place.lng);
      for (const url of urls) {
        const existing = await cache.match(url);
        if (!existing) {
          const response = await fetch(url, { mode: 'no-cors' });
          await cache.put(url, response);
        }
      }
      return true;
    } catch (err) {
      console.error('[OfflineMap] Cache single place failed:', err);
      return false;
    }
  }, []);

  const getCacheSize = useCallback(async (): Promise<number> => {
    if (!('caches' in window)) return 0;
    const cache = await caches.open(TILE_CACHE_NAME);
    const keys = await cache.keys();
    return keys.length;
  }, []);

  const clearCache = useCallback(async (): Promise<void> => {
    if ('caches' in window) {
      await caches.delete(TILE_CACHE_NAME);
      setStatus(s => ({ ...s, cached: 0, total: 0 }));
    }
  }, []);

  const stopCaching = useCallback(() => {
    abortRef.current = true;
    setIsCaching(false);
  }, []);

  return { status, isCaching, cacheAllPlaces, cacheSinglePlace, getCacheSize, clearCache, stopCaching };
}
