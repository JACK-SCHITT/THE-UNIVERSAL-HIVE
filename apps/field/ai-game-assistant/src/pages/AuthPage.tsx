import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { mapSupabaseUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Brain, Mail, Lock, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'verify'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleSendOtp = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
      setLoading(false)
    } else {
      toast({
        title: 'OTP Sent',
        description: 'Check your email for the verification code',
      })
      setMode('verify')
      setLoading(false)
    }
  }

  const handleVerifyAndSetPassword = async () => {
    setLoading(true)
    
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })

    if (error) {
      toast({
        title: 'Verification Failed',
        description: error.message,
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    const finalUsername = username || email.split('@')[0]
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { username: finalUsername },
    })

    if (updateError) {
      toast({
        title: 'Error',
        description: updateError.message,
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    if (data.user) {
      login(mapSupabaseUser(data.user))
      navigate('/')
    }
  }

  const handleLogin = async () => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      })
      setLoading(false)
    } else if (data.user) {
      login(mapSupabaseUser(data.user))
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary flex items-center justify-center p-4">
      <div className="glass rounded-3xl p-8 w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">AI Game Assistant</h1>
          <p className="text-muted-foreground">
            {mode === 'login' ? 'Sign in to your account' : mode === 'signup' ? 'Create your account' : 'Verify your email'}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {mode !== 'verify' ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 touch-target focus-visible-ring"
                  />
                </div>
              </div>

              {mode === 'login' ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 touch-target focus-visible-ring"
                    />
                  </div>
                </div>
              ) : null}

              <Button
                onClick={mode === 'login' ? handleLogin : handleSendOtp}
                disabled={loading || !email || (mode === 'login' && !password)}
                className="w-full touch-target focus-visible-ring"
                size="lg"
              >
                {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Send Verification Code'}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Verification Code</label>
                <Input
                  type="text"
                  placeholder="Enter 4-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={4}
                  className="touch-target focus-visible-ring text-center text-2xl tracking-widest"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Username (Optional)</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Choose a username"
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
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 touch-target focus-visible-ring"
                  />
                </div>
              </div>

              <Button
                onClick={handleVerifyAndSetPassword}
                disabled={loading || !otp || !password || otp.length !== 4}
                className="w-full touch-target focus-visible-ring"
                size="lg"
              >
                {loading ? 'Verifying...' : 'Complete Setup'}
              </Button>
            </>
          )}

          {/* Toggle Mode */}
          {mode !== 'verify' && (
            <div className="text-center">
              <button
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-sm text-primary hover:underline focus-visible-ring"
              >
                {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
