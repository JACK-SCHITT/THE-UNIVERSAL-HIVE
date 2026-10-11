# Mobile APP Workspace - Native Hardware Access Guide

## Why Switch to APP Workspace?

The **WEBSITE workspace** (current) runs in browsers with these **limitations**:
- ❌ No real WiFi CSI (Channel State Information) access
- ❌ No SDR dongle support (RTL-SDR, HackRF)
- ❌ No native magnetometer/RF sensor APIs
- ❌ Simulated data only

The **APP workspace** (React Native) gives you:
- ✅ **Real WiFi scanning** via native APIs
- ✅ **USB-OTG SDR** integration (Android)
- ✅ **Native sensors**: Magnetometer, GPS, Bluetooth scanning
- ✅ **Camera + ML** for PCB component scanning
- ✅ **On-device ML** inference (TensorFlow Lite)
- ✅ **Background scanning** capabilities

---

## What You Can Build in APP Workspace

### 1. **Real WiFi Scanner**
```typescript
// React Native WiFi Module
import WifiManager from 'react-native-wifi-reborn';

// Scan WiFi networks
const networks = await WifiManager.loadWifiList();
// Get BSSID, RSSI, frequency, channel

// Advanced: WiFi CSI (Android)
import { WiFiCSI } from 'react-native-wifi-csi';
const csiData = await WiFiCSI.startCapture();
// Returns amplitude/phase for pose detection
```

### 2. **USB SDR Integration (Android Only)**
```typescript
// USB Host API for RTL-SDR, HackRF
import { UsbSerial } from 'react-native-usb-serialport';

// Detect SDR dongle
const devices = await UsbSerial.list();
// Open RTL-SDR
const connection = await UsbSerial.open(deviceId);
// Read RF spectrum data
const rfData = await connection.read();
```

### 3. **Native Sensors**
```typescript
// Magnetometer (EMF detection)
import { magnetometer } from 'react-native-sensors';

magnetometer.subscribe(({ x, y, z }) => {
  const strength = Math.sqrt(x*x + y*y + z*z);
  // Detect interference from nearby electronics
});

// Geolocation
import Geolocation from '@react-native-community/geolocation';
Geolocation.getCurrentPosition(info => {
  // Lat/lng for location-based features
});
```

### 4. **Camera + ML (PCB Scanning)**
```typescript
// TensorFlow Lite for component recognition
import * as tf from '@tensorflow/tfjs-react-native';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';

// Load model
const model = await tf.loadLayersModel('model.json');

// Scan circuit board
const imageTensor = decodeJpeg(cameraImage);
const predictions = model.predict(imageTensor);
// Identify: resistors, capacitors, ICs, etc.
```

### 5. **Bluetooth Scanning**
```typescript
import BleManager from 'react-native-ble-manager';

// Scan for BLE devices
BleManager.scan([], 5, true).then(() => {
  BleManager.getDiscoveredPeripherals().then(devices => {
    // Detect nearby devices, RSSI tracking
  });
});
```

---

## Migration Steps

### Step 1: Create New APP Project
1. Go back to **OnSpace homepage**
2. Click **"APP"** tab (not "WEBSITE")
3. Create new project: **"FreqBoard Sleuth Mobile"**
4. Choose: React Native template

### Step 2: Install Native Modules
```bash
# WiFi
npm install react-native-wifi-reborn

# Sensors
npm install react-native-sensors

# Bluetooth
npm install react-native-ble-manager

# USB (Android)
npm install react-native-usb-serialport

# Camera + ML
npm install @tensorflow/tfjs-react-native
npm install @react-native-camera-roll/camera-roll
npm install react-native-camera

# Permissions
npm install react-native-permissions
```

### Step 3: Port Existing Code
**Reusable from Website:**
- ✅ UI Components (React)
- ✅ Business logic
- ✅ State management
- ✅ Backend API client

**Needs Replacement:**
- ❌ Browser APIs → Native modules
- ❌ Simulated sensors → Real hardware
- ❌ Web Speech API → react-native-voice

