/**
 * Real Browser Sensor APIs
 * Uses actual device sensors where available
 */

export interface SensorReading {
  timestamp: number;
  values: number[];
}

export interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

export interface NetworkInfo {
  ssid: string;
  signalStrength: number;
  frequency?: number;
  type: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
}

/**
 * Magnetometer - Detect electromagnetic fields
 * Useful for finding powered electronics
 */
export class MagnetometerSensor {
  private sensor: any = null;
  private isAvailable = false;

  async initialize(): Promise<boolean> {
    try {
      if ('Magnetometer' in window) {
        this.sensor = new (window as any).Magnetometer({ frequency: 60 });
        this.isAvailable = true;
        return true;
      }
    } catch (error) {
      console.warn('Magnetometer not available:', error);
    }
    return false;
  }

  start(callback: (reading: SensorReading) => void) {
    if (!this.sensor) {
      throw new Error('Magnetometer not initialized');
    }

    this.sensor.addEventListener('reading', () => {
      callback({
        timestamp: Date.now(),
        values: [this.sensor.x, this.sensor.y, this.sensor.z]
      });
    });

    this.sensor.start();
  }

  stop() {
    if (this.sensor) {
      this.sensor.stop();
    }
  }

  getMagnitude(reading: SensorReading): number {
    const [x, y, z] = reading.values;
    return Math.sqrt(x * x + y * y + z * z);
  }
}

/**
 * Geolocation - Get device location
 */
export class GeolocationSensor {
  async getCurrentPosition(): Promise<GeolocationData> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  watchPosition(callback: (data: GeolocationData) => void): number {
    return navigator.geolocation.watchPosition(
      (position) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000
      }
    );
  }

  clearWatch(watchId: number) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * Network Information API
 * Get WiFi/cellular connection info
 */
export class NetworkSensor {
  getNetworkInfo(): NetworkInfo | null {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (!connection) {
      return null;
    }

    // Determine network type
    let type: NetworkInfo['type'] = 'unknown';
    if (connection.type === 'wifi') type = 'wifi';
    else if (connection.type === 'cellular') type = 'cellular';
    else if (connection.type === 'ethernet') type = 'ethernet';

    return {
      ssid: 'Unknown', // Browser can't access SSID for security
      signalStrength: connection.downlink || 0, // Effective bandwidth (Mbps)
      type
    };
  }

  onNetworkChange(callback: (info: NetworkInfo | null) => void) {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (!connection) return;

    connection.addEventListener('change', () => {
      callback(this.getNetworkInfo());
    });
  }
}

/**
 * Ambient Light Sensor
 */
export class AmbientLightSensor {
  private sensor: any = null;

  async initialize(): Promise<boolean> {
    try {
      if ('AmbientLightSensor' in window) {
        this.sensor = new (window as any).AmbientLightSensor();
        return true;
      }
    } catch (error) {
      console.warn('Ambient light sensor not available');
    }
    return false;
  }

  start(callback: (lux: number) => void) {
    if (!this.sensor) {
      throw new Error('Sensor not initialized');
    }

    this.sensor.addEventListener('reading', () => {
      callback(this.sensor.illuminance);
    });

    this.sensor.start();
  }

  stop() {
    if (this.sensor) {
      this.sensor.stop();
    }
  }
}

/**
 * Battery Status
 */
export class BatterySensor {
  async getBatteryInfo() {
    const battery: any = await (navigator as any).getBattery();
    
    return {
      level: battery.level * 100, // Percentage
      charging: battery.charging,
      chargingTime: battery.chargingTime,
      dischargingTime: battery.dischargingTime
    };
  }
}

/**
 * Comprehensive sensor manager
 */
export class SensorManager {
  magnetometer = new MagnetometerSensor();
  geolocation = new GeolocationSensor();
  network = new NetworkSensor();
  light = new AmbientLightSensor();
  battery = new BatterySensor();

  async initialize() {
    const results = {
      magnetometer: await this.magnetometer.initialize(),
      light: await this.light.initialize()
    };

    console.log('Sensor availability:', results);
    return results;
  }

  getAvailableSensors(): string[] {
    const sensors: string[] = [];
    
    if ('Magnetometer' in window) sensors.push('magnetometer');
    if ('geolocation' in navigator) sensors.push('geolocation');
    if ((navigator as any).connection) sensors.push('network');
    if ('AmbientLightSensor' in window) sensors.push('ambient_light');
    if ('getBattery' in navigator) sensors.push('battery');
    
    return sensors;
  }
}
