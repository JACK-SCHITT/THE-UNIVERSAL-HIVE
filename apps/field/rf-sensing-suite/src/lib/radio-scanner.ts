import { RadioSignal, RadioBand, RADIO_BANDS } from '@/types/radio-bands';

export class RadioScanner {
  private scanInterval: number = 100; // ms
  private activeSignals: Map<string, RadioSignal> = new Map();

  // Simulate scanning a frequency range
  scanBand(band: RadioBand, samplingRate: number = 10): RadioSignal[] {
    const signals: RadioSignal[] = [];
    const [startFreq, endFreq] = band.frequencyRange;
    const step = (endFreq - startFreq) / samplingRate;

    for (let freq = startFreq; freq <= endFreq; freq += step) {
      // Simulate signal detection probability
      if (Math.random() > 0.7) {
        const signal = this.generateSignal(freq, band);
        signals.push(signal);
      }
    }

    return signals;
  }

  // Generate a simulated signal
  private generateSignal(frequency: number, band: RadioBand): RadioSignal {
    // Determine bandwidth based on modulation
    const bandwidth = this.getBandwidth(band.modulation);
    
    // Signal strength varies by band and conditions
    const baseStrength = -120; // Very weak signal
    const maxStrength = -20;   // Very strong signal
    const strength = baseStrength + Math.random() * (maxStrength - baseStrength);

    // Simulate decoded content for some signals
    let decoded: string | undefined;
    if (strength > -60 && Math.random() > 0.5) {
      decoded = this.simulateDecoding(band);
    }

    return {
      frequency,
      bandwidth,
      strength,
      modulation: band.modulation,
      timestamp: Date.now(),
      decoded
    };
  }

  private getBandwidth(modulation: string): number {
    switch (modulation) {
      case 'AM': return 10e3;      // 10 kHz
      case 'FM': return 200e3;     // 200 kHz (wideband FM)
      case 'SSB': return 2.7e3;    // 2.7 kHz
      case 'Digital': return 20e6; // 20 MHz (WiFi)
      default: return 25e3;        // 25 kHz
    }
  }

  private simulateDecoding(band: RadioBand): string {
    const decodings: Record<string, string[]> = {
      'FM Broadcast': [
        '♪ Music playing...',
        'News broadcast',
        'DJ talking',
        'Commercial advertisement',
        'Traffic report'
      ],
      'AM Broadcast': [
        'Talk radio discussion',
        'Sports commentary',
        'News update',
        'Religious programming',
        'Weather forecast'
      ],
      'CB Radio (Citizens Band)': [
        'Breaker one-nine, looking for smokey reports',
        '10-4 good buddy, clear road ahead',
        'Channel check',
        'Anyone got their ears on?',
        'Copy that, over and out'
      ],
      'Marine VHF': [
        'Security call - Pan Pan',
        'Vessel traffic information',
        'Marina calling',
        'Weather update for mariners',
        'Bridge opening schedule'
      ],
      'Aviation VHF': [
        'Tower: Clear for takeoff runway 27',
        'Aircraft: Requesting flight following',
        'ATIS: Wind 270 at 10, visibility 10 miles',
        'Approach: Descend and maintain 3000',
        'Ground: Taxi to runway via Alpha'
      ],
      'NOAA Weather Radio': [
        'Current temperature 72°F, partly cloudy',
        'Severe thunderstorm watch in effect',
        'Marine forecast: Winds 10-15 knots',
        'UV index: 8 (very high)',
        'Air quality: Good'
      ]
    };

    const messages = decodings[band.name] || ['Signal detected'];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Continuous scan simulation
  continuousScan(bands: RadioBand[], callback: (signals: RadioSignal[]) => void): () => void {
    const interval = setInterval(() => {
      const allSignals: RadioSignal[] = [];
      
      // Randomly scan 1-3 bands per cycle
      const numBands = Math.min(1 + Math.floor(Math.random() * 3), bands.length);
      const selectedBands = this.getRandomBands(bands, numBands);

      selectedBands.forEach(band => {
        const signals = this.scanBand(band, 5);
        allSignals.push(...signals);
      });

      callback(allSignals);
    }, this.scanInterval);

    return () => clearInterval(interval);
  }

  private getRandomBands(bands: RadioBand[], count: number): RadioBand[] {
    const shuffled = [...bands].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // Generate waterfall display data
  generateWaterfallData(
    band: RadioBand,
    width: number,
    height: number
  ): number[][] {
    const data: number[][] = [];
    const [startFreq, endFreq] = band.frequencyRange;

    for (let y = 0; y < height; y++) {
      const row: number[] = [];
      for (let x = 0; x < width; x++) {
        const freq = startFreq + (x / width) * (endFreq - startFreq);
        
        // Simulate signal strength at this frequency/time
        const baseNoise = -110;
        let strength = baseNoise + Math.random() * 10; // Noise floor

        // Add occasional signals
        if (Math.random() > 0.95) {
          strength += 40 + Math.random() * 30; // Signal spike
        }

        // Normalize to 0-255 for visualization
        const normalized = Math.max(0, Math.min(255, ((strength + 120) / 100) * 255));
        row.push(normalized);
      }
      data.push(row);
    }

    return data;
  }
}
