import { useEffect, useRef, useState } from 'react';
import { RadioBand } from '@/types/radio-bands';
import { RadioScanner } from '@/lib/radio-scanner';

interface RadioSpectrumAnalyzerProps {
  band: RadioBand;
  isScanning: boolean;
}

export default function RadioSpectrumAnalyzer({ band, isScanning }: RadioSpectrumAnalyzerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waterfallRef = useRef<HTMLCanvasElement>(null);
  const [scanner] = useState(() => new RadioScanner());
  const waterfallData = useRef<number[][]>([]);

  useEffect(() => {
    if (!isScanning) return;

    const canvas = canvasRef.current;
    const waterfallCanvas = waterfallRef.current;
    if (!canvas || !waterfallCanvas) return;

    const ctx = canvas.getContext('2d');
    const waterfallCtx = waterfallCanvas.getContext('2d');
    if (!ctx || !waterfallCtx) return;

    const width = canvas.width;
    const height = canvas.height;
    const waterfallHeight = waterfallCanvas.height;

    let animationFrame: number;

    const render = () => {
      // Draw spectrum analyzer (current state)
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      // Grid
      ctx.strokeStyle = '#1f1f1f';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const y = (i / 10) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        const x = (i / 10) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Scan the band
      const signals = scanner.scanBand(band, width / 2);
      const [startFreq, endFreq] = band.frequencyRange;
      const freqRange = endFreq - startFreq;

      // Draw noise floor
      ctx.fillStyle = '#1a3a4a';
      ctx.globalAlpha = 0.3;
      const noiseHeight = height * 0.15;
      ctx.fillRect(0, height - noiseHeight, width, noiseHeight);
      ctx.globalAlpha = 1;

      // Draw signals
      signals.forEach(signal => {
        const x = ((signal.frequency - startFreq) / freqRange) * width;
        const signalStrength = signal.strength + 120; // Normalize -120 to 0 dBm
        const barHeight = (signalStrength / 120) * height * 0.9;

        // Color based on strength
        const hue = Math.min(200, 200 - (signalStrength / 120) * 200);
        ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
        
        const barWidth = Math.max(2, (signal.bandwidth / freqRange) * width);
        ctx.fillRect(x - barWidth / 2, height - barHeight, barWidth, barHeight);

        // Peak marker for strong signals
        if (signal.strength > -60) {
          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(x, height - barHeight - 5, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
      });

      // Update waterfall
      if (waterfallData.current.length >= waterfallHeight) {
        waterfallData.current.shift();
      }
      
      const newRow = scanner.generateWaterfallData(band, width, 1)[0];
      waterfallData.current.push(newRow);

      // Draw waterfall
      waterfallCtx.fillStyle = '#000';
      waterfallCtx.fillRect(0, 0, width, waterfallHeight);

      waterfallData.current.forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
          // Color gradient from blue (weak) to red (strong)
          const hue = 240 - (value / 255) * 180; // 240 (blue) to 60 (yellow/red)
          const lightness = 20 + (value / 255) * 50;
          waterfallCtx.fillStyle = `hsl(${hue}, 100%, ${lightness}%)`;
          waterfallCtx.fillRect(colIndex, rowIndex, 1, 1);
        });
      });

      animationFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [band, isScanning, scanner]);

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-300">Spectrum Analyzer</h3>
        <canvas
          ref={canvasRef}
          width={800}
          height={200}
          className="w-full h-[200px] rounded-lg border border-gray-800"
        />
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-300">Waterfall Display</h3>
        <canvas
          ref={waterfallRef}
          width={800}
          height={150}
          className="w-full h-[150px] rounded-lg border border-gray-800"
        />
        <p className="text-xs text-gray-500 text-right">Time flows downward →</p>
      </div>
    </div>
  );
}