### Step 4: Add Permissions (Android)
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE"/>
<uses-permission android:name="android.permission.CHANGE_WIFI_STATE"/>
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.BLUETOOTH"/>
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN"/>
<uses-permission android:name="android.permission.BLUETOOTH_SCAN"/>
<uses-permission android:name="android.permission.USB_PERMISSION"/>

<!-- For USB OTG -->
<uses-feature android:name="android.hardware.usb.host"/>
```

### Step 5: Add Permissions (iOS)
```xml
<!-- ios/FreqBoardSleuth/Info.plist -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>Need location for WiFi scanning</string>
<key>NSCameraUsageDescription</key>
<string>Scan circuit boards for component identification</string>
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Scan for nearby devices</string>
```

---

## Hardware Requirements

### For WiFi CSI (DensePose Detection)
**Android:**
- Qualcomm chipset with CSI support (Snapdragon 8xx series)
- Root access + custom firmware (research only)
- OR external WiFi adapter via USB-OTG

**iOS:**
- ❌ Apple blocks direct CSI access
- Workaround: Bluetooth RSSI triangulation

### For RF Scanning
**Required:** USB-OTG SDR dongle
- **RTL-SDR** ($25): 24-1766 MHz
- **HackRF One** ($300): 1 MHz - 6 GHz
- **LimeSDR** ($300): Full duplex, wider range

**Connection:**
- Android: USB-OTG cable + powered USB hub (SDR draws power)
- iOS: ❌ No USB host mode (use external WiFi-enabled SDR like KiwiSDR)

---

## Feature Comparison

| Feature | Website (Browser) | APP (React Native) |
|---------|-------------------|-------------------|
| WiFi Scanning | ⚠️ Basic network list | ✅ Full CSI access (Android) |
| RF Spectrum | ❌ Simulated only | ✅ Real SDR support |
| Magnetometer | ❌ Not available | ✅ Native sensor |
| Camera ML | ⚠️ Limited (WebRTC) | ✅ Full TensorFlow Lite |
| GPS | ✅ Web Geolocation | ✅ Native GPS |
| Background Scan | ❌ Not allowed | ✅ Background services |
| Offline Mode | ⚠️ Limited | ✅ Full offline capability |
| APK/IPA Export | ❌ No | ✅ Full app packages |

---

## Example: Real WiFi Scanner (React Native)

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import WifiManager from 'react-native-wifi-reborn';
import { magnetometer } from 'react-native-sensors';

export default function RealWiFiScanner() {
  const [networks, setNetworks] = useState([]);
  const [emfStrength, setEmfStrength] = useState(0);

  useEffect(() => {
    // Scan WiFi every 5 seconds
    const scanInterval = setInterval(async () => {
      const wifiList = await WifiManager.loadWifiList();
      setNetworks(wifiList);
    }, 5000);

    // Monitor magnetometer (EMF detection)
    const subscription = magnetometer.subscribe(({ x, y, z }) => {
      const strength = Math.sqrt(x*x + y*y + z*z);
      setEmfStrength(strength);
    });

    return () => {
      clearInterval(scanInterval);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <View>
      <Text>EMF Strength: {emfStrength.toFixed(2)} µT</Text>
      
      <FlatList
        data={networks}
        renderItem={({ item }) => (
          <View>
            <Text>{item.SSID}</Text>
            <Text>RSSI: {item.level} dBm</Text>
            <Text>Freq: {item.frequency} MHz</Text>
          </View>
        )}
      />
    </View>
  );
}
```

---

## Next Steps

1. **Test in APP workspace** - Start small, verify hardware access works
2. **Connect real SDR** - Test with RTL-SDR dongle on Android
3. **Train PCB scanner** - Build TensorFlow Lite model for component recognition
4. **Integrate backend** - Connect to Python backend (same API)
5. **Deploy** - Export APK for Android testing

**Questions?** Ask in OnSpace APP workspace chat after migration!
