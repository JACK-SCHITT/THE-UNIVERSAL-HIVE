import { useState, useRef } from 'react';
import {
  Code2, Play, Loader2, Copy, Check, Bug, BookOpen,
  Wand2, FileSearch, FileText, ChevronDown, RotateCcw,
  Sparkles, AlertCircle, Lightbulb, CheckCircle2, Terminal
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { analyzeCode } from '@/lib/gemini';
import { getSettings } from '@/lib/storage';
import ModelSelector from '@/components/features/ModelSelector';
import CodeBlock from '@/components/features/CodeBlock';
import { cn, copyToClipboard } from '@/lib/utils';
import type { GeminiModel } from '@/types';

type Task = 'review' | 'debug' | 'explain' | 'improve' | 'document';

interface TaskConfig {
  id: Task;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  activeColor: string;
  borderColor: string;
}

const TASKS: TaskConfig[] = [
  {
    id: 'review',
    label: 'Review',
    icon: <FileSearch className="w-4 h-4" />,
    description: 'Security, bugs & best practices',
    color: 'text-blue-400',
    activeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
    borderColor: 'border-blue-500/40',
  },
  {
    id: 'debug',
    label: 'Debug',
    icon: <Bug className="w-4 h-4" />,
    description: 'Find and fix all bugs',
    color: 'text-red-400',
    activeColor: 'bg-red-500/15 text-red-300 border-red-500/40',
    borderColor: 'border-red-500/40',
  },
  {
    id: 'explain',
    label: 'Explain',
    icon: <BookOpen className="w-4 h-4" />,
    description: 'Step-by-step explanation',
    color: 'text-green-400',
    activeColor: 'bg-green-500/15 text-green-300 border-green-500/40',
    borderColor: 'border-green-500/40',
  },
  {
    id: 'improve',
    label: 'Improve',
    icon: <Wand2 className="w-4 h-4" />,
    description: 'Performance & readability',
    color: 'text-purple-400',
    activeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
    borderColor: 'border-purple-500/40',
  },
  {
    id: 'document',
    label: 'Document',
    icon: <FileText className="w-4 h-4" />,
    description: 'Add docs & comments',
    color: 'text-yellow-400',
    activeColor: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40',
    borderColor: 'border-yellow-500/40',
  },
];

const LANGUAGES = [
  'TypeScript', 'JavaScript', 'Python', 'Rust', 'Go', 'Java',
  'C++', 'C#', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'SQL',
  'Bash', 'HTML', 'CSS', 'YAML', 'Dockerfile', 'JSON',
];

// Parse the AI markdown response into sections for rendering
function parseAnalysis(raw: string): { type: 'text' | 'code'; content: string; language?: string }[] {
  const parts: { type: 'text' | 'code'; content: string; language?: string }[] = [];
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: raw.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'code', language: match[1] || 'text', content: match[2].trim() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < raw.length) {
    parts.push({ type: 'text', content: raw.slice(lastIndex) });
  }

  return parts;
}

