// Frequency scanner hook
import { useState, useEffect } from 'react';
import { FrequencyReading, FrequencyBand } from '../types';
import { frequencyScanner } from '../services/frequencyScanner';

export function useFrequencyScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [readings, setReadings] = useState<FrequencyReading[]>([]);
  const [currentBand, setCurrentBand] = useState<FrequencyBand>('audio');

  useEffect(() => {
    if (!isScanning) return;

    const unsubscribe = frequencyScanner.onReading((reading) => {
      setReadings(prev => {
        const newReadings = [...prev, reading];
        // Keep last 100 readings for waterfall
        return newReadings.slice(-100);
      });
    });

    return () => {
      unsubscribe();
    };
  }, [isScanning]);

  const startScan = async (band: FrequencyBand) => {
    setCurrentBand(band);
    setIsScanning(true);
    setReadings([]);

    switch (band) {
      case 'audio':
        await frequencyScanner.startAudioScan();
        break;
      case 'emf':
        await frequencyScanner.startEMFScan();
        break;
      case 'wifi':
      case 'bluetooth':
        await frequencyScanner.startWiFiScan();
        break;
    }
  };

  const stopScan = () => {
    frequencyScanner.stopScan();
    setIsScanning(false);
  };

  return {
    isScanning,
    readings,
    currentBand,
    startScan,
    stopScan,
  };
}
