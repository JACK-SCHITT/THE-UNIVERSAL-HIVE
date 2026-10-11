import { getSupabaseClient } from '@/template';

const supabase = getSupabaseClient();
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

export interface ChatMessage {
  id: string;
  user_id: string;
  character_id: string;
  message_text: string;
  sender: 'user' | 'ai';
  image_url?: string | null;
  created_at: string;
}

export const chatStorageService = {
  async getMessages(characterId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('character_id', characterId)
      .order('created_at', { ascending: true });

    if (error) { console.error('Load messages error:', error); return []; }
    return data || [];
  },

  async saveMessage(
    characterId: string,
    messageText: string,
    sender: 'user' | 'ai',
    imageUrl?: string
  ): Promise<ChatMessage | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ user_id: user.id, character_id: characterId, message_text: messageText, sender, image_url: imageUrl })
      .select()
      .single();

    if (error) { console.error('Save message error:', error); return null; }
    return data;
  },

  async clearMessages(characterId: string): Promise<boolean> {
    const { error } = await supabase.from('chat_messages').delete().eq('character_id', characterId);
    if (error) { console.error('Clear messages error:', error); return false; }
    return true;
  },
};

interface StreamCallbacks {
  onChunk: (text: string) => void;
  onImage: (imageUrl: string) => void;
  onComplete: () => void;
  onError: (error: string) => void;
}

export const chatService = {
  async sendMessage(
    characterId: string,
    messages: Array<{ role: string; content: string }>,
    themePromptAddition: string,
    callbacks: StreamCallbacks,
    memoryContext?: string
  ) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { callbacks.onError('Not authenticated'); return; }

      console.log('🚀 Sending to Edge Function');
      if (memoryContext) console.log('🧠 Injecting memory context');

      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ characterId, messages, themePromptAddition, memoryContext }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        callbacks.onError(`Request failed: ${errorText}`);
        return;
      }

      const reader = response.body?.getReader();

      const processData = (data: string) => {
        if (data === '[DONE]') { callbacks.onComplete(); return; }
        try {
          const parsed = JSON.parse(data);
          if (parsed.content) callbacks.onChunk(parsed.content);
          if (parsed.image_url) callbacks.onImage(parsed.image_url);
        } catch (_) {}
      };

      if (reader) {
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) { callbacks.onComplete(); break; }
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(l => l.trim().startsWith('data:'));
          for (const line of lines) {
            processData(line.replace(/^data: /, '').trim());
          }
        }
      } else {
        const fullText = await response.text();
        fullText.split('\n').filter(l => l.trim().startsWith('data:')).forEach(line => {
          processData(line.replace(/^data: /, '').trim());
        });
        callbacks.onComplete();
      }
    } catch (error: any) {
      console.error('Chat service error:', error);
      callbacks.onError(error.message || 'Unknown error');
    }
  },
};
