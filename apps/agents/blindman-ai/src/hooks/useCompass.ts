import { useCallback, useEffect, useRef, useState } from 'react';

export function useCompass() {
  const [heading, setHeading] = useState<number | null>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if ('DeviceOrientationEvent' in window) {
      setSupported(true);
    }
  }, []);

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    // webkitCompassHeading is iOS, alpha is Android (inverted)
    const compassHeading = (event as any).webkitCompassHeading;
    if (compassHeading !== undefined && compassHeading !== null) {
      setHeading(Math.round(compassHeading));
    } else if (event.alpha !== null) {
      // Convert alpha to compass heading
      const alpha = event.alpha!;
      const heading = (360 - alpha) % 360;
      setHeading(Math.round(heading));
    }
  }, []);

  const startCompass = useCallback(async () => {
    if (!supported) return;

    // Request permission on iOS 13+
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const perm = await (DeviceOrientationEvent as any).requestPermission();
        if (perm !== 'granted') return;
      } catch {
        return;
      }
    }

    window.addEventListener('deviceorientation', handleOrientation, true);
  }, [supported, handleOrientation]);

  const stopCompass = useCallback(() => {
    window.removeEventListener('deviceorientation', handleOrientation, true);
  }, [handleOrientation]);

  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [handleOrientation]);

  const getDirectionName = useCallback((h: number): string => {
    const dirs = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
    return dirs[Math.round(h / 45) % 8];
  }, []);

  return { heading, supported, startCompass, stopCompass, getDirectionName };
}
