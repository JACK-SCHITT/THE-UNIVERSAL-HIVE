import { Activity, Brain, Play, Pause } from 'lucide-react'

interface StatusBarProps {
  status: string
  isCapturing: boolean
  isLearning: boolean
  isPlaying: boolean
}

export function StatusBar({ status, isCapturing, isLearning, isPlaying }: StatusBarProps) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            {status === 'idle' ? (
              <Pause className="h-6 w-6 text-muted-foreground" />
            ) : (
              <Activity className="h-6 w-6 text-primary animate-pulse-slow" />
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">System Status</p>
            <p className="text-lg font-bold text-foreground capitalize">{status}</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {isCapturing && (
            <div className="status-indicator bg-primary/10 text-primary">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse-slow" />
              Capturing
            </div>
          )}
          {isLearning && (
            <div className="status-indicator bg-success/10 text-success">
              <Brain className="h-4 w-4 animate-learning" />
              Learning
            </div>
          )}
          {isPlaying && (
            <div className="status-indicator bg-warning/10 text-warning">
              <Play className="h-4 w-4" />
              Playing
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
