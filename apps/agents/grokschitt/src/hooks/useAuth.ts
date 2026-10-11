import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  logout: () => Promise<void>;
}

function mapUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email!,
    username:
      user.user_metadata?.username ||
      user.user_metadata?.full_name ||
      user.email!.split('@')[0],
    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
  };
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));

// Initialize auth listener once
let authInitialized = false;

export function initAuth() {
  if (authInitialized) return;
  authInitialized = true;

  let mounted = true;

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!mounted) return;
    if (session?.user) {
      useAuth.getState().setUser(mapUser(session.user));
    }
    useAuth.getState().setLoading(false);
    useAuth.getState().setInitialized(true);
  });

  supabase.auth.onAuthStateChange((event, session) => {
    if (!mounted) return;
    if (event === 'SIGNED_IN' && session?.user) {
      useAuth.getState().setUser(mapUser(session.user));
      useAuth.getState().setLoading(false);
    } else if (event === 'SIGNED_OUT') {
      useAuth.getState().setUser(null);
      useAuth.getState().setLoading(false);
    } else if (event === 'TOKEN_REFRESHED' && session?.user) {
      useAuth.getState().setUser(mapUser(session.user));
    }
  });

  return () => {
    mounted = false;
  };
}
