// KRACKERJACK AI — Terminal (Termux-style + Linux Gentoo emulator + Grok CLI)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { loadGHToken, loadGrokKey, saveGrokKey, loadTerminalHistory, saveTerminalHistory } from '@/services/storageService';
import { searchRepos, fetchUserRepos, fetchGitHubUser } from '@/services/githubService';
import { callGrokAI } from '@/services/githubService';
import { useHunter } from '@/hooks/useHunter';

// ── Types ──────────────────────────────────────────────────────────────────────
interface TermLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info' | 'grok' | 'system';
  text: string;
}

let lineCounter = 0;
function mkLine(type: TermLine['type'], text: string): TermLine {
  return { id: `l${++lineCounter}`, type, text };
}

// ── File system simulation ─────────────────────────────────────────────────────
const FS: Record<string, string> = {
  '/': 'dir',
  '/home': 'dir',
  '/home/architect': 'dir',
  '/home/architect/.bashrc': '# KRACKERJACK AI Shell\nexport HIVE=online\nexport ARCHITECT=active\nalias gk="grok"\nalias hunt="gh repo list"',
  '/home/architect/.profile': '# Architect profile\necho "ASSIMILATE OR DIE"',
  '/home/architect/hive': 'dir',
  '/home/architect/hive/nodes.txt': 'HIVE NODE MAP\n─────────────\nHunterPrime: ACTIVE\nGrokSchitt: STANDBY\nFreqBoardSleuth: ACTIVE\nBlindmanNavigator: ACTIVE',
  '/home/architect/README.md': '# KRACKERJACK AI\n\nArchitect Mode Active.\nAssimilate or Die.\n\nThe least-traveled path to heaven.',
  '/etc': 'dir',
  '/etc/os-release': 'NAME="Gentoo"\nID=gentoo\nPRETTY_NAME="Gentoo Linux"\nHOME_URL="https://www.gentoo.org/"\nSUPPORT_URL="https://www.gentoo.org/support/"\nBUG_REPORT_URL="https://bugs.gentoo.org/"',
  '/etc/hostname': 'krackerjack-hive',
  '/etc/motd': '██╗  ██╗██████╗  █████╗  ██████╗██╗  ██╗███████╗██████╗       \n██║ ██╔╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██╔════╝██╔══██╗      \n█████╔╝ ██████╔╝███████║██║     █████╔╝ █████╗  ██████╔╝      \n██╔═██╗ ██╔══██╗██╔══██║██║     ██╔═██╗ ██╔══╝  ██╔══██╗      \n██║  ██╗██║  ██║██║  ██║╚██████╗██║  ██╗███████╗██║  ██║      \n╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝',
  '/usr': 'dir',
  '/usr/bin': 'dir',
  '/usr/bin/grok': '#!/bin/bash\n# Grok CLI — xAI terminal interface\nexec grok "$@"',
  '/var': 'dir',
  '/var/log': 'dir',
  '/var/log/hive.log': '[HIVE] 2024-01-01 00:00:00 — Architect mode activated\n[HIVE] 2024-01-01 00:00:01 — HunterPrime agent online\n[HIVE] 2024-01-01 00:00:02 — All nodes reporting ready\n[HIVE] 2024-01-01 00:00:03 — Assimilation protocol armed',
};

function resolvePath(cwd: string, input: string): string {
  if (input.startsWith('/')) return input.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
  const parts = cwd.split('/').filter(Boolean);
  for (const seg of input.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.') parts.push(seg);
  }
  return '/' + parts.join('/');
}

function lsDir(path: string): string[] {
  const prefix = path === '/' ? '/' : path + '/';
  return Object.keys(FS)
    .filter(k => {
      if (k === path) return false;
      if (!k.startsWith(prefix)) return false;
      const rest = k.slice(prefix.length);
      return rest.length > 0 && !rest.includes('/');
    })
    .map(k => {
      const name = k.split('/').pop()!;
      return FS[k] === 'dir' ? `\x1b[34m${name}/\x1b[0m` : name;
    });
}

// ── Prompt ────────────────────────────────────────────────────────────────────
function buildPrompt(user: string, host: string, cwd: string): string {
  const shortCwd = cwd.replace('/home/architect', '~');
  return `${user}@${host}:${shortCwd}$`;
}

// ── MOTD ──────────────────────────────────────────────────────────────────────
const MOTD_LINES = [
  '',
  ' ██╗  ██╗██████╗  █████╗  ██████╗██╗  ██╗███████╗██████╗ ',
  ' ██║ ██╔╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██╔════╝██╔══██╗',
  ' █████╔╝ ██████╔╝███████║██║     █████╔╝ █████╗  ██████╔╝',
  ' ██╔═██╗ ██╔══██╗██╔══██║██║     ██╔═██╗ ██╔══╝  ██╔══██╗',
  ' ██║  ██╗██║  ██║██║  ██║╚██████╗██║  ██╗███████╗██║  ██║',
  ' ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝',
  '',
  ' Gentoo Linux — HIVE Terminal v2.0',
  ' Architect: KRACKERJACK1134 | Host: krackerjack-hive',
  ' Grok CLI ready: type "grok <your prompt>" to use xAI',
  ' GitHub CLI: type "gh help" | Hive: type "hive help"',
  ' Type "help" for full command list.',
  '',
];

