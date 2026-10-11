import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, User, KeyRound, ArrowLeft } from 'lucide-react';
import { authService } from '@/lib/authService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Step = 'email' | 'otp' | 'password';

export function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Enter your email.'); return; }
    setLoading(true);
    try {
      await authService.sendOtp(email);
      toast.success('Verification code sent — check your inbox.');
      setStep('otp');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) { toast.error('Enter the 6-digit code.'); return; }
    setStep('password');
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { toast.error('Enter a username.'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { toast.error('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const user = await authService.verifyOtpAndSetPassword(email, otp, password, username.trim());
      login(user);
      toast.success(`Welcome, ${user.username}!`);
      navigate('/');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="fixed inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(#00d4ff 1px, transparent 1px), linear-gradient(90deg, #00d4ff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-DEFAULT to-green-neon flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-DEFAULT/20">
            <Shield className="w-7 h-7 text-bg-base" />
          </div>
          <div className="font-bold text-xl text-white font-sans tracking-tight">NeuralShield</div>
          <div className="text-[11px] text-[#4a6080] font-mono mt-1">CREATE ACCOUNT</div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {(['email', 'otp', 'password'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono transition-all",
                step === s ? "bg-cyan-DEFAULT text-bg-base" :
                ['email', 'otp', 'password'].indexOf(step) > i ? "bg-green-neon text-bg-base" :
                "bg-bg-elevated text-[#4a6080]"
              )}>
                {i + 1}
              </div>
              {i < 2 && <div className={cn("h-px w-8", ['email', 'otp', 'password'].indexOf(step) > i ? "bg-green-neon" : "bg-bg-border")} />}
            </React.Fragment>
          ))}
        </div>

        <div className="card-base p-6">
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-white font-sans mb-1">Enter your email</h2>
                <p className="text-[11px] text-[#4a6080] font-mono mb-4">We'll send a verification code.</p>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[#4a6080] mb-1.5 uppercase tracking-wider">Email Address</label>
                <div className="flex items-center gap-2 bg-bg-base border border-bg-border rounded px-3 py-2.5 focus-within:border-cyan-DEFAULT transition-colors">
                  <Mail className="w-3.5 h-3.5 text-[#3a5070] shrink-0" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="analyst@neuralshield.ai"
                    className="bg-transparent text-xs font-mono text-[#aac4d8] placeholder-[#2a4060] outline-none flex-1"
                    autoComplete="email" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className={cn("w-full py-2.5 rounded font-mono text-xs font-bold tracking-wider transition-all",
                  loading ? "bg-bg-elevated text-[#4a6080] cursor-not-allowed" :
                  "bg-cyan-DEFAULT text-bg-base hover:bg-cyan-DEFAULT/90 shadow-md shadow-cyan-DEFAULT/20")}>
                {loading ? 'SENDING...' : 'SEND CODE'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <button onClick={() => setStep('email')} className="flex items-center gap-1 text-[10px] font-mono text-[#4a6080] hover:text-cyan-DEFAULT mb-3 transition-colors">
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <h2 className="text-sm font-bold text-white font-sans mb-1">Check your email</h2>
                <p className="text-[11px] text-[#4a6080] font-mono mb-4">Enter the 6-digit code sent to <span className="text-cyan-DEFAULT">{email}</span></p>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[#4a6080] mb-1.5 uppercase tracking-wider">Verification Code</label>
                <div className="flex items-center gap-2 bg-bg-base border border-bg-border rounded px-3 py-2.5 focus-within:border-cyan-DEFAULT transition-colors">
                  <KeyRound className="w-3.5 h-3.5 text-[#3a5070] shrink-0" />
                  <input type="text" inputMode="numeric" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="bg-transparent text-sm font-mono text-[#aac4d8] placeholder-[#2a4060] outline-none flex-1 tracking-[0.3em]"
                    autoComplete="one-time-code" />
                </div>
              </div>
              <button type="submit"
                className="w-full py-2.5 rounded font-mono text-xs font-bold tracking-wider bg-cyan-DEFAULT text-bg-base hover:bg-cyan-DEFAULT/90 shadow-md shadow-cyan-DEFAULT/20 transition-all">
                VERIFY CODE
              </button>
              <button type="button" onClick={handleSendOtp} disabled={loading}
                className="w-full text-[11px] font-mono text-[#4a6080] hover:text-cyan-DEFAULT transition-colors">
                Resend code
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleComplete} className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-white font-sans mb-1">Set up your account</h2>
                <p className="text-[11px] text-[#4a6080] font-mono mb-4">Choose a username and password.</p>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[#4a6080] mb-1.5 uppercase tracking-wider">Username</label>
                <div className="flex items-center gap-2 bg-bg-base border border-bg-border rounded px-3 py-2.5 focus-within:border-cyan-DEFAULT transition-colors">
                  <User className="w-3.5 h-3.5 text-[#3a5070] shrink-0" />
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                    placeholder="analyst_01"
                    className="bg-transparent text-xs font-mono text-[#aac4d8] placeholder-[#2a4060] outline-none flex-1"
                    autoComplete="username" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[#4a6080] mb-1.5 uppercase tracking-wider">Password</label>
                <div className="flex items-center gap-2 bg-bg-base border border-bg-border rounded px-3 py-2.5 focus-within:border-cyan-DEFAULT transition-colors">
                  <Lock className="w-3.5 h-3.5 text-[#3a5070] shrink-0" />
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="bg-transparent text-xs font-mono text-[#aac4d8] placeholder-[#2a4060] outline-none flex-1"
                    autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="text-[#3a5070] hover:text-cyan-DEFAULT transition-colors">
                    {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[#4a6080] mb-1.5 uppercase tracking-wider">Confirm Password</label>
                <div className="flex items-center gap-2 bg-bg-base border border-bg-border rounded px-3 py-2.5 focus-within:border-cyan-DEFAULT transition-colors">
                  <Lock className="w-3.5 h-3.5 text-[#3a5070] shrink-0" />
                  <input type={showPw ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat password"
                    className="bg-transparent text-xs font-mono text-[#aac4d8] placeholder-[#2a4060] outline-none flex-1"
                    autoComplete="new-password" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className={cn("w-full py-2.5 rounded font-mono text-xs font-bold tracking-wider transition-all",
                  loading ? "bg-bg-elevated text-[#4a6080] cursor-not-allowed" :
                  "bg-cyan-DEFAULT text-bg-base hover:bg-cyan-DEFAULT/90 shadow-md shadow-cyan-DEFAULT/20")}>
                {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
              </button>
            </form>
          )}

          <div className="mt-4 pt-4 border-t border-bg-border text-center">
            <span className="text-[11px] text-[#4a6080] font-mono">Already have an account? </span>
            <Link to="/login" className="text-[11px] text-cyan-DEFAULT font-mono hover:text-cyan-DEFAULT/80 transition-colors">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
