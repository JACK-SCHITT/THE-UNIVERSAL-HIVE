import { useState, useCallback, useRef } from 'react';
import { ChatMessage, Storage } from '@/constants/storage';
import { sendMessage } from '@/services/aiService';

export function useChat(sessionId: string, agentId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [appIdea, setAppIdea] = useState('');
  const streamingIdRef = useRef<string | null>(null);

  const loadHistory = useCallback(async () => {
    const history = await Storage.getChatHistory(sessionId);
    setMessages(history);
  }, [sessionId]);

  const sendUserMessage = useCallback(async (text: string) => {
    if (isStreaming || !text.trim()) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
      agentId,
    };

    const aiMsgId = `a_${Date.now()}`;
    streamingIdRef.current = aiMsgId;

    const aiMsg: ChatMessage = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now() + 1,
      agentId,
    };

    const updatedWithUser = (prev: ChatMessage[]) => [...prev, userMsg];
    setMessages(prev => [...prev, userMsg, aiMsg]);

    setIsStreaming(true);

    // Extract app idea from first user message if none set
    if (!appIdea && messages.length === 0) {
      setAppIdea(text.trim());
    }

    const allMsgs = [...messages, userMsg];

    await sendMessage(
      allMsgs,
      agentId,
      agentId ? `agent:${agentId}` : 'prime',
      appIdea || text,
      {
        onChunk: (chunk) => {
          setMessages(prev =>
            prev.map(m =>
              m.id === aiMsgId ? { ...m, content: m.content + chunk } : m
            )
          );
        },
        onDone: () => {
          setIsStreaming(false);
          streamingIdRef.current = null;
          setMessages(prev => {
            Storage.saveChatHistory(sessionId, prev);
            return prev;
          });
        },
        onError: (err) => {
          setIsStreaming(false);
          streamingIdRef.current = null;
          setMessages(prev =>
            prev.map(m =>
              m.id === aiMsgId
                ? { ...m, content: 'Signal lost. Reconnecting... Try again.' }
                : m
            )
          );
        },
      }
    );
  }, [isStreaming, messages, agentId, appIdea, sessionId]);

  const clearHistory = useCallback(async () => {
    setMessages([]);
    await Storage.clearChatHistory(sessionId);
  }, [sessionId]);

  return {
    messages,
    isStreaming,
    appIdea,
    loadHistory,
    sendUserMessage,
    clearHistory,
  };
}
