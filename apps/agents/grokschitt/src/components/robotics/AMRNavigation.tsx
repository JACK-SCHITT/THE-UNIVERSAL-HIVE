import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Navigation, MapPin, TrendingUp } from 'lucide-react';

export default function AMRNavigation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let frame = 0;

    const animate = () => {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw warehouse layout (shelving racks)
      const racks = [
        { x: 100, y: 100, w: 80, h: 400 },
        { x: 250, y: 100, w: 80, h: 400 },
        { x: 400, y: 100, w: 80, h: 400 },
        { x: 550, y: 100, w: 80, h: 200 },
        { x: 550, y: 350, w: 80, h: 150 },
      ];

      racks.forEach(rack => {
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(rack.x, rack.y, rack.w, rack.h);
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 2;
        ctx.strokeRect(rack.x, rack.y, rack.w, rack.h);
      });

      // AMR position (moving along path)
      const pathProgress = (frame % 300) / 300;
      const amrPath = [
        { x: 50, y: 300 },
        { x: 200, y: 300 },
        { x: 200, y: 150 },
        { x: 350, y: 150 },
        { x: 350, y: 400 },
        { x: 500, y: 400 },
        { x: 500, y: 250 },
        { x: 650, y: 250 },
      ];

      const currentSegment = Math.floor(pathProgress * (amrPath.length - 1));
      const segmentProgress = (pathProgress * (amrPath.length - 1)) % 1;

      const currentPoint = amrPath[currentSegment];
      const nextPoint = amrPath[Math.min(currentSegment + 1, amrPath.length - 1)];

      const amrX = currentPoint.x + (nextPoint.x - currentPoint.x) * segmentProgress;
      const amrY = currentPoint.y + (nextPoint.y - currentPoint.y) * segmentProgress;

      // Draw planned path
      ctx.strokeStyle = 'rgba(0, 150, 255, 0.3)';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(amrPath[0].x, amrPath[0].y);
      amrPath.forEach(point => ctx.lineTo(point.x, point.y));
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw humans (some behind racks)
      const humans = [
        { x: 150, y: 300, hidden: false },
        { x: 300, y: 200, hidden: true }, // Behind rack
        { x: 450, y: 350, hidden: false },
      ];

      humans.forEach(human => {
        // WiFi detection radius (shows through walls)
        const gradient = ctx.createRadialGradient(human.x, human.y, 0, human.x, human.y, 80);
        gradient.addColorStop(0, 'rgba(0, 255, 136, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 255, 136, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(human.x, human.y, 80, 0, Math.PI * 2);
        ctx.fill();

        // Human figure
        ctx.fillStyle = human.hidden ? 'rgba(0, 255, 136, 0.5)' : '#00ff88';
        ctx.beginPath();
        ctx.arc(human.x, human.y, 10, 0, Math.PI * 2);
        ctx.fill();

        if (human.hidden) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.fillText('Hidden', human.x - 20, human.y - 20);
        }
      });

      // AMR with detection cone
      const detectionRadius = 120;
      const coneAngle = Math.PI / 3;
      const amrAngle = Math.atan2(nextPoint.y - currentPoint.y, nextPoint.x - currentPoint.x);

      // Detection cone (WiFi field)
      ctx.fillStyle = 'rgba(100, 150, 255, 0.15)';
      ctx.beginPath();
      ctx.moveTo(amrX, amrY);
      ctx.arc(amrX, amrY, detectionRadius, amrAngle - coneAngle/2, amrAngle + coneAngle/2);
      ctx.closePath();
      ctx.fill();

      // AMR body
      const amrSize = 25;
      ctx.save();
      ctx.translate(amrX, amrY);
      ctx.rotate(amrAngle);

      ctx.fillStyle = '#0096ff';
      ctx.fillRect(-amrSize/2, -amrSize/2, amrSize, amrSize);

      // Direction indicator
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(amrSize/2, 0);
      ctx.lineTo(amrSize/2 + 10, -5);
      ctx.lineTo(amrSize/2 + 10, 5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // AMR label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('AMR', amrX - 15, amrY - amrSize - 5);

      // Info overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 220, 110);
      ctx.fillStyle = '#00ff88';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('AMR Navigation', 20, 30);
      ctx.font = '12px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Humans detected: 3', 20, 50);
      ctx.fillText('1 behind rack', 20, 70);
      ctx.fillText('WiFi detection active', 20, 90);
      ctx.fillText('LIDAR: Blocked', 20, 110);

      frame++;
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">AMR Navigation</h3>
        <p className="text-sm text-muted-foreground">
          Autonomous mobile robots sense humans around blind corners, through shelving racks
        </p>
      </div>

      <Card className="overflow-hidden bg-black border-primary/30">
        <canvas ref={canvasRef} className="w-full h-[600px]" />
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 bg-card/50">
          <div className="flex items-center gap-3">
            <Navigation className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Active AMRs</p>
              <p className="text-2xl font-bold">12</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card/50">
          <div className="flex items-center gap-3">
            <MapPin className="w-8 h-8 text-secondary" />
            <div>
              <p className="text-sm text-muted-foreground">Through-Shelf Detections</p>
              <p className="text-2xl font-bold">284</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card/50">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Efficiency Gain</p>
              <p className="text-2xl font-bold">+34%</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-card/50">
        <h4 className="text-lg font-bold mb-4">🚀 Navigation Features</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="font-bold mb-2">WiFi Advantages</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Detects humans through shelving racks</li>
              <li>• Works around blind corners</li>
              <li>• No LIDAR occlusion issues</li>
              <li>• 360° awareness without multiple sensors</li>
            </ul>
          </div>
          <div>
            <p className="font-bold mb-2">LIDAR Limitations</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Blocked by obstacles</li>
              <li>• Requires line-of-sight</li>
              <li>• Blind spots behind racks</li>
              <li>• Multiple sensors needed for coverage</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
