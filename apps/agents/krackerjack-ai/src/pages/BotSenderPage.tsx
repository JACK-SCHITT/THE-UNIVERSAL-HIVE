import { useState, useCallback } from 'react';
import { useHive } from '@/hooks/useHive';
import { supabase } from '@/lib/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Send, MessageSquare, CheckCircle, XCircle, Clock, Plus, ChevronDown } from 'lucide-react';
import type { BotMessage, VaultToken } from '@/types';
import { generateId } from '@/lib/utils';

type BotPlatform = 'telegram' | 'discord';

const PLATFORMS = [
  {
    id: 'telegram' as BotPlatform,
    label: 'Telegram',
    icon: '✈️',
    color: '#229ED9',
    placeholder: 'Bot token from @BotFather (1234567890:AAFxxx...)',
    chatPlaceholder: 'Chat ID (e.g. -1001234567890 for group)',
    hint: 'Get bot token from @BotFather · Chat ID: forward message to @userinfobot',
  },
  {
    id: 'discord' as BotPlatform,
    label: 'Discord',
    icon: '🎮',
    color: '#5865F2',
    placeholder: 'Bot token OR webhook URL (https://discord.com/api/webhooks/...)',
    chatPlaceholder: 'Channel ID (only needed for bot token mode)',
    hint: 'Discord Developer Portal → Bot → Token · OR copy webhook URL from channel settings',
  },
];

const MESSAGE_TEMPLATES = [
  { label: '🔔 Status Update', text: '⚡ *HIVE-OS STATUS UPDATE*\n\nAll nodes operational. Architect mode active.\nTimestamp: ' + new Date().toLocaleString() },
  { label: '🚨 Alert', text: '🚨 *HIVE ALERT*\n\nCritical notification from the Architect.\nAction required.' },
  { label: '✅ Deploy Success', text: '✅ *DEPLOYMENT SUCCESSFUL*\n\nAll services online. Health checks passing.\nHive-OS v3.0 running.' },
  { label: '📊 Daily Report', text: '📊 *DAILY HIVE REPORT*\n\nSystems checked. No anomalies detected.\nProtocol: ASSIMILATE OR DIE\nPath: LEAST TRAVELED' },
  { label: '🔒 Security Notice', text: '🔒 *AEGIS SECURITY NOTICE*\n\nRoutine security scan complete. No threats detected.\nHardening protocols active.' },
];

