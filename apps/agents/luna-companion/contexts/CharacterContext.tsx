import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { getSupabaseClient } from '@/template';

export interface Character {
  id: string;
  name: string;
  avatar: string;
  personality: string;
  description: string;
  system_prompt: string;
  tags: string[];
  created_by?: string;
}

interface CharacterContextType {
  characters: Character[];
  currentCharacter: Character | null;
  loading: boolean;
  selectCharacter: (character: Character) => void;
  createCharacter: (data: Omit<Character, 'id' | 'created_by'>) => Promise<Character | null>;
  deleteCharacter: (id: string) => Promise<void>;
  refreshCharacters: () => Promise<void>;
}

export const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      // Load public/preset active characters
      const { data: publicChars, error: pubErr } = await supabase
        .from('characters')
        .select('*')
        .eq('is_active', true)
        .is('created_by', null)
        .order('created_at', { ascending: true });

      let userChars: Character[] = [];
      if (user) {
        // Load user-created characters
        const { data: uChars } = await supabase
          .from('characters')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });
        userChars = uChars || [];
      }

      const all = [...(publicChars || []), ...userChars];
      setCharacters(all);
      if (all.length > 0 && !currentCharacter) {
        setCurrentCharacter(all[0]);
      }
    } catch (error) {
      console.error('Failed to load characters:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCharacter = async (data: Omit<Character, 'id' | 'created_by'>): Promise<Character | null> => {
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: created, error } = await supabase
        .from('characters')
        .insert({
          ...data,
          created_by: user.id,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Create character error:', error);
        return null;
      }

      setCharacters(prev => [...prev, created]);
      setCurrentCharacter(created);
      return created;
    } catch (err) {
      console.error('Create character exception:', err);
      return null;
    }
  };

  const deleteCharacter = async (id: string) => {
    try {
      const supabase = getSupabaseClient();
      await supabase.from('characters').delete().eq('id', id);
      setCharacters(prev => prev.filter(c => c.id !== id));
      if (currentCharacter?.id === id) {
        setCurrentCharacter(characters.find(c => c.id !== id) || null);
      }
    } catch (err) {
      console.error('Delete character error:', err);
    }
  };

  return (
    <CharacterContext.Provider
      value={{
        characters,
        currentCharacter,
        loading,
        selectCharacter: setCurrentCharacter,
        createCharacter,
        deleteCharacter,
        refreshCharacters: loadCharacters,
      }}
    >
      {children}
    </CharacterContext.Provider>
  );
}
