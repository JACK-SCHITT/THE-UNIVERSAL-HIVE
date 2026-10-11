import { useSimulation } from '@/hooks/useSimulation';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Lightbulb, Wind, Zap, DollarSign, Users, Thermometer } from 'lucide-react';

export default function SmartBuildingDashboard() {
  const { rooms, totalEnergySavings, buildingOccupancy } = useSimulation();

  const occupiedRooms = rooms.filter(r => r.occupied).length;
  const totalRooms = rooms.length;
  const totalEnergyWatts = rooms.reduce((s, r) => s + r.energyWatts, 0);
  const monthlyCostSavings = Math.round(totalEnergySavings * 120); // estimate

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-cyber flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Smart Building Automation</h2>
            <p className="text-sm text-muted-foreground">WiFi sensing for real-time HVAC, lighting, and energy management</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30">
          <Zap className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium text-green-500">Live Optimizing</span>
        </div>
      </div>

      {/* Live Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Occupied Rooms</p>
              <p className="text-2xl font-bold">{occupiedRooms}/{totalRooms}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Energy Savings</p>
              <p className="text-2xl font-bold">{totalEnergySavings}%</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-accent/20 to-accent/5 border-accent/30">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Monthly Savings</p>
              <p className="text-2xl font-bold">${monthlyCostSavings}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/30">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total Occupants</p>
              <p className="text-2xl font-bold">{buildingOccupancy}</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="rooms" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rooms">Room Status</TabsTrigger>
          <TabsTrigger value="hvac">HVAC</TabsTrigger>
          <TabsTrigger value="energy">Energy</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map(room => (
              <Card
                key={room.id}
                className={`p-4 bg-card/50 border ${
                  room.occupied ? 'border-primary/40' : 'border-border/30'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold">{room.name}</p>
                    <p className="text-xs text-muted-foreground">{room.zone}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    room.occupied
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {room.occupied ? `${room.peopleCount} people` : 'Empty'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                    <span>{room.temperature.toFixed(1)}°C</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wind className={`w-3.5 h-3.5 ${room.hvacActive ? 'text-blue-400' : 'text-muted-foreground'}`} />
                    <span>{room.hvacActive ? 'HVAC On' : 'Eco Mode'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className={`w-3.5 h-3.5 ${room.lightLevel > 0 ? 'text-yellow-400' : 'text-muted-foreground'}`} />
                    <span>{room.lightLevel}% light</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-green-400" />
                    <span>{room.energyWatts}W</span>
                  </div>
                </div>

                {/* Energy bar */}
                <div className="mt-3 w-full h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      room.occupied ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                    style={{ width: `${(room.energyWatts / 4000) * 100}%` }}
                  />
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="hvac">
          <div className="space-y-4">
            <Card className="p-6 bg-card/50">
              <h3 className="text-lg font-bold mb-4">🌡️ HVAC Status by Room</h3>
              <div className="space-y-3">
                {rooms.map(room => (
                  <div key={room.id} className="flex items-center gap-4 p-3 bg-background/50 rounded-lg">
                    <div className="w-32 text-sm font-bold truncate">{room.name}</div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{room.temperature.toFixed(1)}°C current</span>
                        <span className="text-muted-foreground">{room.targetTemp}°C target</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${room.occupied ? 'bg-red-400' : 'bg-blue-400'}`}
                          style={{ width: `${((room.temperature - 15) / 15) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      room.hvacActive ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {room.hvacActive ? 'Active' : 'Eco'}
                    </span>
                    <span className="text-xs text-muted-foreground w-12 text-right">{room.energyWatts}W</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="energy">
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-6 bg-card/50">
                <p className="text-sm text-muted-foreground mb-1">Total Power Draw</p>
                <p className="text-3xl font-bold">{(totalEnergyWatts / 1000).toFixed(1)} kW</p>
              </Card>
              <Card className="p-6 bg-card/50">
                <p className="text-sm text-muted-foreground mb-1">Annual Savings</p>
                <p className="text-3xl font-bold">${monthlyCostSavings * 12}</p>
              </Card>
              <Card className="p-6 bg-card/50">
                <p className="text-sm text-muted-foreground mb-1">CO₂ Reduction</p>
                <p className="text-3xl font-bold">{Math.round(totalEnergySavings * 2.4)} kg/day</p>
              </Card>
            </div>

            <Card className="p-6 bg-card/50">
              <h4 className="text-lg font-bold mb-4">⚡ Energy by Zone</h4>
              <div className="space-y-3">
                {rooms.map(room => (
                  <div key={room.id} className="flex items-center gap-4">
                    <span className="w-36 text-sm truncate">{room.name}</span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all duration-1000"
                        style={{ width: `${(room.energyWatts / 4000) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-14 text-right">{room.energyWatts}W</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                * Empty rooms auto-switch to eco mode — saving {totalEnergySavings}% vs. scheduled HVAC
              </p>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
