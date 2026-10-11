import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Square, Paperclip, Code, RotateCcw, AlertTriangle, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  getUserConversations, createConversation, updateConversation,
  deleteConversation, getEffectiveApiKey, getDefaultModel
} from '@/lib/storage';
import { streamMessage, generateTitle } from '@/lib/gemini';
import type { Conversation, Message, GeminiModel } from '@/types';
import { generateId } from '@/lib/utils';
import ConversationList from '@/components/features/ConversationList';
import MessageBubble from '@/components/features/MessageBubble';
import ModelSelector from '@/components/features/ModelSelector';

export default function ChatPage() {
  const { user } = useAuth();
  const { conversationId } = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [model, setModel] = useState<GeminiModel>('gemini-2.5-flash');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [showSystem, setShowSystem] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!user) return;
    const convs = getUserConversations(user.id);
    setConversations(convs);
    setModel(getDefaultModel(user.id));

    if (conversationId) {
      const found = convs.find(c => c.id === conversationId);
      if (found) { setActiveConv(found); setModel(found.model); setSystemPrompt(found.systemPrompt || ''); }
    }
  }, [user, conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages, streamText]);

  const refreshConvs = useCallback(() => {
    if (!user) return;
    const convs = getUserConversations(user.id);
    setConversations(convs);
    if (activeConv) {
      const updated = convs.find(c => c.id === activeConv.id);
      if (updated) setActiveConv(updated);
    }
  }, [user, activeConv]);

  const handleNewChat = () => {
    setActiveConv(null);
    setInput('');
    setStreamText('');
    navigate('/chat');
  };

  const handleSelectConv = (id: string) => {
    navigate(`/chat/${id}`);
    const conv = conversations.find(c => c.id === id);
    if (conv) { setActiveConv(conv); setModel(conv.model); setSystemPrompt(conv.systemPrompt || ''); }
  };

  const handleDeleteConv = (id: string) => {
    deleteConversation(id);
    if (activeConv?.id === id) { setActiveConv(null); navigate('/chat'); }
    refreshConvs();
    toast.success('Conversation deleted');
  };

  const handleSend = async () => {
    if (!input.trim() || streaming || !user) return;

    const apiKey = getEffectiveApiKey(user.id);
    if (!apiKey) {
      toast.error('No API key configured. Add your Gemini API key in Settings.');
      return;
    }

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setInput('');
    setStreaming(true);
    setStreamText('');

    let conv = activeConv;

    if (!conv) {
      conv = createConversation({
        title: 'New Chat',
        userId: user.id,
        messages: [userMsg],
        model,
        systemPrompt: systemPrompt || undefined,
        tags: [],
        isShared: false,
      });
      setActiveConv(conv);
      navigate(`/chat/${conv.id}`, { replace: true });
    } else {
      const updated = updateConversation(conv.id, { messages: [...conv.messages, userMsg] });
      if (updated) { conv = updated; setActiveConv(updated); }
    }

    const messages = [...(conv.messages || [])];
    let fullResponse = '';

    try {
      fullResponse = await streamMessage(apiKey, model, messages, systemPrompt || undefined, (chunk) => {
        setStreamText(prev => prev + chunk);
      });

      const assistantMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date().toISOString(),
        model,
      };

      const finalMessages = [...messages, assistantMsg];
      const updated = updateConversation(conv.id, { messages: finalMessages, model });
      if (updated) setActiveConv(updated);

      // Auto-generate title after first exchange
      if (messages.length === 1) {
        generateTitle(apiKey, userMsg.content).then(title => {
          updateConversation(conv!.id, { title });
          refreshConvs();
        });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to get response from Gemini');
    } finally {
      setStreaming(false);
      setStreamText('');
      refreshConvs();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const apiKey = user ? getEffectiveApiKey(user.id) : '';

  return (
    <div className="flex h-full overflow-hidden">
      <ConversationList
        conversations={conversations}
        activeId={activeConv?.id}
        onSelect={handleSelectConv}
        onNew={handleNewChat}
        onDelete={handleDeleteConv}
      />

      {/* Main chat */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-500/30 bg-surface-800/40 flex-shrink-0">
          <div className="flex items-center gap-3">
            <ModelSelector value={model} onChange={setModel} />
            {activeConv && (
              <span className="text-sm text-gray-400 truncate max-w-xs">{activeConv.title}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSystem(s => !s)}
              className={`btn-ghost text-xs flex items-center gap-1.5 ${showSystem ? 'text-brand-300' : ''}`}
            >
              <Code className="w-3.5 h-3.5" />
              System Prompt
            </button>
            {activeConv && (
              <button
                onClick={() => { if (activeConv) { updateConversation(activeConv.id, { messages: [] }); refreshConvs(); setActiveConv({ ...activeConv, messages: [] }); } }}
                className="btn-ghost text-xs flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* System prompt */}
        {showSystem && (
          <div className="px-4 py-3 border-b border-surface-500/30 bg-surface-700/30 animate-fade-in">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">System Prompt</label>
            <textarea
              className="input-field w-full text-xs font-mono"
              rows={3}
              placeholder="You are a helpful coding assistant specializing in..."
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
            />
          </div>
        )}

        {/* No API key warning */}
        {!apiKey && (
          <div className="mx-4 mt-3 flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            No Gemini API key configured.{' '}
            <a href="/settings" className="underline hover:text-yellow-300">Add your key in Settings →</a>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {!activeConv || activeConv.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400/20 to-accent-500/20 border border-brand-500/20 flex items-center justify-center mb-4">
                <KeyRound className="w-7 h-7 text-brand-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Start a conversation</h3>
              <p className="text-gray-600 text-sm max-w-sm">
                Ask anything — code review, architecture decisions, debugging, automation scripts, or project planning.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-6 max-w-sm">
                {[
                  'Review my Python automation script',
                  'Write a GitHub Actions workflow',
                  'Debug this TypeScript error',
                  'Design a microservices architecture',
                ].map(s => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-left p-3 rounded-xl bg-surface-700/40 border border-surface-500/30 text-xs text-gray-400 hover:text-gray-200 hover:border-brand-500/30 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {activeConv.messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} userName={user?.name} />
              ))}
              {streaming && streamText && (
                <div className="flex gap-3 animate-slide-up">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-500 to-brand-500 flex items-center justify-center flex-shrink-0 mt-1 glow-green">
                    <span className="text-white text-xs font-bold">G</span>
                  </div>
                  <div className="flex-1 max-w-[85%]">
                    <div className="text-xs text-gray-500 mb-1">TeamGemini</div>
                    <div className="rounded-xl px-4 py-3 bg-surface-700/60 border border-surface-500/30 text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {streamText}
                      <span className="inline-block w-0.5 h-4 bg-brand-400 ml-0.5 animate-pulse" />
                    </div>
                  </div>
                </div>
              )}
              {streaming && !streamText && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-500 to-brand-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs font-bold">G</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-surface-700/60 border border-surface-500/30">
                    <span className="typing-dot" style={{ animationDelay: '0ms' }} />
                    <span className="typing-dot" style={{ animationDelay: '200ms' }} />
                    <span className="typing-dot" style={{ animationDelay: '400ms' }} />
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 pb-4 pt-2 border-t border-surface-500/20 flex-shrink-0">
          <div className="flex items-end gap-2 bg-surface-700/50 border border-surface-400/40 rounded-xl p-2 focus-within:border-brand-500/50 transition-colors">
            <button className="p-2 rounded-lg hover:bg-surface-600/60 text-gray-500 hover:text-gray-300 transition-colors">
              <Paperclip className="w-4 h-4" />
            </button>
            <textarea
              ref={textareaRef}
              className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 resize-none outline-none max-h-40 py-1"
              placeholder="Message TeamGemini... (Shift+Enter for new line)"
              rows={1}
              value={input}
              onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'; }}
              onKeyDown={handleKeyDown}
            />
            {streaming ? (
              <button
                onClick={() => { setStreaming(false); setStreamText(''); }}
                className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
              >
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim() || !apiKey}
                className="p-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="text-xs text-gray-700 text-center mt-2">
            Gemini may make mistakes. Verify important information.
          </div>
        </div>
      </div>
    </div>
  );
}
