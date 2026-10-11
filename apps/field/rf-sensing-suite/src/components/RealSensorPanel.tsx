import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SensorManager } from '@/lib/real-sensors';
import { Activity, MapPin, Wifi, Sun, Battery } from 'lucide-react';

export default function RealSensorPanel() {
  const [sensorManager] = useState(() => new SensorManager());
  const [available, setAvailable] = useState<string[]>([]);
  const [magnetometer, setMagnetometer] = useState<number>(0);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [network, setNetwork] = useState<string>('Unknown');
  const [light, setLight] = useState<number>(0);
  const [battery, setBattery] = useState<number>(100);

  useEffect(() => {
    const init = async () => {
      await sensorManager.initialize();
      const sensors = sensorManager.getAvailableSensors();
      setAvailable(sensors);
    };
    init();
  }, [sensorManager]);

  const startMagnetometer = () => {
    sensorManager.magnetometer.start((reading) => {
      const magnitude = sensorManager.magnetometer.getMagnitude(reading);
      setMagnetometer(magnitude);
    });
  };

  const getLocation = async () => {
    try {
      const pos = await sensorManager.geolocation.getCurrentPosition();
      setLocation({ lat: pos.latitude, lng: pos.longitude });
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const checkNetwork = () => {
    const info = sensorManager.network.getNetworkInfo();
    if (info) {
      setNetwork(`${info.type} - ${info.signalStrength} Mbps`);
    }
  };

  const startLight = () => {
    sensorManager.light.start((lux) => {
      setLight(lux);
    });
  };

  const checkBattery = async () => {
    try {
      const info = await sensorManager.battery.getBatteryInfo();
      setBattery(info.level);
    } catch (error) {
      console.error('Battery API not supported');
    }
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800 p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-green-400" />
        Real Device Sensors
      </h2>

      <p className="text-xs text-gray-400 mb-4">
        Available: {available.length > 0 ? available.join(', ') : 'None detected'}
      </p>

      <div className="grid grid-cols-2 gap-4">
        {/* Magnetometer */}
        <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
          <Activity className="w-4 h-4 text-purple-400 mb-2" />
          <p className="text-xs text-gray-400">Magnetometer (EMF)</p>
          <p className="text-2xl font-bold text-white">{magnetometer.toFixed(2)} µT</p>
          <Button 
            size="sm" 
            onClick={startMagnetometer}
            className="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-xs"
          >
            Start Reading
          </Button>
        </div>

        {/* Geolocation */}
        <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
          <MapPin className="w-4 h-4 text-blue-400 mb-2" />
          <p className="text-xs text-gray-400">GPS Location</p>
          {location ? (
            <p className="text-sm font-mono text-white">
              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </p>
          ) : (
            <p className="text-sm text-gray-500">Not available</p>
          )}
          <Button 
            size="sm" 
            onClick={getLocation}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-xs"
          >
            Get Location
          </Button>
        </div>

        {/* Network */}
        <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
          <Wifi className="w-4 h-4 text-green-400 mb-2" />
          <p className="text-xs text-gray-400">Network Info</p>
          <p className="text-sm font-semibold text-white">{network}</p>
          <Button 
            size="sm" 
            onClick={checkNetwork}
            className="mt-2 w-full bg-green-600 hover:bg-green-700 text-xs"
          >
            Check Network
          </Button>
        </div>

        {/* Ambient Light */}
        <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
          <Sun className="w-4 h-4 text-yellow-400 mb-2" />
          <p className="text-xs text-gray-400">Ambient Light</p>
          <p className="text-2xl font-bold text-white">{light.toFixed(0)} lux</p>
          <Button 
            size="sm" 
            onClick={startLight}
            className="mt-2 w-full bg-yellow-600 hover:bg-yellow-700 text-xs"
          >
            Start Reading
          </Button>
        </div>

        {/* Battery */}
        <div className="bg-black/40 p-4 rounded-lg border border-gray-800 col-span-2">
          <Battery className="w-4 h-4 text-orange-400 mb-2" />
          <p className="text-xs text-gray-400">Battery Status</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1">
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                  style={{ width: `${battery}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-bold text-white">{battery.toFixed(0)}%</span>
          </div>
          <Button 
            size="sm" 
            onClick={checkBattery}
            className="mt-2 w-full bg-orange-600 hover:bg-orange-700 text-xs"
          >
            Check Battery
          </Button>
        </div>
      </div>

      <div className="mt-4 bg-blue-950/40 border border-blue-800/50 rounded p-3">
        <p className="text-xs text-blue-300">
          ℹ️ <strong>Browser Limitations:</strong> Some sensors require HTTPS, user permission, 
          or specific browser flags. For full hardware access (WiFi CSI, SDR), use the 
          <strong> Mobile APP workspace</strong> (React Native).
        </p>
      </div>
    </Card>
  );
}
