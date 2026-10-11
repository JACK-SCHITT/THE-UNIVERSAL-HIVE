import { useEffect, useRef } from 'react';
import { WiFiSignal } from '@/types/wifi-pose';

interface WiFiSignalGraphProps {
  signal: WiFiSignal;
  title: string;
  type: 'amplitude' | 'phase';
}

export default function WiFiSignalGraph({ signal, title, type }: WiFiSignalGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const data = type === 'amplitude' ? signal.amplitude : signal.phase;

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = '#1f1f1f';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = (i / 5) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw signal
    const barWidth = width / data.length;
    
    data.forEach((value, i) => {
      const x = i * barWidth;
      let normalizedValue: number;
      let color: string;

      if (type === 'amplitude') {
        normalizedValue = value / 60; // 0-60 dB range
        color = `hsl(${200 - normalizedValue * 60}, 70%, 60%)`;
      } else {
        normalizedValue = value / (2 * Math.PI);
        color = `hsl(${normalizedValue * 360}, 70%, 60%)`;
      }

      const barHeight = normalizedValue * height * 0.9;

      ctx.fillStyle = color;
      ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);
    });

    // Draw waveform overlay for phase
    if (type === 'phase') {
      ctx.strokeStyle = '#4ECDC4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      data.forEach((value, i) => {
        const x = i * barWidth + barWidth / 2;
        const y = height - (value / (2 * Math.PI)) * height;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    }

  }, [signal, type]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">{title}</h3>
        <span className="text-xs text-gray-500">
          {type === 'amplitude' ? 'dB' : 'radians'}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={120}
        className="w-full h-[120px] rounded-lg border border-gray-800"
      />
    </div>
  );
}
