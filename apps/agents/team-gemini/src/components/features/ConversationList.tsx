import { useState } from 'react';
import { MessageSquare, Trash2, Plus, Search, Tag } from 'lucide-react';
import type { Conversation } from '@/types';
import { cn, formatRelative, truncate } from '@/lib/utils';

interface ConversationListProps {
  conversations: Conversation[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export default function ConversationList({ conversations, activeId, onSelect, onNew, onDelete }: ConversationListProps) {
  const [search, setSearch] = useState('');

  const filtered = conversations
    .filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="flex flex-col h-full w-64 border-r border-surface-500/30 bg-surface-800/40">
      {/* Header */}
      <div className="p-3 border-b border-surface-500/30">
        <button onClick={onNew} className="btn-primary w-full flex items-center justify-center gap-2 py-2 text-sm">
          <Plus className="w-4 h-4" />
          New Chat
        </button>
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-500" />
          <input
            className="input-field w-full pl-8 py-2 text-xs"
            placeholder="Search conversations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-600 text-sm">
            {search ? 'No results' : 'No conversations yet'}
          </div>
        )}
        {filtered.map(conv => (
          <div
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={cn(
              'group relative flex items-start gap-2.5 px-3 py-2.5 mx-1 rounded-lg cursor-pointer transition-colors',
              activeId === conv.id
                ? 'bg-brand-500/15 border border-brand-500/25'
                : 'hover:bg-surface-600/40'
            )}
          >
            <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-500" />
            <div className="flex-1 min-w-0">
              <div className={cn('text-xs font-medium truncate', activeId === conv.id ? 'text-brand-300' : 'text-gray-300')}>
                {conv.title}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-gray-600 font-mono">
                  {(conv.model || '').replace('gemini-', '')}
                </span>
                <span className="text-gray-700">·</span>
                <span className="text-xs text-gray-600">{formatRelative(conv.updatedAt)}</span>
              </div>
              {conv.tags && conv.tags.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {conv.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-surface-600/60 text-gray-500 flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" />{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={e => { e.stopPropagation(); onDelete(conv.id); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 text-gray-600 hover:text-red-400"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