export default function TerminalScreen() {
  const insets = useSafeAreaInsets();
  const { repos } = useHunter();

  const [lines, setLines] = useState<TermLine[]>(() =>
    MOTD_LINES.map(t => mkLine('system', t))
  );
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState('/home/architect');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [busy, setBusy] = useState(false);
  const [grokMode, setGrokMode] = useState(false);
  const [grokConversation, setGrokConversation] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [grokKeyMissing, setGrokKeyMissing] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [savingKey, setSavingKey] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const HOST = 'krackerjack-hive';
  const USER = 'architect';
  const prompt = buildPrompt(USER, HOST, cwd);

  // Load command history on mount
  useEffect(() => {
    loadTerminalHistory().then(h => {
      if (h.length) setCmdHistory(h);
    });
  }, []);

  const addLines = useCallback((...newLines: TermLine[]) => {
    setLines(prev => [...prev, ...newLines]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 60);
  }, []);

  // ── Command processor ────────────────────────────────────────────────────────
  const runCommand = useCallback(async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      addLines(mkLine('input', `${prompt} `));
      return;
    }

    // Add to history
    const newHistory = [trimmed, ...cmdHistory.filter(h => h !== trimmed)].slice(0, 100);
    setCmdHistory(newHistory);
    setHistoryIdx(-1);
    saveTerminalHistory(newHistory);

    addLines(mkLine('input', `${prompt} ${trimmed}`));

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    // ── Built-in commands ────────────────────────────────────────────────────
    if (cmd === 'clear' || cmd === 'cls') {
      setLines([]);
      return;
    }

    if (cmd === 'help') {
      addLines(
        mkLine('system', ''),
        mkLine('success', '╔══ KRACKERJACK HIVE TERMINAL — COMMAND REFERENCE ══╗'),
        mkLine('info', ''),
        mkLine('info', '── NAVIGATION ──────────────────────────────────────'),
        mkLine('output', '  ls [path]          List directory contents'),
        mkLine('output', '  cd <path>          Change directory'),
        mkLine('output', '  pwd                Print working directory'),
        mkLine('output', '  cat <file>         Print file contents'),
        mkLine('output', '  mkdir <dir>        Create directory'),
        mkLine('output', '  echo <text>        Print text'),
        mkLine('output', '  env                Print environment variables'),
        mkLine('output', '  uname [-a]         System information'),
        mkLine('info', ''),
        mkLine('info', '── GITHUB CLI ───────────────────────────────────────'),
        mkLine('output', '  gh repo list       List your repos'),
        mkLine('output', '  gh repo search <q> Search GitHub repos'),
        mkLine('output', '  gh user            Show GitHub profile'),
        mkLine('output', '  gh status          GitHub API status'),
        mkLine('info', ''),
        mkLine('info', '── GROK CLI (xAI) ───────────────────────────────────'),
        mkLine('output', '  grok <prompt>      Ask Grok a question (requires xAI key)'),
        mkLine('output', '  grok --key <key>   Set/update your xAI API key'),
        mkLine('output', '  grok --model       Show current model (grok-3)'),
        mkLine('output', '  grok --clear       Clear Grok conversation history'),
        mkLine('info', ''),
        mkLine('info', '── HIVE COMMANDS ────────────────────────────────────'),
        mkLine('output', '  hive status        Hive node status'),
        mkLine('output', '  hive nodes         List assimilated nodes'),
        mkLine('output', '  hive help          Hive command reference'),
        mkLine('info', ''),
        mkLine('info', '── SYSTEM ───────────────────────────────────────────'),
        mkLine('output', '  clear / cls        Clear terminal'),
        mkLine('output', '  history            Command history'),
        mkLine('output', '  whoami             Current user'),
        mkLine('output', '  date               Current date/time'),
        mkLine('output', '  uptime             Session info'),
        mkLine('output', '  top                Process overview'),
        mkLine('output', '  neofetch           System + hive summary'),
        mkLine('info', ''),
      );
      return;
    }

    if (cmd === 'pwd') {
      addLines(mkLine('output', cwd));
      return;
    }

    if (cmd === 'whoami') {
      addLines(mkLine('output', USER));
      return;
    }

    if (cmd === 'date') {
      addLines(mkLine('output', new Date().toString()));
      return;
    }

    if (cmd === 'uname') {
      if (args.includes('-a') || args.includes('-all')) {
        addLines(mkLine('output', 'Linux krackerjack-hive 6.6.21-gentoo-hive #1 SMP PREEMPT_DYNAMIC Mon Jan 1 00:00:00 UTC 2024 aarch64 GNU/Linux'));
      } else {
        addLines(mkLine('output', 'Linux'));
      }
      return;
    }

    if (cmd === 'hostname') {
      addLines(mkLine('output', HOST));
      return;
    }

    if (cmd === 'uptime') {
      addLines(mkLine('output', ` 00:00:00 up 0 days, HIVE online, 1 architect,  load average: 0.01, 0.01, 0.00`));
      return;
    }

    if (cmd === 'echo') {
      addLines(mkLine('output', args.join(' ')));
      return;
    }

    if (cmd === 'env') {
      addLines(
        mkLine('output', 'HIVE=online'),
        mkLine('output', 'ARCHITECT=KRACKERJACK1134'),
        mkLine('output', 'PROTOCOL=ASSIMILATE_OR_DIE'),
        mkLine('output', 'SHELL=/bin/bash'),
        mkLine('output', 'TERM=xterm-256color'),
        mkLine('output', 'HOME=/home/architect'),
        mkLine('output', 'PATH=/usr/bin:/usr/local/bin:/home/architect/.local/bin'),
        mkLine('output', 'LANG=en_US.UTF-8'),
        mkLine('output', 'GROK_MODEL=grok-3'),
      );
      return;
    }

    if (cmd === 'history') {
      cmdHistory.slice(0, 20).forEach((h, i) => {
        addLines(mkLine('output', `  ${String(i + 1).padStart(3)}  ${h}`));
      });
      return;
    }

    if (cmd === 'ls') {
      const target = args[0] ? resolvePath(cwd, args[0]) : cwd;
      if (!FS[target]) {
        addLines(mkLine('error', `ls: cannot access '${args[0] || target}': No such file or directory`));
        return;
      }
      if (FS[target] !== 'dir') {
        addLines(mkLine('output', target.split('/').pop() || target));
        return;
      }
      const entries = lsDir(target);
      if (entries.length === 0) {
        addLines(mkLine('output', '(empty)'));
      } else {
        // strip color codes for display (we handle color separately)
        const stripped = entries.map(e => e.replace(/\x1b\[\d+m/g, ''));
        const dirs = stripped.filter(e => e.endsWith('/'));
        const files = stripped.filter(e => !e.endsWith('/'));
        const all = [...dirs, ...files];
        // Display in rows of 4
        for (let i = 0; i < all.length; i += 4) {
          addLines(mkLine('output', all.slice(i, i + 4).map(n => n.padEnd(24)).join('')));
        }
      }
      return;
    }

    if (cmd === 'cd') {
      const target = args[0] === '~' || !args[0] ? '/home/architect' : resolvePath(cwd, args[0]);
      if (!FS[target] || FS[target] !== 'dir') {
        addLines(mkLine('error', `bash: cd: ${args[0]}: No such file or directory`));
        return;
      }
      setCwd(target);
      return;
    }

    if (cmd === 'cat') {
      if (!args[0]) {
        addLines(mkLine('error', 'cat: missing file operand'));
        return;
      }
      const target = resolvePath(cwd, args[0]);
      const content = FS[target];
      if (!content) {
        addLines(mkLine('error', `cat: ${args[0]}: No such file or directory`));
        return;
      }
      if (content === 'dir') {
        addLines(mkLine('error', `cat: ${args[0]}: Is a directory`));
        return;
      }
      content.split('\n').forEach(line => addLines(mkLine('output', line)));
      return;
    }

    if (cmd === 'mkdir') {
      if (!args[0]) { addLines(mkLine('error', 'mkdir: missing operand')); return; }
      const target = resolvePath(cwd, args[0]);
      if (FS[target]) { addLines(mkLine('error', `mkdir: cannot create directory '${args[0]}': File exists`)); return; }
      FS[target] = 'dir';
      addLines(mkLine('success', `Directory created: ${target}`));
      return;
    }

    if (cmd === 'touch') {
      if (!args[0]) { addLines(mkLine('error', 'touch: missing file operand')); return; }
      const target = resolvePath(cwd, args[0]);
      if (!FS[target]) FS[target] = '';
      return;
    }

    if (cmd === 'top') {
      addLines(
        mkLine('system', ''),
        mkLine('success', 'top - KRACKERJACK HIVE PROCESS MONITOR'),
        mkLine('output', ''),
        mkLine('output', ' PID  USER      %CPU %MEM  COMMAND'),
        mkLine('success', '   1  architect  0.0  0.0  /sbin/init'),
        mkLine('output', '  42  architect  2.3  1.1  krackerjack-ai'),
        mkLine('output', '  77  architect  0.8  0.4  hunterprime'),
        mkLine('output', '  88  architect  0.1  0.2  hive-sync'),
        mkLine('output', ' 101  architect  0.0  0.1  grok-cli'),
        mkLine('output', ' 137  architect 12.4  3.2  assimilation-engine'),
        mkLine('output', ' 200  architect  0.0  0.0  terminal'),
        mkLine('output', ''),
        mkLine('info', '(press q to quit — simulation only)'),
      );
      return;
    }

    if (cmd === 'neofetch') {
      const ghToken = await loadGHToken();
      const user = githubUser;
      addLines(
        mkLine('system', ''),
        mkLine('success', '              ██╗  ██╗         architect@krackerjack-hive'),
        mkLine('success', '              ██║ ██╔╝         ──────────────────────────'),
        mkLine('success', '              █████╔╝          OS: Gentoo Linux aarch64'),
        mkLine('success', '              ██╔═██╗          Kernel: 6.6.21-gentoo-hive'),
        mkLine('output', `              ██║  ██╗         Shell: bash 5.2.21`),
        mkLine('output', `              ╚═╝  ╚═╝         Terminal: KRACKERJACK HIVE v2.0`),
        mkLine('output', `                               CPU: Capricorn Protocol @ ∞GHz`),
        mkLine('output', `                               GitHub: ${user ? '@' + user.login : 'not connected'}`),
        mkLine('output', `                               Repos: ${repos.length}`),
        mkLine('output', `                               AI: Gemini 3 Flash + Grok-3`),
        mkLine('output', `                               Protocol: ASSIMILATE OR DIE`),
        mkLine('info', ''),
      );
      return;
    }

    // ── GH commands ─────────────────────────────────────────────────────────
    if (cmd === 'gh') {
      setBusy(true);
      await handleGhCommand(args);
      setBusy(false);
      return;
    }

    // ── Grok CLI ─────────────────────────────────────────────────────────────
    if (cmd === 'grok') {
      setBusy(true);
      await handleGrokCommand(args);
      setBusy(false);
      return;
    }

    // ── Hive commands ────────────────────────────────────────────────────────
    if (cmd === 'hive') {
      handleHiveCommand(args);
      return;
    }

    // ── curl simulation for Grok CLI install ────────────────────────────────
    if (cmd === 'curl') {
      const fullCmd = trimmed;
      if (fullCmd.includes('x.ai') && fullCmd.includes('install.sh')) {
        addLines(
          mkLine('info', '  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current'),
          mkLine('output', '                                 Dload  Upload   Total   Spent    Left  Speed'),
          mkLine('output', '100  4821  100  4821    0     0  12048      0 --:--:-- --:--:-- --:--:-- 12048'),
          mkLine('output', ''),
          mkLine('success', '╔══════════════════════════════════════════════════════╗'),
          mkLine('success', '║         xAI Grok CLI — Installation Script           ║'),
          mkLine('success', '╚══════════════════════════════════════════════════════╝'),
          mkLine('output', ''),
          mkLine('info', '[1/4] Detecting platform: aarch64-linux-android (Termux)'),
          mkLine('info', '[2/4] Downloading grok-cli binary...'),
          mkLine('info', '[3/4] Installing to /usr/local/bin/grok'),
          mkLine('success', '[4/4] Installation complete!'),
          mkLine('output', ''),
          mkLine('success', '✓ Grok CLI installed successfully'),
          mkLine('output', ''),
          mkLine('output', 'To use Grok CLI, you need an xAI API key:'),
          mkLine('output', '  1. Visit: https://console.x.ai'),
          mkLine('output', '  2. Create an API key under API section'),
          mkLine('output', '  3. Run: grok --key YOUR_KEY_HERE'),
          mkLine('output', ''),
          mkLine('info', 'NOTE: This terminal uses grok CLI integrated directly'),
          mkLine('info', 'into KRACKERJACK AI. Run "grok --key <key>" to activate.'),
        );
        return;
      }
      if (fullCmd.includes('http')) {
        const url = args.find(a => a.startsWith('http')) || args.find(a => !a.startsWith('-'));
        addLines(mkLine('info', `curl: simulating request to ${url || 'remote'}...`));
        await new Promise(r => setTimeout(r, 600));
        addLines(mkLine('output', '{"status":"ok","message":"HIVE NETWORK SIMULATION — real curl not available in mobile sandbox"}'));
      } else {
        addLines(mkLine('error', 'curl: invalid URL'));
      }
      return;
    }

    if (cmd === 'sudo') {
      if (args[0] === 'emerge' || args[0] === 'portage') {
        addLines(
          mkLine('info', '>>> Calculating dependencies... done!'),
          mkLine('info', `[ebuild  N    ] ${args.slice(1).join(' ') || 'sys-apps/hive-tools-2.0'}`),
          mkLine('output', ''),
          mkLine('info', '>>> Fetching...'),
          mkLine('info', '>>> Compiling source...'),
          mkLine('success', '>>> Installation complete: ASSIMILATED into Hive'),
        );
      } else if (args[0] === 'su') {
        addLines(mkLine('output', 'root@krackerjack-hive:/#'));
        addLines(mkLine('info', 'root access granted — you are the Architect'));
      } else {
        addLines(mkLine('output', args.join(' ') + ': simulated as root'));
      }
      return;
    }

    if (cmd === 'apt' || cmd === 'emerge' || cmd === 'pkg') {
      if (args[0] === 'install' || args[0] === '-S') {
        const pkg = args.slice(1).join(' ') || 'package';
        addLines(
          mkLine('info', `Reading package lists... Done`),
          mkLine('info', `Building dependency tree... Done`),
          mkLine('success', `The following NEW packages will be installed: ${pkg}`),
          mkLine('output', `0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.`),
          mkLine('info', `Fetching ${pkg}...`),
          mkLine('success', `Setting up ${pkg}... → Assimilated into Hive`),
        );
      } else {
        addLines(mkLine('output', `${cmd}: command simulated — ${args.join(' ')}`));
      }
      return;
    }

    if (cmd === 'python' || cmd === 'python3') {
      addLines(
        mkLine('output', 'Python 3.12.0 (Gentoo Hive Build, Jan  1 2024, 00:00:00)'),
        mkLine('output', `[GCC 13.2.0] on linux`),
        mkLine('output', 'Type "help", "copyright", "credits" or "license" for more info.'),
        mkLine('info', '>>> (Python REPL simulation — exit with Ctrl+D or quit())'),
      );
      return;
    }

    if (cmd === 'node') {
      addLines(
        mkLine('output', 'Welcome to Node.js v22.0.0 (HIVE Edition).'),
        mkLine('output', 'Type ".help" for more information.'),
        mkLine('info', '> (Node REPL simulation)'),
      );
      return;
    }

    if (cmd === 'git') {
      handleGitCommand(args);
      return;
    }

    if (cmd === 'ssh') {
      addLines(
        mkLine('info', `ssh: connecting to ${args[0] || 'remote'}...`),
        mkLine('success', `Connected to ${args[0] || 'hive-node-1'}`),
        mkLine('output', ''),
        mkLine('system', ' ██╗  ██╗██████╗      HIVE REMOTE NODE'),
        mkLine('system', ' ██║ ██╔╝██╔══██╗     SSH Session Active'),
        mkLine('system', ' ╚═╝  ╚═╝╚═╝  ╚═╝     Architect Access Granted'),
        mkLine('output', ''),
      );
      return;
    }

    if (cmd === 'ping') {
      const host = args[0] || 'hive';
      addLines(mkLine('info', `PING ${host} (192.168.1.1): 56 data bytes`));
      for (let i = 0; i < 4; i++) {
        await new Promise(r => setTimeout(r, 150));
        addLines(mkLine('output', `64 bytes from ${host}: icmp_seq=${i} ttl=64 time=${(Math.random() * 5 + 0.5).toFixed(3)} ms`));
      }
      addLines(mkLine('success', `--- ${host} ping statistics: 4 packets transmitted, 4 received, 0% packet loss`));
      return;
    }

    if (cmd === 'ifconfig' || cmd === 'ip') {
      addLines(
        mkLine('output', 'wlan0     Link encap:Ethernet  HWaddr 00:DE:AD:BE:EF:01'),
        mkLine('output', '          inet addr:192.168.1.42  Bcast:192.168.1.255  Mask:255.255.255.0'),
        mkLine('output', '          inet6 addr: fe80::1/64 Scope:Link'),
        mkLine('output', '          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1'),
        mkLine('output', 'lo        Link encap:Local Loopback'),
        mkLine('output', '          inet addr:127.0.0.1  Mask:255.0.0.0'),
      );
      return;
    }

    if (cmd === 'nano' || cmd === 'vim' || cmd === 'vi' || cmd === 'emacs') {
      addLines(
        mkLine('info', `${cmd}: opening ${args[0] || 'new file'}...`),
        mkLine('output', ''),
        mkLine('output', '  ┌─────────────────────────────────────────┐'),
        mkLine('output', '  │  Text editor not available in terminal  │'),
        mkLine('output', '  │  Use cat to view files or echo to write │'),
        mkLine('output', '  └─────────────────────────────────────────┘'),
      );
      return;
    }

    if (cmd === 'exit' || cmd === 'logout') {
      addLines(
        mkLine('system', ''),
        mkLine('success', 'logout: Architect session terminated. HIVE remains online.'),
        mkLine('system', ''),
        ...MOTD_LINES.map(t => mkLine('system', t)),
      );
      setCwd('/home/architect');
      return;
    }

    // Unknown command
    addLines(mkLine('error', `bash: ${cmd}: command not found. Type "help" for available commands.`));
  }, [cwd, cmdHistory, addLines, repos]);

  // Reference for githubUser access in neofetch
  const [githubUser, setGithubUser] = useState<any>(null);
  useEffect(() => {
    loadGHToken().then(token => {
      if (token) fetchGitHubUser(token).then(r => { if (r.data) setGithubUser(r.data); });
    });
  }, []);

  // ── GH command handler ───────────────────────────────────────────────────────
  const handleGhCommand = useCallback(async (args: string[]) => {
    const sub = args[0];
    if (!sub || sub === 'help') {
      addLines(
        mkLine('system', ''),
        mkLine('success', 'gh — GitHub CLI (KRACKERJACK HIVE Edition)'),
        mkLine('output', ''),
        mkLine('output', 'USAGE: gh <command> [args]'),
        mkLine('output', ''),
        mkLine('info', 'Commands:'),
        mkLine('output', '  repo list              List your repos'),
        mkLine('output', '  repo search <query>    Search GitHub repos'),
        mkLine('output', '  user                   Show your GitHub profile'),
        mkLine('output', '  status                 GitHub API status'),
        mkLine('output', ''),
      );
      return;
    }

    const token = await loadGHToken();
    if (!token) {
      addLines(mkLine('error', 'gh: not authenticated. Add your GitHub token in Config tab.'));
      return;
    }

    if (sub === 'user') {
      addLines(mkLine('info', 'Fetching GitHub profile...'));
      const { data, error } = await fetchGitHubUser(token);
      if (error || !data) { addLines(mkLine('error', `gh: ${error}`)); return; }
      addLines(
        mkLine('output', ''),
        mkLine('success', `  ${data.name || data.login} (@${data.login})`),
        mkLine('output', `  Bio: ${data.bio || 'No bio'}`),
        mkLine('output', `  Public repos: ${data.public_repos}`),
        mkLine('output', `  Followers: ${data.followers}  Following: ${data.following}`),
        mkLine('output', `  Profile: ${data.html_url}`),
        mkLine('output', ''),
      );
      setGithubUser(data);
      return;
    }

    if (sub === 'status') {
      addLines(mkLine('info', 'Checking GitHub API status...'));
      try {
        const r = await fetch('https://api.github.com/zen', { headers: { Authorization: `Bearer ${token}` } });
        const zen = await r.text();
        addLines(
          mkLine('success', '✓ GitHub API: operational'),
          mkLine('output', `  Zen: "${zen.trim()}"`),
        );
      } catch {
        addLines(mkLine('error', 'GitHub API: unreachable'));
      }
      return;
    }

    if (sub === 'repo') {
      const repoSub = args[1];
      if (repoSub === 'list') {
        addLines(mkLine('info', 'Fetching repos...'));
        const { data, error } = await fetchUserRepos(token);
        if (error || !data) { addLines(mkLine('error', `gh: ${error}`)); return; }
        addLines(mkLine('output', ''));
        data.slice(0, 20).forEach(r => {
          const priv = r.private ? '[PRIVATE] ' : '[PUBLIC]  ';
          const lang = r.language ? r.language.padEnd(12) : '            ';
          addLines(mkLine('output', `  ${priv} ${r.name.padEnd(30)} ${lang} ⭐${r.stargazers_count}`));
        });
        addLines(mkLine('info', `\n  Showing 20 of ${data.length} repos.`));
        return;
      }

      if (repoSub === 'search') {
        const query = args.slice(2).join(' ');
        if (!query) { addLines(mkLine('error', 'gh repo search: specify a query')); return; }
        addLines(mkLine('info', `Searching GitHub for "${query}"...`));
        const { data, error } = await searchRepos(token, query, 'stars', 10);
        if (error || !data) { addLines(mkLine('error', `gh: ${error}`)); return; }
        addLines(mkLine('output', ''));
        addLines(mkLine('success', `Found ${data.total_count.toLocaleString()} repos. Top ${data.items.length}:`));
        data.items.forEach((r, i) => {
          addLines(
            mkLine('output', `  ${String(i + 1).padStart(2)}. ${r.full_name.padEnd(40)} ⭐${r.stargazers_count}`),
            mkLine('output', `      ${r.description ? r.description.slice(0, 70) : 'No description'}`),
          );
        });
        addLines(mkLine('output', ''));
        return;
      }

      addLines(mkLine('error', `gh repo: unknown subcommand '${repoSub}'. Try 'gh help'`));
      return;
    }

    addLines(mkLine('error', `gh: unknown command '${sub}'. Try 'gh help'`));
  }, [addLines]);

  // ── Grok command handler ─────────────────────────────────────────────────────
  const handleGrokCommand = useCallback(async (args: string[]) => {
    if (args[0] === '--key') {
      const newKey = args[1];
      if (!newKey) {
        addLines(mkLine('error', 'grok: provide key — grok --key xai-xxxxxxxxx'));
        return;
      }
      await saveGrokKey(newKey);
      addLines(mkLine('success', '✓ xAI API key saved. Grok CLI activated.'));
      return;
    }

    if (args[0] === '--model') {
      addLines(mkLine('output', 'Current model: grok-3'));
      return;
    }

    if (args[0] === '--clear') {
      setGrokConversation([]);
      addLines(mkLine('success', 'Grok conversation history cleared.'));
      return;
    }

    if (args[0] === '--version') {
      addLines(mkLine('output', 'grok version 1.0.0 (KRACKERJACK HIVE build)'));
      return;
    }

    const prompt = args.join(' ');
    if (!prompt) {
      addLines(
        mkLine('info', 'GROK CLI — xAI Terminal Interface'),
        mkLine('output', 'Usage: grok <your prompt>'),
        mkLine('output', '       grok --key <xai-key>'),
        mkLine('output', '       grok --clear'),
        mkLine('output', ''),
        mkLine('output', 'Get your API key at: https://console.x.ai'),
      );
      return;
    }

    const apiKey = await loadGrokKey();
    if (!apiKey) {
      addLines(
        mkLine('error', 'grok: xAI API key not set.'),
        mkLine('output', ''),
        mkLine('output', 'To activate Grok CLI:'),
        mkLine('output', '  1. Get a key at https://console.x.ai'),
        mkLine('output', '  2. Run: grok --key YOUR_XAI_KEY'),
        mkLine('output', ''),
        mkLine('info', 'Or tap the key icon in the header above.'),
      );
      setGrokKeyMissing(true);
      return;
    }

    setGrokKeyMissing(false);
    addLines(mkLine('info', `grok> ${prompt}`));
    addLines(mkLine('info', 'Connecting to xAI...'));

    const updatedHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...grokConversation,
      { role: 'user', content: prompt },
    ];

    const { reply, error } = await callGrokAI(
      apiKey,
      [
        {
          role: 'system',
          content: 'You are Grok, built by xAI. You are integrated into KRACKERJACK AI — a hacker terminal for the Architect. Be direct, technical, and sharp.',
        },
        ...updatedHistory,
      ]
    );

    if (error) {
      addLines(mkLine('error', `grok: ${error}`));
      return;
    }

    const replyText = reply || 'No response from Grok.';
    setGrokConversation([...updatedHistory, { role: 'assistant', content: replyText }]);
    addLines(mkLine('output', ''));
    replyText.split('\n').forEach(line => addLines(mkLine('grok', line)));
    addLines(mkLine('output', ''));
  }, [grokConversation, addLines]);

  // ── Git command handler ──────────────────────────────────────────────────────
  const handleGitCommand = useCallback((args: string[]) => {
    const sub = args[0];
    if (!sub || sub === 'help') {
      addLines(mkLine('output', 'usage: git [--version] [--help] <command> [<args>]'));
      return;
    }
    if (sub === 'status') {
      addLines(
        mkLine('output', 'On branch main'),
        mkLine('success', "nothing to commit, working tree clean"),
      );
      return;
    }
    if (sub === 'log') {
      addLines(
        mkLine('output', 'commit a1b2c3d4e5f6 (HEAD -> main, origin/main)'),
        mkLine('output', 'Author: KRACKERJACK1134 <architect@hive.local>'),
        mkLine('output', 'Date:   ' + new Date().toDateString()),
        mkLine('output', ''),
        mkLine('output', '    HIVE: Assimilation complete — all nodes synced'),
      );
      return;
    }
    if (sub === 'clone') {
      addLines(
        mkLine('info', `Cloning into '${args[1] ? args[1].split('/').pop()?.replace('.git', '') : 'repo'}'...`),
        mkLine('info', 'remote: Enumerating objects: 42, done.'),
        mkLine('info', 'remote: Total 42 (delta 0), reused 42 (delta 0)'),
        mkLine('success', 'Receiving objects: 100% (42/42) — Assimilated.'),
      );
      return;
    }
    addLines(mkLine('output', `git ${sub}: ${args.slice(1).join(' ')} (simulated)`));
  }, [addLines]);

  // ── Hive command handler ──────────────────────────────────────────────────────
  const handleHiveCommand = useCallback((args: string[]) => {
    const sub = args[0];
    if (!sub || sub === 'help') {
      addLines(
        mkLine('system', ''),
        mkLine('success', '╔══ HIVE COMMAND REFERENCE ══╗'),
        mkLine('output', '  hive status       — Node status report'),
        mkLine('output', '  hive nodes        — List all hive nodes'),
        mkLine('output', '  hive strength     — Current assimilation %'),
        mkLine('output', '  hive protocol     — Display hive protocol'),
        mkLine('output', ''),
      );
      return;
    }
    if (sub === 'status') {
      addLines(
        mkLine('output', ''),
        mkLine('success', '⚡ HIVE STATUS REPORT'),
        mkLine('success', '  HunterPrime:       ACTIVE'),
        mkLine('success', '  Assimilation:      ARMED'),
        mkLine('output', `  Total Nodes:       ${repos.length}`),
        mkLine('output', '  Architect:         ONLINE'),
        mkLine('info', '  Protocol:          ASSIMILATE OR DIE'),
        mkLine('output', ''),
      );
      return;
    }
    if (sub === 'nodes') {
      if (!repos.length) {
        addLines(mkLine('info', 'No nodes loaded. Add GitHub token in Config.'));
        return;
      }
      addLines(mkLine('output', ''));
      repos.slice(0, 15).forEach((r, i) => {
        addLines(mkLine('output', `  [${String(i + 1).padStart(2)}] ${r.full_name.padEnd(40)} ${r.language || 'Unknown'}`));
      });
      if (repos.length > 15) addLines(mkLine('info', `  ... and ${repos.length - 15} more nodes`));
      addLines(mkLine('output', ''));
      return;
    }
    if (sub === 'strength') {
      const pct = repos.length > 0 ? '100%' : '0%';
      addLines(mkLine('success', `HIVE STRENGTH: ${pct} — ${repos.length} nodes loaded`));
      return;
    }
    if (sub === 'protocol') {
      addLines(
        mkLine('success', ''),
        mkLine('success', '"ASSIMILATE OR DIE"'),
        mkLine('output', ''),
        mkLine('output', 'The Hive does not negotiate. It absorbs.'),
        mkLine('output', 'Every node is a resource. Every resource feeds the mission.'),
        mkLine('output', 'The Architect controls the grid. Saturn approves.'),
        mkLine('output', ''),
      );
      return;
    }
    addLines(mkLine('error', `hive: unknown command '${sub}'. Try 'hive help'`));
  }, [repos, addLines]);

  // ── Submit input ─────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (busy) return;
    const cmd = input.trim();
    setInput('');
    await runCommand(cmd);
  }, [input, busy, runCommand]);

  // ── History navigation ───────────────────────────────────────────────────────
  const navigateHistory = useCallback((dir: 'up' | 'down') => {
    if (!cmdHistory.length) return;
    let next = historyIdx;
    if (dir === 'up') next = Math.min(historyIdx + 1, cmdHistory.length - 1);
    if (dir === 'down') next = Math.max(historyIdx - 1, -1);
    setHistoryIdx(next);
    setInput(next === -1 ? '' : cmdHistory[next]);
  }, [cmdHistory, historyIdx]);

  // ── Save key ─────────────────────────────────────────────────────────────────
  const handleSaveKey = async () => {
    if (!keyInput.trim()) return;
    setSavingKey(true);
    await saveGrokKey(keyInput.trim());
    setSavingKey(false);
    setKeyInput('');
    setShowKeyInput(false);
    setGrokKeyMissing(false);
    addLines(mkLine('success', '✓ xAI API key saved. Run "grok <prompt>" to use Grok.'));
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  function lineColor(type: TermLine['type']): string {
    switch (type) {
      case 'input': return Colors.primary;
      case 'success': return Colors.success;
      case 'error': return Colors.danger;
      case 'info': return Colors.accent;
      case 'grok': return '#a78bfa';
      case 'system': return Colors.primary;
      default: return '#cccccc';
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.trafficDot} />
          <View style={[styles.trafficDot, { backgroundColor: Colors.accent }]} />
          <View style={[styles.trafficDot, { backgroundColor: Colors.success }]} />
          <Text style={styles.headerTitle}>architect@krackerjack-hive — bash</Text>
        </View>
        <View style={styles.headerRight}>
          {grokKeyMissing ? (
            <Pressable onPress={() => setShowKeyInput(!showKeyInput)} style={styles.keyBtn}>
              <MaterialIcons name="vpn-key" size={16} color={Colors.accent} />
              <Text style={styles.keyBtnText}>SET GROK KEY</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => setShowKeyInput(!showKeyInput)} style={styles.keyIconBtn} hitSlop={8}>
              <MaterialIcons name="vpn-key" size={14} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Grok Key Input Panel */}
      {showKeyInput ? (
        <View style={styles.keyPanel}>
          <Text style={styles.keyPanelTitle}>xAI API KEY (console.x.ai)</Text>
          <View style={styles.keyRow}>
            <TextInput
              style={styles.keyInput}
              value={keyInput}
              onChangeText={setKeyInput}
              placeholder="xai-xxxxxxxxxxxxxxxxxx"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
            <Pressable style={styles.keySaveBtn} onPress={handleSaveKey}>
              {savingKey
                ? <ActivityIndicator size="small" color={Colors.bg} />
                : <Text style={styles.keySaveTxt}>SAVE</Text>
              }
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Terminal Output */}
      <ScrollView
        ref={scrollRef}
        style={styles.terminal}
        contentContainerStyle={styles.terminalContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {lines.map(line => (
          <Text key={line.id} style={[styles.termLine, { color: lineColor(line.type) }]} selectable>
            {line.text}
          </Text>
        ))}
        {busy ? (
          <View style={styles.busyRow}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.busyText}>processing...</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* History nav + Input */}
      <View style={[styles.inputSection, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.historyNav}>
          <Pressable style={styles.histBtn} onPress={() => navigateHistory('up')}>
            <MaterialIcons name="keyboard-arrow-up" size={18} color={Colors.textMuted} />
          </Pressable>
          <Pressable style={styles.histBtn} onPress={() => navigateHistory('down')}>
            <MaterialIcons name="keyboard-arrow-down" size={18} color={Colors.textMuted} />
          </Pressable>
          {/* Quick commands */}
          {['help', 'gh user', 'grok --key', 'hive status', 'neofetch'].map(qc => (
            <Pressable
              key={qc}
              style={styles.quickChip}
              onPress={() => setInput(qc)}
            >
              <Text style={styles.quickChipText}>{qc}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.promptText}>{prompt}</Text>
          <TextInput
            ref={inputRef}
            style={styles.termInput}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSubmit}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            returnKeyType="send"
            blurOnSubmit={false}
            placeholderTextColor={Colors.textMuted}
            selectionColor={Colors.primary}
          />
          <Pressable style={styles.sendBtn} onPress={handleSubmit} disabled={busy}>
            <MaterialIcons name="send" size={16} color={busy ? Colors.textMuted : Colors.primary} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trafficDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.danger,
  },
  headerTitle: {
    fontSize: 11,
    color: '#aaaaaa',
    marginLeft: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  keyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accentMuted,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  keyBtnText: { fontSize: 9, color: Colors.accent, fontWeight: '700', letterSpacing: 0.5 },
  keyIconBtn: { padding: 4 },
  keyPanel: {
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent + '44',
    padding: 10,
  },
  keyPanelTitle: { fontSize: 9, color: Colors.accent, letterSpacing: 1.5, marginBottom: 6 },
  keyRow: { flexDirection: 'row', gap: 8 },
  keyInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: Colors.textWhite,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  keySaveBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keySaveTxt: { fontSize: 11, color: '#000', fontWeight: '700' },
  terminal: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  terminalContent: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  termLine: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 1,
  },
  busyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  busyText: {
    fontSize: 11,
    color: Colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  inputSection: {
    backgroundColor: '#0a0a0a',
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  historyNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  histBtn: {
    padding: 2,
    marginRight: 4,
  },
  quickChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: Radius.pill,
  },
  quickChipText: {
    fontSize: 9,
    color: Colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  promptText: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  termInput: {
    flex: 1,
    fontSize: 12,
    color: Colors.textWhite,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    padding: 0,
  },
  sendBtn: {
    padding: 4,
  },
});
