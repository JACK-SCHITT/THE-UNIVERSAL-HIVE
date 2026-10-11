import { Card } from '@/components/ui/card';
import { Lightbulb, Zap, DollarSign } from 'lucide-react';

export default function LightingAutomation() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">Lighting Automation</h3>
        <p className="text-sm text-muted-foreground">
          Lights follow people through rooms — no motion sensor delays or dead zones
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 bg-card/50">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-sm text-muted-foreground">Active Zones</p>
              <p className="text-2xl font-bold">12/28</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card/50">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Energy Saved</p>
              <p className="text-2xl font-bold">18%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card/50">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Monthly Savings</p>
              <p className="text-2xl font-bold">$421</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-card/50">
        <h4 className="text-lg font-bold mb-4">💡 Lighting Zones</h4>
        <p className="text-muted-foreground mb-4">
          Building divided into 28 lighting zones with WiFi presence detection
        </p>
        
        <div className="grid md:grid-cols-4 gap-3">
          {[...Array(28)].map((_, i) => (
            <div 
              key={i} 
              className={`p-3 rounded-lg border ${
                i < 12 
                  ? 'border-yellow-500/30 bg-yellow-500/10' 
                  : 'border-border/30 bg-background/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">Zone {i + 1}</span>
                <Lightbulb className={`w-4 h-4 ${i < 12 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {i < 12 ? 'Active' : 'Standby'}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-card/50">
        <h4 className="text-lg font-bold mb-4">✨ Smart Features</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="font-bold mb-2">Automation</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Lights follow people room-to-room</li>
              <li>• No motion sensor delays</li>
              <li>• Works through walls</li>
              <li>• Dim when room partially occupied</li>
            </ul>
          </div>
          <div>
            <p className="font-bold mb-2">Benefits</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 18% energy reduction</li>
              <li>• $421/month savings</li>
              <li>• Better user experience</li>
              <li>• Extended bulb life</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
