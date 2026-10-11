import { Play, Pause, Brain, Mic, Volume2 } from 'lucide-react'
import { Button } from '../ui/button'
import { useState } from 'react'

interface ControlPanelProps {
  isCapturing: boolean
  isLearning: boolean
  isPlaying: boolean
  onStartCapture: () => void
  onStopCapture: () => void
  onStartLearning: () => void
  onStopLearning: () => void
  onStartPlaying: () => void
  onStopPlaying: () => void
}

export function ControlPanel({
  isLearning,
  isPlaying,
  onStartLearning,
  onStopLearning,
  onStartPlaying,
  onStopPlaying,
}: ControlPanelProps) {
  const [voiceEnabled, setVoiceEnabled] = useState(false)

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled)
    if (!voiceEnabled) {
      // In a real implementation, this would initialize voice recognition
      console.log('Voice commands enabled')
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 glass border-t">
      <div className="container mx-auto px-4 py-4">
        {/* Voice Control Toggle */}
        <div className="mb-4 flex items-center justify-center gap-3">
          <Button
            onClick={toggleVoice}
            variant={voiceEnabled ? "default" : "outline"}
            size="sm"
            className="touch-target focus-visible-ring"
          >
            {voiceEnabled ? <Volume2 className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
            {voiceEnabled ? 'Voice Active' : 'Enable Voice'}
          </Button>
          {voiceEnabled && (
            <span className="text-xs text-muted-foreground animate-pulse-slow">
              Say "start learning" or "start playing"
            </span>
          )}
        </div>

        {/* Main Controls */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={isLearning ? onStopLearning : onStartLearning}
            size="lg"
            variant={isLearning ? "destructive" : "default"}
            className="touch-target focus-visible-ring text-lg h-16"
          >
            <Brain className="h-6 w-6 mr-2" />
            {isLearning ? 'Stop Learning' : 'Start Learning'}
          </Button>

          <Button
            onClick={isPlaying ? onStopPlaying : onStartPlaying}
            size="lg"
            variant={isPlaying ? "destructive" : "default"}
            className="touch-target focus-visible-ring text-lg h-16"
          >
            {isPlaying ? (
              <>
                <Pause className="h-6 w-6 mr-2" />
                Stop Playing
              </>
            ) : (
              <>
                <Play className="h-6 w-6 mr-2" />
                Start Playing
              </>
            )}
          </Button>
        </div>

        {/* Accessibility Note */}
        <p className="text-xs text-center text-muted-foreground mt-3">
          All controls support voice commands and keyboard shortcuts
        </p>
      </div>
    </div>
  )
}
