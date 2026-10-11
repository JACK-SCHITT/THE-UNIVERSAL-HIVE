import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, FolderOpen, GitBranch, Plug, Users, Zap, Clock, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserConversations, getUserProjects, getUsers, getSettings } from '@/lib/storage';
import type { Conversation, Project } from '@/types';
import { formatRelative, truncate, MODEL_LABELS } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamSize, setTeamSize] = useState(0);

  useEffect(() => {
    if (!user) return;
    setConvs(getUserConversations(user.id));
    setProjects(getUserProjects(user.id));
    setTeamSize(getUsers().length);
  }, [user]);

  const recentConvs = [...convs]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const settings = getSettings();

  const stats = [
    { label: 'Conversations', value: convs.length, icon: MessageSquare, color: 'text-brand-400', bg: 'bg-brand-500/10' },
    { label: 'Projects', value: projects.length, icon: FolderOpen, color: 'text-accent-400', bg: 'bg-accent-500/10' },
    { label: 'Team Members', value: teamSize, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Active Model', value: MODEL_LABELS[user?.preferences?.defaultModel || 'gemini-2.5-flash'], icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  ];

  const quickActions = [
    { label: 'New Chat', desc: 'Start an AI conversation', icon: MessageSquare, to: '/chat', color: 'from-brand-500 to-brand-600' },
    { label: 'New Project', desc: 'Create a shared workspace', icon: FolderOpen, to: '/projects', color: 'from-accent-500 to-accent-600' },
    { label: 'GitHub', desc: 'Manage repos & automate', icon: GitBranch, to: '/github', color: 'from-purple-500 to-purple-600' },
    { label: 'Integrations', desc: 'Connect any platform', icon: Plug, to: '/integrations', color: 'from-orange-500 to-orange-600' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
          <span className="text-brand-300">{user?.name}</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="card flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <div className="text-lg font-bold text-white">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" /> Quick Actions
          </h2>
          <div className="space-y-2">
            {quickActions.map(a => (
              <button
                key={a.label}
                onClick={() => navigate(a.to)}
                className="w-full flex items-center gap-3 p-3 rounded-xl glass glass-hover group"
              >
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${a.color} flex items-center justify-center flex-shrink-0`}>
                  <a.icon className="w-4 h-4 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-medium text-gray-200 group-hover:text-white">{a.label}</div>
                  <div className="text-xs text-gray-500">{a.desc}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>

          {/* API Key Status */}
          <div className="mt-4 p-3 rounded-xl bg-surface-700/40 border border-surface-500/30">
            <div className="text-xs font-medium text-gray-400 mb-2">API Key Status</div>
            {user?.apiKey ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-400 animate-pulse-slow" />
                <span className="text-xs text-accent-400">Personal key active</span>
              </div>
            ) : settings.rootKey ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse-slow" />
                <span className="text-xs text-yellow-400">Using shared root key</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-xs text-red-400">No API key set</span>
                <button onClick={() => navigate('/settings')} className="text-xs text-brand-400 hover:underline ml-auto">
                  Add key →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-400" /> Recent Chats
            </h2>
            <button onClick={() => navigate('/chat')} className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentConvs.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="w-10 h-10 text-gray-700 mb-3" />
              <p className="text-gray-500 text-sm">No conversations yet</p>
              <button onClick={() => navigate('/chat')} className="btn-primary mt-4 text-sm">
                Start your first chat
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentConvs.map(c => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/chat/${c.id}`)}
                  className="w-full flex items-start gap-3 p-3 rounded-xl glass glass-hover group text-left"
                >
                  <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-200 group-hover:text-white truncate">
                      {c.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono text-gray-600">{MODEL_LABELS[c.model] || c.model}</span>
                      <span className="text-gray-700">·</span>
                      <span className="text-xs text-gray-600">{c.messages.length} messages</span>
                      <span className="text-gray-700">·</span>
                      <span className="text-xs text-gray-600">{formatRelative(c.updatedAt)}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-700 group-hover:text-gray-400 mt-0.5" />
                </button>
              ))}
              <button
                onClick={() => navigate('/chat')}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-surface-400/40 text-gray-500 hover:text-gray-300 hover:border-brand-500/30 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" /> New conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Projects */}
      {projects.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent-400" /> Active Projects
            </h2>
            <button onClick={() => navigate('/projects')} className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              Manage <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.slice(0, 3).map(p => (
              <button
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="card text-left group glass-hover"
                style={{ borderLeft: `3px solid ${p.color}` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{p.icon}</span>
                  <span className="text-sm font-medium text-gray-200 group-hover:text-white">{p.name}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{p.description || 'No description'}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-gray-600">
                  <span>{p.members.length} members</span>
                  <span>·</span>
                  <span>{p.integrations.length} integrations</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
