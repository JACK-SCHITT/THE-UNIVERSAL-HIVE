import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatInterface from '@/components/grok/ChatInterface';
import Sidebar from '@/components/grok/Sidebar';
import FraudSidebar from '@/components/grok/FraudSidebar';
import SystemPromptEditor from '@/components/grok/SystemPromptEditor';
import { Button } from '@/components/ui/button';
import { Menu, X, Settings, Shield, Home } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Conversation } from '@/types/chat';

export default function GrokMaxPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [fraudSidebarOpen, setFraudSidebarOpen] = useState(true);
  const [promptEditorOpen, setPromptEditorOpen] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    loadConversations();
  }, [user]);

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setConversations(data);
    }
  };

  const createNewChat = () => {
    setCurrentConversation(null);
  };

  const selectConversation = (conv: Conversation) => {
    setCurrentConversation(conv);
  };

  const updateSystemPrompt = async (newPrompt: string) => {
    if (currentConversation) {
      await supabase
        .from('conversations')
        .update({ system_prompt: newPrompt })
        .eq('id', currentConversation.id);

      setCurrentConversation({ ...currentConversation, system_prompt: newPrompt });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm z-50 flex-shrink-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg gradient-cyber flex items-center justify-center">
                <span className="text-2xl font-bold text-white">G</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gradient">GROK-MAX</h1>
                <p className="text-xs text-muted-foreground">Local Edition • Uncensored AI</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              title="Back to GROKSCHITT"
            >
              <Home className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPromptEditorOpen(true)}
              title="System Prompt Editor"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFraudSidebarOpen(!fraudSidebarOpen)}
              title="Fraud Detection"
            >
              <Shield className="w-5 h-5" />
            </Button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 border border-accent/30">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse-glow"></div>
              <span className="text-xs font-medium text-accent">
                {user ? 'Authenticated' : 'Guest Mode'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Chat History */}
        <Sidebar
          open={sidebarOpen}
          conversations={conversations}
          currentConversation={currentConversation}
          onNewChat={createNewChat}
          onSelectConversation={selectConversation}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatInterface
            conversation={currentConversation}
            onConversationCreated={(conv) => {
              setCurrentConversation(conv);
              loadConversations();
            }}
            userId={user?.id}
          />
        </div>

        {/* Right Sidebar - Fraud Detection */}
        <FraudSidebar
          open={fraudSidebarOpen}
          onClose={() => setFraudSidebarOpen(false)}
          userId={user?.id}
        />
      </div>

      {/* System Prompt Editor Modal */}
      {promptEditorOpen && (
        <SystemPromptEditor
          currentPrompt={currentConversation?.system_prompt}
          onSave={updateSystemPrompt}
          onClose={() => setPromptEditorOpen(false)}
        />
      )}
    </div>
  );
}
