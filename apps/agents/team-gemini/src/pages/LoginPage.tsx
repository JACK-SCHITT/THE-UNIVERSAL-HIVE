import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import heroBg from '@/assets/hero-bg.jpg';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const user = login(email.trim(), password);
      setLoading(false);
      if (user) {
        navigate('/');
      } else {
        setError('Invalid email or password.');
      }
    }, 400);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 relative items-end p-12"
        style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-surface-900/90 via-surface-900/60 to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center glow-blue">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">TeamGemini</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3 leading-tight">
            Your team's private<br />
            <span className="text-brand-300">AI powerhouse.</span>
          </h2>
          <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
            Multi-model Gemini access, GitHub automation, shared project spaces, and unlimited integrations — all in one workspace.
          </p>
          <div className="flex gap-4 mt-6">
            {['Gemini 2.5 Pro', 'GitHub Sync', '20 Users', 'Any Stack'].map(f => (
              <div key={f} className="text-xs font-medium text-brand-300 bg-brand-500/10 border border-brand-500/20 px-3 py-1.5 rounded-full">
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-900">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">TeamGemini</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-gray-500 text-sm mb-8">Sign in to your workspace</p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-4 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                className="input-field w-full"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input-field w-full pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full py-2.5 mt-2" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-3 rounded-lg bg-surface-700/40 border border-surface-500/30">
            <p className="text-xs text-gray-500 mb-1 font-medium">Default admin credentials</p>
            <p className="text-xs font-mono text-gray-400">admin@teamgemini.local / admin123</p>
            <p className="text-xs text-gray-600 mt-1">Change these in Admin → User Management</p>
          </div>
        </div>
      </div>
    </div>
  );
}
