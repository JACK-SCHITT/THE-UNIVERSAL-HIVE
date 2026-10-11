import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Game } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { Gamepad2, Plus, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export function GameLibrary() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    loadGames()
  }, [])

  const loadGames = async () => {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('name')

    if (error) {
      toast({
        title: 'Error Loading Games',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      setGames(data || [])
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading games...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Game Library</h2>
          <p className="text-muted-foreground">Select a game to configure automation</p>
        </div>
        <Button variant="outline" size="lg" className="touch-target focus-visible-ring">
          <Plus className="h-5 w-5 mr-2" />
          Add Custom Game
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {games.map((game) => (
          <div
            key={game.id}
            className="glass rounded-xl p-6 space-y-4 hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => navigate(`/game/${game.id}`)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Gamepad2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{game.name}</h3>
                  <p className="text-sm text-muted-foreground">{game.game_type}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="touch-target"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/game/${game.id}/settings`)
                }}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>

            {game.description && (
              <p className="text-sm text-muted-foreground">{game.description}</p>
            )}

            <div className="flex gap-2">
              <span className={`text-xs px-2 py-1 rounded ${game.automation_enabled ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                {game.automation_enabled ? 'Automation Ready' : 'Manual Only'}
              </span>
              {game.requires_credentials && (
                <span className="text-xs px-2 py-1 rounded bg-warning/10 text-warning">
                  Login Required
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
