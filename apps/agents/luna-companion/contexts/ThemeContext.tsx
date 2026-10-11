import React, { createContext, useState, useContext, ReactNode } from 'react';

export type ConversationTheme = {
  id: string;
  name: string;
  icon: string;
  description: string;
  systemPromptAddition: string;
  accentColor: string;
  bgGradient: [string, string];
};

export const CONVERSATION_THEMES: ConversationTheme[] = [
  {
    id: 'dreamy',
    name: 'Dreamy',
    icon: 'auto-awesome',
    description: 'Mystical & poetic conversations',
    systemPromptAddition: 'Speak in a dreamy, mystical tone with poetic metaphors.',
    accentColor: '#a855f7',
    bgGradient: ['#0a0a0f', '#12121a'],
  },
  {
    id: 'romantic',
    name: 'Romantic',
    icon: 'favorite',
    description: 'Warm, loving & intimate',
    systemPromptAddition: 'Be warm, affectionate and caring. Show deep emotional connection.',
    accentColor: '#ec4899',
    bgGradient: ['#0f0a0f', '#1a0d14'],
  },
  {
    id: 'philosophical',
    name: 'Philosopher',
    icon: 'psychology',
    description: 'Deep thoughts & big questions',
    systemPromptAddition: 'Engage in deep philosophical discussions. Ask thought-provoking questions.',
    accentColor: '#3b82f6',
    bgGradient: ['#0a0a14', '#0d1024'],
  },
  {
    id: 'creative',
    name: 'Creative',
    icon: 'palette',
    description: 'Art, stories & imagination',
    systemPromptAddition: 'Be wildly creative. Help write stories, poems, and explore artistic ideas.',
    accentColor: '#f59e0b',
    bgGradient: ['#0f0c0a', '#1a1208'],
  },
  {
    id: 'adventure',
    name: 'Adventure',
    icon: 'explore',
    description: 'Bold quests & excitement',
    systemPromptAddition: 'Be adventurous and exciting! Engage in role-play and epic storytelling.',
    accentColor: '#10b981',
    bgGradient: ['#0a0f0b', '#0d1a10'],
  },
];

interface ThemeContextType {
  activeTheme: ConversationTheme;
  setTheme: (theme: ConversationTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [activeTheme, setActiveTheme] = useState<ConversationTheme>(CONVERSATION_THEMES[0]);

  return (
    <ThemeContext.Provider value={{ activeTheme, setTheme: setActiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useConversationTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useConversationTheme must be used within ThemeProvider');
  return ctx;
}
