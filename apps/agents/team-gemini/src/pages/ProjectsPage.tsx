import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Users, GitBranch, MessageSquare, Plug, Trash2, Edit, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProjects, createProject, updateProject, deleteProject, getUsers, getProjectConversations } from '@/lib/storage';
import type { Project } from '@/types';
import { PROJECT_COLORS, PROJECT_ICONS, formatDate } from '@/lib/utils';

function ProjectModal({ onClose, onSave, initial }: { onClose: () => void; onSave: (p: Partial<Project>) => void; initial?: Project }) {
  const { user } = useAuth();
  const [name, setName] = useState(initial?.name || '');
  const [desc, setDesc] = useState(initial?.description || '');
  const [color, setColor] = useState(initial?.color || PROJECT_COLORS[0]);
  const [icon, setIcon] = useState(initial?.icon || PROJECT_ICONS[0]);
  const [systemPrompt, setSystemPrompt] = useState(initial?.systemPrompt || '');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass rounded-2xl p-6 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">{initial ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={onClose} className="btn-ghost p-1"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Name</label>
            <input className="input-field w-full" placeholder="Project name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
            <textarea className="input-field w-full" rows={2} placeholder="What is this project about?" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Icon</label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_ICONS.map(ic => (
                <button key={ic} onClick={() => setIcon(ic)} className={`text-xl p-1.5 rounded-lg transition-colors ${icon === ic ? 'bg-brand-500/30 border border-brand-500/50' : 'hover:bg-surface-600/60'}`}>{ic}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Color</label>
            <div className="flex gap-2">
              {PROJECT_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent'}`} style={{ background: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">System Prompt (for shared chats)</label>
            <textarea className="input-field w-full font-mono text-xs" rows={3} placeholder="You are a specialized assistant for..." value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={() => { if (!name.trim()) { toast.error('Name required'); return; } onSave({ name, description: desc, color, icon, systemPrompt }); }}
            className="btn-primary flex-1"
          >
            {initial ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Project | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | undefined>();
  const allUsers = getUsers();

  useEffect(() => {
    if (!user) return;
    const p = getUserProjects(user.id);
    setProjects(p);
    if (projectId) setSelected(p.find(x => x.id === projectId) || null);
  }, [user, projectId]);

  const handleCreate = (data: Partial<Project>) => {
    if (!user) return;
    const p = createProject({
      ...data as any,
      members: [user.id],
      createdBy: user.id,
      integrations: [],
      sharedConversations: [],
      tags: [],
    });
    setProjects(getUserProjects(user.id));
    setShowModal(false);
    toast.success('Project created!');
    navigate(`/projects/${p.id}`);
  };

  const handleUpdate = (data: Partial<Project>) => {
    if (!editTarget) return;
    updateProject(editTarget.id, data);
    setProjects(getUserProjects(user!.id));
    setEditTarget(undefined);
    setShowModal(false);
    toast.success('Project updated');
  };

  const handleDelete = (id: string) => {
    deleteProject(id);
    setProjects(getUserProjects(user!.id));
    if (selected?.id === id) { setSelected(null); navigate('/projects'); }
    toast.success('Project deleted');
  };

  if (selected) {
    const sharedConvs = getProjectConversations(selected.id);
    const members = allUsers.filter(u => selected.members.includes(u.id));
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <button onClick={() => { setSelected(null); navigate('/projects'); }} className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 mb-4">
          ← Back to Projects
        </button>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${selected.color}20`, border: `1px solid ${selected.color}40` }}>
              {selected.icon}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{selected.name}</h1>
              <p className="text-gray-500 text-sm">{selected.description}</p>
              <p className="text-xs text-gray-600 mt-0.5">Created {formatDate(selected.createdAt)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setEditTarget(selected); setShowModal(true); }} className="btn-secondary flex items-center gap-2 text-sm">
              <Edit className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={() => handleDelete(selected.id)} className="btn-ghost text-red-400 hover:bg-red-500/10 text-sm flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Members */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-brand-400" /> Members ({members.length})</h3>
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface-600/40">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-xs font-bold text-white">
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-200">{m.name}</div>
                    <div className="text-xs text-gray-500">{m.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shared Conversations */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-accent-400" /> Shared Chats ({sharedConvs.length})</h3>
            {sharedConvs.length === 0 ? (
              <p className="text-xs text-gray-600 py-4 text-center">No shared conversations yet</p>
            ) : (
              <div className="space-y-1.5">
                {sharedConvs.map(c => (
                  <button key={c.id} onClick={() => navigate(`/chat/${c.id}`)} className="w-full text-left p-2 rounded-lg hover:bg-surface-600/40 text-xs text-gray-400 hover:text-gray-200 transition-colors truncate">
                    {c.title}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => navigate('/chat')} className="btn-primary w-full text-xs mt-3 py-1.5 flex items-center justify-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> New shared chat
            </button>
          </div>

          {/* Integrations */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Plug className="w-4 h-4 text-purple-400" /> Integrations ({selected.integrations.length})</h3>
            {selected.integrations.length === 0 ? (
              <p className="text-xs text-gray-600 py-4 text-center">No integrations yet</p>
            ) : (
              <div className="space-y-1.5">
                {selected.integrations.map(i => (
                  <div key={i.id} className="flex items-center gap-2 p-2 rounded-lg bg-surface-600/30">
                    <div className={`w-1.5 h-1.5 rounded-full ${i.enabled ? 'bg-accent-400' : 'bg-gray-600'}`} />
                    <span className="text-xs text-gray-300">{i.name}</span>
                    <span className="text-xs text-gray-600 ml-auto">{i.type}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => navigate('/integrations')} className="btn-secondary w-full text-xs mt-3 py-1.5 flex items-center justify-center gap-1.5">
              <Plug className="w-3.5 h-3.5" /> Manage integrations
            </button>
          </div>
        </div>

        {/* System Prompt */}
        {selected.systemPrompt && (
          <div className="mt-4 card">
            <h3 className="text-xs font-semibold text-gray-400 mb-2">Project System Prompt</h3>
            <pre className="text-xs text-gray-400 font-mono bg-surface-700/40 rounded-lg p-3 whitespace-pre-wrap">{selected.systemPrompt}</pre>
          </div>
        )}

        {(showModal && editTarget) && (
          <ProjectModal onClose={() => { setShowModal(false); setEditTarget(undefined); }} onSave={handleUpdate} initial={editTarget} />
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Projects</h1>
          <p className="text-gray-500 text-sm mt-0.5">Shared workspaces for your team</p>
        </div>
        <button onClick={() => { setEditTarget(undefined); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FolderOpen className="w-12 h-12 text-gray-700 mb-4" />
          <h3 className="text-gray-400 font-medium mb-2">No projects yet</h3>
          <p className="text-gray-600 text-sm mb-6">Create a project to share AI chats and context with your team</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Create first project</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <div
              key={p.id}
              onClick={() => { setSelected(p); navigate(`/projects/${p.id}`); }}
              className="card glass-hover cursor-pointer group"
              style={{ borderTop: `2px solid ${p.color}` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-2xl">{p.icon}</div>
                <button onClick={e => { e.stopPropagation(); handleDelete(p.id); }} className="opacity-0 group-hover:opacity-100 btn-ghost p-1 text-gray-600 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <h3 className="font-semibold text-gray-200 group-hover:text-white mb-1">{p.name}</h3>
              <p className="text-xs text-gray-500 line-clamp-2 mb-4">{p.description || 'No description'}</p>
              <div className="flex items-center gap-4 text-xs text-gray-600 border-t border-surface-500/20 pt-3">
                <span className="flex items-center gap-1.5"><Users className="w-3 h-3" />{p.members.length}</span>
                <span className="flex items-center gap-1.5"><Plug className="w-3 h-3" />{p.integrations.length}</span>
                <span className="ml-auto">{formatDate(p.createdAt)}</span>
              </div>
            </div>
          ))}
          <button
            onClick={() => setShowModal(true)}
            className="card flex flex-col items-center justify-center border-dashed border-surface-400/30 hover:border-brand-500/30 cursor-pointer group transition-colors min-h-[160px]"
          >
            <Plus className="w-8 h-8 text-gray-700 group-hover:text-brand-400 transition-colors mb-2" />
            <span className="text-sm text-gray-600 group-hover:text-gray-400">New Project</span>
          </button>
        </div>
      )}

      {showModal && !editTarget && (
        <ProjectModal onClose={() => setShowModal(false)} onSave={handleCreate} />
      )}
    </div>
  );
}
