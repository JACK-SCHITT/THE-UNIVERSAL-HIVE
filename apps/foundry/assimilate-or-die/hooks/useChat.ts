import { useState, useCallback, useRef } from 'react';
import { streamChat, ChatMessage } from '@/services/ai';
import { addMessage, getMessages, Message } from '@/services/conversations';

export function useChat(conversationId: string, agentId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const appIdeaRef = useRef('');

  const loadMessages = useCallback(async () => {
    setLoading(true);
    const { data } = await getMessages(conversationId);
    setMessages(data);
    // Extract app idea from first user message if available
    const firstUser = data.find(m => m.role === 'user');
    if (firstUser) appIdeaRef.current = firstUser.content.slice(0, 200);
    setLoading(false);
  }, [conversationId]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;

    // Update app idea from first message
    if (messages.length === 0) appIdeaRef.current = text.slice(0, 200);

    // Save user message to DB
    const { data: userMsg } = await addMessage(conversationId, 'user', text);
    if (userMsg) setMessages(prev => [...prev, userMsg]);

    // Build history for AI
    const history: ChatMessage[] = [
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: text },
    ];

    setStreaming(true);
    setStreamingText('');
    let fullResponse = '';

    await streamChat(history, agentId, appIdeaRef.current, {
      onChunk: (chunk) => {
        fullResponse += chunk;
        setStreamingText(fullResponse);
      },
      onComplete: async () => {
        setStreaming(false);
        setStreamingText('');
        if (fullResponse) {
          const { data: aiMsg } = await addMessage(conversationId, 'assistant', fullResponse);
          if (aiMsg) setMessages(prev => [...prev, aiMsg]);
        }
      },
      onError: async (err) => {
        setStreaming(false);
        setStreamingText('');
        const errorText = `[SYSTEM ERROR] ${err}`;
        const { data: errMsg } = await addMessage(conversationId, 'assistant', errorText);
        if (errMsg) setMessages(prev => [...prev, errMsg]);
      },
    });
  }, [messages, conversationId, agentId, streaming]);

  return { messages, loading, streaming, streamingText, loadMessages, sendMessage };
}
