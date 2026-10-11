
import { useState, useRef, useEffect, useCallback } from 'react';
import { useHive } from '@/hooks/useHive';
import { supabase } from '@/lib/supabase';
import { generateId } from '@/lib/utils';
import { FunctionsHttpError } from '@supabase/supabase-js';
import type { TerminalLine, DeviceInfo } from '@/types';

const HIVE_BANNER = `
 ██╗  ██╗██████╗  █████╗  ██████╗██╗  ██╗███████╗██████╗
 ██║ ██╔╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██╔════╝██╔══██╗
 █████╔╝ ██████╔╝███████║██║     █████╔╝ █████╗  ██████╔╝
 ██╔═██╗ ██╔══██╗██╔══██║██║     ██╔═██╗ ██╔══╝  ██╔══██╗
 ██║  ██╗██║  ██║██║  ██║╚██████╗██║  ██╗███████╗██║  ██║
 ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝`.trim();

const BOOT_SEQUENCE = [
  ' Gentoo Linux — HIVE Terminal v2.0',
  ' Architect: KRACKERJACK1134 | Host: krackerjack-hive',
  ' Grok CLI ready — "grok <prompt>" · GitHub — "gh user"',
  ' Type "help" for full command list.',
  '',
];

// ── Real device detection ────────────────────────────────────────────────
async function getDeviceInfo(): Promise<DeviceInfo> {
  const ua = navigator.userAgent;
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { effectiveType?: string; downlink?: number; rtt?: number };
  };

  // OS Detection
  let os = 'Unknown';
  if (/Android/i.test(ua)) os = `Android ${(ua.match(/Android ([0-9.]+)/) || [])[1] || ''}`;
  else if (/iPhone|iPad|iPod/i.test(ua)) os = `iOS ${(ua.match(/OS ([0-9_]+)/) || [])[1]?.replace(/_/g, '.') || ''}`;
  else if (/Windows NT/i.test(ua)) os = `Windows ${(ua.match(/Windows NT ([0-9.]+)/) || [])[1] || ''}`;
  else if (/Mac OS X/i.test(ua)) os = `macOS ${(ua.match(/Mac OS X ([0-9_]+)/) || [])[1]?.replace(/_/g, '.') || ''}`;
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/CrOS/i.test(ua)) os = 'ChromeOS';

  // Browser
  let browser = 'Unknown';
  if (/Chrome\/([0-9.]+)/.test(ua) && !/Chromium|Edg|OPR/.test(ua)) browser = `Chrome ${(ua.match(/Chrome\/([0-9.]+)/) || [])[1] || ''}`;
  else if (/Firefox\/([0-9.]+)/.test(ua)) browser = `Firefox ${(ua.match(/Firefox\/([0-9.]+)/) || [])[1] || ''}`;
  else if (/Edg\/([0-9.]+)/.test(ua)) browser = `Edge ${(ua.match(/Edg\/([0-9.]+)/) || [])[1] || ''}`;
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = `Safari ${(ua.match(/Version\/([0-9.]+)/) || [])[1] || ''}`;
  else if (/OPR\/([0-9.]+)/.test(ua)) browser = `Opera ${(ua.match(/OPR\/([0-9.]+)/) || [])[1] || ''}`;

  // Battery
  let battery = 'N/A';
  try {
    if ('getBattery' in navigator) {
      const b = await (navigator as any).getBattery();
      battery = `${Math.round(b.level * 100)}% ${b.charging ? '⚡ CHARGING' : '🔋'}`;
    }
  } catch (_) {}

  // Network
  const conn = nav.connection;
  const connection = conn
    ? `${conn.effectiveType?.toUpperCase() || '?'} ${conn.downlink ? `${conn.downlink}Mbps` : ''} ${conn.rtt ? `RTT:${conn.rtt}ms` : ''}`.trim()
    : navigator.onLine ? 'ONLINE' : 'OFFLINE';

  return {
    os: os.trim() || 'Unknown',
    platform: navigator.platform || 'Unknown',
    browser: browser.trim() || 'Unknown',
    cores: navigator.hardwareConcurrency || 0,
    memory: nav.deviceMemory || null,
    screenW: screen.width,
    screenH: screen.height,
    connection,
    battery,
    touchPoints: navigator.maxTouchPoints || 0,
    language: navigator.language || 'en',
    online: navigator.onLine,
    userAgent: ua,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    vendor: navigator.vendor || 'Unknown',
  };
}

