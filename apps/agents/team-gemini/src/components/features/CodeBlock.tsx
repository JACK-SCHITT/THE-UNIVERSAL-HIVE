import { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import { cn, getLangColor, copyToClipboard } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
}

export default function CodeBlock({ code, language = 'text', filename, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('rounded-xl overflow-hidden border border-surface-500/40 my-2', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-700/60 border-b border-surface-500/30">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-gray-500" />
          {filename && <span className="text-xs text-gray-400 font-mono">{filename}</span>}
          <span className={cn('text-xs font-mono font-medium', getLangColor(language))}>
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-gray-400 hover:text-gray-200 hover:bg-surface-600/60 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {/* Code */}
      <div className="bg-[#0a0d14] overflow-x-auto">
        <pre className="p-4 text-sm font-mono text-gray-300 leading-relaxed whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
