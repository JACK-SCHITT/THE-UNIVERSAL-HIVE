import { useState } from 'react';
import { Save, Eye, EyeOff, Key, User, GitBranch, Cpu, Palette, Loader2, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { updateUser, logout } from '@/lib/storage';
import type { GeminiModel } from '@/types';

const MODELS: { value: GeminiModel; label: string; desc: string }[] = [
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', desc: 'Most capable — complex reasoning' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', desc: 'Fast & smart — best for most tasks' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', desc: 'Balanced speed and quality' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', desc: 'Long context, 2M tokens' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', desc: 'Fastest, lightweight tasks' },
];

export default function SettingsPage() {
  const { user, refreshUser, logout: authLogout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [apiKey, setApiKey] = useState(user?.apiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [githubToken, setGithubToken] = useState(user?.githubToken || '');
  const [showGh, setShowGh] = useState(false);
  const [defaultModel, setDefaultModel] = useState<GeminiModel>(user?.preferences?.defaultModel || 'gemini-2.5-flash');
  const [systemPrompt, setSystemPrompt] = useState(user?.preferences?.systemPrompt || '');
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'profile' | 'api' | 'ai' | 'appearance'>('profile');

  const handleSave = () => {
    if (!user) return;
    setSaving(true);

    const updates: any = { name, email, preferences: { ...user.preferences, defaultModel, systemPrompt } };
    if (apiKey !== user.apiKey) updates.apiKey = apiKey || undefined;
    if (githubToken !== user.githubToken) updates.githubToken = githubToken || undefined;
    if (newPw) {
      if (currentPw !== user.password) { toast.error('Current password is incorrect'); setSaving(false); return; }
      updates.password = newPw;
    }

    setTimeout(() => {
      updateUser(user.id, updates);
      refreshUser();
      setSaving(false);
      setCurrentPw('');
      setNewPw('');
      toast.success('Settings saved!');
    }, 400);
  };

  const TABS = [
    { id: 'profile', label: 'Profile', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'api', label: 'API Keys', icon: <Key className="w-3.5 h-3.5" /> },
    { id: 'ai', label: 'AI Preferences', icon: <Cpu className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl">
        <h1 className="text-xl font-bold text-white mb-1">Settings</h1>
        <p className="text-gray-500 text-sm mb-6">Manage your account, API keys, and AI preferences</p>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-surface-500/30">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'text-brand-300 border-brand-400' : 'text-gray-500 hover:text-gray-300 border-transparent'}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-5">
          {/* Profile */}
          {tab === 'profile' && (
            <>
              <div className="card">
                <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-400" /> Account Info
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Display Name</label>
                    <input className="input-field w-full" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                    <input type="email" className="input-field w-full" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-700/30">
                    <div className="text-xs text-gray-500">Role:</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${user?.role === 'admin' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-brand-500/10 text-brand-400 border border-brand-500/20'}`}>
                      {user?.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">Change Password</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Current Password</label>
                    <input type={showPw ? 'text' : 'password'} className="input-field w-full" placeholder="Current password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">New Password</label>
                    <div className="relative">
                      <input type={showPw ? 'text' : 'password'} className="input-field w-full pr-10" placeholder="New password" value={newPw} onChange={e => setNewPw(e.target.value)} />
                      <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-2.5 text-gray-500">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* API Keys */}
          {tab === 'api' && (
            <>
              <div className="card">
                <h3 className="text-sm font-semibold text-gray-300 mb-1 flex items-center gap-2">
                  <Key className="w-4 h-4 text-yellow-400" /> Gemini API Key
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  Your personal Gemini API key. If not set, the shared root key will be used.
                  Get your key at{' '}
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">
                    aistudio.google.com
                  </a>
                </p>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    className="input-field w-full pr-10"
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowApiKey(s => !s)} className="absolute right-3 top-2.5 text-gray-500">
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    {apiKey ? (
                      <><div className="w-2 h-2 rounded-full bg-accent-400" /><span className="text-accent-400">Personal key set</span></>
                    ) : (
                      <><div className="w-2 h-2 rounded-full bg-gray-600" /><span className="text-gray-500">Using shared key</span></>
                    )}
                  </div>
                  {apiKey && (
                    <button onClick={() => setApiKey('')} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="card">
                <h3 className="text-sm font-semibold text-gray-300 mb-1 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-gray-400" /> GitHub Token
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  Personal access token for GitHub integration. Generate at{' '}
                  <a href="https://github.com/settings/tokens/new" target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">
                    github.com/settings/tokens
                  </a>
                </p>
                <div className="relative">
                  <input
                    type={showGh ? 'text' : 'password'}
                    className="input-field w-full pr-10"
                    placeholder="ghp_xxxxxxxxxxxx"
                    value={githubToken}
                    onChange={e => setGithubToken(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowGh(s => !s)} className="absolute right-3 top-2.5 text-gray-500">
                    {showGh ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* AI Preferences */}
          {tab === 'ai' && (
            <>
              <div className="card">
                <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-brand-400" /> Default Model
                </h3>
                <div className="space-y-2">
                  {MODELS.map(m => (
                    <button
                      key={m.value}
                      onClick={() => setDefaultModel(m.value)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${defaultModel === m.value ? 'bg-brand-500/15 border-brand-500/40' : 'border-surface-400/30 hover:border-surface-400/60'}`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${defaultModel === m.value ? 'border-brand-400' : 'border-gray-600'}`}>
                        {defaultModel === m.value && <div className="w-2 h-2 rounded-full bg-brand-400" />}
                      </div>
                      <div>
                        <div className={`text-sm font-mono font-medium ${defaultModel === m.value ? 'text-brand-300' : 'text-gray-300'}`}>{m.label}</div>
                        <div className="text-xs text-gray-500">{m.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Default System Prompt</h3>
                <p className="text-xs text-gray-500 mb-3">Applied to all new conversations unless overridden per-chat.</p>
                <textarea
                  className="input-field w-full font-mono text-xs"
                  rows={5}
                  placeholder="You are a helpful assistant specializing in software development, automation, and system design..."
                  value={systemPrompt}
                  onChange={e => setSystemPrompt(e.target.value)}
                />
              </div>
            </>
          )}

          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
