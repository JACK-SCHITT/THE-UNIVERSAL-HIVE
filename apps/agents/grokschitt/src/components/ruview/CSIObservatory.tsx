import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { useSimulation } from '@/hooks/useSimulation';
import { Waves, Zap, Activity } from 'lucide-react';

export default function CSIObservatory() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { nodes, persons, tick } = useSimulation();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const W = canvas.width = canvas.offsetWidth;
      const H = canvas.height = canvas.offsetHeight;
      const t = Date.now() / 1000;

      ctx.fillStyle = '#030308';
      ctx.fillRect(0, 0, W, H);

      const onlineNodes = nodes.filter(n => n.online);
      const numSubcarriers = 56;
      const panelH = H / 2;

      // Panel 1: Subcarrier amplitude manifold
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, panelH - 1);

      const subW = W / numSubcarriers;
      for (let i = 0; i < numSubcarriers; i++) {
        // Amplitude affected by person positions
        let amplitude = 0.3;
        persons.forEach(p => {
          const freqInfluence = Math.sin(i * 0.2 + p.x * 10 + t * p.breathingRate * 0.05);
          amplitude += 0.15 * Math.abs(freqInfluence) * (1 - Math.abs(p.x - i / numSubcarriers));
        });
        // Add breathing/heartrate micro-variations
        const breathMod = persons[0] ? 0.05 * Math.sin(t * persons[0].breathingRate * 0.1 + i * 0.3) : 0;
        const hrMod = persons[0] ? 0.02 * Math.sin(t * persons[0].heartRate * 0.013 + i * 0.5) : 0;
        amplitude = Math.min(1, amplitude + breathMod + hrMod);

        const barH = amplitude * (panelH - 20);
        const hue = 200 + i * 2;
        ctx.fillStyle = `hsla(${hue}, 90%, 60%, 0.85)`;
        ctx.fillRect(i * subW, panelH - barH - 1, subW - 1, barH);
      }

      ctx.fillStyle = 'rgba(0,150,255,0.7)';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`CSI Subcarrier Manifold — ${numSubcarriers} subcarriers × ${onlineNodes.length} nodes`, 10, 16);

      // Separator
      ctx.fillStyle = '#1a1a3a';
      ctx.fillRect(0, panelH - 1, W, 2);

      // Panel 2: Phase constellation + vital sign waveform
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, panelH + 1, W, panelH - 1);

      const halfW = W / 2;

      // Left: Phase constellation
      const phaseW = halfW - 10;
      const cx = phaseW / 2 + 10;
      const cy = panelH + panelH / 2;
      const radius = Math.min(phaseW, panelH) * 0.4;

      // Draw IQ circle
      ctx.strokeStyle = 'rgba(100,100,200,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Phase dots from each node
      onlineNodes.forEach((node, ni) => {
        for (let i = 0; i < numSubcarriers; i += 3) {
          const phase = (i * 0.113 + t * 0.5 + ni * 1.2) + persons.reduce((s, p) => s + p.x * 0.5 + p.y * 0.3, 0);
          const amp = 0.5 + 0.4 * Math.sin(i * 0.2 + t * 0.8);
          const px = cx + Math.cos(phase) * radius * amp;
          const py = cy + Math.sin(phase) * radius * amp;
          ctx.fillStyle = `hsla(${ni * 60 + i * 3}, 80%, 65%, 0.8)`;
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.fillStyle = 'rgba(100,150,255,0.7)';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('Phase Constellation (IQ)', 14, panelH + 16);

      // Right: Vital sign waveform
      const waveX = halfW + 10;
      const waveW = W - waveX - 10;

      ctx.fillStyle = 'rgba(100,255,150,0.7)';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('Vital Sign Waveform', waveX, panelH + 16);

      persons.forEach((p, pi) => {
        const lineY = panelH + 40 + pi * ((panelH - 50) / persons.length);
        const amp = 15;
        ctx.strokeStyle = `hsla(${pi * 80}, 80%, 65%, 0.9)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        for (let x = 0; x < waveW; x++) {
          const progress = x / waveW;
          const breathing = Math.sin(progress * 6 * Math.PI + t * p.breathingRate * 0.1) * amp * 0.7;
          const heartbeat = Math.sin(progress * 40 * Math.PI + t * p.heartRate * 0.013) * amp * 0.4;
          const y = lineY + breathing + heartbeat;
          if (x === 0) ctx.moveTo(waveX + x, y);
          else ctx.lineTo(waveX + x, y);
        }
        ctx.stroke();

        ctx.fillStyle = `hsla(${pi * 80}, 80%, 65%, 0.8)`;
        ctx.font = '9px monospace';
        ctx.fillText(`P${p.id}: HR ${p.heartRate.toFixed(0)} · BR ${p.breathingRate.toFixed(0)}`, waveX + 2, lineY - 4);
      });
    };

    const id = requestAnimationFrame(function loop() {
      draw();
      requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(id);
  }, [nodes, persons, tick]);

  const onlineCount = nodes.filter(n => n.online).length;
  const totalPPS = nodes.reduce((s, n) => s + n.packetsPerSecond, 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">CSI Observatory</h3>
        <p className="text-sm text-muted-foreground">
          Live Channel State Information visualization — subcarrier manifold, phase constellation, vital waveforms
        </p>
      </div>

      <Card className="overflow-hidden bg-black border-primary/30">
        <canvas ref={canvasRef} className="w-full h-[500px]" />
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 bg-card/50">
          <div className="flex items-center gap-3">
            <Waves className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Active Subcarriers</p>
              <p className="text-2xl font-bold">{onlineCount * 56}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-card/50">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Packets/sec</p>
              <p className="text-2xl font-bold">{(totalPPS / 1000).toFixed(0)}K</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-card/50">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-secondary" />
            <div>
              <p className="text-sm text-muted-foreground">Signal Links</p>
              <p className="text-2xl font-bold">{onlineCount * (onlineCount - 1)}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
