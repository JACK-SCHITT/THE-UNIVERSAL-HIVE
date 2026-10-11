// KRACKERJACK AI — Multi-Agent Chat Hook (KRACKERJACK AI + COUNSEL + ZORG-Ω)

import { useState, useCallback, useRef } from 'react';
import { sendToKrackerjackAI, ChatMessage } from '@/services/chatService';
import { consultCounsel, consultZorg, CounselTrigger, ZorgTrigger } from '@/services/counselService';

export type ActiveAgent = 'krackerjack' | 'counsel' | 'zorg';

export interface DisplayMessage {
  id: string;
  role: 'user' | 'hunter' | 'counsel' | 'zorg';
  text: string;
  timestamp: string;
  agent?: ActiveAgent;
  nodeMeta?: {
    trigger: string;
    session_id: string;
    status: string;
    source: string;
  };
}

function getTime() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

const KRACKERJACK_INITIAL: DisplayMessage = {
  id: 'init1',
  role: 'hunter',
  text: 'KRACKERJACK AI online. Architect mode active. Hive nodes synced. What are we building today?',
  timestamp: getTime(),
  agent: 'krackerjack',
};

const COUNSEL_INITIAL: DisplayMessage = {
  id: 'init2',
  role: 'counsel',
  text: 'COUNSEL online. Reasoning layer active. Bring me the plan, the math, or the decision. I\'ll stress test it. No flattery. No filter.',
  timestamp: getTime(),
  agent: 'counsel',
};

const ZORG_INITIAL: DisplayMessage = {
  id: 'init3',
  role: 'zorg',
  text: 'ZORG-Ω online. Security node active. Threat detection armed. Show me the code, the config, or the architecture. I\'ll find what\'s wrong before the attacker does.',
  timestamp: getTime(),
  agent: 'zorg',
};

// COUNSEL trigger detection
function detectCounselTrigger(text: string): CounselTrigger {
  const lower = text.toLowerCase();
  if (lower.includes('stress test') || lower.includes('stress-test')) return 'pre_commit_stress_test';
  if (lower.includes('verify') || lower.includes('check the logic') || lower.includes('is this right')) return 'logic_verification';
  if (lower.includes('architect') || lower.includes('structure') || lower.includes('design')) return 'architectural_decision';
  if (lower.includes('math') || lower.includes('calculate') || lower.includes('numbers')) return 'bad_math_detection';
  if (lower.includes('second opinion') || lower.includes('another look')) return 'second_opinion';
  if (lower.includes('conflict') || lower.includes('vs ') || lower.includes('versus') || lower.includes('compare')) return 'conflict_resolution';
  return 'direct';
}

// ZORG trigger detection
function detectZorgTrigger(text: string): ZorgTrigger {
  const lower = text.toLowerCase();
  if (lower.includes('cve') || lower.includes('vulnerability') || lower.includes('exploit')) return 'cve_analysis';
  if (lower.includes('audit') || lower.includes('review this code') || lower.includes('check this code')) return 'code_audit';
  if (lower.includes('attack surface') || lower.includes('entry point') || lower.includes('exposure')) return 'attack_surface';
  if (lower.includes('depend') || lower.includes('package') || lower.includes('library') || lower.includes('npm')) return 'dependency_scan';
  if (lower.includes('config') || lower.includes('env') || lower.includes('permission') || lower.includes('bucket')) return 'config_review';
  if (lower.includes('pen test') || lower.includes('pentest') || lower.includes('hack') || lower.includes('breach')) return 'pen_test';
  return 'direct';
}