// Render a single markdown text segment with basic formatting
function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        // H3
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={i} className="text-sm font-semibold text-white mt-4 mb-1 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
              {trimmed.slice(4)}
            </h3>
          );
        }
        // H2
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={i} className="text-base font-bold text-white mt-5 mb-2 border-b border-surface-500/30 pb-1">
              {trimmed.slice(3)}
            </h2>
          );
        }
        // H1
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={i} className="text-lg font-bold text-white mt-4 mb-2">
              {trimmed.slice(2)}
            </h1>
          );
        }
        // Bullet with warning icon
        if (trimmed.startsWith('- ⚠️') || trimmed.startsWith('* ⚠️')) {
          return (
            <div key={i} className="flex items-start gap-2 text-sm text-yellow-300/90 pl-1">
              <AlertCircle className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <span>{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }
        // Bullet with checkmark
        if (trimmed.startsWith('- ✅') || trimmed.startsWith('* ✅')) {
          return (
            <div key={i} className="flex items-start gap-2 text-sm text-green-300/90 pl-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
              <span>{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }
        // Bullet with lightbulb
        if (trimmed.startsWith('- 💡') || trimmed.startsWith('* 💡')) {
          return (
            <div key={i} className="flex items-start gap-2 text-sm text-purple-300/90 pl-1">
              <Lightbulb className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
              <span>{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }
        // Regular bullet
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={i} className="flex items-start gap-2 text-sm text-gray-300 pl-1">
              <span className="text-brand-400 mt-1.5 flex-shrink-0">•</span>
              <span>{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }
        // Numbered list
        if (/^\d+\.\s/.test(trimmed)) {
          const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
          if (numMatch) {
            return (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-300 pl-1">
                <span className="text-brand-300 font-mono text-xs mt-0.5 flex-shrink-0 w-4">{numMatch[1]}.</span>
                <span>{renderInline(numMatch[2])}</span>
              </div>
            );
          }
        }
        // Bold line (starts and ends with **)
        if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4) {
          return (
            <p key={i} className="text-sm font-semibold text-gray-200">{trimmed.slice(2, -2)}</p>
          );
        }
        // Default paragraph
        return (
          <p key={i} className="text-sm text-gray-300 leading-relaxed">{renderInline(trimmed)}</p>
        );
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  // Bold + inline code
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="font-mono text-xs bg-surface-600/60 text-brand-300 px-1 py-0.5 rounded">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-100">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function CodeReviewPage() {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('TypeScript');
  const [task, setTask] = useState<Task>('review');
  const [model, setModel] = useState<GeminiModel>('gemini-2.5-pro');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [langDropdown, setLangDropdown] = useState(false);
  const [copiedResult, setCopiedResult] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const settings = getSettings();
  const apiKey = user?.apiKey || settings.rootKey;

  const activeTask = TASKS.find(t => t.id === task)!;

  const handleAnalyze = async () => {
    if (!code.trim()) {
      toast.error('Paste some code first');
      return;
    }
    if (!apiKey) {
      toast.error('No Gemini API key configured. Add one in Settings.');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const output = await analyzeCode(apiKey, code, language.toLowerCase(), task);
      setResult(output);
    } catch (err: any) {
      toast.error(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResult = async () => {
    await copyToClipboard(result);
    setCopiedResult(true);
    setTimeout(() => setCopiedResult(false), 2000);
  };

  const handleReset = () => {
    setCode('');
    setResult('');
    textareaRef.current?.focus();
  };

  const parsedResult = result ? parseAnalysis(result) : [];
  const lineCount = code.split('\n').length;
  const charCount = code.length;

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-500/30 bg-surface-800/40 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
            <Code2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Code Review</h1>
            <p className="text-xs text-gray-500">AI-powered analysis with Gemini</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ModelSelector
            value={model}
            onChange={setModel}
            compact
          />
          {(code || result) && (
            <button onClick={handleReset} className="btn-ghost flex items-center gap-1.5 text-xs">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Left: Input Panel */}
        <div className={cn(
          'flex flex-col border-r border-surface-500/30 transition-all duration-300',
          result ? 'w-[42%]' : 'w-full'
        )}>
          {/* Task selector */}
          <div className="flex gap-1.5 px-4 py-3 border-b border-surface-500/30 flex-shrink-0 overflow-x-auto">
            {TASKS.map(t => (
              <button
                key={t.id}
                onClick={() => setTask(t.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all whitespace-nowrap',
                  task === t.id
                    ? t.activeColor
                    : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-surface-600/50'
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Task description */}
          <div className={cn(
            'flex items-center gap-2 px-4 py-2 text-xs border-b border-surface-500/20 flex-shrink-0',
            activeTask.color
          )}>
            {activeTask.icon}
            <span className="text-gray-400">{activeTask.description}</span>
          </div>

          {/* Language selector + stats */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-surface-500/30 bg-surface-800/30 flex-shrink-0">
            <div className="relative">
              <button
                onClick={() => setLangDropdown(d => !d)}
                className="flex items-center gap-1.5 text-xs font-mono text-gray-300 bg-surface-600/60 hover:bg-surface-500/60 border border-surface-400/40 px-3 py-1.5 rounded-lg transition-colors"
              >
                {language}
                <ChevronDown className={cn('w-3 h-3 text-gray-500 transition-transform', langDropdown && 'rotate-180')} />
              </button>
              {langDropdown && (
                <div className="absolute top-full left-0 mt-1 w-40 glass rounded-xl border border-surface-400/40 shadow-2xl z-20 py-1 max-h-64 overflow-y-auto">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang}
                      onClick={() => { setLanguage(lang); setLangDropdown(false); }}
                      className={cn(
                        'w-full text-left px-3 py-1.5 text-xs hover:bg-surface-600/60 transition-colors',
                        language === lang ? 'text-brand-300 font-medium' : 'text-gray-400'
                      )}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {code && (
              <div className="flex items-center gap-3 text-xs text-gray-600 ml-auto">
                <span>{lineCount} lines</span>
                <span>·</span>
                <span>{charCount} chars</span>
              </div>
            )}
          </div>

          {/* Code input */}
          <div className="flex-1 relative overflow-hidden">
            {/* Line numbers */}
            <div className="absolute left-0 top-0 bottom-0 w-10 bg-surface-800/50 border-r border-surface-500/20 flex flex-col pt-4 overflow-hidden select-none pointer-events-none">
              {Array.from({ length: Math.max(lineCount, 20) }, (_, i) => (
                <div key={i} className="text-xs font-mono text-gray-700 text-right pr-2.5 leading-6 flex-shrink-0">
                  {i + 1}
                </div>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              value={code}
              onChange={e => setCode(e.target.value)}
              className="absolute inset-0 bg-transparent text-sm font-mono text-gray-200 leading-6 resize-none focus:outline-none pl-12 pr-4 pt-4 pb-4 placeholder-gray-700"
              placeholder={`// Paste your ${language} code here...\n// Supports any language, framework, or snippet`}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
            />
          </div>

          {/* Analyze button */}
          <div className="px-4 py-3 border-t border-surface-500/30 bg-surface-800/30 flex items-center gap-3 flex-shrink-0">
            <button
              onClick={handleAnalyze}
              disabled={loading || !code.trim()}
              className={cn(
                'flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed',
                'bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white shadow-lg shadow-brand-500/20'
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run {activeTask.label}
                </>
              )}
            </button>
            {!apiKey && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> No API key — add one in Settings
              </p>
            )}
          </div>
        </div>

        {/* Right: Result Panel */}
        {(result || loading) && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Result header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-surface-500/30 bg-surface-800/30 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span className="text-sm font-medium text-gray-200">
                  {loading ? 'Analyzing...' : `${activeTask.label} Results`}
                </span>
                {!loading && (
                  <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', activeTask.activeColor)}>
                    {language}
                  </span>
                )}
              </div>
              {result && (
                <button
                  onClick={handleCopyResult}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 bg-surface-600/50 hover:bg-surface-500/60 border border-surface-400/40 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {copiedResult ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedResult ? 'Copied' : 'Copy all'}
                </button>
              )}
            </div>

            {/* Result content */}
            <div className="flex-1 overflow-y-auto p-5">
              {loading && !result && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-2 border-brand-500/20 animate-ping" />
                    <div className="w-12 h-12 rounded-full bg-brand-500/10 border border-brand-500/30 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Gemini is analyzing your code</p>
                    <p className="text-xs text-gray-600 mt-1">This may take a few seconds...</p>
                  </div>
                </div>
              )}

              {parsedResult.length > 0 && (
                <div className="space-y-2">
                  {parsedResult.map((part, i) =>
                    part.type === 'code' ? (
                      <CodeBlock
                        key={i}
                        code={part.content}
                        language={part.language}
                        className="my-3"
                      />
                    ) : (
                      <MarkdownText key={i} text={part.content} />
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state when no result yet */}
        {!result && !loading && (
          <div className="hidden lg:flex flex-1 items-center justify-center">
            <div className="text-center max-w-xs">
              <div className="w-16 h-16 rounded-2xl bg-surface-700/40 border border-surface-500/30 flex items-center justify-center mx-auto mb-4">
                <Terminal className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Results appear here</h3>
              <p className="text-xs text-gray-700">Paste code on the left, choose a task, and click Run</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