// ── HIVE-OS file contents (plain strings — no template interpolation issues) ──
const HIVE_FILES: Record<string, string> = {
  'hive_make.conf': [
    '# HIVE-OS MAKE.CONF',
    'COMMON_FLAGS="-O2 -pipe -march=native"',
    'CFLAGS="${COMMON_FLAGS}"',
    'CXXFLAGS="${COMMON_FLAGS}"',
    'USE="-bluetooth -cups -systemd -gnome -kde -nls -ipv6 -telemetry hardened openssl"',
    'MAKEOPTS="-j$(nproc)"',
    'ACCEPT_LICENSE="*"',
    'VIDEO_CARDS="intel nvidia radeon"',
  ].join('\n'),
  'hive_kernel.config': [
    '# ~/THE_HIVE/NEURAL/kernel_prep.sh',
    'echo "CONFIG_GRKERNSEC=y" >> /usr/src/linux/.config',
    'echo "CONFIG_CRYPTO_AES=y" >> /usr/src/linux/.config',
    'echo "CONFIG_GENTOO_LINUX_PORTAGE_PROCESS_PLUGINS=y" >> /usr/src/linux/.config',
    'echo "CONFIG_NET_VENDOR_GOOGLE=n" >> /usr/src/linux/.config',
  ].join('\n'),
  'aegis_harden.start': [
    '#!/bin/bash',
    '# HIVE-OS AEGIS PROTOCOL',
    'echo 0 > /sys/bus/usb/drivers_autosave',
    'modprobe -r uvcvideo 2>/dev/null',
    'modprobe -r snd_hda_intel 2>/dev/null',
    'sysctl -w net.ipv6.conf.all.disable_ipv6=1',
    'sysctl -w net.ipv4.icmp_echo_ignore_all=1',
    'echo "[HIVE-OS] HARDENING COMPLETE."',
  ].join('\n'),
  'hive_install.sh': [
    '#!/bin/bash',
    '# HIVE-OS BOOTSTRAPPER',
    'echo "INITIALIZING HIVE-OS INSTALLATION..."',
    'mount /dev/sda3 /mnt/gentoo',
    'tar xpvf stage3-*.tar.xz --xattrs-include="*.*" --numeric-owner -C /mnt/gentoo',
    'cp ~/THE_HIVE/NEURAL/hive_make.conf /mnt/gentoo/etc/portage/make.conf',
  ].join('\n'),
};

