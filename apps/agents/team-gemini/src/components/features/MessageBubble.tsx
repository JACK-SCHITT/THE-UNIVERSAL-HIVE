import { useState } from 'react';
import { Copy, Check, Cpu, User } from 'lucide-react';
import type { Message } from '@/types';
import { cn, formatRelative, MODEL_LABELS, copyToClipboard } from '@/lib/utils';
import CodeBlock from './CodeBlock';

interface MessageBubbleProps {
  message: Message;
  userName?: string;
}

function renderContent(content: string) {
  const parts: React.ReactNode[] = [];
  const codeRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = codeRegex.exec(content)) !== null) {
    const before = content.slice(lastIndex, match.index);
    if (before) {
      parts.push(<span key={key++} className="whitespace-pre-wrap">{renderInline(before)}</span>);
    }
    parts.push(
      <CodeBlock
        key={key++}
        language={match[1] || 'text'}
        code={match[2].trim()}
      />
    );
    lastIndex = match.index + match[0].length;
  }

  const remaining = content.slice(lastIndex);
  if (remaining) {
    parts.push(<span key={key++} className="whitespace-pre-wrap">{renderInline(remaining)}</span>);
  }

  return parts;
}

function renderInline(text: string) {
  // Bold
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={i} className="px-1.5 py-0.5 rounded bg-surface-600/80 text-green-300 font-mono text-sm">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export default function MessageBubble({ message, userName }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await copyToClipboard(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('flex gap-3 group animate-slide-up', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mt-1',
        isUser
          ? 'bg-gradient-to-br from-brand-400 to-brand-600 text-white'
          : 'bg-gradient-to-br from-accent-500 to-brand-500 glow-green'
      )}>
        {isUser
          ? (userName?.charAt(0).toUpperCase() || <User className="w-4 h-4" />)
          : <Cpu className="w-4 h-4 text-white" />
        }
      </div>

      {/* Content */}
      <div className={cn('flex-1 min-w-0 max-w-[85%]', isUser && 'flex flex-col items-end')}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-gray-400">
            {isUser ? (userName || 'You') : 'TeamGemini'}
          </span>
          {message.model && !isUser && (
            <span className="badge-model bg-surface-600/60 text-brand-300 border border-brand-500/20">
              {MODEL_LABELS[message.model] || message.model}
            </span>
          )}
          <span className="text-xs text-gray-600">{formatRelative(message.timestamp)}</span>
        </div>

        <div className={cn(
          'rounded-xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-brand-500/20 border border-brand-500/30 text-gray-100'
            : 'bg-surface-700/60 border border-surface-500/30 text-gray-200'
        )}>
          <div className="prose-sm">
            {renderContent(message.content)}
          </div>
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 px-1"
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
