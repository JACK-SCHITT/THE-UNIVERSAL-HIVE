import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/template';
import {
  Conversation,
  getConversations,
  createConversation,
  deleteConversation,
} from '@/services/conversations';

interface ConversationsContextType {
  conversations: Conversation[];
  loading: boolean;
  refresh: () => Promise<void>;
  addConversation: (agentId: string, agentName: string, title: string) => Promise<Conversation | null>;
  removeConversation: (id: string) => Promise<void>;
}

export const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined);

export function ConversationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await getConversations();
    setConversations(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      refresh();
    } else {
      setConversations([]);
    }
  }, [user]);

  const addConversation = useCallback(async (
    agentId: string,
    agentName: string,
    title: string
  ): Promise<Conversation | null> => {
    const { data } = await createConversation(agentId, agentName, title);
    if (data) {
      setConversations(prev => [data, ...prev]);
    }
    return data;
  }, []);

  const removeConversation = useCallback(async (id: string) => {
    await deleteConversation(id);
    setConversations(prev => prev.filter(c => c.id !== id));
  }, []);

  return (
    <ConversationsContext.Provider value={{ conversations, loading, refresh, addConversation, removeConversation }}>
      {children}
    </ConversationsContext.Provider>
  );
}