export function BotSenderPage() {
  const { vault } = useHive();
  const [platform, setPlatform] = useState<BotPlatform>('telegram');
  const [selectedVaultToken, setSelectedVaultToken] = useState<string>('');
  const [manualToken, setManualToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [message, setMessage] = useState('');
  const [embedTitle, setEmbedTitle] = useState('');
  const [useEmbed, setUseEmbed] = useState(false);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<BotMessage[]>([]);
  const [showVaultMenu, setShowVaultMenu] = useState(false);

  // Get bot tokens from vault
  const vaultBotTokens = vault.filter(t => t.category === 'bot' && t.active);
  const selectedVaultEntry = vaultBotTokens.find(t => t.id === selectedVaultToken);
  const effectiveToken = selectedVaultEntry?.value || manualToken;

  const platformInfo = PLATFORMS.find(p => p.id === platform)!;

  const handleSend = useCallback(async () => {
    if (!effectiveToken.trim()) { toast.error('Enter or select a bot token'); return; }
    if (!message.trim()) { toast.error('Message cannot be empty'); return; }
    if (platform === 'telegram' && !chatId.trim()) { toast.error('Chat ID required for Telegram'); return; }

    setSending(true);
    const msgId = generateId();

    const pending: BotMessage = {
      id: msgId,
      platform,
      tokenLabel: selectedVaultEntry?.label || 'Manual Token',
      chatId: chatId || 'webhook',
      message: message.trim(),
      status: 'pending',
      timestamp: new Date().toLocaleTimeString(),
    };
    setHistory(prev => [pending, ...prev]);

    const { data, error } = await supabase.functions.invoke('bot-sender', {
      body: {
        platform,
        botToken: effectiveToken.trim(),
        chatId: chatId.trim() || undefined,
        message: message.trim(),
        embedTitle: useEmbed && embedTitle ? embedTitle : undefined,
        embedColor: '#f5a623',
        username: 'HIVE-OS',
      },
    });

    if (error) {
      let msg = error.message;
      if (error instanceof FunctionsHttpError) {
        try { msg = await error.context.text(); } catch (_) {}
      }
      setHistory(prev => prev.map(m => m.id === msgId ? { ...m, status: 'error', response: msg } : m));
      toast.error(`Send failed: ${msg}`);
    } else {
      setHistory(prev => prev.map(m => m.id === msgId ? {
        ...m, status: 'sent',
        response: `Message ID: ${data?.messageId || 'sent'}`,
      } : m));
      toast.success(`Sent via ${platformInfo.label} ✓`);
    }

    setSending(false);
  }, [effectiveToken, platform, chatId, message, embedTitle, useEmbed, selectedVaultEntry, platformInfo]);

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-130px)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Header */}
        <div>
          <h2 className="font-mono text-sm font-bold tracking-widest" style={{ color: '#00d4ff', textShadow: '0 0 10px #00d4ff55' }}>
            📡 BOT BROADCAST
          </h2>
          <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
            Send messages via Telegram & Discord bot tokens
          </p>
        </div>

        {/* Platform Switcher */}
        <div className="flex gap-3">
          {PLATFORMS.map(p => (
            <button key={p.id} onClick={() => setPlatform(p.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-mono text-xs font-bold tracking-wider transition-all ${
                platform === p.id ? 'border-2' : 'border border-hive-border text-muted-foreground opacity-60'
              }`}
              style={platform === p.id ? { borderColor: p.color, color: p.color, background: `${p.color}12` } : {}}>
              <span className="text-base">{p.icon}</span>
              {p.label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Token selection */}
        <div>
          <div className="font-mono text-[10px] text-muted-foreground tracking-wider mb-2">BOT TOKEN</div>

          {/* Vault token picker */}
          {vaultBotTokens.length > 0 && (
            <div className="relative mb-2">
              <button onClick={() => setShowVaultMenu(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-hive-border bg-hive-card hover:border-neon-blue/30 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: platformInfo.color }} />
                  <span className="font-mono text-xs text-gray-300">
                    {selectedVaultEntry ? selectedVaultEntry.label : 'Select from Vault'}
                  </span>
                </div>
                <ChevronDown size={13} className={`text-muted-foreground transition-transform ${showVaultMenu ? 'rotate-180' : ''}`} />
              </button>
              {showVaultMenu && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-hive-dark border border-hive-border rounded-lg overflow-hidden shadow-2xl">
                  <button onClick={() => { setSelectedVaultToken(''); setShowVaultMenu(false); }}
                    className="w-full px-3 py-2.5 text-left font-mono text-xs text-muted-foreground hover:bg-hive-card border-b border-hive-border">
                    Manual / enter below
                  </button>
                  {vaultBotTokens.map(t => (
                    <button key={t.id} onClick={() => { setSelectedVaultToken(t.id); setShowVaultMenu(false); }}
                      className={`w-full px-3 py-2.5 text-left hover:bg-hive-card border-b border-hive-border last:border-0 transition-colors ${selectedVaultToken === t.id ? 'bg-hive-card border-l-2 border-l-neon-blue' : ''}`}>
                      <div className="font-mono text-xs text-gray-200">{t.label}</div>
                      {t.meta?.username && <div className="font-mono text-[9px] text-muted-foreground">@{t.meta.username}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!selectedVaultEntry && (
            <input
              value={manualToken}
              onChange={e => setManualToken(e.target.value)}
              placeholder={platformInfo.placeholder}
              className="w-full bg-hive-card border border-hive-border rounded-lg px-3 py-2.5 font-mono text-xs text-gray-200 outline-none focus:border-gold/40"
            />
          )}

          <p className="font-mono text-[9px] text-muted-foreground/60 mt-1.5 leading-relaxed">{platformInfo.hint}</p>
        </div>

        {/* Chat ID (Telegram required / Discord optional) */}
        <div>
          <div className="font-mono text-[10px] text-muted-foreground tracking-wider mb-2">
            CHAT / CHANNEL ID {platform === 'telegram' ? '(REQUIRED)' : '(OPTIONAL for webhook)'}
          </div>
          <input
            value={chatId}
            onChange={e => setChatId(e.target.value)}
            placeholder={platformInfo.chatPlaceholder}
            className="w-full bg-hive-card border border-hive-border rounded-lg px-3 py-2.5 font-mono text-xs text-gray-200 outline-none focus:border-gold/40"
          />
        </div>

        {/* Discord embed toggle */}
        {platform === 'discord' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-mono text-[10px] text-muted-foreground tracking-wider">SEND AS EMBED</div>
              <button onClick={() => setUseEmbed(v => !v)}
                className={`relative w-10 h-5 rounded-full transition-colors ${useEmbed ? 'bg-gold' : 'bg-hive-border'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-hive-black transition-all ${useEmbed ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
            {useEmbed && (
              <input value={embedTitle} onChange={e => setEmbedTitle(e.target.value)}
                placeholder="Embed title (e.g. HIVE STATUS UPDATE)"
                className="w-full bg-hive-card border border-hive-border rounded-lg px-3 py-2.5 font-mono text-xs text-gray-200 outline-none focus:border-gold/40" />
            )}
          </div>
        )}

        {/* Templates */}
        <div>
          <div className="font-mono text-[10px] text-muted-foreground tracking-wider mb-2">QUICK TEMPLATES</div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {MESSAGE_TEMPLATES.map(t => (
              <button key={t.label} onClick={() => setMessage(t.text)}
                className="flex-shrink-0 px-3 py-2 rounded border border-hive-border font-mono text-[10px] text-muted-foreground hover:border-gold/40 hover:text-gold transition-colors whitespace-nowrap">
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <div className="font-mono text-[10px] text-muted-foreground tracking-wider mb-2">MESSAGE</div>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type your message... Telegram supports *bold*, _italic_, `code`"
            rows={5}
            className="w-full bg-hive-card border border-hive-border rounded-lg px-3 py-3 font-mono text-xs text-gray-200 outline-none focus:border-gold/40 resize-none leading-relaxed"
          />
          <div className="text-right font-mono text-[9px] text-muted-foreground/50 mt-1">{message.length} chars</div>
        </div>

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={sending || !message.trim() || !effectiveToken.trim()}
          className="w-full py-4 rounded-xl font-mono text-sm font-bold tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          style={{
            background: sending ? '#333' : `linear-gradient(90deg, ${platformInfo.color}, ${platformInfo.color}99)`,
            color: '#fff'
          }}
        >
          <Send size={16} />
          {sending ? 'SENDING...' : `BROADCAST · ${platformInfo.icon} ${platformInfo.label.toUpperCase()}`}
        </button>

        {/* Add to vault CTA */}
        <div className="text-center">
          <p className="font-mono text-[9px] text-muted-foreground/50">
            Store bot tokens permanently in CONFIG → VAULT (category: bot)
          </p>
        </div>

        {/* Send History */}
        {history.length > 0 && (
          <div>
            <div className="font-mono text-[10px] text-muted-foreground tracking-wider mb-2">SEND LOG</div>
            <div className="space-y-2">
              {history.map(msg => (
                <div key={msg.id} className="hive-card rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {msg.status === 'sent' && <CheckCircle size={14} className="text-terminal-green" />}
                      {msg.status === 'error' && <XCircle size={14} className="text-red-400" />}
                      {msg.status === 'pending' && <Clock size={14} className="text-gold animate-pulse" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-mono text-[9px] font-bold" style={{ color: msg.platform === 'telegram' ? '#229ED9' : '#5865F2' }}>
                          {msg.platform.toUpperCase()}
                        </span>
                        <span className="font-mono text-[9px] text-muted-foreground">{msg.tokenLabel}</span>
                        <span className="font-mono text-[9px] text-muted-foreground">{msg.timestamp}</span>
                      </div>
                      <p className="font-mono text-[10px] text-gray-300 line-clamp-2">{msg.message}</p>
                      {msg.response && (
                        <p className={`font-mono text-[9px] mt-1 ${msg.status === 'sent' ? 'text-terminal-green' : 'text-red-400'}`}>
                          {msg.response}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
