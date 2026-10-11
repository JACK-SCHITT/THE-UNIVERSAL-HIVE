import { useState, useEffect } from 'react';
import {
  Shield, Users, Plus, Trash2, Edit, Key, Save, Eye, EyeOff,
  UserCheck, UserX, Settings, AlertTriangle, Check, X, Copy, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getUsers, createUser, updateUser, deleteUser, getSettings, saveSettings } from '@/lib/storage';
import type { User, AppSettings, GeminiModel } from '@/types';
import { formatDate, copyToClipboard } from '@/lib/utils';

const MODELS: GeminiModel[] = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'];

function UserModal({
  onClose, onSave, initial,
}: { onClose: () => void; onSave: (u: Partial<User> & { password?: string }) => void; initial?: User }) {
  const [name, setName] = useState(initial?.name || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>(initial?.role || 'member');
  const [apiKey, setApiKey] = useState(initial?.apiKey || '');
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass rounded-2xl p-6 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">{initial ? 'Edit User' : 'Add Team Member'}</h2>
          <button onClick={onClose} className="btn-ghost p-1"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Name</label>
            <input className="input-field w-full" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
            <input type="email" className="input-field w-full" placeholder="email@company.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">{initial ? 'New Password (leave blank to keep)' : 'Password'}</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className="input-field w-full pr-10"
                placeholder={initial ? '••••••••' : 'Set password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-2.5 text-gray-500">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Role</label>
            <select className="input-field w-full" value={role} onChange={e => setRole(e.target.value as 'admin' | 'member')}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Gemini API Key (optional)</label>
            <input type="password" className="input-field w-full" placeholder="AIza..." value={apiKey} onChange={e => setApiKey(e.target.value)} />
            <p className="text-xs text-gray-600 mt-1">If blank, user will use the shared root key.</p>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={() => {
              if (!name.trim() || !email.trim()) { toast.error('Name and email required'); return; }
              if (!initial && !password.trim()) { toast.error('Password required'); return; }
              onSave({ name, email, role, apiKey: apiKey || undefined, ...(password ? { password } : {}) });
            }}
            className="btn-primary flex-1"
          >
            {initial ? 'Save' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user: currentUser, refreshUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState<User | undefined>();
  const [rootKey, setRootKey] = useState(settings.rootKey || '');
  const [showRootKey, setShowRootKey] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [tab, setTab] = useState<'users' | 'settings'>('users');

  useEffect(() => { setUsers(getUsers()); }, []);

  const handleCreateUser = (data: Partial<User> & { password?: string }) => {
    const newUser = createUser({
      name: data.name!,
      email: data.email!,
      password: data.password!,
      role: data.role || 'member',
      apiKey: data.apiKey,
      preferences: {
        defaultModel: settings.defaultModel,
        theme: 'midnight',
        fontSize: 'md',
        codeTheme: 'dracula',
      },
    });
    setUsers(getUsers());
    setModal(false);
    toast.success(`${newUser.name} added to the team!`);
  };

  const handleUpdateUser = (data: Partial<User> & { password?: string }) => {
    if (!editTarget) return;
    updateUser(editTarget.id, { ...data });
    setUsers(getUsers());
    setEditTarget(undefined);
    setModal(false);
    if (editTarget.id === currentUser?.id) refreshUser();
    toast.success('User updated');
  };

  const handleDeleteUser = (id: string) => {
    if (id === currentUser?.id) { toast.error("Can't delete your own account"); return; }
    deleteUser(id);
    setUsers(getUsers());
    toast.success('User removed');
  };

  const handleSaveSettings = () => {
    setSavingSettings(true);
    const updated = { ...settings, rootKey };
    saveSettings(updated);
    setSettings(updated);
    setTimeout(() => { setSavingSettings(false); toast.success('Settings saved'); }, 400);
  };

  const maxReached = users.length >= settings.maxTeamSize;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-500 text-sm">Manage users, API keys, and app settings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[{ id: 'users', label: 'Team Members', icon: <Users className="w-3.5 h-3.5" /> }, { id: 'settings', label: 'App Settings', icon: <Settings className="w-3.5 h-3.5" /> }].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'text-gray-400 hover:text-gray-200 border border-transparent'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {tab === 'users' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-400">
              <span className="text-white font-semibold">{users.length}</span> / {settings.maxTeamSize} members
            </div>
            <button
              onClick={() => { setEditTarget(undefined); setModal(true); }}
              disabled={maxReached}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Add Member
            </button>
          </div>

          {maxReached && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm mb-4">
              <AlertTriangle className="w-4 h-4" /> Team limit of {settings.maxTeamSize} reached.
            </div>
          )}

          {/* Progress bar */}
          <div className="mb-5 h-1.5 bg-surface-600 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-400 to-accent-500 rounded-full transition-all" style={{ width: `${(users.length / settings.maxTeamSize) * 100}%` }} />
          </div>

          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl glass group">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-200">{u.name}</span>
                    {u.role === 'admin' && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">admin</span>
                    )}
                    {u.id === currentUser?.id && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">you</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span>{u.email}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Key className="w-2.5 h-2.5" />
                      {u.apiKey ? 'Personal key' : 'Shared key'}
                    </span>
                    <span>·</span>
                    <span>Joined {formatDate(u.createdAt)}</span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditTarget(u); setModal(true); }} className="btn-ghost p-1.5">
                    <Edit className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  <button onClick={() => handleDeleteUser(u.id)} disabled={u.id === currentUser?.id} className="btn-ghost p-1.5 disabled:opacity-30">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {tab === 'settings' && (
        <div className="max-w-2xl space-y-6">
          {/* Root Key */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-300 mb-1 flex items-center gap-2">
              <Key className="w-4 h-4 text-yellow-400" /> Root Gemini API Key
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Shared key used when team members don't have a personal API key. Set this on your work computer.
            </p>
            <div className="relative">
              <input
                type={showRootKey ? 'text' : 'password'}
                className="input-field w-full pr-20"
                placeholder="AIzaSy..."
                value={rootKey}
                onChange={e => setRootKey(e.target.value)}
              />
              <div className="absolute right-2 top-1.5 flex gap-1">
                <button type="button" onClick={() => setShowRootKey(s => !s)} className="btn-ghost p-1">
                  {showRootKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                {rootKey && (
                  <button onClick={() => { copyToClipboard(rootKey); toast.success('Copied'); }} className="btn-ghost p-1">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              {settings.rootKey ? (
                <><div className="w-2 h-2 rounded-full bg-accent-400" /><span className="text-xs text-accent-400">Root key is set</span></>
              ) : (
                <><div className="w-2 h-2 rounded-full bg-red-400" /><span className="text-xs text-red-400">No root key configured</span></>
              )}
            </div>
          </div>

          {/* App Settings */}
          <div className="card space-y-4">
            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Settings className="w-4 h-4 text-brand-400" /> General Settings
            </h3>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">App Name</label>
              <input className="input-field w-full" value={settings.appName} onChange={e => setSettings(s => ({ ...s, appName: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Max Team Size</label>
              <input type="number" min={1} max={100} className="input-field w-32" value={settings.maxTeamSize} onChange={e => setSettings(s => ({ ...s, maxTeamSize: +e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Default Model</label>
              <select className="input-field" value={settings.defaultModel} onChange={e => setSettings(s => ({ ...s, defaultModel: e.target.value as GeminiModel }))}>
                {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSettings(s => ({ ...s, requireApiKey: !s.requireApiKey }))}
                className={`w-10 h-6 rounded-full transition-colors relative ${settings.requireApiKey ? 'bg-brand-500' : 'bg-surface-500'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.requireApiKey ? 'left-5' : 'left-1'}`} />
              </button>
              <div>
                <div className="text-xs font-medium text-gray-300">Require personal API key</div>
                <div className="text-xs text-gray-600">Users must set their own Gemini API key</div>
              </div>
            </div>
          </div>

          <button onClick={handleSaveSettings} disabled={savingSettings} className="btn-primary flex items-center gap-2">
            {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {savingSettings ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      )}

      {modal && (
        <UserModal
          onClose={() => { setModal(false); setEditTarget(undefined); }}
          onSave={editTarget ? handleUpdateUser : handleCreateUser}
          initial={editTarget}
        />
      )}
    </div>
  );
}
