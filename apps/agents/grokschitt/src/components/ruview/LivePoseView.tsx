import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { useSimulation } from '@/hooks/useSimulation';
import { Users, Heart, Activity } from 'lucide-react';

export default function LivePoseView() {
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

      // Background grid
      ctx.fillStyle = '#060606';
      ctx.fillRect(0, 0, W, H);

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Room boundary
      ctx.strokeStyle = 'rgba(0,255,136,0.15)';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, W - 40, H - 40);

      // WiFi signal ripples from each node
      const now = Date.now();
      nodes.filter(n => n.online).forEach((n, i) => {
        const nx = 20 + n.x * (W - 40);
        const ny = 20 + n.y * (H - 40);
        const ripple = ((now / 1000 + i * 0.5) % 3) / 3;
        ctx.strokeStyle = `rgba(0,150,255,${0.15 * (1 - ripple)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(nx, ny, ripple * Math.min(W, H) * 0.5, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw each person skeleton
      const SKELETON_CONNECTIONS = [
        [0,1],[0,2],[1,3],[2,4],         // head
        [5,6],[5,11],[6,12],[11,12],     // torso
        [5,7],[7,9],[6,8],[8,10],        // arms
        [11,13],[13,15],[12,14],[14,16], // legs
      ];

      const COLORS = ['#00ffaa', '#ff6b6b', '#4ecdc4'];

      persons.forEach((p, pi) => {
        if (!p.poseKeypoints.length) return;

        const color = COLORS[pi % COLORS.length];
        const kp = p.poseKeypoints.map(pt => ({
          x: 20 + pt[0] * (W - 40),
          y: 20 + pt[1] * (H - 40),
        }));

        // Glow aura
        const cx = kp[0].x;
        const cy = (kp[0].y + kp[11].y) / 2;
        const aura = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
        aura.addColorStop(0, `${color}20`);
        aura.addColorStop(1, 'transparent');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(cx, cy, 60, 0, Math.PI * 2);
        ctx.fill();

        // Skeleton lines
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        SKELETON_CONNECTIONS.forEach(([a, b]) => {
          ctx.beginPath();
          ctx.moveTo(kp[a].x, kp[a].y);
          ctx.lineTo(kp[b].x, kp[b].y);
          ctx.stroke();
        });
        ctx.shadowBlur = 0;

        // Keypoint dots
        kp.forEach((pt, ki) => {
          const isJoint = [5,6,7,8,9,10,11,12,13,14,15,16].includes(ki);
          ctx.fillStyle = isJoint ? color : '#fff';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, isJoint ? 4 : 5, 0, Math.PI * 2);
          ctx.fill();
        });

        // Label + vitals
        ctx.fillStyle = color;
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`P${p.id}`, kp[0].x - 8, kp[0].y - 18);
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText(`♥ ${p.heartRate.toFixed(0)}`, kp[0].x - 14, kp[0].y - 6);
      });

      // HUD
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(10, 10, 220, persons.length * 22 + 30);
      ctx.fillStyle = '#00ff88';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('LIVE POSE (17-KP)', 20, 28);
      persons.forEach((p, i) => {
        ctx.fillStyle = COLORS[i % COLORS.length];
        ctx.font = '10px monospace';
        ctx.fillText(
          `P${p.id}: HR ${p.heartRate.toFixed(0)} · BR ${p.breathingRate.toFixed(0)} · ${p.status}`,
          20, 46 + i * 22
        );
      });
    };

    const id = requestAnimationFrame(function loop() {
      draw();
      requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(id);
  }, [persons, nodes]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">Live Pose Detection</h3>
        <p className="text-sm text-muted-foreground">
          17-keypoint COCO skeleton reconstruction from WiFi CSI — no cameras, works through walls
        </p>
      </div>

      <Card className="overflow-hidden bg-black border-primary/30">
        <canvas ref={canvasRef} className="w-full h-[520px]" />
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 bg-card/50">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">People Tracked</p>
              <p className="text-2xl font-bold">{persons.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-card/50">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-sm text-muted-foreground">Avg Heart Rate</p>
              <p className="text-2xl font-bold">
                {persons.length ? (persons.reduce((s, p) => s + p.heartRate, 0) / persons.length).toFixed(0) : '—'} BPM
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-card/50">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Keypoints</p>
              <p className="text-2xl font-bold">17 × {persons.length}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
