import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import WiFiDensePose from '@/pages/WiFiDensePose';
import RadioScanner from '@/pages/RadioScanner';
import BiometricSuite from '@/pages/BiometricSuite';
import { Radio, Wifi, Shield } from 'lucide-react';

export default function App() {
  return (
    <BrowserRouter>
      {/* Navigation */}
      <nav className="fixed top-4 right-4 z-50 flex gap-2">
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2 bg-gray-900/90 hover:bg-gray-800 backdrop-blur-sm border border-gray-700 rounded-lg transition-colors text-sm text-white"
        >
          <Wifi className="w-4 h-4" />
          WiFi Pose
        </Link>
        <Link
          to="/radio"
          className="flex items-center gap-2 px-4 py-2 bg-gray-900/90 hover:bg-gray-800 backdrop-blur-sm border border-gray-700 rounded-lg transition-colors text-sm text-white"
        >
          <Radio className="w-4 h-4" />
          Radio Scanner
        </Link>
        <Link
          to="/biometric"
          className="flex items-center gap-2 px-4 py-2 bg-gray-900/90 hover:bg-gray-800 backdrop-blur-sm border border-gray-700 rounded-lg transition-colors text-sm text-white"
        >
          <Shield className="w-4 h-4" />
          Biometric
        </Link>
      </nav>

      <Routes>
        <Route path="/" element={<WiFiDensePose />} />
        <Route path="/radio" element={<RadioScanner />} />
        <Route path="/biometric" element={<BiometricSuite />} />
      </Routes>
    </BrowserRouter>
  );
}
