import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { X, Mail, Lock, User, Loader2, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AuthModalProps {
  onClose: () => void;
}

type AuthStep = 'login' | 'register' | 'otp';

export default function AuthModal({ onClose }: AuthModalProps) {
  const [step, setStep] = useState<AuthStep>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { toast.error('Email and password required'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success('Welcome back!');
      onClose();
    }
  };

  const handleSendOtp = async () => {
    if (!email) { toast.error('Email required'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('OTP sent to your email');
      setStep('otp');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (!otp) { toast.error('Enter the OTP code'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (password) {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: { username: username || email.split('@')[0] }
      });
      if (updateError) { toast.error(updateError.message); setLoading(false); return; }
    }

    toast.success('Account created! Welcome to GROKSCHITT!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6 bg-card border-primary/30 mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-cyber flex items-center justify-center">
              <span className="text-xl font-bold text-white">G</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {step === 'login' ? 'Sign In' : step === 'register' ? 'Create Account' : 'Verify Email'}
              </h2>
              <p className="text-xs text-muted-foreground">GROKSCHITT v18</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {step === 'login' && (
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-9 bg-background/50"
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>
            <div>
              <Label>Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 bg-background/50"
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>
            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full gradient-cyber text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
            </Button>
            <div className="text-center">
              <button
                onClick={() => setStep('register')}
                className="text-sm text-primary hover:underline"
              >
                No account? Create one
              </button>
            </div>
          </div>
        )}

        {step === 'register' && (
          <div className="space-y-4">
            <div>
              <Label>Username</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="your_handle"
                  className="pl-9 bg-background/50"
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-9 bg-background/50"
                />
              </div>
            </div>
            <div>
              <Label>Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="min 6 characters"
                  className="pl-9 bg-background/50"
                />
              </div>
            </div>
            <Button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full gradient-cyber text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Verification Code'}
            </Button>
            <div className="text-center">
              <button
                onClick={() => setStep('login')}
                className="text-sm text-primary hover:underline"
              >
                Already have an account?
              </button>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the 4-digit code sent to <strong>{email}</strong>
            </p>
            <div>
              <Label>Verification Code</Label>
              <div className="relative mt-1">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="1234"
                  maxLength={6}
                  className="pl-9 bg-background/50 text-center text-2xl tracking-widest"
                  onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                />
              </div>
            </div>
            <Button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full gradient-cyber text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Create Account'}
            </Button>
            <div className="text-center">
              <button
                onClick={() => setStep('register')}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
