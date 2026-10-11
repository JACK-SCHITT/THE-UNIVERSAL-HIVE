import { useState, useCallback } from 'react';
import { getSupabaseClient } from '@/template';

export interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

const supabase = getSupabaseClient();

export function useReactions() {
  const [reactions, setReactions] = useState<Record<string, Record<string, Reaction>>>({});

  const loadReactionsForMessage = useCallback(async (messageId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('message_reactions')
      .select('*')
      .eq('message_id', messageId);

    if (error || !data) return;

    const grouped: Record<string, Reaction> = {};
    for (const r of data) {
      if (!grouped[r.emoji]) {
        grouped[r.emoji] = { emoji: r.emoji, count: 0, userReacted: false };
      }
      grouped[r.emoji].count += 1;
      if (r.user_id === user.id) {
        grouped[r.emoji].userReacted = true;
      }
    }

    setReactions(prev => ({ ...prev, [messageId]: grouped }));
  }, []);

  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const current = reactions[messageId]?.[emoji];

    if (current?.userReacted) {
      // Remove reaction
      await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji);

      setReactions(prev => {
        const msgReactions = { ...prev[messageId] };
        if (msgReactions[emoji]) {
          const newCount = msgReactions[emoji].count - 1;
          if (newCount <= 0) {
            delete msgReactions[emoji];
          } else {
            msgReactions[emoji] = { ...msgReactions[emoji], count: newCount, userReacted: false };
          }
        }
        return { ...prev, [messageId]: msgReactions };
      });
    } else {
      // Add reaction
      const { error } = await supabase
        .from('message_reactions')
        .insert({ message_id: messageId, user_id: user.id, emoji });

      if (!error) {
        setReactions(prev => {
          const msgReactions = { ...prev[messageId] } || {};
          msgReactions[emoji] = {
            emoji,
            count: (msgReactions[emoji]?.count || 0) + 1,
            userReacted: true,
          };
          return { ...prev, [messageId]: msgReactions };
        });
      }
    }
  }, [reactions]);

  return { reactions, loadReactionsForMessage, toggleReaction };
}
