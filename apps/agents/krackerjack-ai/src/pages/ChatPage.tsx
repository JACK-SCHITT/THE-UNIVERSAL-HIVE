import { useState, useRef, useEffect } from 'react';
import { useHive } from '@/hooks/useHive';
import { generateId } from '@/lib/utils';
import type { HiveAgent } from '@/types';
import { Send, Zap } from 'lucide-react';
import { HIVE_NODES } from '@/constants/defaultSoulData';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  agent?: HiveAgent;
  timestamp: string;
  engine?: string;
  streaming?: boolean;
}

const EDGE_FN_URL = `${(import.meta.env.VITE_SUPABASE_URL || (typeof location!=="undefined"?location.origin:""))}/functions/v1/hive-chat`;
const ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || "hive-anon-key");

export function ChatPage() {
  const { grokKey } = useHive();
  const [activeAgent, setActiveAgent] = useState<HiveAgent>('krackerjack');
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateId(),
      role: 'agent',
      content: 'KRACKERJACK AI online. Architect mode active. All Hive nodes operational. What do you need?',
      agent: 'krackerjack',
      timestamp: new Date().toLocaleTimeString(),
      engine: 'ready',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const getNodeInfo = (id: HiveAgent) => HIVE_NODES.find(n => n.id === id) || HIVE_NODES[0];

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString(),
    };
    const newHistory = [...history, { role: 'user' as const, content: input }];
    setHistory(newHistory);
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Create a placeholder streaming message
    const streamId = generateId();
    const node = getNodeInfo(activeAgent);
    setMessages(prev => [...prev, {
      id: streamId,
      role: 'agent',
      content: '',
      agent: activeAgent,
      timestamp: new Date().toLocaleTimeString(),
      engine: activeAgent === 'grok' || grokKey ? 'grok-3' : 'gemini-3-flash',
      streaming: true,
    }]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch(EDGE_FN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
        },
        body: JSON.stringify({
          messages: newHistory,
          agent: activeAgent,
          grokKey: grokKey || undefined,
          stream: true,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        setMessages(prev => prev.map(m => m.id === streamId
          ? { ...m, content: `[ERROR] ${errText}`, streaming: false }
          : m));
        setLoading(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') continue;

          try {
            const parsed = JSON.parse(raw);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              setMessages(prev => prev.map(m => m.id === streamId
                ? { ...m, content: fullText }
                : m));
            }
          } catch (_) {
            // skip malformed chunks
          }
        }
      }

      // Finalize
      setMessages(prev => prev.map(m => m.id === streamId
        ? { ...m, streaming: false }
        : m));

      if (fullText) {
        setHistory(prev => [...prev, { role: 'assistant', content: fullText }]);
      }

    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') {
        setMessages(prev => prev.map(m => m.id === streamId
          ? { ...m, content: m.content || '[Cancelled]', streaming: false }
          : m));
      } else {
        setMessages(prev => prev.map(m => m.id === streamId
          ? { ...m, content: `[ERROR] ${String(err)}`, streaming: false }
          : m));
      }
    }

    setLoading(false);
  };

  const stopStream = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const clearChat = () => {
    setHistory([]);
    const currentNode = getNodeInfo(activeAgent);
    setMessages([{
      id: generateId(), role: 'agent',
      content: `${currentNode.name} online. How can I assist, Architect?`,
      agent: activeAgent, timestamp: new Date().toLocaleTimeString(),
    }]);
  };

  const currentNode = getNodeInfo(activeAgent);

  return (
    <div className="flex flex-col h-[calc(100vh-130px)]">
      {/* Agent Switcher */}
      <div className="flex overflow-x-auto gap-2 p-3 border-b border-hive-border bg-hive-dark no-scrollbar">
        {HIVE_NODES.filter(n => n.status !== 'PENDING').map(node => (
          <button
            key={node.id}
            onClick={() => { setActiveAgent(node.id as HiveAgent); clearChat(); }}
            className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-lg transition-all ${
              activeAgent === node.id ? 'bg-hive-card' : 'opacity-50 hover:opacity-80'
            }`}
            style={{ borderWidth: 1, borderColor: activeAgent === node.id ? node.color : '#222' }}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: node.color }} />
              <span className="font-mono text-[9px] font-bold tracking-wider" style={{ color: node.color }}>
                {node.id === 'krackerjack' ? 'KJ-AI' : node.name.split(' ')[0]}
              </span>
            </div>
            <span className="font-mono text-[8px] text-muted-foreground">{node.model}</span>
          </button>
        ))}
        <button onClick={clearChat} className="flex-shrink-0 px-3 py-2 rounded-lg border border-hive-border font-mono text-[9px] text-muted-foreground hover:border-red-500/40 hover:text-red-400 transition-colors">
          CLEAR
        </button>
      </div>

      {/* Active Agent Banner */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-hive-border" style={{ background: `${currentNode.color}08` }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full pulse-gold" style={{ background: currentNode.color }} />
          <span className="font-mono text-[10px] font-bold tracking-wider" style={{ color: currentNode.color }}>{currentNode.name}</span>
          <span className="font-mono text-[10px] text-muted-foreground">— {currentNode.role}</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap size={9} className="text-terminal-green" />
          <span className="font-mono text-[9px] text-terminal-green">STREAM</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => {
          const node = msg.agent ? getNodeInfo(msg.agent) : null;
          return (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                {msg.role === 'agent' && node && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: node.color }} />
                    <span className="font-mono text-[9px] tracking-wider" style={{ color: node.color }}>{node.name}</span>
                    <span className="font-mono text-[9px] text-muted-foreground">{msg.timestamp}</span>
                    {msg.engine && <span className="font-mono text-[8px] text-muted-foreground/50">· {msg.engine}</span>}
                  </div>
                )}
                <div
                  className={`rounded-lg px-3.5 py-2.5 font-mono text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-gold/10 border border-gold/20 text-gold/90 rounded-tr-sm'
                      : 'bg-hive-card border border-hive-border text-gray-200 rounded-tl-sm'
                  }`}
                  style={msg.role === 'agent' && node ? { borderColor: `${node.color}22` } : {}}
                >
                  {msg.content}
                  {msg.streaming && (
                    <span className="inline-block w-1.5 h-3.5 bg-current ml-0.5 animate-pulse align-middle" />
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="text-right mt-1">
                    <span className="font-mono text-[9px] text-muted-foreground">{msg.timestamp}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-hive-border p-3 bg-hive-dark">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${currentNode.name}...`}
            rows={1}
            className="flex-1 bg-hive-card border border-hive-border rounded-lg px-3 py-2.5 font-mono text-xs text-gray-200 outline-none focus:border-gold/40 resize-none transition-colors"
            style={{ minHeight: 44 }}
          />
          {loading ? (
            <button
              onClick={stopStream}
              className="px-3.5 rounded-lg flex items-center justify-center transition-all bg-red-500/80"
            >
              <span className="text-white font-bold text-xs">■</span>
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-3.5 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
              style={{ background: currentNode.color }}
            >
              <Send size={15} className="text-hive-black" />
            </button>
          )}
        </div>
        <p className="font-mono text-[9px] text-muted-foreground/50 mt-1.5 text-center">
          Live streaming · Red button to stop · Grok key in CONFIG for xAI mode
        </p>
      </div>
    </div>
  );
}
