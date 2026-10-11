import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FacialRecognition from '@/components/FacialRecognition';
import VoiceRecognition from '@/components/VoiceRecognition';
import FraudDetectionDemo from '@/components/FraudDetectionDemo';
import RealSensorPanel from '@/components/RealSensorPanel';
import { Shield, Camera, Mic, Activity } from 'lucide-react';

export default function BiometricSuite() {
  const handleVoiceCommand = (command: string) => {
    console.log('Voice command received:', command);
    // Handle commands here (e.g., control radio scanner)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                Biometric Security Suite
              </h1>
              <p className="text-xs text-gray-500">Facial Recognition • Voice ID • Fraud Detection</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="facial" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-900 border border-gray-800 mb-6">
            <TabsTrigger value="facial" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Facial Recognition
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Voice Recognition
            </TabsTrigger>
            <TabsTrigger value="fraud" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Fraud Detection
            </TabsTrigger>
            <TabsTrigger value="sensors" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Real Sensors
            </TabsTrigger>
          </TabsList>

          <TabsContent value="facial">
            <FacialRecognition />
          </TabsContent>

          <TabsContent value="voice">
            <VoiceRecognition onCommand={handleVoiceCommand} />
          </TabsContent>

          <TabsContent value="fraud">
            <FraudDetectionDemo />
          </TabsContent>

          <TabsContent value="sensors">
            <RealSensorPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
