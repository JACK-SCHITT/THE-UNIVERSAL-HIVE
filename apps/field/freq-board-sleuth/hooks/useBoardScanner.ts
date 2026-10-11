// Board scanner hook
import { useState } from 'react';
import { BoardAnalysis } from '../types';
import { componentDetector } from '../services/componentDetector';

export function useBoardScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [analysis, setAnalysis] = useState<BoardAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scanBoard = async (imageUri: string) => {
    setIsScanning(true);
    setError(null);

    try {
      // Check for QR code first
      const qrData = await componentDetector.scanQRCode(imageUri);
      
      // Analyze components
      const result = await componentDetector.analyzeBoard(imageUri);
      
      if (qrData) {
        result.modelGuess = `QR detected: ${qrData}`;
      }
      
      setAnalysis(result);
    } catch (err) {
      setError('Failed to analyze board');
    } finally {
      setIsScanning(false);
    }
  };

  const clearAnalysis = () => {
    setAnalysis(null);
    setError(null);
  };

  return {
    isScanning,
    analysis,
    error,
    scanBoard,
    clearAnalysis,
  };
}
