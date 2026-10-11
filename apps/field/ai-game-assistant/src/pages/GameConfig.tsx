import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Game, GameCredential } from '@/types'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Play, Lock, User } from 'lucide-react'

export function GameConfig() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { toast } = useToast()
  
  const [game, setGame] = useState<Game | null>(null)
  const [credentials, setCredentials] = useState<GameCredential | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (gameId && user) {
      loadGameData()
    }
  }, [gameId, user])

  const loadGameData = async () => {
    if (!gameId || !user) return

    // Load game
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single()

    if (gameError) {
      toast({
        title: 'Error',
        description: gameError.message,
        variant: 'destructive',
      })
      navigate('/games')
      return
    }

    setGame(gameData)

    // Load existing credentials
    const { data: credData } = await supabase
      .from('game_credentials')
      .select('*')
      .eq('game_id', gameId)
      .eq('user_id', user.id)
      .single()

    if (credData) {
      setCredentials(credData)
      setUsername(credData.username || '')
    }

    setLoading(false)
  }

  const handleSaveCredentials = async () => {
    if (!game || !user) return

    setSaving(true)

    const credentialData = {
      user_id: user.id,
      game_id: game.id,
      username,
      encrypted_password: password, // In production, encrypt this!
      is_active: true,
    }

    const { error } = await supabase
      .from('game_credentials')
      .upsert(credentialData)

    if (error) {
      toast({
        title: 'Error Saving Credentials',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Credentials Saved',
        description: 'Your game login has been configured',
      })
    }

    setSaving(false)
  }

  const handleStartAutomation = () => {
    if (!credentials && game?.requires_credentials) {
      toast({
        title: 'Setup Required',
        description: 'Please save your credentials first',
        variant: 'destructive',
      })
      return
    }

    navigate(`/play/${gameId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!game) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/games')}
          className="touch-target"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{game.name}</h1>
          <p className="text-muted-foreground">Configure game automation</p>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="glass rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Game Information</h2>
          <p className="text-muted-foreground">{game.description}</p>
        </div>

        {game.requires_credentials && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Login Credentials</h3>
            <p className="text-sm text-muted-foreground">
              Store your game login to enable automated sessions
            </p>

            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Username / Email</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Your game username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 touch-target focus-visible-ring"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Your game password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 touch-target focus-visible-ring"
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveCredentials}
                disabled={saving || !username || !password}
                className="touch-target focus-visible-ring"
                size="lg"
              >
                <Save className="h-5 w-5 mr-2" />
                {saving ? 'Saving...' : 'Save Credentials'}
              </Button>
            </div>
          </div>
        )}

        {/* Automation Settings */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-semibold text-foreground">Automation Settings</h3>
          
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">AI Learning Features</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Automatic screen capture and analysis</li>
              <li>Pattern recognition from your gameplay</li>
              <li>Autonomous action execution</li>
              <li>Adaptive learning based on success rate</li>
            </ul>
          </div>

          <Button
            onClick={handleStartAutomation}
            size="lg"
            className="w-full touch-target focus-visible-ring"
          >
            <Play className="h-5 w-5 mr-2" />
            Start AI Automation
          </Button>
        </div>
      </div>
    </div>
  )
}
