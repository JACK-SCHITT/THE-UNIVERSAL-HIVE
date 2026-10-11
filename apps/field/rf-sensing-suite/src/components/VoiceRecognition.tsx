import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VoiceRecognition as VoiceResult } from '@/types/biometric';
import { VoiceRecognitionEngine } from '@/lib/voice-recognition';
import { Mic, MicOff, Volume2, AlertCircle } from 'lucide-react';

interface VoiceRecognitionProps {
  onCommand?: (command: string) => void;
}

export default function VoiceRecognition({ onCommand }: VoiceRecognitionProps) {
  const [engine] = useState(() => new VoiceRecognitionEngine());
  const [isListening, setIsListening] = useState(false);
  const [results, setResults] = useState<VoiceResult[]>([]);
  const [error, setError] = useState<string>('');

  const startListening = () => {
    if (!engine.isSupported()) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    engine.startListening(
      (result) => {
        setResults(prev => [result, ...prev].slice(0, 20)); // Keep last 20
        
        if (result.command) {
          onCommand?.(result.transcript);
        }
      },
      (err) => {
        setError(err);
        setIsListening(false);
      }
    );

    setIsListening(true);
    setError('');
  };

  const stopListening = () => {
    engine.stopListening();
    setIsListening(false);
  };

  const getCommandIcon = (action?: string) => {
    switch (action) {
      case 'start_scan': return '▶️';
      case 'stop_scan': return '⏸️';
      case 'change_band': return '📻';
      case 'record': return '⏺️';
      case 'analyze': return '🔍';
      default: return '💬';
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gray-900/50 border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              Voice Recognition & Commands
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Web Speech API - voice commands & speaker identification
            </p>
          </div>

          <Button
            onClick={isListening ? stopListening : startListening}
            className={isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4 mr-2" />
                Stop Listening
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Start Listening
              </>
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-950/50 border border-red-800 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-300 font-semibold">Error</p>
                <p className="text-xs text-red-400 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Listening Indicator */}
        {isListening && (
          <div className="bg-purple-950/40 border border-purple-800 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-3 h-3 bg-purple-500 rounded-full animate-ping" />
              </div>
              <div>
                <p className="text-sm font-semibold text-purple-300">Listening...</p>
                <p className="text-xs text-gray-400 mt-1">
                  Try: "Start scan", "Change to FM", "Analyze", "Stop scan"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Transcript History */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {results.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mic className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No voice input yet</p>
              <p className="text-xs mt-1">Click "Start Listening" to begin</p>
            </div>
          ) : (
            results.map((result, idx) => (
              <Card
                key={`${result.timestamp}-${idx}`}
                className={`p-3 ${
                  result.command
                    ? 'bg-purple-950/40 border-purple-800'
                    : 'bg-black/40 border-gray-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">
                    {getCommandIcon(result.command?.action)}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm text-white font-medium">
                        {result.transcript}
                      </p>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-500">
                        Confidence: <span className="text-purple-400 font-semibold">
                          {(result.confidence * 100).toFixed(0)}%
                        </span>
                      </span>

                      {result.recognizedSpeaker && (
                        <span className="text-gray-500">
                          Speaker: <span className="text-green-400 font-semibold">
                            {result.recognizedSpeaker}
                          </span>
                        </span>
                      )}
                    </div>

                    {result.command && (
                      <div className="mt-2 bg-purple-900/40 rounded px-2 py-1">
                        <p className="text-xs text-purple-300 font-mono">
                          → Command: {result.command.action}
                          {result.command.parameters && (
                            <span className="ml-2 text-purple-400">
                              {JSON.stringify(result.command.parameters)}
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>

      {/* Voice Commands Reference */}
      <Card className="bg-gray-900/50 border-gray-800 p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Available Commands</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-black/40 p-2 rounded border border-gray-800">
            <p className="text-purple-400 font-semibold">▶️ Start/Begin scan</p>
            <p className="text-gray-500 text-xs mt-0.5">Start RF scanning</p>
          </div>
          <div className="bg-black/40 p-2 rounded border border-gray-800">
            <p className="text-purple-400 font-semibold">⏸️ Stop/End scan</p>
            <p className="text-gray-500 text-xs mt-0.5">Stop scanning</p>
          </div>
          <div className="bg-black/40 p-2 rounded border border-gray-800">
            <p className="text-purple-400 font-semibold">📻 Change/Switch to [band]</p>
            <p className="text-gray-500 text-xs mt-0.5">Select frequency band</p>
          </div>
          <div className="bg-black/40 p-2 rounded border border-gray-800">
            <p className="text-purple-400 font-semibold">🔍 Analyze/Identify</p>
            <p className="text-gray-500 text-xs mt-0.5">Analyze signals</p>
          </div>
        </div>
      </Card>

      {/* Browser Support Info */}
      {!engine.isSupported() && (
        <Card className="bg-amber-950/40 border-amber-800/50 p-4">
          <p className="text-xs text-amber-300">
            ⚠️ Your browser doesn't support Web Speech API. Try Chrome, Edge, or Safari.
          </p>
        </Card>
      )}
    </div>
  );
}
