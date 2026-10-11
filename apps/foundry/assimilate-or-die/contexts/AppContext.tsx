import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Mission, MISSIONS, RANKS, Rank } from '@/constants/data';
import { getSupabaseClient } from '@/template';
import { useAuth } from '@/template';

interface UserProfile {
  name: string;
  handle: string;
  xp: number;
  toolsExplored: string[];
  chatMessagesSent: number;
  appsSubmitted: number;
  lessonsCompleted: number;
  missions: Mission[];
}

interface AppContextType {
  user: UserProfile;
  currentRank: Rank;
  nextRank: Rank | null;
  xpProgress: number;
  addXP: (amount: number) => void;
  markToolExplored: (toolId: string) => void;
  incrementChat: () => void;
  completeMission: (missionId: string) => void;
  completeLesson: () => void;
  syncProfile: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function getRank(xp: number): Rank {
  return RANKS.slice().reverse().find(r => xp >= r.minXP) || RANKS[0];
}

const DEFAULT_USER: UserProfile = {
  name: 'NEW RECRUIT',
  handle: '@initiate_001',
  xp: 0,
  toolsExplored: [],
  chatMessagesSent: 0,
  appsSubmitted: 0,
  lessonsCompleted: 0,
  missions: MISSIONS,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const { user: authUser } = useAuth();
  const supabase = getSupabaseClient();

  // Sync profile from Supabase when auth user is available
  const syncProfile = useCallback(async () => {
    if (!authUser) return;
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error || !data) return;

      setUser(prev => ({
        ...prev,
        name: data.username || prev.name,
        handle: data.handle || prev.handle,
        xp: data.xp || prev.xp,
        toolsExplored: data.tools_explored || prev.toolsExplored,
        chatMessagesSent: data.chat_messages_sent || prev.chatMessagesSent,
        appsSubmitted: data.apps_submitted || prev.appsSubmitted,
        lessonsCompleted: data.lessons_completed || prev.lessonsCompleted,
        missions: data.missions_data?.length ? data.missions_data : prev.missions,
      }));
    } catch (e) {
      console.log('Profile sync error:', e);
    }
  }, [authUser]);

  useEffect(() => {
    syncProfile();
  }, [authUser]);

  // Persist profile changes to Supabase
  const persistProfile = useCallback(async (updates: Partial<{
    xp: number;
    tools_explored: string[];
    chat_messages_sent: number;
    apps_submitted: number;
    lessons_completed: number;
    missions_data: Mission[];
  }>) => {
    if (!authUser) return;
    try {
      await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', authUser.id);
    } catch (e) {
      console.log('Persist error:', e);
    }
  }, [authUser]);

  const addXP = useCallback((amount: number) => {
    setUser(prev => {
      const newXP = prev.xp + amount;
      persistProfile({ xp: newXP });
      return { ...prev, xp: newXP };
    });
  }, [persistProfile]);

  const markToolExplored = useCallback((toolId: string) => {
    setUser(prev => {
      if (prev.toolsExplored.includes(toolId)) return prev;
      const newExplored = [...prev.toolsExplored, toolId];
      const missions = prev.missions.map(m =>
        m.id === '1' && !m.completed ? { ...m, completed: true } : m
      );
      const missions2 = missions.map(m =>
        m.id === '5' && !m.completed && newExplored.length >= 9
          ? { ...m, completed: true }
          : m
      );
      persistProfile({ tools_explored: newExplored, missions_data: missions2 });
      return { ...prev, toolsExplored: newExplored, missions: missions2 };
    });
  }, [persistProfile]);

  const incrementChat = useCallback(() => {
    setUser(prev => {
      const newCount = prev.chatMessagesSent + 1;
      const missions = prev.missions.map(m =>
        m.id === '2' && !m.completed && newCount >= 5 ? { ...m, completed: true } : m
      );
      persistProfile({ chat_messages_sent: newCount, missions_data: missions });
      return { ...prev, chatMessagesSent: newCount, missions };
    });
  }, [persistProfile]);

  const completeMission = useCallback((missionId: string) => {
    setUser(prev => {
      const mission = prev.missions.find(m => m.id === missionId);
      if (!mission || mission.completed) return prev;
      const missions = prev.missions.map(m =>
        m.id === missionId ? { ...m, completed: true } : m
      );
      const newXP = prev.xp + mission.xp;
      persistProfile({ missions_data: missions, xp: newXP });
      return { ...prev, missions, xp: newXP };
    });
  }, [persistProfile]);

  const completeLesson = useCallback(() => {
    setUser(prev => {
      const newCount = prev.lessonsCompleted + 1;
      const missions = prev.missions.map(m =>
        m.id === '4' && !m.completed && newCount >= 3 ? { ...m, completed: true } : m
      );
      persistProfile({ lessons_completed: newCount, missions_data: missions });
      return { ...prev, lessonsCompleted: newCount, missions };
    });
  }, [persistProfile]);

  const currentRank = getRank(user.xp);
  const nextRank = RANKS.find(r => r.level === currentRank.level + 1) || null;
  const xpProgress = nextRank
    ? (user.xp - currentRank.minXP) / (nextRank.minXP - currentRank.minXP)
    : 1;

  return (
    <AppContext.Provider value={{ user, currentRank, nextRank, xpProgress, addXP, markToolExplored, incrementChat, completeMission, completeLesson, syncProfile }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
