import { supabase } from '@/lib/supabase';
import { AuthUser } from '@/types/auth';
import { User } from '@supabase/supabase-js';

function mapUser(user: User, profile?: { role?: string; plan?: string; username?: string } | null): AuthUser {
  return {
    id: user.id,
    email: user.email!,
    username: profile?.username || user.user_metadata?.username || user.email!.split('@')[0],
    role: (profile?.role as 'admin' | 'user') || 'user',
    plan: (profile?.plan as 'free' | 'pro' | 'enterprise') || 'free',
  };
}

async function ensureProfile(user: User, username?: string): Promise<AuthUser> {
  // Check if profile already exists
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (existing) return mapUser(user, existing);

  // Create profile for new user
  const uname = username || user.user_metadata?.username || user.email!.split('@')[0];
  const { data: created, error } = await supabase
    .from('profiles')
    .insert({ id: user.id, username: uname, email: user.email!, role: 'user', plan: 'free' })
    .select()
    .single();

  if (error) {
    console.error('[authService] ensureProfile error:', error.message);
  }

  return mapUser(user, created);
}

export const authService = {
  async sendOtp(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
  },

  async verifyOtpAndSetPassword(
    email: string,
    token: string,
    password: string,
    username: string
  ): Promise<AuthUser> {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) throw error;
    if (!data.user) throw new Error('Verification failed — no user returned.');

    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      password,
      data: { username },
    });
    if (updateError) throw updateError;

    return ensureProfile(updateData.user!, username);
  },

  async signInWithPassword(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: profile } = await supabase
      .from('profiles')
      .select('username, role, plan')
      .eq('id', data.user.id)
      .single();

    return mapUser(data.user, profile);
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};
