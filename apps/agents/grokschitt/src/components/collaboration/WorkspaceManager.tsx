import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users, Plus, Share2, UserPlus, Crown, Shield, Eye, LogIn } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import AuthModal from '@/components/auth/AuthModal';

interface Workspace { id: string; name: string; description: string; owner_id: string; created_at: string; }
interface WorkspaceMember { id: string; user_id: string; role: string; user_profiles: { username: string; email: string }; }

export default function WorkspaceManager() {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [creating, setCreating] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '' });
  const [inviteEmail, setInviteEmail] = useState('');
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (user) loadWorkspaces();
  }, [user]);

  useEffect(() => {
    if (selectedWorkspace) loadMembers(selectedWorkspace);
  }, [selectedWorkspace]);

  const loadWorkspaces = async () => {
    const { data } = await supabase.from('workspaces').select('*').order('created_at', { ascending: false });
    setWorkspaces(data || []);
  };

  const loadMembers = async (wsId: string) => {
    const { data } = await supabase
      .from('workspace_members')
      .select('*, user_profiles(username, email)')
      .eq('workspace_id', wsId);
    setMembers(data || []);
  };

  const createWorkspace = async () => {
    if (!newWorkspace.name.trim() || !user) { toast.error('Name required'); return; }
    const { data: ws, error: wsErr } = await supabase
      .from('workspaces')
      .insert({ name: newWorkspace.name, description: newWorkspace.description, owner_id: user.id })
      .select().single();
    if (wsErr) { toast.error('Failed to create workspace'); return; }
    await supabase.from('workspace_members').insert({ workspace_id: ws.id, user_id: user.id, role: 'owner' });
    toast.success('Workspace created!');
    setCreating(false);
    setNewWorkspace({ name: '', description: '' });
    loadWorkspaces();
  };

  const inviteMember = () => {
    if (!inviteEmail.trim()) return;
    toast.success(`Invitation sent to ${inviteEmail}`);
    setInviteEmail('');
  };

  const getRoleIcon = (role: string) => {
    if (role === 'owner') return <Crown className="w-4 h-4 text-yellow-500" />;
    if (role === 'admin') return <Shield className="w-4 h-4 text-blue-500" />;
    if (role === 'viewer') return <Eye className="w-4 h-4 text-gray-500" />;
    return <Users className="w-4 h-4 text-green-500" />;
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <div className="w-20 h-20 rounded-2xl gradient-cyber flex items-center justify-center">
          <Users className="w-10 h-10 text-white" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Sign In to Access Workspaces</h2>
          <p className="text-muted-foreground">Create and manage team workspaces for collaborative AI projects.</p>
        </div>
        <Button onClick={() => setShowAuth(true)} className="gradient-cyber text-white gap-2">
          <LogIn className="w-4 h-4" />
          Sign In / Create Account
        </Button>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-cyber flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Workspaces</h2>
            <p className="text-sm text-muted-foreground">Collaborate with your team</p>
          </div>
        </div>
        <Button onClick={() => setCreating(true)} className="gradient-cyber text-white gap-2">
          <Plus className="w-4 h-4" />
          New Workspace
        </Button>
      </div>

      {creating && (
        <Card className="p-6 bg-card/50 border-primary/30">
          <h3 className="text-lg font-bold mb-4">Create New Workspace</h3>
          <div className="space-y-4">
            <div>
              <Label>Workspace Name</Label>
              <Input value={newWorkspace.name} onChange={e => setNewWorkspace({ ...newWorkspace, name: e.target.value })} placeholder="My Workspace" className="bg-background/50 mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={newWorkspace.description} onChange={e => setNewWorkspace({ ...newWorkspace, description: e.target.value })} placeholder="What's this workspace for?" className="bg-background/50 mt-1" />
            </div>
            <div className="flex gap-2">
              <Button onClick={createWorkspace} className="gradient-cyber text-white">Create</Button>
              <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 bg-card/50">
          <h3 className="text-lg font-bold mb-4">Your Workspaces</h3>
          <div className="space-y-2">
            {workspaces.map(ws => (
              <div
                key={ws.id}
                onClick={() => setSelectedWorkspace(ws.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedWorkspace === ws.id ? 'bg-primary/10 border-primary' : 'bg-background/50 border-border/50 hover:bg-accent/10'
                }`}
              >
                <h4 className="font-bold">{ws.name}</h4>
                {ws.description && <p className="text-sm text-muted-foreground line-clamp-1">{ws.description}</p>}
              </div>
            ))}
            {workspaces.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No workspaces yet. Create one!</p>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-card/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Members</h3>
            {selectedWorkspace && <Button size="sm" variant="outline" className="gap-2"><Share2 className="w-4 h-4" />Share</Button>}
          </div>

          {selectedWorkspace ? (
            <>
              <div className="mb-4 p-4 bg-background/50 rounded-lg">
                <Label>Invite by Email</Label>
                <div className="flex gap-2 mt-2">
                  <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@example.com" className="bg-background/50" />
                  <Button onClick={inviteMember} size="sm" className="gradient-cyber text-white gap-2">
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {members.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
                        {m.user_profiles?.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{m.user_profiles?.username}</p>
                        <p className="text-xs text-muted-foreground">{m.user_profiles?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(m.role)}
                      <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded capitalize">{m.role}</span>
                    </div>
                  </div>
                ))}
                {members.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No members yet</p>}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Select a workspace to view members</p>
          )}
        </Card>
      </div>
    </div>
  );
}
