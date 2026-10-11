import { useState, useCallback, useEffect } from 'react'
import { useToast } from './use-toast'

type Status = 'idle' | 'capturing' | 'learning' | 'playing' | 'paused'

export function useGameLearning() {
  const [status, setStatus] = useState<Status>('idle')
  const [isCapturing, setIsCapturing] = useState(false)
  const [isLearning, setIsLearning] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [learningProgress, setLearningProgress] = useState(0)
  const [actionsLearned, setActionsLearned] = useState(0)
  const { toast } = useToast()

  // Simulate learning progress
  useEffect(() => {
    if (isLearning) {
      const interval = setInterval(() => {
        setLearningProgress(prev => {
          if (prev >= 100) {
            setIsLearning(false)
            toast({
              title: "Learning Complete!",
              description: "AI is ready to play autonomously",
            })
            return 100
          }
          return prev + 2
        })
        setActionsLearned(prev => prev + 1)
      }, 500)
      return () => clearInterval(interval)
    }
  }, [isLearning, toast])

  const startCapture = useCallback(async () => {
    try {
      // Request screen capture permission
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' }
      })
      
      setIsCapturing(true)
      setStatus('capturing')
      toast({
        title: "Capture Started",
        description: "Recording game screen for AI analysis",
      })

      // Store stream for later cleanup
      window.gameStream = stream
    } catch (error) {
      toast({
        title: "Capture Failed",
        description: "Unable to access screen capture",
        variant: "destructive",
      })
    }
  }, [toast])

  const stopCapture = useCallback(() => {
    if (window.gameStream) {
      window.gameStream.getTracks().forEach(track => track.stop())
    }
    setIsCapturing(false)
    setStatus('idle')
    toast({
      title: "Capture Stopped",
      description: "Screen recording ended",
    })
  }, [toast])

  const startLearning = useCallback(() => {
    if (!isCapturing && actionsLearned === 0) {
      toast({
        title: "Start Capture First",
        description: "Capture gameplay before starting AI learning",
        variant: "destructive",
      })
      return
    }

    setIsLearning(true)
    setStatus('learning')
    setLearningProgress(0)
    toast({
      title: "AI Learning Started",
      description: "Analyzing gameplay patterns...",
    })
  }, [isCapturing, actionsLearned, toast])

  const stopLearning = useCallback(() => {
    setIsLearning(false)
    setStatus('idle')
    toast({
      title: "Learning Paused",
      description: "AI training paused",
    })
  }, [toast])

  const startPlaying = useCallback(() => {
    if (learningProgress < 50) {
      toast({
        title: "Insufficient Training",
        description: "AI needs at least 50% learning progress to play",
        variant: "destructive",
      })
      return
    }

    setIsPlaying(true)
    setStatus('playing')
    toast({
      title: "Autonomous Play Started",
      description: "AI is now playing the game",
    })
  }, [learningProgress, toast])

  const stopPlaying = useCallback(() => {
    setIsPlaying(false)
    setStatus('idle')
    toast({
      title: "Autonomous Play Stopped",
      description: "AI stopped playing",
    })
  }, [toast])

  return {
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
  }
}

declare global {
  interface Window {
    gameStream?: MediaStream
  }
}
