import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameCapture } from '@/components/features/GameCapture'
import { AILearningPanel } from '@/components/features/AILearningPanel'
import { ControlPanel } from '@/components/features/ControlPanel'
import { StatusBar } from '@/components/features/StatusBar'
import { useGameLearning } from '@/hooks/useGameLearning'
import { Button } from '@/components/ui/button'
import { Gamepad2 } from 'lucide-react'

export function HomePage() {
  const navigate = useNavigate()
  const {
    status,
    isCapturing,
    isLearning,
    isPlaying,
    learningProgress,
    actionsLearned,
    startCapture,
    stopCapture,
    startLearning,
    stopLearning,
    startPlaying,
    stopPlaying,
  } = useGameLearning()

  return (
    <>
      <main className="container mx-auto px-4 py-6 space-y-6 pb-32">
        {/* Quick Action */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Quick Start</h2>
              <p className="text-sm text-muted-foreground">Configure a game for automation</p>
            </div>
            <Button
              onClick={() => navigate('/games')}
              size="lg"
              className="touch-target focus-visible-ring"
            >
              <Gamepad2 className="h-5 w-5 mr-2" />
              Browse Games
            </Button>
          </div>
        </div>

        {/* Status Bar */}
        <StatusBar 
          status={status}
          isCapturing={isCapturing}
          isLearning={isLearning}
          isPlaying={isPlaying}
        />

        {/* Game Capture Area */}
        <GameCapture 
          isCapturing={isCapturing}
          onStartCapture={startCapture}
          onStopCapture={stopCapture}
        />

        {/* AI Learning Panel */}
        <AILearningPanel 
          learningProgress={learningProgress}
          actionsLearned={actionsLearned}
          isLearning={isLearning}
        />
      </main>

      {/* Fixed Control Panel */}
      <ControlPanel
        isCapturing={isCapturing}
        isLearning={isLearning}
        isPlaying={isPlaying}
        onStartCapture={startCapture}
        onStopCapture={stopCapture}
        onStartLearning={startLearning}
        onStopLearning={stopLearning}
        onStartPlaying={startPlaying}
        onStopPlaying={stopPlaying}
      />
    </>
  )
}