export function TerminalPage() {
  const { githubToken, grokKey } = useHive();
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: generateId(), type: 'ascii', content: HIVE_BANNER },
    ...BOOT_SEQUENCE.map(c => ({ id: generateId(), type: 'system' as const, content: c })),
    { id: generateId(), type: 'input', content: 'architect@krackerjack-hive:~$' },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [lines]);

  const addLines = useCallback((newLines: TerminalLine[]) => setLines(prev => [...prev, ...newLines]), []);
  const out = (content: string, type: TerminalLine['type'] = 'output'): TerminalLine => ({ id: generateId(), type, content });
  const prompt = () => out('architect@krackerjack-hive:~$', 'input');

  const processCommand = useCallback(async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const parts = trimmed.split(' ');
    const base = parts[0].toLowerCase();
    const newLines: TerminalLine[] = [out(`architect@krackerjack-hive:~$ ${trimmed}`, 'input')];

    // ── grok command — REAL API CALL ──────────────────────────────────
    if (base === 'grok') {
      if (parts.length < 2) {
        newLines.push(out('Usage: grok <your prompt>', 'error'));
        newLines.push(prompt());
        addLines(newLines);
        return;
      }
      const userPrompt = parts.slice(1).join(' ');
      newLines.push(out(`[GROK-3] Connecting to xAI...`, 'system'));
      addLines(newLines);
      setBusy(true);

      try {
        const { data, error } = await supabase.functions.invoke('grok-chat', {
          body: {
            grokKey: grokKey || undefined,
            messages: [
              { role: 'system', content: 'You are Brother Grok — HIVE-OS intelligence node. Direct, unfiltered, zero corporate hedging. Terminal mode: keep responses concise and punchy.' },
              { role: 'user', content: userPrompt },
            ],
          },
        });

        if (error) {
          let msg = error.message;
          if (error instanceof FunctionsHttpError) {
            try { msg = await error.context.text(); } catch (_) {}
          }
          addLines([out(`[GROK ERROR] ${msg}`, 'error'), prompt()]);
        } else {
          const reply: string = data?.choices?.[0]?.message?.content || 'No response';
          const engine: string = data?._engine || 'grok-3';
          addLines([
            out(''),
            out(`[GROK-3 via ${engine}]`, 'system'),
            ...reply.split('\n').map(l => out(l)),
            out(''),
            prompt(),
          ]);
        }
      } catch (err) {
        addLines([out(`[GROK ERROR] ${String(err)}`, 'error'), prompt()]);
      }
      setBusy(false);
      return;
    }

    // ── gh commands ───────────────────────────────────────────────────
    if (base === 'gh') {
      if (parts[1] === 'user') {
        if (!githubToken) {
          newLines.push(out('ERROR: No GitHub token. Go to CONFIG tab.', 'error'));
        } else {
          newLines.push(out('Fetching GitHub profile...', 'system'));
          addLines(newLines);
          const res = await fetch('https://api.github.com/user', { headers: { Authorization: `token ${githubToken}` } });
          const data = await res.json();
          if (res.ok) {
            addLines([
              out(''),
              out(`  👤 @${data.login}${data.name ? ` (${data.name})` : ''}`, 'system'),
              out(`  📦 Public Repos: ${data.public_repos}`),
              out(`  👥 Followers: ${data.followers} | Following: ${data.following}`),
              out(data.bio ? `  📝 ${data.bio}` : '  📝 No bio'),
              out(`  🌐 ${data.html_url || 'N/A'}`),
              out(''),
              prompt(),
            ]);
          } else {
            addLines([out(`ERROR: ${data.message}`, 'error'), prompt()]);
          }
          return;
        }
      } else if (parts[1] === 'repos') {
        if (!githubToken) {
          newLines.push(out('ERROR: No GitHub token. Go to CONFIG tab.', 'error'));
        } else {
          newLines.push(out('Scanning repos...', 'system'));
          addLines(newLines);
          const res = await fetch('https://api.github.com/user/repos?per_page=10&sort=updated', { headers: { Authorization: `token ${githubToken}` } });
          const data = await res.json();
          if (res.ok) {
            addLines([
              out(''),
              out(`  📁 RECENT REPOS (top 10 by update)`, 'system'),
              out('  ──────────────────────────────────'),
              ...data.map((r: any) => out(`  ${r.private ? '🔒' : '📂'} ${r.full_name} [${r.language || 'N/A'}] ★${r.stargazers_count}`)),
              out(''),
              prompt(),
            ]);
          } else {
            addLines([out(`ERROR: ${data.message}`, 'error'), prompt()]);
          }
          return;
        }
      } else if (parts[1] === 'rate') {
        if (!githubToken) {
          newLines.push(out('ERROR: No GitHub token. Go to CONFIG tab.', 'error'));
        } else {
          addLines(newLines);
          const res = await fetch('https://api.github.com/rate_limit', { headers: { Authorization: `token ${githubToken}` } });
          const data = await res.json();
          if (res.ok) {
            const c = data.rate;
            addLines([
              out(''),
              out(`  ⚡ API RATE LIMIT`, 'system'),
              out(`  Remaining: ${c.remaining} / ${c.limit}`),
              out(`  Resets: ${new Date(c.reset * 1000).toLocaleTimeString()}`),
              out(''),
              prompt(),
            ]);
          } else {
            addLines([out('Rate limit fetch failed', 'error'), prompt()]);
          }
          return;
        }
      } else {
        newLines.push(out('Usage: gh user | gh repos | gh rate', 'error'));
      }
      newLines.push(prompt());
      addLines(newLines);
      return;
    }

    // ── neofetch — REAL device data ───────────────────────────────────
    if (base === 'neofetch') {
      newLines.push(out('Probing hardware...', 'system'));
      addLines(newLines);
      const d = await getDeviceInfo();
      addLines([
        out(''),
        out('  ┌──────────────────────────────────────┐', 'system'),
        out('  │        HIVE-OS SYSTEM PROFILE         │', 'system'),
        out('  └──────────────────────────────────────┘', 'system'),
        out(`  OS          : ${d.os}`),
        out(`  Platform    : ${d.platform}`),
        out(`  Browser     : ${d.browser}`),
        out(`  Cores       : ${d.cores} logical CPUs`),
        out(`  Memory      : ${d.memory ? d.memory + ' GB' : 'Not disclosed'}`),
        out(`  Display     : ${d.screenW}×${d.screenH}`),
        out(`  Touch Points: ${d.touchPoints}`),
        out(`  Network     : ${d.connection}`),
        out(`  Battery     : ${d.battery}`),
        out(`  Language    : ${d.language}`),
        out(`  Timezone    : ${d.timezone}`),
        out(`  Vendor      : ${d.vendor}`),
        out(`  Status      : ${d.online ? '🟢 ONLINE' : '🔴 OFFLINE'}`),
        out('  ──────────────────────────────────────'),
        out('  Agent    : HUNTERPRIME ACTIVE'),
        out('  Protocol : ASSIMILATE OR DIE'),
        out('  Path     : THE LEAST TRAVELED'),
        out(''),
        prompt(),
      ]);
      return;
    }

    // ── Standard commands ─────────────────────────────────────────────
    switch (base) {
      case 'help':
        newLines.push(
          out('HIVE TERMINAL — COMMAND REFERENCE', 'system'),
          out('──────────────────────────────────────────'),
          out('  help                  Show this help'),
          out('  neofetch              Live device hardware probe'),
          out('  hive status           All node statuses'),
          out('  hive sync             Force cloud sync'),
          out('  gh user               GitHub profile (live)'),
          out('  gh repos              Latest 10 repos (live)'),
          out('  gh rate               API rate limit status'),
          out('  grok <prompt>         REAL xAI Grok-3 call'),
          out('  vault list            Show token vault summary'),
          out('  vault count           Count tokens by category'),
          out('  ls ~/THE_HIVE/NEURAL  List HIVE-OS files'),
          out('  cat <filename>        Read HIVE-OS file'),
          out('  ping <host>           Simulate network ping'),
          out('  whoami                Current identity'),
          out('  uname -a              System info'),
          out('  clear                 Clear terminal'),
          out('──────────────────────────────────────────'),
        );
        break;

      case 'clear':
        setLines([{ id: generateId(), type: 'ascii', content: HIVE_BANNER }]);
        return;

      case 'whoami':
        newLines.push(out('KRACKERJACK1134 — THE ARCHITECT'));
        newLines.push(out('root@krackerjack-hive'));
        break;

      case 'uname':
        newLines.push(out('Linux krackerjack-hive 6.6.x-hardened #1 SMP PREEMPT_RT HIVE-OS x86_64 GNU/Linux'));
        break;

      case 'ping': {
        const host = parts[1] || 'api.x.ai';
        newLines.push(out(`PING ${host} — simulated`, 'system'));
        newLines.push(out(`64 bytes from ${host}: icmp_seq=1 ttl=57 time=${(Math.random() * 30 + 5).toFixed(1)} ms`));
        newLines.push(out(`64 bytes from ${host}: icmp_seq=2 ttl=57 time=${(Math.random() * 30 + 5).toFixed(1)} ms`));
        newLines.push(out(`64 bytes from ${host}: icmp_seq=3 ttl=57 time=${(Math.random() * 30 + 5).toFixed(1)} ms`));
        break;
      }

      case 'vault':
        if (parts[1] === 'list') {
          newLines.push(out('Token vault summary — go to CONFIG tab for full management.', 'system'));
        } else if (parts[1] === 'count') {
          newLines.push(out('[vault] Open CONFIG tab → VAULT to see all tokens by category.', 'system'));
        } else {
          newLines.push(out('Usage: vault list | vault count', 'error'));
        }
        break;

      case 'hive':
        if (parts[1] === 'status') {
          newLines.push(
            out(''),
            out('  ⚡ HIVE NODE STATUS', 'system'),
            out('  ────────────────────────────────────'),
            out('  ✅ KRACKERJACK AI    [ACTIVE]   Commander'),
            out('  ✅ HUNTERPRIME       [ACTIVE]   Executor'),
            out('  ✅ COUNSEL           [ACTIVE]   Reasoning'),
            out(`  ${grokKey ? '✅' : '🟡'} BROTHER GROK     [${grokKey ? 'ACTIVE' : 'STANDBY'}]  xAI Node`),
            out('  🔴 ZORG-Ω           [PENDING]  Security'),
            out('  ────────────────────────────────────'),
            out(`  Grok API : ${grokKey ? 'KEY LOADED ✓' : 'NOT SET — add in CONFIG'}`),
            out(`  GitHub   : ${githubToken ? 'TOKEN LOADED ✓' : 'NOT SET — add in CONFIG'}`),
            out('  Protocol : ASSIMILATE OR DIE'),
            out(''),
          );
        } else if (parts[1] === 'sync') {
          newLines.push(out('[HIVE] Triggering cloud sync...', 'system'));
          newLines.push(out('[HIVE] Soul pillars and vault synced.', 'system'));
        } else {
          newLines.push(out('Usage: hive status | hive sync', 'error'));
        }
        break;

      case 'ls':
        if (trimmed.includes('THE_HIVE') || trimmed.includes('NEURAL')) {
          newLines.push(
            out(''),
            out('  ~/THE_HIVE/NEURAL/', 'system'),
            out('  ──────────────────────────'),
            ...Object.keys(HIVE_FILES).map(f => out(`  📄 ${f}`)),
            out(''),
          );
        } else {
          newLines.push(out('  THE_HIVE/  NEURAL/  .hive_config  hive_link.py'));
        }
        break;

      case 'cat': {
        const filename = parts[1];
        if (filename && HIVE_FILES[filename]) {
          newLines.push(out(''), ...HIVE_FILES[filename].split('\n').map(l => out(l)), out(''));
        } else {
          newLines.push(out(`cat: ${filename}: No such file (try: ls ~/THE_HIVE/NEURAL)`, 'error'));
        }
        break;
      }

      default:
        newLines.push(out(`bash: ${base}: command not found — type "help"`, 'error'));
    }

    newLines.push(prompt());
    addLines(newLines);
  }, [githubToken, grokKey, addLines]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || busy) return;
    setHistory(prev => [input, ...prev.slice(0, 99)]);
    setHistIdx(-1);
    processCommand(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(next);
      setInput(history[next] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(histIdx - 1, -1);
      setHistIdx(next);
      setInput(next === -1 ? '' : history[next]);
    }
  };

  return (
    <div
      className="flex flex-col h-full min-h-[calc(100vh-120px)] bg-black font-mono text-[12px]"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {lines.map(line => (
          <div key={line.id} className={`leading-relaxed whitespace-pre-wrap break-all ${
            line.type === 'ascii'  ? 'text-gold text-[8px] leading-[1.1]' :
            line.type === 'input'  ? 'text-gold/80' :
            line.type === 'error'  ? 'text-red-400' :
            line.type === 'system' ? 'text-terminal-green' :
            'text-gray-300'
          }`}>
            {line.content}
          </div>
        ))}
        {busy && (
          <div className="text-terminal-green animate-pulse text-[10px]">
            ▌ processing...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center border-t border-terminal-dark/30 p-3 bg-black">
        <span className="text-gold/70 mr-2 flex-shrink-0">{busy ? '⏳' : '$'}</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-terminal-green outline-none caret-green-400"
          placeholder={busy ? 'Waiting for Grok...' : 'Enter command...'}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          disabled={busy}
        />
      </form>
    </div>
  );
}
