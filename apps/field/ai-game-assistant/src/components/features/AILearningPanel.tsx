import { Brain, TrendingUp, Target } from 'lucide-react'
import { Progress } from '../ui/progress'

interface AILearningPanelProps {
  learningProgress: number
  actionsLearned: number
  isLearning: boolean
}

export function AILearningPanel({ learningProgress, actionsLearned, isLearning }: AILearningPanelProps) {
  return (
    <div className="glass rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-success/10 p-3 rounded-lg">
          <Brain className={`h-6 w-6 text-success ${isLearning ? 'animate-learning' : ''}`} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">AI Learning Progress</h2>
          <p className="text-sm text-muted-foreground">Training the AI to play autonomously</p>
        </div>
      </div>

      {/* Learning Progress */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-foreground">Learning Progress</span>
          <span className="text-sm font-bold text-primary">{learningProgress}%</span>
        </div>
        <Progress value={learningProgress} className="h-3" />
        {learningProgress >= 100 && (
          <p className="text-sm text-success font-medium">✓ AI is fully trained and ready!</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="h-4 w-4" />
            <span className="text-xs">Actions Learned</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{actionsLearned}</p>
        </div>

        <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Accuracy</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {Math.min(95, Math.round(learningProgress * 0.95))}%
          </p>
        </div>
      </div>

      {/* Learning Tips */}
      {learningProgress < 100 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-sm text-foreground">
            <span className="font-semibold">Tip:</span> The AI learns by observing your gameplay patterns. 
            Continue playing naturally for best results.
          </p>
        </div>
      )}
    </div>
  )
}
