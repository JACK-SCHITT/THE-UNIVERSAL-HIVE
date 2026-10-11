import { useContext } from 'react';
import { ConversationsContext } from '@/contexts/ConversationsContext';

export function useConversations() {
  const context = useContext(ConversationsContext);
  if (!context) throw new Error('useConversations must be used within ConversationsProvider');
  return context;
}
