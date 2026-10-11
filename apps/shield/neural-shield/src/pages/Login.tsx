import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { authService } from '@/lib/authService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const user = await authService.signInWithPassword(email, password);
      login(user);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="fixed inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(#00d4ff 1px, transparent 1px), linear-gradient(90deg, #00d4ff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-DEFAULT to-green-neon flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-DEFAULT/20">
            <Shield className="w-7 h-7 text-bg-base" />
          </div>
          <div className="font-bold text-xl text-white font-sans tracking-tight">NeuralShield</div>
          <div className="text-[11px] text-[#4a6080] font-mono mt-1">RL FRAUD ENGINE v2.4.1</div>
        </div>

        <div className="card-base p-6 border-bg-border">
          <h2 className="text-sm font-bold text-white font-sans mb-1">Sign In</h2>
          <p className="text-[11px] text-[#4a6080] font-mono mb-6">Access your fraud detection dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-[#4a6080] mb-1.5 uppercase tracking-wider">Email</label>
              <div className="flex items-center gap-2 bg-bg-base border border-bg-border rounded px-3 py-2.5 focus-within:border-cyan-DEFAULT transition-colors">
                <Mail className="w-3.5 h-3.5 text-[#3a5070] shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="analyst@neuralshield.ai"
                  className="bg-transparent text-xs font-mono text-[#aac4d8] placeholder-[#2a4060] outline-none flex-1"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-[#4a6080] mb-1.5 uppercase tracking-wider">Password</label>
              <div className="flex items-center gap-2 bg-bg-base border border-bg-border rounded px-3 py-2.5 focus-within:border-cyan-DEFAULT transition-colors">
                <Lock className="w-3.5 h-3.5 text-[#3a5070] shrink-0" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-transparent text-xs font-mono text-[#aac4d8] placeholder-[#2a4060] outline-none flex-1"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="text-[#3a5070] hover:text-cyan-DEFAULT transition-colors">
                  {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full py-2.5 rounded font-mono text-xs font-bold tracking-wider transition-all",
                loading
                  ? "bg-bg-elevated text-[#4a6080] cursor-not-allowed"
                  : "bg-cyan-DEFAULT text-bg-base hover:bg-cyan-DEFAULT/90 shadow-md shadow-cyan-DEFAULT/20 hover:shadow-cyan-DEFAULT/30"
              )}
            >
              {loading ? 'AUTHENTICATING...' : 'SIGN IN'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-bg-border text-center">
            <span className="text-[11px] text-[#4a6080] font-mono">No account? </span>
            <Link to="/register" className="text-[11px] text-cyan-DEFAULT font-mono hover:text-cyan-DEFAULT/80 transition-colors">
              Create one
            </Link>
          </div>
        </div>

        <p className="text-center text-[10px] text-[#2a4060] font-mono mt-4">
          View plans → <Link to="/pricing" className="text-cyan-DEFAULT hover:underline">Pricing</Link>
        </p>
      </div>
    </div>
  );
}
