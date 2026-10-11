// FFT (Fast Fourier Transform) implementation for audio spectrum analysis
// Cooley-Tukey FFT algorithm

export interface ComplexNumber {
  real: number;
  imag: number;
}

export function fft(samples: number[]): ComplexNumber[] {
  const n = samples.length;
  
  // Ensure power of 2
  if (n === 1) {
    return [{ real: samples[0], imag: 0 }];
  }
  
  // Split into even and odd
  const even: number[] = [];
  const odd: number[] = [];
  
  for (let i = 0; i < n; i += 2) {
    even.push(samples[i]);
    if (i + 1 < n) {
      odd.push(samples[i + 1]);
    }
  }
  
  // Recursive FFT
  const evenFFT = fft(even);
  const oddFFT = fft(odd);
  
  // Combine results
  const result: ComplexNumber[] = new Array(n);
  
  for (let k = 0; k < n / 2; k++) {
    const angle = -2 * Math.PI * k / n;
    const twiddle = {
      real: Math.cos(angle),
      imag: Math.sin(angle),
    };
    
    const oddTerm = complexMultiply(twiddle, oddFFT[k % oddFFT.length]);
    
    result[k] = complexAdd(evenFFT[k % evenFFT.length], oddTerm);
    result[k + n / 2] = complexSubtract(evenFFT[k % evenFFT.length], oddTerm);
  }
  
  return result;
}

export function getMagnitude(complex: ComplexNumber): number {
  return Math.sqrt(complex.real * complex.real + complex.imag * complex.imag);
}

export function complexMultiply(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  return {
    real: a.real * b.real - a.imag * b.imag,
    imag: a.real * b.imag + a.imag * b.real,
  };
}

export function complexAdd(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  return {
    real: a.real + b.real,
    imag: a.imag + b.imag,
  };
}

export function complexSubtract(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  return {
    real: a.real - b.real,
    imag: a.imag - b.imag,
  };
}

// Apply window function to reduce spectral leakage
export function applyHammingWindow(samples: number[]): number[] {
  const n = samples.length;
  return samples.map((sample, i) => {
    const window = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (n - 1));
    return sample * window;
  });
}

// Convert amplitude to dB
export function amplitudeToDb(amplitude: number): number {
  return 20 * Math.log10(Math.max(amplitude, 1e-10));
}

// Find peaks in frequency spectrum
export function findPeaks(magnitudes: number[], threshold: number = 0.5): number[] {
  const peaks: number[] = [];
  const maxMag = Math.max(...magnitudes);
  
  for (let i = 1; i < magnitudes.length - 1; i++) {
    const current = magnitudes[i];
    const prev = magnitudes[i - 1];
    const next = magnitudes[i + 1];
    
    // Local maximum and above threshold
    if (current > prev && current > next && current > maxMag * threshold) {
      peaks.push(i);
    }
  }
  
  return peaks;
}

// Detect harmonics (integer multiples of fundamental frequency)
export function detectHarmonics(
  magnitudes: number[],
  sampleRate: number,
  fundamentalIndex: number,
  maxHarmonics: number = 10
): { harmonic: number; frequency: number; amplitude: number }[] {
  const harmonics: { harmonic: number; frequency: number; amplitude: number }[] = [];
  const binWidth = sampleRate / magnitudes.length;
  const fundamentalFreq = fundamentalIndex * binWidth;
  
  for (let h = 1; h <= maxHarmonics; h++) {
    const expectedFreq = fundamentalFreq * h;
    const expectedIndex = Math.round(expectedFreq / binWidth);
    
    if (expectedIndex < magnitudes.length) {
      // Check a small window around expected index
      let maxAmp = 0;
      let maxIdx = expectedIndex;
      
      for (let i = Math.max(0, expectedIndex - 2); i <= Math.min(magnitudes.length - 1, expectedIndex + 2); i++) {
        if (magnitudes[i] > maxAmp) {
          maxAmp = magnitudes[i];
          maxIdx = i;
        }
      }
      
      harmonics.push({
        harmonic: h,
        frequency: maxIdx * binWidth,
        amplitude: maxAmp,
      });
    }
  }
  
  return harmonics;
}

// Pad array to next power of 2 for FFT
export function padToPowerOfTwo(samples: number[]): number[] {
  const n = samples.length;
  const nextPow2 = Math.pow(2, Math.ceil(Math.log2(n)));
  
  if (n === nextPow2) return samples;
  
  const padded = new Array(nextPow2).fill(0);
  for (let i = 0; i < n; i++) {
    padded[i] = samples[i];
  }
  
  return padded;
}
