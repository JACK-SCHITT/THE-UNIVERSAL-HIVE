import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, MessageSquare, X } from 'lucide-react';
import type { Conversation } from '@/types/chat';
import { cn } from '@/lib/utils';

interface SidebarProps {
  open: boolean;
  conversations: Conversation[];
  currentConversation: Conversation | null;
  onNewChat: () => void;
  onSelectConversation: (conv: Conversation) => void;
  onClose: () => void;
}

export default function Sidebar({
  open,
  conversations,
  currentConversation,
  onNewChat,
  onSelectConversation,
  onClose
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-card/50 border-r border-border/50 flex flex-col transition-transform",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h2 className="font-bold text-lg">Chat History</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4">
          <Button
            onClick={onNewChat}
            className="w-full gradient-cyber text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No conversations yet
            </p>
          ) : (
            conversations.map((conv) => (
              <Card
                key={conv.id}
                className={cn(
                  "p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                  currentConversation?.id === conv.id && "bg-primary/20 border-primary/50"
                )}
                onClick={() => onSelectConversation(conv)}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conv.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(conv.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
