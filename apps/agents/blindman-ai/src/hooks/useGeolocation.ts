import { useCallback, useEffect, useRef, useState } from 'react';

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

interface GeolocationOptions {
  onPosition?: (pos: GeoPosition) => void;
  onError?: (err: string) => void;
  watchMode?: boolean;
}

export function useGeolocation(options: GeolocationOptions = {}) {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const parsePosition = (pos: GeolocationPosition): GeoPosition => ({
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
    heading: pos.coords.heading ?? undefined,
    speed: pos.coords.speed ?? undefined,
    timestamp: pos.timestamp,
  });

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    const geoPos = parsePosition(pos);
    setPosition(geoPos);
    setError(null);
    options.onPosition?.(geoPos);
  }, [options]);

  const handleError = useCallback((err: GeolocationPositionError) => {
    const msg = err.code === 1
      ? 'Location access denied — enable it in browser settings'
      : err.code === 2
      ? 'Signal is dogshit — position unavailable'
      : 'GPS timeout — try again';
    setError(msg);
    options.onError?.(msg);
  }, [options]);

  const getCurrentPosition = useCallback(() => {
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    });
  }, [handleSuccess, handleError]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    setIsTracking(true);
    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 2000,
    });
  }, [handleSuccess, handleError]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { position, error, isTracking, getCurrentPosition, startTracking, stopTracking };
}
