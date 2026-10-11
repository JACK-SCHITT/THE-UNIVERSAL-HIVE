import { useState, useEffect, useRef } from 'react';
import { useCharacter } from './useCharacter';
import { chatService, chatStorageService, ChatMessage } from '@/services/chatService';
import { memoryService } from '@/services/memoryService';
import { useAlert } from '@/template';
import { useConversationTheme } from '@/contexts/ThemeContext';
import { getSupabaseClient } from '@/template';

const supabase = getSupabaseClient();

interface Message extends ChatMessage {
  isStreaming?: boolean;
}

export function useChat() {
  const { currentCharacter } = useCharacter();
  const { showAlert } = useAlert();
  const { activeTheme } = useConversationTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [memoryPromptBlock, setMemoryPromptBlock] = useState('');

  useEffect(() => {
    if (currentCharacter) {
      loadMessages();
      loadMemories();
    }
  }, [currentCharacter?.id]);

  const loadMessages = async () => {
    if (!currentCharacter) return;
    setLoading(true);
    const data = await chatStorageService.getMessages(currentCharacter.id);
    setMessages(data);
    setLoading(false);
  };

  const loadMemories = async () => {
    if (!currentCharacter) return;
    const mems = await memoryService.loadMemories(currentCharacter.id);
    const block = memoryService.formatMemoriesForPrompt(mems);
    setMemoryPromptBlock(block);
    if (block) console.log('🧠 Loaded memory context:', block.substring(0, 80));
  };

  const sendMessage = async (text: string) => {
    if (!currentCharacter || !text.trim()) return;

    const userMessage = await chatStorageService.saveMessage(currentCharacter.id, text, 'user');
    if (!userMessage) {
      showAlert('Failed to send message');
      return;
    }

    setMessages(prev => [...prev, userMessage]);

    const conversationHistory = [...messages, userMessage].map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.message_text,
    }));

    const streamingId = `streaming-${Date.now()}`;
    const streamingMessage: Message = {
      id: streamingId,
      user_id: userMessage.user_id,
      character_id: currentCharacter.id,
      message_text: '',
      sender: 'ai',
      created_at: new Date().toISOString(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, streamingMessage]);
    setIsStreaming(true);

    let fullResponse = '';
    let imageUrl: string | undefined;

    await chatService.sendMessage(
      currentCharacter.id,
      conversationHistory,
      activeTheme.systemPromptAddition,
      {
        onChunk: (chunk) => {
          fullResponse += chunk;
          setMessages(prev =>
            prev.map(msg => msg.id === streamingId ? { ...msg, message_text: fullResponse } : msg)
          );
        },
        onImage: (url) => {
          imageUrl = url;
          setMessages(prev =>
            prev.map(msg => msg.id === streamingId ? { ...msg, image_url: url } : msg)
          );
        },
        onComplete: async () => {
          setIsStreaming(false);
          if (fullResponse) {
            const aiMessage = await chatStorageService.saveMessage(
              currentCharacter.id, fullResponse, 'ai', imageUrl
            );
            if (aiMessage) {
              setMessages(prev =>
                prev.map(msg => msg.id === streamingId ? { ...aiMessage, isStreaming: false } : msg)
              );

              // Background memory extraction (after every 3rd AI response)
              triggerMemoryExtraction(text, fullResponse);
            }
          }
        },
        onError: (error) => {
          setIsStreaming(false);
          setMessages(prev => prev.filter(msg => msg.id !== streamingId));
          showAlert(error);
        },
      },
      memoryPromptBlock || undefined
    );
  };

  const triggerMemoryExtraction = async (userText: string, aiResponse: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !currentCharacter) return;

      const excerpt = `User: ${userText}\nAssistant: ${aiResponse}`;
      // Fire and forget — don't await, runs in background
      memoryService.extractAndSaveMemories(
        currentCharacter.id,
        excerpt,
        session
      ).then(() => {
        // Refresh memory block silently after extraction
        loadMemories();
      });
    } catch (_) {
      // Silent fail for background task
    }
  };

  const clearChat = async () => {
    if (!currentCharacter) return;
    const success = await chatStorageService.clearMessages(currentCharacter.id);
    if (success) {
      setMessages([]);
    } else {
      showAlert('Failed to clear chat');
    }
  };

  return { messages, loading, isStreaming, sendMessage, clearChat };
}
