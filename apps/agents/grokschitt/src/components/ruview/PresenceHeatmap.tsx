import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { useSimulation } from '@/hooks/useSimulation';
import { Users, TrendingUp, Map } from 'lucide-react';

export default function PresenceHeatmap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const persons = useSimulation(s => s.persons);
  const nodes = useSimulation(s => s.nodes);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const W = canvas.width = canvas.offsetWidth;
      const H = canvas.height = canvas.offsetHeight;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, W, H);

      // Draw room outline
      ctx.strokeStyle = '#2a2a2a';
      ctx.lineWidth = 2;
      const pad = 50;
      ctx.strokeRect(pad, pad, W - pad * 2, H - pad * 2);

      // Draw heatmap from person positions
      persons.forEach(p => {
        const px = pad + p.x * (W - pad * 2);
        const py = pad + p.y * (H - pad * 2);
        const radius = 80;

        const grad = ctx.createRadialGradient(px, py, 0, px, py, radius);
        grad.addColorStop(0, `hsla(${p.id * 60}, 80%, 60%, 0.6)`);
        grad.addColorStop(0.5, `hsla(${p.id * 60}, 80%, 50%, 0.2)`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();

        // Pose skeleton if available
        if (p.poseKeypoints.length === 17) {
          const kp = p.poseKeypoints;
          const toCanvas = (pt: number[]) => ({
            x: pad + pt[0] * (W - pad * 2),
            y: pad + pt[1] * (H - pad * 2),
          });

          const connections = [
            [0,1],[0,2],[1,3],[2,4],
            [5,6],[5,11],[6,12],[11,12],
            [5,7],[7,9],[6,8],[8,10],
            [11,13],[13,15],[12,14],[14,16],
          ];

          ctx.strokeStyle = `hsla(${p.id * 60}, 80%, 70%, 0.8)`;
          ctx.lineWidth = 2;
          connections.forEach(([a, b]) => {
            const pa = toCanvas(kp[a]);
            const pb = toCanvas(kp[b]);
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.stroke();
          });

          kp.forEach(pt => {
            const c = toCanvas(pt);
            ctx.fillStyle = `hsl(${p.id * 60}, 80%, 70%)`;
            ctx.beginPath();
            ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
            ctx.fill();
          });
        } else {
          // Person dot
          ctx.fillStyle = `hsl(${p.id * 60}, 80%, 65%)`;
          ctx.beginPath();
          ctx.arc(px, py, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`P${p.id}`, px - 8, py - 14);
        }
      });

      // Draw ESP32 nodes
      nodes.forEach(n => {
        const nx = pad + n.x * (W - pad * 2);
        const ny = pad + n.y * (H - pad * 2);

        ctx.fillStyle = n.online ? '#00ff88' : '#666';
        ctx.fillRect(nx - 5, ny - 5, 10, 10);

        if (n.online) {
          ctx.strokeStyle = 'rgba(0,255,136,0.3)';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          persons.forEach(p => {
            const px = pad + p.x * (W - pad * 2);
            const py = pad + p.y * (H - pad * 2);
            ctx.beginPath();
            ctx.moveTo(nx, ny);
            ctx.lineTo(px, py);
            ctx.stroke();
          });
          ctx.setLineDash([]);
        }

        ctx.fillStyle = '#fff';
        ctx.font = '9px monospace';
        ctx.fillText(n.name.replace('Node ', ''), nx + 7, ny + 4);
      });

      // Info overlay
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(10, H - 100, 230, 90);
      ctx.fillStyle = '#00ff88';
      ctx.font = 'bold 13px monospace';
      ctx.fillText('PRESENCE HEATMAP', 20, H - 80);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#fff';
      ctx.fillText(`Occupancy: ${persons.length} detected`, 20, H - 62);
      ctx.fillText(`Nodes: ${nodes.filter(n => n.online).length}/${nodes.length} online`, 20, H - 44);
      ctx.fillText(`Privacy-first — no cameras`, 20, H - 26);
    };

    const id = requestAnimationFrame(function loop() {
      draw();
      requestAnimationFrame(loop);
    });

    return () => cancelAnimationFrame(id);
  }, [persons, nodes]);

  const avgDwell = '12m 34s';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">Presence Heatmap</h3>
        <p className="text-sm text-muted-foreground">
          Room occupancy with pose skeletons — real-time from WiFi CSI, GDPR-friendly
        </p>
      </div>

      <Card className="overflow-hidden bg-black border-primary/30">
        <canvas ref={canvasRef} className="w-full h-[500px]" />
      </Card>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4 bg-card/50">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold">Current Occupancy</p>
          </div>
          <p className="text-2xl font-bold">{persons.length} people</p>
        </Card>
        <Card className="p-4 bg-card/50">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-secondary" />
            <p className="text-sm font-bold">Active Nodes</p>
          </div>
          <p className="text-2xl font-bold">{nodes.filter(n => n.online).length}/{nodes.length}</p>
        </Card>
        <Card className="p-4 bg-card/50">
          <div className="flex items-center gap-2 mb-2">
            <Map className="w-4 h-4 text-accent" />
            <p className="text-sm font-bold">Coverage</p>
          </div>
          <p className="text-2xl font-bold">100%</p>
        </Card>
        <Card className="p-4 bg-card/50">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-yellow-500" />
            <p className="text-sm font-bold">Avg Dwell</p>
          </div>
          <p className="text-2xl font-bold">{avgDwell}</p>
        </Card>
      </div>
    </div>
  );
}
