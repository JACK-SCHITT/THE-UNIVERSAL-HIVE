import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Shield, Navigation, AlertTriangle, Activity } from 'lucide-react';
import { useSimulation } from '@/hooks/useSimulation';

function RoboticsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { robots, persons, nodes } = useSimulation();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const W = canvas.width = canvas.offsetWidth;
      const H = canvas.height = canvas.offsetHeight;

      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Warehouse racks (fixed obstacles)
      const racks = [
        { x: 0.15, y: 0.1, w: 0.08, h: 0.5 },
        { x: 0.35, y: 0.1, w: 0.08, h: 0.5 },
        { x: 0.55, y: 0.1, w: 0.08, h: 0.25 },
        { x: 0.55, y: 0.45, w: 0.08, h: 0.2 },
        { x: 0.75, y: 0.1, w: 0.08, h: 0.35 },
      ];

      racks.forEach(r => {
        const rx = r.x * W, ry = r.y * H, rw = r.w * W, rh = r.h * H;
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeStyle = '#2a2a4a';
        ctx.lineWidth = 2;
        ctx.strokeRect(rx, ry, rw, rh);
        // Rack lines
        ctx.strokeStyle = '#3a3a5a';
        ctx.lineWidth = 1;
        for (let ly = ry + 20; ly < ry + rh; ly += 20) {
          ctx.beginPath(); ctx.moveTo(rx, ly); ctx.lineTo(rx + rw, ly); ctx.stroke();
        }
      });

      // Humans with WiFi detection aura
      persons.forEach(p => {
        const px = p.x * W, py = p.y * H;
        const grad = ctx.createRadialGradient(px, py, 0, px, py, 80);
        grad.addColorStop(0, 'rgba(0,255,136,0.25)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, 80, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.fillText(`P${p.id}`, px - 8, py - 14);
      });

      // Robots
      robots.forEach(r => {
        const rx = r.x * W, ry = r.y * H;

        // Safety zone circle
        const zoneR = r.safetyZone * 40;
        const zoneColor = r.status === 'stopped' ? 'rgba(255,50,50,0.15)' :
                          r.status === 'slow' ? 'rgba(255,200,50,0.15)' : 'rgba(100,150,255,0.1)';
        ctx.fillStyle = zoneColor;
        ctx.beginPath();
        ctx.arc(rx, ry, zoneR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = zoneColor.replace('0.15', '0.4').replace('0.1', '0.3');
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Detection cone (WiFi direction)
        const coneR = 100;
        const coneAngle = Math.PI / 2.5;
        ctx.fillStyle = 'rgba(100,150,255,0.12)';
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.arc(rx, ry, coneR, r.heading - coneAngle / 2, r.heading + coneAngle / 2);
        ctx.closePath();
        ctx.fill();

        // Robot body
        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(r.heading);
        const bodyColor = r.type === 'cobot' ? '#0096ff' : '#aa44ff';
        ctx.fillStyle = r.status === 'stopped' ? '#ff3333' : r.status === 'slow' ? '#ffcc00' : bodyColor;
        ctx.fillRect(-14, -14, 28, 28);

        // Direction arrow
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(10, -5);
        ctx.lineTo(10, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(r.id.toUpperCase(), rx - 20, ry - 18);

        // Status dot
        ctx.fillStyle = r.status === 'stopped' ? '#ff3333' : r.status === 'slow' ? '#ffcc00' : '#00ff88';
        ctx.beginPath();
        ctx.arc(rx + 16, ry - 16, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      // HUD
      const stopCount = robots.filter(r => r.status === 'stopped').length;
      const slowCount = robots.filter(r => r.status === 'slow').length;
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(10, 10, 240, 90);
      ctx.fillStyle = '#0096ff';
      ctx.font = 'bold 13px monospace';
      ctx.fillText('ROBOTICS CONTROL', 20, 30);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#fff';
      ctx.fillText(`Robots: ${robots.length} · Humans: ${persons.length}`, 20, 50);
      ctx.fillText(`STOPPED: ${stopCount} · SLOW: ${slowCount}`, 20, 68);
      ctx.fillText(`WiFi through-wall sensing active`, 20, 86);
    };

    const id = requestAnimationFrame(function loop() {
      draw();
      requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(id);
  }, [robots, persons, nodes]);

  return (
    <Card className="overflow-hidden bg-black border-primary/30">
      <canvas ref={canvasRef} className="w-full h-[480px]" />
    </Card>
  );
}

export default function RoboticsHub() {
  const { robots, totalCollisionsPrevented, safetyAlerts } = useSimulation();
  const cobots = robots.filter(r => r.type === 'cobot');
  const amrs = robots.filter(r => r.type === 'amr');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-cyber flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Robotics Integration Hub</h2>
            <p className="text-sm text-muted-foreground">WiFi sensing for robot spatial awareness and collision avoidance</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse-glow"></div>
          <span className="text-sm font-medium text-accent">Live</span>
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Active Robots</p>
              <p className="text-2xl font-bold">{robots.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Collisions Prevented</p>
              <p className="text-2xl font-bold">{totalCollisionsPrevented}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-yellow-500/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-sm text-muted-foreground">Safety Alerts (live)</p>
              <p className="text-2xl font-bold">{safetyAlerts}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-accent/20 to-accent/5 border-accent/30">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Avg Response</p>
              <p className="text-2xl font-bold">&lt;100ms</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="map" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="map">Live Map</TabsTrigger>
          <TabsTrigger value="cobots">Cobots ({cobots.length})</TabsTrigger>
          <TabsTrigger value="amrs">AMRs ({amrs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="map">
          <RoboticsCanvas />
        </TabsContent>

        <TabsContent value="cobots">
          <div className="space-y-3">
            {cobots.map(r => (
              <Card key={r.id} className="p-4 bg-card/50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold">{r.id.toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">Collaborative Robot · Safety Zone: {r.safetyZone}m</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    r.status === 'stopped' ? 'bg-red-500/20 text-red-400' :
                    r.status === 'slow' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {r.status.toUpperCase()}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <span>Pos: ({(r.x * 10).toFixed(1)}m, {(r.y * 10).toFixed(1)}m)</span>
                  <span>Humans detected: {r.detectedHumans.length}</span>
                  <span>Prevented: {r.collisionsPrevented}</span>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="amrs">
          <div className="space-y-3">
            {amrs.map(r => (
              <Card key={r.id} className="p-4 bg-card/50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold">{r.id.toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">Autonomous Mobile Robot · {(r.speed * 10).toFixed(1)} km/h</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    r.status === 'stopped' ? 'bg-red-500/20 text-red-400' :
                    r.status === 'slow' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {r.status.toUpperCase()}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <span>Pos: ({(r.x * 10).toFixed(1)}m, {(r.y * 10).toFixed(1)}m)</span>
                  <span>WiFi detections: {r.detectedHumans.length}</span>
                  <span>Prevented: {r.collisionsPrevented}</span>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
