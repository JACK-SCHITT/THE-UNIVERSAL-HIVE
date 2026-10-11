import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Wind, Thermometer, Users } from 'lucide-react';

export default function HVACOptimizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let frame = 0;

    const rooms = [
      { x: 50, y: 50, w: 200, h: 150, name: 'Conference A', occupied: true, temp: 22 },
      { x: 270, y: 50, w: 200, h: 150, name: 'Conference B', occupied: false, temp: 18 },
      { x: 490, y: 50, w: 200, h: 150, name: 'Office 1', occupied: true, temp: 23 },
      { x: 50, y: 220, w: 200, h: 150, name: 'Office 2', occupied: true, temp: 22 },
      { x: 270, y: 220, w: 200, h: 150, name: 'Break Room', occupied: false, temp: 19 },
      { x: 490, y: 220, w: 200, h: 150, name: 'Office 3', occupied: false, temp: 20 },
    ];

    const animate = () => {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      rooms.forEach(room => {
        // Room background
        const tempColor = room.occupied 
          ? `rgba(255, 100, 100, ${0.2 + (room.temp - 20) / 30})` 
          : `rgba(100, 150, 255, ${0.15})`;
        
        ctx.fillStyle = tempColor;
        ctx.fillRect(room.x, room.y, room.w, room.h);

        // Room border
        ctx.strokeStyle = room.occupied ? '#ff6464' : '#6496ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(room.x, room.y, room.w, room.h);

        // Room name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(room.name, room.x + 10, room.y + 25);

        // Temperature
        ctx.font = '24px monospace';
        ctx.fillText(`${room.temp}°C`, room.x + 10, room.y + 60);

        // Occupancy status
        const statusColor = room.occupied ? '#00ff88' : '#6496ff';
        ctx.fillStyle = statusColor;
        ctx.font = '12px monospace';
        ctx.fillText(room.occupied ? 'OCCUPIED' : 'EMPTY', room.x + 10, room.y + 85);

        // HVAC status
        ctx.fillStyle = room.occupied ? '#ff6464' : '#6496ff';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(room.occupied ? 'HEATING' : 'ECO MODE', room.x + 10, room.y + 105);

        // People count if occupied
        if (room.occupied) {
          const peopleCount = 1 + Math.floor(Math.random() * 4);
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px monospace';
          ctx.fillText(`${peopleCount} people`, room.x + 10, room.y + 125);

          // Draw people icons
          for (let i = 0; i < peopleCount; i++) {
            const personX = room.x + room.w - 30 - i * 15;
            const personY = room.y + room.h - 30;
            ctx.fillStyle = '#00ff88';
            ctx.beginPath();
            ctx.arc(personX, personY, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // Info overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, canvas.height - 90, 220, 80);
      ctx.fillStyle = '#00ff88';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('HVAC Optimizer', 20, canvas.height - 70);
      ctx.font = '12px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Occupied: 3 rooms', 20, canvas.height - 50);
      ctx.fillText('Empty: 3 rooms', 20, canvas.height - 30);
      ctx.fillText('Savings: 24%', 20, canvas.height - 10);

      frame++;
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">HVAC Optimization</h3>
        <p className="text-sm text-muted-foreground">
          Heat/cool only occupied rooms based on real-time presence — 15-30% energy savings
        </p>
      </div>

      <Card className="overflow-hidden bg-black border-primary/30">
        <canvas ref={canvasRef} className="w-full h-[600px]" />
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 bg-card/50">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Occupied Rooms</p>
              <p className="text-2xl font-bold">3/6</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card/50">
          <div className="flex items-center gap-3">
            <Thermometer className="w-8 h-8 text-secondary" />
            <div>
              <p className="text-sm text-muted-foreground">Avg Temperature</p>
              <p className="text-2xl font-bold">22°C</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card/50">
          <div className="flex items-center gap-3">
            <Wind className="w-8 h-8 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Energy Saved</p>
              <p className="text-2xl font-bold">24%</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-card/50">
        <h4 className="text-lg font-bold mb-4">❄️ Smart HVAC Features</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="font-bold mb-2">Automated Actions</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Reduce temperature in empty rooms</li>
              <li>• Pre-heat before predicted arrival</li>
              <li>• Night mode for entire building</li>
              <li>• Meeting room auto-adjust</li>
            </ul>
          </div>
          <div>
            <p className="font-bold mb-2">Efficiency Metrics</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 15-30% energy reduction</li>
              <li>• $2,847/month cost savings</li>
              <li>• 4.2 month payback period</li>
              <li>• 92% system efficiency</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
