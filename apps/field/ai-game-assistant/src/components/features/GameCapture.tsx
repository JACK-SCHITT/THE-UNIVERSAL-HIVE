import { Monitor, MonitorOff } from 'lucide-react'
import { Button } from '../ui/button'

interface GameCaptureProps {
  isCapturing: boolean
  onStartCapture: () => void
  onStopCapture: () => void
}

export function GameCapture({ isCapturing, onStartCapture, onStopCapture }: GameCaptureProps) {
  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-lg">
          <Monitor className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Game Capture</h2>
          <p className="text-sm text-muted-foreground">Record your gameplay for AI to learn</p>
        </div>
      </div>

      <div className="bg-secondary/50 rounded-xl p-8 min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-border">
        {isCapturing ? (
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div className="relative bg-primary text-primary-foreground p-4 rounded-full">
                <Monitor className="h-8 w-8" />
              </div>
            </div>
            <div>
              <p className="font-semibold text-foreground">Recording Active</p>
              <p className="text-sm text-muted-foreground">Play your game normally</p>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <MonitorOff className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <p className="font-semibold text-foreground">No Active Capture</p>
              <p className="text-sm text-muted-foreground">Start capturing to begin learning</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={onStartCapture}
          disabled={isCapturing}
          size="lg"
          className="flex-1 touch-target focus-visible-ring"
        >
          <Monitor className="h-5 w-5 mr-2" />
          Start Capture
        </Button>
        <Button
          onClick={onStopCapture}
          disabled={!isCapturing}
          variant="destructive"
          size="lg"
          className="flex-1 touch-target focus-visible-ring"
        >
          <MonitorOff className="h-5 w-5 mr-2" />
          Stop Capture
        </Button>
      </div>
    </div>
  )
}
