import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Upload, Shield, Activity, Github, Twitter, Linkedin, LogIn } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import AuthModal from '@/components/auth/AuthModal';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  social_links?: { github?: string; twitter?: string; linkedin?: string };
}

export default function UserProfileView() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [fraudProfile, setFraudProfile] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadActivities();
      loadFraudProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (data) setProfile(data);
  };

  const loadActivities = async () => {
    const { data } = await supabase
      .from('user_activity')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    setActivities(data || []);
  };

  const loadFraudProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_fraud_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (data) setFraudProfile(data);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploadingAvatar(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `avatars/${profile.id}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('public-assets').upload(fileName, file, { upsert: true });
    if (uploadError) { toast.error('Upload failed'); setUploadingAvatar(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('public-assets').getPublicUrl(fileName);
    await supabase.from('user_profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
    setProfile({ ...profile, avatar_url: publicUrl });
    toast.success('Avatar updated!');
    setUploadingAvatar(false);
  };

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from('user_profiles')
      .update({ bio: profile.bio, social_links: profile.social_links })
      .eq('id', profile.id);
    if (error) { toast.error('Save failed'); } else { toast.success('Profile updated!'); setEditing(false); }
    setSaving(false);
  };

  // Not logged in
  if (!loading && !user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <div className="w-20 h-20 rounded-2xl gradient-cyber flex items-center justify-center">
          <User className="w-10 h-10 text-white" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Sign In to View Profile</h2>
          <p className="text-muted-foreground">Create an account to manage your profile, track activity, and view fraud analytics.</p>
        </div>
        <Button onClick={() => setShowAuth(true)} className="gradient-cyber text-white gap-2">
          <LogIn className="w-4 h-4" />
          Sign In / Create Account
        </Button>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    );
  }

  if (loading || !profile) {
    return <div className="flex items-center justify-center p-12"><p className="text-muted-foreground">Loading profile...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl gradient-cyber flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">My Profile</h2>
          <p className="text-sm text-muted-foreground">Manage your profile and settings</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 p-6 bg-card/50">
          <div className="flex items-start gap-6 mb-6">
            {/* Avatar */}
            <div className="relative group flex-shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <Upload className="w-6 h-6 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-1">{profile.username}</h3>
              <p className="text-muted-foreground mb-4">{profile.email}</p>

              {editing ? (
                <div className="space-y-4">
                  <div>
                    <Label>Bio</Label>
                    <Textarea
                      value={profile.bio || ''}
                      onChange={e => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      className="bg-background/50 mt-1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Social Links</Label>
                    {(['github', 'twitter', 'linkedin'] as const).map(platform => (
                      <div key={platform} className="flex items-center gap-2">
                        <span className="text-xs w-16 text-muted-foreground capitalize">{platform}</span>
                        <Input
                          value={profile.social_links?.[platform] || ''}
                          onChange={e => setProfile({ ...profile, social_links: { ...profile.social_links, [platform]: e.target.value } })}
                          placeholder={`${platform} username`}
                          className="bg-background/50"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveProfile} disabled={saving} className="gradient-cyber text-white">
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {profile.bio && <p className="text-sm">{profile.bio}</p>}
                  {profile.social_links && (
                    <div className="flex gap-3">
                      {profile.social_links.github && (
                        <a href={`https://github.com/${profile.social_links.github}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                          <Github className="w-5 h-5" />
                        </a>
                      )}
                      {profile.social_links.twitter && (
                        <a href={`https://twitter.com/${profile.social_links.twitter}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                          <Twitter className="w-5 h-5" />
                        </a>
                      )}
                      {profile.social_links.linkedin && (
                        <a href={profile.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                          <Linkedin className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  )}
                  <Button variant="outline" onClick={() => setEditing(true)}>Edit Profile</Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card/50">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="font-bold">Fraud Profile</h3>
          </div>
          {fraudProfile ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Trust Score</p>
                <p className="text-2xl font-bold">{(parseFloat(fraudProfile.trust_score) * 100).toFixed(0)}%</p>
                <div className="w-full h-2 bg-muted rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-accent" style={{ width: `${parseFloat(fraudProfile.trust_score) * 100}%` }} />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-xl font-bold">{fraudProfile.transaction_count}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Amount</p>
                <p className="text-xl font-bold">${parseFloat(fraudProfile.mean_transaction).toFixed(2)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Run a fraud analysis to build your profile</p>
          )}
        </Card>
      </div>

      <Card className="p-6 bg-card/50">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-secondary" />
          <h3 className="font-bold">Recent Activity</h3>
        </div>
        <div className="space-y-2">
          {activities.length > 0 ? (
            activities.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                <div>
                  <p className="text-sm font-bold">{a.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
                </div>
                <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded">{a.activity_type}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No recent activity logged</p>
          )}
        </div>
      </Card>
    </div>
  );
}
