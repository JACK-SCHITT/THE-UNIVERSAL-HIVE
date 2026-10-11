import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AuthUser } from '@/types/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (u: AuthUser) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function mapUser(user: User, profile?: { role?: string; plan?: string; username?: string } | null): AuthUser {
  return {
    id: user.id,
    email: user.email!,
    username: profile?.username || user.user_metadata?.username || user.email!.split('@')[0],
    role: (profile?.role as 'admin' | 'user') || 'user',
    plan: (profile?.plan as 'free' | 'pro' | 'enterprise') || 'free',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (supaUser: User): Promise<AuthUser> => {
    const { data } = await supabase
      .from('profiles')
      .select('username, role, plan')
      .eq('id', supaUser.id)
      .single();
    return mapUser(supaUser, data);
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const authUser = await fetchProfile(session.user);
      setUser(authUser);
    }
  }, [fetchProfile]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        const authUser = await fetchProfile(session.user);
        if (mounted) setUser(authUser);
      }
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' && session?.user) {
        const authUser = await fetchProfile(session.user);
        if (mounted) { setUser(authUser); setLoading(false); }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) { setUser(null); setLoading(false); }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        const authUser = await fetchProfile(session.user);
        if (mounted) setUser(authUser);
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [fetchProfile]);

  const login = useCallback((u: AuthUser) => setUser(u), []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
