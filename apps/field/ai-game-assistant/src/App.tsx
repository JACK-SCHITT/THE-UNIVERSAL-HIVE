import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { AuthPage } from './pages/AuthPage'
import { HomePage } from './pages/HomePage'
import { GameLibrary } from './pages/GameLibrary'
import { GameConfig } from './pages/GameConfig'
import { Toaster } from './components/ui/toaster'
import { useAuth } from './hooks/useAuth'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
        {user && <Header />}
        
        <Routes>
          <Route
            path="/auth"
            element={user ? <Navigate to="/" replace /> : <AuthPage />}
          />
          <Route
            path="/"
            element={user ? <HomePage /> : <Navigate to="/auth" replace />}
          />
          <Route
            path="/games"
            element={user ? <GameLibrary /> : <Navigate to="/auth" replace />}
          />
          <Route
            path="/game/:gameId"
            element={user ? <GameConfig /> : <Navigate to="/auth" replace />}
          />
        </Routes>

        <Toaster />
      </div>
    </BrowserRouter>
  )
}

export default App
