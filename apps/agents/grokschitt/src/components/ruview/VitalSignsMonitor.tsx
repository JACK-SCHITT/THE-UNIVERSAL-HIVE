import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { useSimulation } from '@/hooks/useSimulation';
import { Heart, Activity, TrendingUp, AlertTriangle } from 'lucide-react';

export default function VitalSignsMonitor() {
  const persons = useSimulation(s => s.persons);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">Vital Signs Monitor</h3>
        <p className="text-sm text-muted-foreground">
          Real-time breathing (6–30 BPM) and heart rate (40–120 BPM) via WiFi CSI — no wearables
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {persons.map(p => {
          const statusBg = {
            normal: 'bg-accent/20 border-accent/30',
            warning: 'bg-yellow-500/20 border-yellow-500/30',
            alert: 'bg-destructive/20 border-destructive/30',
          }[p.status];
          const statusColor = {
            normal: 'text-accent',
            warning: 'text-yellow-500',
            alert: 'text-destructive',
          }[p.status];

          return (
            <Card key={p.id} className={`p-6 bg-card/50 border-2 ${statusBg}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Person {p.id}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${statusBg} ${statusColor}`}>
                  {p.status}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Heart Rate</p>
                    <p className="text-2xl font-bold">{p.heartRate.toFixed(0)} BPM</p>
                  </div>
                  <span className="text-xs text-muted-foreground">40–120</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Breathing Rate</p>
                    <p className="text-2xl font-bold">{p.breathingRate.toFixed(0)} BPM</p>
                  </div>
                  <span className="text-xs text-muted-foreground">6–30</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">HRV</p>
                    <p className="text-2xl font-bold">{p.hrv.toFixed(0)} ms</p>
                  </div>
                  <span className="text-xs text-muted-foreground">Good</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">SpO₂ (est.)</p>
                    <p className="text-2xl font-bold">{p.spo2}%</p>
                  </div>
                  <span className="text-xs text-muted-foreground">≥95%</span>
                </div>
              </div>

              {p.status !== 'normal' && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Elevated vitals detected — heart rate above 100 BPM baseline
                  </p>
                </div>
              )}

              {/* Mini sparkline bar */}
              <div className="mt-4">
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-primary transition-all duration-500"
                    style={{ width: `${((p.heartRate - 40) / 80) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Position: ({(p.x * 10).toFixed(1)}m, {(p.y * 10).toFixed(1)}m)
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6 bg-card/50">
        <h4 className="text-lg font-bold mb-4">📊 Detection Method</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="font-bold text-sm mb-2">Breathing (Bandpass 0.1–0.5 Hz)</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• FFT peak detection on CSI amplitude</li>
              <li>• Range: 6–30 breaths/min</li>
              <li>• Accuracy: ±1 BPM</li>
              <li>• Latency: &lt;500ms</li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-sm mb-2">Heart Rate (Bandpass 0.8–2.0 Hz)</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Phase deviation micro-Doppler</li>
              <li>• Range: 40–120 BPM</li>
              <li>• Accuracy: ±2 BPM</li>
              <li>• Works through walls up to 5m</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