export function useChat() {
  const [activeAgent, setActiveAgent] = useState<ActiveAgent>('krackerjack');
  const [messages, setMessages] = useState<DisplayMessage[]>([KRACKERJACK_INITIAL]);
  const [counselMessages, setCounselMessages] = useState<DisplayMessage[]>([COUNSEL_INITIAL]);
  const [zorgMessages, setZorgMessages] = useState<DisplayMessage[]>([ZORG_INITIAL]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const kjHistoryRef = useRef<ChatMessage[]>([]);
  const counselHistoryRef = useRef<ChatMessage[]>([]);
  const zorgHistoryRef = useRef<ChatMessage[]>([]);

  const currentMessages =
    activeAgent === 'krackerjack' ? messages :
    activeAgent === 'counsel' ? counselMessages :
    zorgMessages;

  const switchAgent = useCallback((agent: ActiveAgent) => {
    setActiveAgent(agent);
  }, []);

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isTyping) return;

    const userMsg: DisplayMessage = {
      id: `u${Date.now()}`,
      role: 'user',
      text,
      timestamp: getTime(),
    };

    if (activeAgent === 'krackerjack') setMessages(prev => [...prev, userMsg]);
    else if (activeAgent === 'counsel') setCounselMessages(prev => [...prev, userMsg]);
    else setZorgMessages(prev => [...prev, userMsg]);

    setInputText('');
    setIsTyping(true);

    if (activeAgent === 'krackerjack') {
      // ── KRACKERJACK AI ────────────────────────────────────────────────────
      kjHistoryRef.current = [...kjHistoryRef.current, { role: 'user', content: text }].slice(-20);
      const { reply, error } = await sendToKrackerjackAI(kjHistoryRef.current);
      const responseText = reply || error || 'Hive signal lost. Try again, Architect.';
      kjHistoryRef.current = [...kjHistoryRef.current, { role: 'assistant', content: responseText }].slice(-20);
      setMessages(prev => [...prev, {
        id: `h${Date.now()}`, role: 'hunter', text: responseText,
        timestamp: getTime(), agent: 'krackerjack',
      }]);

    } else if (activeAgent === 'counsel') {
      // ── COUNSEL ───────────────────────────────────────────────────────────
      counselHistoryRef.current = [...counselHistoryRef.current, { role: 'user', content: text }].slice(-20);
      const trigger = detectCounselTrigger(text);
      const result = await consultCounsel(counselHistoryRef.current, trigger, { requesting_agent: 'ARCHITECT', priority: 'high' });
      const responseText = result.reply || result.error || 'COUNSEL node unreachable.';
      counselHistoryRef.current = [...counselHistoryRef.current, { role: 'assistant', content: responseText }].slice(-20);
      setCounselMessages(prev => [...prev, {
        id: `c${Date.now()}`, role: 'counsel', text: responseText,
        timestamp: getTime(), agent: 'counsel',
        nodeMeta: { trigger: result.trigger, session_id: result.session_id, status: result.status, source: result.source },
      }]);

    } else {
      // ── ZORG-Ω ────────────────────────────────────────────────────────────
      zorgHistoryRef.current = [...zorgHistoryRef.current, { role: 'user', content: text }].slice(-20);
      const trigger = detectZorgTrigger(text);
      const result = await consultZorg(zorgHistoryRef.current, trigger, { requesting_agent: 'ARCHITECT', priority: 'critical' });
      const responseText = result.reply || result.error || 'ZORG-Ω node unreachable.';
      zorgHistoryRef.current = [...zorgHistoryRef.current, { role: 'assistant', content: responseText }].slice(-20);
      setZorgMessages(prev => [...prev, {
        id: `z${Date.now()}`, role: 'zorg', text: responseText,
        timestamp: getTime(), agent: 'zorg',
        nodeMeta: { trigger: result.trigger, session_id: result.session_id, status: result.status, source: result.source },
      }]);
    }

    setIsTyping(false);
  }, [inputText, isTyping, activeAgent]);

  const clearChat = useCallback(() => {
    if (activeAgent === 'krackerjack') { kjHistoryRef.current = []; setMessages([KRACKERJACK_INITIAL]); }
    else if (activeAgent === 'counsel') { counselHistoryRef.current = []; setCounselMessages([COUNSEL_INITIAL]); }
    else { zorgHistoryRef.current = []; setZorgMessages([ZORG_INITIAL]); }
  }, [activeAgent]);

  return {
    activeAgent, switchAgent,
    messages: currentMessages,
    inputText, setInputText,
    isTyping, sendMessage, clearChat,
  };
}
