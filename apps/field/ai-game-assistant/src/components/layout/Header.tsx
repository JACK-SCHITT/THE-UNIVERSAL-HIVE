import { Brain, LogOut, Gamepad2, Home } from 'lucide-react'
import { Button } from '../ui/button'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { useNavigate, useLocation } from 'react-router-dom'

export function Header() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    navigate('/auth')
  }

  return (
    <header className="sticky top-0 z-50 glass border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">AI Game Assistant</h1>
              {user && (
                <p className="text-xs text-muted-foreground">Welcome, {user.username}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {location.pathname !== '/' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="touch-target"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            )}
            {location.pathname !== '/games' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/games')}
                className="touch-target"
              >
                <Gamepad2 className="h-4 w-4 mr-2" />
                Games
              </Button>
            )}
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="touch-target focus-visible-ring"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
