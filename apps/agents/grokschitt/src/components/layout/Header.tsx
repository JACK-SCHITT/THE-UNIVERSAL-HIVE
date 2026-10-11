import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare, Book, Globe, LogIn, LogOut, User } from 'lucide-react';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import AuthModal from '@/components/auth/AuthModal';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth, initAuth } from '@/hooks/useAuth';
import { languages, Language } from '@/lib/i18n';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSimulation } from '@/hooks/useSimulation';

// Initialize auth listener once on module load
initAuth();

export default function Header() {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { user, loading, logout } = useAuth();
  const startSimulation = useSimulation(s => s.startSimulation);
  const [showAuth, setShowAuth] = useState(false);

  // Start simulation engine on mount
  useEffect(() => {
    startSimulation();
  }, [startSimulation]);

  return (
    <>
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 rounded-lg gradient-cyber flex items-center justify-center">
                <span className="text-2xl font-bold text-white">G</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient">GROKSCHITT</h1>
                <p className="text-xs text-muted-foreground">v18 COMPLETE EDITION</p>
              </div>
            </div>

            <nav className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 border border-accent/30">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse-glow"></div>
                <span className="text-xs font-medium text-accent">Live</span>
              </div>

              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                {t('nav.home')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/grok-max')}>
                <MessageSquare className="w-4 h-4 mr-1" />
                {t('nav.chat')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/docs')}>
                <Book className="w-4 h-4 mr-1" />
                API
              </Button>

              <div className="hidden md:flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
                  <SelectTrigger className="w-[100px] h-8 bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(languages).map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <NotificationCenter />

              {/* Auth */}
              {loading ? null : user ? (
                <div className="flex items-center gap-2">
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-medium text-primary">{user.username}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => logout()}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setShowAuth(true)}
                  className="gradient-cyber text-white gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
