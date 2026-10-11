import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

export default function CobotSafety() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [safetyStatus, setSafetyStatus] = useState<'safe' | 'warning' | 'stop'>('safe');

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

      // Draw grid
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Cobot position (center-right)
      const cobotX = canvas.width * 0.7;
      const cobotY = canvas.height / 2;

      // Safety zones (concentric circles)
      const zones = [
        { radius: 150, color: 'rgba(255, 0, 0, 0.1)', label: 'STOP Zone', distance: 0.5 },
        { radius: 250, color: 'rgba(255, 165, 0, 0.1)', label: 'SLOW Zone', distance: 1.5 },
        { radius: 350, color: 'rgba(0, 255, 0, 0.1)', label: 'SAFE Zone', distance: 2.5 }
      ];

      zones.forEach((zone, index) => {
        ctx.strokeStyle = zone.color.replace('0.1', '0.3');
        ctx.fillStyle = zone.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cobotX, cobotY, zone.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Zone label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(zone.label, cobotX + zone.radius + 10, cobotY);
        ctx.font = '10px monospace';
        ctx.fillText(`${zone.distance}m`, cobotX + zone.radius + 10, cobotY + 15);
      });

      // Draw cobot
      const cobotSize = 40;
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(cobotX - cobotSize/2, cobotY - cobotSize/2, cobotSize, cobotSize);
      
      // Cobot arm
      const armAngle = Math.sin(frame / 30) * 0.5;
      const armLength = 60;
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(cobotX, cobotY);
      ctx.lineTo(
        cobotX + Math.cos(armAngle) * armLength,
        cobotY + Math.sin(armAngle) * armLength
      );
      ctx.stroke();

      // Cobot label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('Cobot', cobotX - 25, cobotY - cobotSize);

      // Simulate human approaching
      const humanX = canvas.width * 0.2 + Math.sin(frame / 60) * 100;
      const humanY = canvas.height / 2;

      // Draw human
      ctx.fillStyle = '#00ff88';
      ctx.beginPath();
      ctx.arc(humanX, humanY, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#00ff88';
      ctx.fillRect(humanX - 8, humanY + 15, 16, 40);

      // Calculate distance
      const distance = Math.sqrt(Math.pow(cobotX - humanX, 2) + Math.pow(cobotY - humanY, 2));

      // Update safety status
      if (distance < 150) {
        setSafetyStatus('stop');
        // Draw warning line
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(humanX, humanY);
        ctx.lineTo(cobotX, cobotY);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (distance < 250) {
        setSafetyStatus('warning');
        ctx.strokeStyle = 'rgba(255, 165, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(humanX, humanY);
        ctx.lineTo(cobotX, cobotY);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        setSafetyStatus('safe');
      }

      // Distance label
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      const distanceMeters = (distance / 100).toFixed(1);
      ctx.fillText(`${distanceMeters}m`, (humanX + cobotX) / 2, (humanY + cobotY) / 2 - 10);

      // Info overlay
      const statusColors = {
        safe: '#00ff88',
        warning: '#ffa500',
        stop: '#ff0000'
      };

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 200, 100);
      ctx.fillStyle = statusColors[safetyStatus];
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`STATUS: ${safetyStatus.toUpperCase()}`, 20, 35);
      ctx.font = '12px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Distance: ${distanceMeters}m`, 20, 55);
      ctx.fillText('WiFi CSI Detection', 20, 75);
      ctx.fillText('Through-wall capable', 20, 95);

      frame++;
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">Cobot Safety Zones</h3>
        <p className="text-sm text-muted-foreground">
          WiFi sensing detects human presence near collaborative robots — auto-slow or stop before contact
        </p>
      </div>

      <Card className="overflow-hidden bg-black border-primary/30">
        <canvas ref={canvasRef} className="w-full h-[600px]" />
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className={`p-4 ${
          safetyStatus === 'safe' ? 'border-green-500/30 bg-green-500/10' : 'bg-card/50'
        }`}>
          <div className="flex items-center gap-3">
            <CheckCircle className={`w-8 h-8 ${
              safetyStatus === 'safe' ? 'text-green-500' : 'text-muted-foreground'
            }`} />
            <div>
              <p className="text-sm text-muted-foreground">SAFE Zone</p>
              <p className="text-xl font-bold">2.5m+</p>
            </div>
          </div>
        </Card>

        <Card className={`p-4 ${
          safetyStatus === 'warning' ? 'border-yellow-500/30 bg-yellow-500/10' : 'bg-card/50'
        }`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-8 h-8 ${
              safetyStatus === 'warning' ? 'text-yellow-500' : 'text-muted-foreground'
            }`} />
            <div>
              <p className="text-sm text-muted-foreground">SLOW Zone</p>
              <p className="text-xl font-bold">1.5-2.5m</p>
            </div>
          </div>
        </Card>

        <Card className={`p-4 ${
          safetyStatus === 'stop' ? 'border-red-500/30 bg-red-500/10' : 'bg-card/50'
        }`}>
          <div className="flex items-center gap-3">
            <Shield className={`w-8 h-8 ${
              safetyStatus === 'stop' ? 'text-red-500' : 'text-muted-foreground'
            }`} />
            <div>
              <p className="text-sm text-muted-foreground">STOP Zone</p>
              <p className="text-xl font-bold">&lt;0.5m</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-card/50">
        <h4 className="text-lg font-bold mb-4">🛡️ Safety Protocol</h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-green-500 font-bold">1</span>
            </div>
            <div>
              <p className="font-bold text-sm">SAFE Zone (2.5m+)</p>
              <p className="text-xs text-muted-foreground">Normal operation — robot moves at full speed</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-yellow-500 font-bold">2</span>
            </div>
            <div>
              <p className="font-bold text-sm">SLOW Zone (1.5-2.5m)</p>
              <p className="text-xs text-muted-foreground">Reduce speed to 50% — monitor human movement continuously</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-red-500 font-bold">3</span>
            </div>
            <div>
              <p className="font-bold text-sm">STOP Zone (&lt;0.5m)</p>
              <p className="text-xs text-muted-foreground">Immediate halt — lock motors until human exits zone</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
