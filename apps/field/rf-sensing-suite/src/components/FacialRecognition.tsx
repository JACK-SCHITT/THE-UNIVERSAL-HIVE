import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FaceDetection, BiometricProfile } from '@/types/biometric';
import { FaceRecognitionEngine } from '@/lib/face-recognition';
import { Camera, CameraOff, UserPlus, Users } from 'lucide-react';

export default function FacialRecognition() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engine] = useState(() => new FaceRecognitionEngine());
  const [isActive, setIsActive] = useState(false);
  const [detections, setDetections] = useState<FaceDetection[]>([]);
  const [profiles, setProfiles] = useState<BiometricProfile[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    engine.initialize();
    
    // Add demo profiles
    const demoProfiles: BiometricProfile[] = [
      {
        id: '1',
        name: 'Admin User',
        faceDescriptors: [new Float32Array(128).fill(0.5)],
        trustScore: 0.95,
        lastSeen: Date.now(),
        accessLevel: 'admin'
      },
      {
        id: '2',
        name: 'Operator',
        faceDescriptors: [new Float32Array(128).fill(0.3)],
        trustScore: 0.85,
        lastSeen: Date.now() - 3600000,
        accessLevel: 'operator'
      }
    ];
    
    demoProfiles.forEach(p => engine.registerFace(p));
    setProfiles(engine.getProfiles());
  }, [engine]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      
      setStream(mediaStream);
      setIsActive(true);
      startDetection();
    } catch (error) {
      console.error('Camera access denied:', error);
      alert('Camera access required for facial recognition');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsActive(false);
  };

  const startDetection = () => {
    const detectInterval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Detect faces
      try {
        const faces = await engine.detectFaces(imageData);
        setDetections(faces);
        
        // Draw detections
        drawDetections(ctx, faces);
      } catch (error) {
        console.error('Detection error:', error);
      }
    }, 500); // 2 FPS

    return () => clearInterval(detectInterval);
  };

  const drawDetections = (ctx: CanvasRenderingContext2D, faces: FaceDetection[]) => {
    faces.forEach(face => {
      // Bounding box
      ctx.strokeStyle = face.recognizedAs ? '#4ADE80' : '#FFD93D';
      ctx.lineWidth = 3;
      ctx.strokeRect(
        face.boundingBox.x,
        face.boundingBox.y,
        face.boundingBox.width,
        face.boundingBox.height
      );

      // Landmarks
      ctx.fillStyle = '#FF6B6B';
      Object.values(face.landmarks).forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });

      // Label
      ctx.fillStyle = face.recognizedAs ? '#4ADE80' : '#FFD93D';
      ctx.font = 'bold 14px monospace';
      const label = face.recognizedAs || 'Unknown';
      const confidence = `${(face.confidence * 100).toFixed(0)}%`;
      ctx.fillText(
        `${label} (${confidence})`,
        face.boundingBox.x,
        face.boundingBox.y - 10
      );
    });
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gray-900/50 border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Facial Recognition
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Browser-based face detection & identification
            </p>
          </div>
          
          <Button
            onClick={isActive ? stopCamera : startCamera}
            className={isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
          >
            {isActive ? (
              <>
                <CameraOff className="w-4 h-4 mr-2" />
                Stop Camera
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                Start Camera
              </>
            )}
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Video Feed */}
          <div className="space-y-2">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-auto hidden"
                playsInline
              />
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="w-full h-auto"
              />
              
              {!isActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                  <div className="text-center">
                    <Camera className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                    <p className="text-gray-400">Camera inactive</p>
                  </div>
                </div>
              )}
            </div>
            
            {detections.length > 0 && (
              <div className="bg-black/40 p-3 rounded border border-gray-800">
                <p className="text-sm text-green-400 font-semibold mb-2">
                  ✓ {detections.length} face(s) detected
                </p>
                {detections.map((face, idx) => (
                  <div key={face.id} className="text-xs text-gray-400 mt-1">
                    {idx + 1}. {face.recognizedAs ? (
                      <span className="text-green-400 font-semibold">{face.recognizedAs}</span>
                    ) : (
                      <span className="text-yellow-400">Unknown person</span>
                    )} - {(face.confidence * 100).toFixed(0)}% confidence
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Registered Profiles */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Registered Profiles ({profiles.length})
              </h3>
              <Button size="sm" variant="outline" className="text-xs">
                <UserPlus className="w-3 h-3 mr-1" />
                Add
              </Button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {profiles.map(profile => (
                <Card key={profile.id} className="bg-black/40 border-gray-800 p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-white">{profile.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Access: <span className="text-orange-400">{profile.accessLevel}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-500">Trust Score</span>
                            <span className="text-green-400 font-semibold">
                              {(profile.trustScore * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                              style={{ width: `${profile.trustScore * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Info */}
      <Card className="bg-blue-950/40 border-blue-800/50 p-4">
        <p className="text-xs text-blue-300">
          ℹ️ This uses browser-based face detection (simulated). Production systems use 
          MediaPipe Face Detection or face-api.js with trained CNN embeddings for 128-dim descriptors.
          Always obtain consent before biometric collection.
        </p>
      </Card>
    </div>
  );
}
