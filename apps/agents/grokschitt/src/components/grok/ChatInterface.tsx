import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Send, Loader2, Bot, User, Search, Code, Image as ImageIcon, Mic, Volume2, Download, FileText } from 'lucide-react';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { useExport } from '@/hooks/useExport';
import { supabase } from '@/lib/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';
import type { Message, Conversation } from '@/types/chat';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  conversation: Conversation | null;
  onConversationCreated: (conv: Conversation) => void;
  userId?: string;
}

export default function ChatInterface({ conversation, onConversationCreated, userId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tools, setTools] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isListening, isSpeaking, transcript, startListening, stopListening, speak, stopSpeaking, clearTranscript } = useVoiceChat();
  const { exportChatAsPDF, exportChatAsMarkdown } = useExport();

  useEffect(() => {
    if (conversation) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!conversation) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('grok-chat', {
        body: {
          conversationId: conversation?.id,
          message: userMessage,
          tools: tools.length > 0 ? tools : undefined,
          userId: userId
        }
      });

      if (error) {
        let errorMessage = error.message;
        if (error instanceof FunctionsHttpError) {
          try {
            const statusCode = error.context?.status ?? 500;
            const textContent = await error.context?.text();
            errorMessage = `[Code: ${statusCode}] ${textContent || error.message || 'Unknown error'}`;
          } catch {
            errorMessage = `${error.message || 'Failed to read response'}`;
          }
        }
        throw new Error(errorMessage);
      }

      // Update conversation if new one was created
      if (!conversation && data.conversationId) {
        const { data: newConv } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', data.conversationId)
          .single();

        if (newConv) {
          onConversationCreated(newConv);
        }
      }

      // Reload messages
      if (conversation || data.conversationId) {
        loadMessages();
      }

      // Clear tools after use
      setTools([]);

      // Speak response if voice is enabled
      if (isSpeaking || isListening) {
        speak(data.message);
      }
      
    } catch (error: any) {
      console.error('Chat error:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const toggleTool = (tool: string) => {
    setTools(prev => 
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    );
  };

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      clearTranscript();
      startListening();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Welcome Screen */}
      {!conversation && messages.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-2xl space-y-6">
            <div className="w-20 h-20 mx-auto rounded-2xl gradient-cyber flex items-center justify-center">
              <Bot className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gradient">GROK-MAX Local Edition</h2>
            <p className="text-lg text-muted-foreground">
              Uncensored AI assistant with no limits. Ask anything, get brutally honest answers.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <Card className="p-4 bg-card/50 border-primary/30">
                <h3 className="font-bold text-primary mb-2">🔥 No Filters</h3>
                <p className="text-sm text-muted-foreground">Zero corporate censorship. Real answers only.</p>
              </Card>
              <Card className="p-4 bg-card/50 border-secondary/30">
                <h3 className="font-bold text-secondary mb-2">🧠 Smart Tools</h3>
                <p className="text-sm text-muted-foreground">Web search, code, and image generation.</p>
              </Card>
              <Card className="p-4 bg-card/50 border-accent/30">
                <h3 className="font-bold text-accent mb-2">💬 Long Context</h3>
                <p className="text-sm text-muted-foreground">Up to 1M tokens for deep conversations.</p>
              </Card>
              <Card className="p-4 bg-card/50 border-muted/30">
                <h3 className="font-bold text-foreground mb-2">⚡ Frontier Models</h3>
                <p className="text-sm text-muted-foreground">Gemini 3 & GPT-5 under the hood.</p>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg gradient-cyber flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              
              <Card className={`max-w-[80%] p-4 ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card/50 border-border/50'
              }`}>
                <ReactMarkdown
                  className="prose prose-sm dark:prose-invert max-w-none"
                  components={{
                    code: ({ node, className, children, ...props }: any) => {
                      const match = /language-(\w+)/.exec(className || '');
                      return match ? (
                        <pre className="bg-muted p-3 rounded-lg overflow-x-auto">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      ) : (
                        <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </Card>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg gradient-cyber flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <Card className="p-4 bg-card/50 border-border/50">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Export Options */}
      {conversation && messages.length > 0 && (
        <div className="px-4 pb-2 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportChatAsPDF(conversation.id)}
            className="gap-2"
          >
            <Download className="w-3 h-3" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportChatAsMarkdown(conversation.id)}
            className="gap-2"
          >
            <FileText className="w-3 h-3" />
            Export MD
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-border/50 bg-card/30 backdrop-blur-sm p-4">
        {/* Tool Toggles */}
        <div className="flex gap-2 mb-3 flex-wrap">
          <Button
            variant={tools.includes('web_search') ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleTool('web_search')}
            className="gap-2"
          >
            <Search className="w-4 h-4" />
            Web Search
          </Button>
          <Button
            variant={tools.includes('code_exec') ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleTool('code_exec')}
            className="gap-2"
            disabled
          >
            <Code className="w-4 h-4" />
            Code (Soon)
          </Button>
          <Button
            variant={tools.includes('image_gen') ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleTool('image_gen')}
            className="gap-2"
            disabled
          >
            <ImageIcon className="w-4 h-4" />
            Image (Soon)
          </Button>
          <Button
            variant={isListening ? 'default' : 'outline'}
            size="sm"
            onClick={handleVoiceInput}
            className="gap-2"
          >
            <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
            Voice {isListening ? 'Listening...' : 'Input'}
          </Button>
          <Button
            variant={isSpeaking ? 'default' : 'outline'}
            size="sm"
            onClick={isSpeaking ? stopSpeaking : () => {}}
            className="gap-2"
            disabled={!isSpeaking}
          >
            <Volume2 className="w-4 h-4" />
            {isSpeaking ? 'Speaking...' : 'TTS'}
          </Button>
        </div>

        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask GROK-MAX anything... no filters, no limits"
            className="min-h-[60px] max-h-[200px] resize-none bg-background/50"
            disabled={loading}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            size="icon"
            className="h-[60px] w-[60px] gradient-cyber text-white flex-shrink-0"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
