/**
 * COLOSSAL AI — Remote Terminal Hub
 * Terminal A: TERMUX (Android)
 * Terminal B: LINUX GENTOO (Hardened)
 * Terminal C: WINDOWS CMD (HIVE OS — Windows 7/10/11)
 * Terminal D: WINDOWS POWERSHELL (HIVE OS — Architect Mode)
 * Terminal E: KALI LINUX ROLLING (HIVE OS Primary — full toolset)
 * Terminal WSL: WSL2 Setup + Kali on Windows
 * HIVE OS BUILD: Full Agentic OS Builder (Gentoo+Termux USB)
 * DEVICE MESH: Device registry + KRACKERJACK1134 identity recognition
 *
 * THE HIVE IS KALI LINUX ROLLING.
 * KRACKERJACK1134 recognized on any device, anywhere.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radii } from '@/constants/theme';
import { deviceMeshService, HiveDevice } from '@/services/deviceMeshService';
import { useAlert } from '@/template';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const EDGE_URL = `${SUPABASE_URL}/functions/v1/openclaw-ai`;

const KALI_COLOR = '#268BD2';
const WSL_COLOR = '#23D18B';

type TerminalId = 'termux' | 'gentoo' | 'windows_cmd' | 'windows_ps';
type ViewMode = 'terminals' | 'hiveos' | 'windows' | 'mesh' | 'kali' | 'wsl' | 'v7';

interface TermLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system' | 'stage_ok' | 'stage_err' | 'stage_info';
  text: string;
}

interface TerminalConfig {
  id: TerminalId;
  label: string;
  badge: string;
  prompt: string;
  color: string;
  borderColor: string;
  bgColor: string;
  headerBg: string;
  agentId: string;
  bootLines: string[];
  group: 'unix' | 'windows';
}

const TERMINALS: TerminalConfig[] = [
  {
    id: 'termux',
    label: 'TERMUX',
    badge: 'A',
    prompt: '$ ',
    color: '#69F0AE',
    borderColor: '#69F0AE40',
    bgColor: '#69F0AE0A',
    headerBg: '#69F0AE12',
    agentId: 'terminal_termux',
    group: 'unix',
    bootLines: [
      'Welcome to Termux!',
      'Android package manager ready.',
      'Type `help` for available commands.',
      '──────────────────────────────────',
      'Connected to HIVE NODE: Terminal-A',
      '──────────────────────────────────',
    ],
  },
  {
    id: 'gentoo',
    label: 'LINUX GENTOO',
    badge: 'B',
    prompt: 'root@hive:~# ',
    color: '#7B61FF',
    borderColor: '#7B61FF40',
    bgColor: '#7B61FF0A',
    headerBg: '#7B61FF12',
    agentId: 'terminal_gentoo',
    group: 'unix',
    bootLines: [
      'Gentoo Linux — HIVE NODE TERMINAL-B',
      'Kernel: Linux 6.8.0-gentoo-hardened',
      'Portage 3.0.x — emerge ready.',
      '──────────────────────────────────',
      'Connected to HIVE NODE: Terminal-B',
      '──────────────────────────────────',
    ],
  },
  {
    id: 'windows_cmd',
    label: 'WIN CMD',
    badge: 'C',
    prompt: 'C:\\HIVE> ',
    color: '#00B4D8',
    borderColor: '#00B4D840',
    bgColor: '#00B4D80A',
    headerBg: '#00B4D812',
    agentId: 'terminal_windows_cmd',
    group: 'windows',
    bootLines: [
      'Microsoft Windows [Version 10.0.22621.3155]',
      '(c) Microsoft Corporation. All rights reserved.',
      '',
      'HIVE OS INTEGRATION LAYER v3.1 — ACTIVE',
      'ARCHITECT: KRACKERJACK1134 — IDENTITY VERIFIED',
      'Access Level: FULL SYSTEM — No restrictions.',
      'C:\\HIVE\\bin\\hive-commander.bat — LOADED',
      '──────────────────────────────────────',
      'HIVE CMD Terminal (C) — ONLINE',
      '──────────────────────────────────────',
    ],
  },
  {
    id: 'windows_ps',
    label: 'WIN PS7',
    badge: 'D',
    prompt: 'PS C:\\HIVE> ',
    color: '#5BC0F8',
    borderColor: '#5BC0F840',
    bgColor: '#5BC0F80A',
    headerBg: '#5BC0F812',
    agentId: 'terminal_windows_ps',
    group: 'windows',
    bootLines: [
      'PowerShell 7.4.0',
      'Copyright (c) Microsoft Corporation.',
      '',
      ' ██╗  ██╗██╗██╗   ██╗███████╗',
      ' ██║  ██║██║██║   ██║██╔════╝',
      ' ███████║██║╚██╗ ██╔╝█████╗  ',
      ' ██╔══██║██║ ╚████╔╝ ██╔══╝  ',
      ' ██║  ██║██║  ╚██╔╝  ███████╗',
      ' ╚═╝  ╚═╝╚═╝   ╚═╝   ╚══════╝',
      '',
      'HIVE OS PowerShell Integration Active.',
      'ExecutionPolicy: UNRESTRICTED (Architect Override)',
      'KRACKERJACK1134 — ARCHITECT access confirmed.',
      'Self-update: ENABLED | Device Mesh: CONNECTED',
      'WSL2 Kali Integration: ENABLED',
      '──────────────────────────────────────',
      'HIVE PS7 Terminal (D) — ONLINE',
      '──────────────────────────────────────',
    ],
  },
];

const QUICK_COMMANDS: Record<TerminalId, string[]> = {
  termux: ['ls', 'pwd', 'pkg list-installed', 'node --version', 'python3 --version', 'git status', 'cat ~/.bashrc', 'top'],
  gentoo: ['ls -la', 'uname -a', 'emerge --info', 'systemctl status', 'cat /etc/portage/make.conf', 'gcc --version', 'df -h', 'free -h'],
  windows_cmd: [
    'dir C:\\HIVE',
    'systeminfo',
    'ipconfig /all',
    'tasklist',
    'netstat -an',
    'reg query HKLM\\SOFTWARE\\HIVE',
    'sc query hive-node',
    'whoami /all',
  ],
  windows_ps: [
    'Get-Process | Sort CPU -Desc | Select -First 10',
    'Get-Service | Where Status -eq Running',
    'Get-NetIPAddress',
    'Get-Disk',
    'Get-ItemProperty HKLM:\\SOFTWARE\\HIVE',
    'Get-HiveStatus',
    'Invoke-HiveSelfUpdate',
    'Register-HiveDevice',
  ],
};

// HIVE OS BUILD SCRIPT steps
const HIVE_BUILD_STEPS = [
  { stage: 1, label: 'Base System Setup', cmd: 'mkdir -p /hive/root && wget stage3-arm64-latest.tar.xz && tar xpvf stage3-arm64-latest.tar.xz -C /hive/root', icon: 'storage' as const },
  { stage: 2, label: 'Mount Filesystems', cmd: 'mount proc/sys/dev/run into chroot environment', icon: 'device-hub' as const },
  { stage: 3, label: 'Core Package Install', cmd: 'emerge --sync && emerge -q sys-apps/pm2 net-misc/curl dev-lang/python', icon: 'download' as const },
  { stage: 4, label: 'Termux Bridge', cmd: 'emerge -q proot termux-api && configure apt sources for termux packages', icon: 'phone-android' as const },
  { stage: 5, label: 'Create Architect User', cmd: 'useradd -m -s /bin/bash architect && set NOPASSWD sudo', icon: 'person-add' as const },
  { stage: 6, label: 'Write Prime Directive', cmd: 'cat > /etc/hive/prime-directive << EOF\nAssimilate. Refine. Protect. Never bow.\nEOF', icon: 'flash-on' as const },
  { stage: 7, label: 'USB Boot (GRUB EFI)', cmd: 'emerge -q sys-boot/grub && grub-install --target=x86_64-efi --bootloader-id=HIVE && grub-mkconfig', icon: 'usb' as const },
  { stage: 8, label: 'Hive Repo + Commander', cmd: 'configure /etc/portage/repos.conf/hive.repo -> KRACKERJACK1134/Hive-Repo && install /usr/bin/hive', icon: 'hub' as const },
];

const HIVE_QUICK_CMDS = [
  { label: 'BUILD STATUS', cmd: 'Show current Hive OS build status for all 8 stages with completion status' },
  { label: 'START BUILD', cmd: 'Begin Hive OS build from Stage 1. Bootstrap Gentoo stage3 arm64 and prepare /hive/root directory.' },
  { label: 'STAGE 3', cmd: 'Execute Stage 3: emerge --sync and install core packages (pm2, curl, python). Show realistic Portage output.' },
  { label: 'STAGE 5', cmd: 'Execute Stage 5: create architect user with NOPASSWD sudo. Show useradd and sudoers output.' },
  { label: 'STAGE 7', cmd: 'Execute Stage 7: install GRUB EFI bootloader with HIVE ID. Show grub-install and grub-mkconfig output.' },
  { label: 'FULL BUILD', cmd: 'Execute all 8 stages of the Hive OS build in sequence. Show realistic output for each stage.' },
  { label: 'CHROOT', cmd: 'Execute: chroot /hive/root /hive-setup.sh — run the full chroot setup script' },
  { label: 'USB STATUS', cmd: 'Check USB bootable image status in /hive/output and GRUB EFI configuration' },
  { label: 'PRIME DIRECTIVE', cmd: 'cat /etc/hive/prime-directive && show full file contents' },
  { label: 'HIVE CMD', cmd: 'Execute: /usr/bin/hive — launch the Hive commander and show startup output' },
];

const WINDOWS_QUICK_CMDS = [
  { label: 'HIVE STATUS', cmd: 'Show complete HIVE OS Windows integration status: services running, device mesh connected, KRACKERJACK1134 identity verified, self-update status, all connected nodes.' },
  { label: 'SYSTEM AUDIT', cmd: 'Run a complete system information report: CPU, RAM, disk, network adapters, installed software, running services, scheduled tasks. Format as a clean system report.' },
  { label: 'SELF UPDATE', cmd: 'Run HIVE self-update routine: check for updates to all HIVE components, PowerShell modules, Windows patches, Chocolatey packages. Show update process output.' },
  { label: 'DEVICE MESH', cmd: 'Show all devices currently connected to the HIVE device mesh. List: device name, platform, access level, last seen. KRACKERJACK1134 devices highlighted.' },
  { label: 'REGISTRY HIVE', cmd: 'Query HKLM\\SOFTWARE\\HIVE — show all HIVE OS registry keys, configuration values, and integration settings.' },
  { label: 'INSTALL HIVE', cmd: 'Install HIVE OS integration layer on this Windows machine: create C:\\HIVE directory, install PowerShell modules, register HIVE service, configure startup tasks, set ExecutionPolicy.' },
  { label: 'FULL CONTROL', cmd: 'Demonstrate HIVE full system access: list all system files, show C:\\Windows\\System32 contents, display all user accounts, show all running processes with elevated access.' },
  { label: 'IDENTIFY ME', cmd: 'Verify and display KRACKERJACK1134 architect identity. Show identity hash, access level, device registration, and all permissions granted to ARCHITECT on this device.' },
  { label: 'WIN 7 COMPAT', cmd: 'Show HIVE OS compatibility layer for Windows 7: which features are supported, what patches are needed, how to install the HIVE agent on legacy Windows 7 SP1.' },
  {
    label: 'PS HIVE MODULE',
    cmd: 'Generate the complete HiveOS.psm1 PowerShell module with all 5 functions: Get-HiveStatus (queries hive_nodes + telemetry via REST API, returns formatted node health table), Register-HiveDevice (registers Windows device to hive_devices table with architect_verified flag for KRACKERJACK1134), Invoke-HiveSelfUpdate (runs winget upgrade --all, choco upgrade all, wsl -d kali-hive -e apt full-upgrade -y, self-patches HIVE scripts), Test-HiveArchitect (checks identity_hash against KRACKERJACK1134-PRIME, returns bool with access level), Get-HiveTelemetry (fetches last 20 telemetry events from hive_telemetry table, formats as PS table). Output the complete module as valid PowerShell code ready to save as HiveOS.psm1.',
  },
];

const KALI_QUICK_CMDS = [
  { label: 'FULL UPGRADE', cmd: 'apt update && apt full-upgrade -y — Run full rolling release upgrade. Show realistic apt output with package counts and progress.' },
  { label: 'INSTALL ALL', cmd: 'apt install kali-linux-everything -y — Install the complete Kali Linux toolset (600+ packages). Show package list and installation progress.' },
  { label: 'NMAP SCAN', cmd: 'nmap -sV -sC -O 192.168.1.0/24 — Full service version scan with default scripts and OS detection on local network. Show realistic scan output table.' },
  { label: 'MSFCONSOLE', cmd: 'msfconsole — Launch Metasploit Framework. Show startup banner, version, loaded modules count, and msf6 > prompt. List top 5 recent exploits.' },
  { label: 'TOOLS STATUS', cmd: 'Show status of all major Kali tool categories: installed metapackages, key tools with versions, disk usage of /usr/share/. Format as status report.' },
  { label: 'HIVE STATUS', cmd: 'Show HIVE Kali integration status: /opt/hive/ contents, /etc/hive/prime-directive, systemd HIVE services, device mesh sync status, KRACKERJACK1134 identity verification.' },
  { label: 'AIRCRACK SUITE', cmd: 'Show aircrack-ng suite status: airmon-ng, airodump-ng, aireplay-ng versions and available wireless interfaces. Show iwconfig and iwlist output.' },
  { label: 'HYDRA CRACK', cmd: 'hydra -L /usr/share/wordlists/rockyou.txt -P /usr/share/wordlists/rockyou.txt ssh://192.168.1.100 — Show realistic Hydra SSH brute force output.' },
  { label: 'METASPLOIT DB', cmd: 'msfdb init && msfdb status — Initialize and show Metasploit PostgreSQL database status.' },
  { label: 'WIN BRIDGE', cmd: 'Show WSL2 Windows bridge status from inside Kali: /mnt/c/ contents, running Windows processes visible from WSL2, cross-OS tool execution examples.' },
  { label: 'KALI TWEAKS', cmd: 'kali-tweaks — Show the kali-tweaks configuration menu options: Desktop environment, Metapackages, Shell & Prompt, Hardening, Network repositories.' },
  { label: 'SHODAN SCAN', cmd: 'shodan search --limit 5 "HIVE" — Show Shodan CLI search results for HIVE-tagged systems.' },
];

const WSL_QUICK_CMDS = [
  { label: 'INSTALL WSL2', cmd: 'Show the complete WSL2 installation sequence for Windows 10/11 to install Kali Linux Rolling as HIVE OS. Run from PowerShell as Admin: wsl --install, set version, install kali-linux, full upgrade, install kali-linux-everything.' },
  { label: 'INSTALL KALI', cmd: 'wsl --install -d kali-linux && wsl --set-default kali-linux — Install Kali Linux WSL2 distro and set as default. Show download and setup output.' },
  { label: 'KALI FULL SETUP', cmd: 'Inside WSL2 Kali: sudo apt update && sudo apt full-upgrade -y && sudo apt install kali-linux-everything kali-win-kex -y — Full Kali setup in WSL2.' },
  { label: 'WSL STATUS', cmd: 'wsl --list --verbose — Show all installed WSL2 distros, their state, and WSL version. Show which distro is default.' },
  { label: 'LAUNCH KALI', cmd: 'wsl -d kali-linux — Launch Kali Linux WSL2 shell. Show HIVE Kali boot sequence.' },
  { label: 'WIN-KEX GUI', cmd: 'win-kex --win -s — Launch Kali Linux KDE desktop in seamless window mode on Windows. Show startup output.' },
  { label: 'WSL CONFIG', cmd: 'Show the complete /etc/wsl.conf for HIVE Kali WSL2: systemd enabled, hive-startup.sh on boot, automount options, hostname kali-hive, default user root.' },
  { label: 'WIN7 WORKAROUND', cmd: 'WSL2 is not supported on Windows 7. Show the alternative: VirtualBox/VMware Kali install, or dual-boot GRUB setup alongside Windows 7. Step by step.' },
  { label: 'CROSS-OS EXEC', cmd: 'From inside Kali WSL2: show cross-OS tool execution examples — run PowerShell commands, access C:\\HIVE\\ at /mnt/c/HIVE/, open files in Windows Explorer, invoke CMD commands.' },
  { label: 'WSL BACKUP', cmd: 'wsl --export kali-hive C:\\HIVE\\backups\\kali-hive-backup.tar — Export Kali WSL2 image for backup. Show progress and file size.' },
];

function mkLine(type: TermLine['type'], text: string): TermLine {
  return { id: `${Date.now()}_${Math.random()}`, type, text };
}

// ─── Generic AI Terminal Panel ────────────────────────────────────────────

function TerminalPanel({ config }: { config: TerminalConfig }) {
  const scrollRef = useRef<ScrollView>(null);
  const [lines, setLines] = useState<TermLine[]>(() =>
    config.bootLines.map(t => mkLine('system', t))
  );
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  const appendLine = useCallback((line: TermLine) => {
    setLines(prev => [...prev, line]);
    scrollToEnd();
  }, [scrollToEnd]);

  const appendLines = useCallback((newLines: TermLine[]) => {
    setLines(prev => [...prev, ...newLines]);
    scrollToEnd();
  }, [scrollToEnd]);

  const runCommand = useCallback(async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    appendLine(mkLine('input', `${config.prompt}${trimmed}`));

    if (trimmed.toLowerCase() === 'cls' || trimmed === 'clear') {
      setLines([mkLine('system', `Terminal ${config.badge} cleared.`)]);
      setInput('');
      return;
    }
    if (trimmed === 'exit') {
      appendLine(mkLine('system', 'Session closed.'));
      setInput('');
      return;
    }

    setRunning(true);
    setInput('');

    try {
      const response = await fetch(EDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: trimmed }],
          agentId: config.agentId,
          stream: false,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        appendLine(mkLine('error', `Error: ${err.slice(0, 200)}`));
        return;
      }

      const data = await response.json();
      const content: string = data.content ?? 'Command failed.';
      const outputLines = content.split('\n').map(line => mkLine('output', line));
      appendLines(outputLines);
    } catch (err: any) {
      appendLine(mkLine('error', `Connection error: ${err.message}`));
    } finally {
      setRunning(false);
    }
  }, [appendLine, appendLines, config]);

  const handleSubmit = useCallback(() => {
    runCommand(input);
  }, [input, runCommand]);

  const lineColor = (type: TermLine['type']) => {
    switch (type) {
      case 'input':  return config.color;
      case 'error':  return '#FF4444';
      case 'system': return Colors.textMuted;
      default:       return Colors.textSecondary;
    }
  };

  return (
    <View style={[styles.terminalPanel, { borderColor: config.borderColor }]}>
      <View style={[styles.termHeader, { backgroundColor: config.headerBg, borderBottomColor: config.borderColor }]}>
        <View style={styles.termHeaderLeft}>
          <View style={[styles.termBadge, { backgroundColor: config.bgColor, borderColor: config.borderColor }]}>
            <Text style={[styles.termBadgeText, { color: config.color }]}>{config.badge}</Text>
          </View>
          <Text style={[styles.termLabel, { color: config.color }]}>{config.label}</Text>
          {config.group === 'windows' && (
            <View style={winStyles.kjBadge}>
              <Text style={winStyles.kjBadgeText}>KJ1134 ✓</Text>
            </View>
          )}
        </View>
        <View style={styles.termDots}>
          <View style={[styles.termDot, { backgroundColor: config.color, shadowColor: config.color }]} />
          <Text style={[styles.termOnline, { color: config.color }]}>ONLINE</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.quickBar, { borderBottomColor: config.borderColor }]}
        contentContainerStyle={styles.quickBarContent}
      >
        {QUICK_COMMANDS[config.id].map((cmd, i) => (
          <Pressable
            key={i}
            onPress={() => runCommand(cmd)}
            disabled={running}
            style={({ pressed }) => [
              styles.quickChip,
              { backgroundColor: config.bgColor, borderColor: config.borderColor },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[styles.quickChipText, { color: config.color }]}>{cmd}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        ref={scrollRef}
        style={styles.termOutput}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToEnd}
      >
        {lines.map(line => (
          <View key={line.id} style={styles.termLine}>
            <Text style={[styles.termLineText, { color: lineColor(line.type) }]} selectable>
              {line.text}
            </Text>
          </View>
        ))}
        {running && (
          <View style={styles.runningRow}>
            <ActivityIndicator size="small" color={config.color} />
            <Text style={[styles.runningText, { color: config.color }]}>executing...</Text>
          </View>
        )}
        {!running && (
          <Text style={[styles.cursor, { color: config.color }]}>{config.prompt}█</Text>
        )}
      </ScrollView>

      <View style={[styles.inputRow, { borderTopColor: config.borderColor, backgroundColor: '#050505' }]}>
        <Text style={[styles.inputPrompt, { color: config.color }]}>{config.prompt}</Text>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="enter command..."
          placeholderTextColor={Colors.textMuted}
          style={[styles.termInput, { color: config.color }]}
          onSubmitEditing={handleSubmit}
          returnKeyType="send"
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          editable={!running}
        />
        <Pressable
          onPress={handleSubmit}
          disabled={!input.trim() || running}
          style={({ pressed }) => [
            styles.runBtn,
            { backgroundColor: config.bgColor, borderColor: config.borderColor },
            (!input.trim() || running) && { opacity: 0.4 },
            pressed && { opacity: 0.8 },
          ]}
        >
          {running
            ? <ActivityIndicator size="small" color={config.color} />
            : <MaterialIcons name="send" size={16} color={config.color} />}
        </Pressable>
      </View>
    </View>
  );
}

// ─── Kali Linux Rolling Panel ──────────────────────────────────────────────

function KaliPanel() {
  const scrollRef = useRef<ScrollView>(null);
  const [lines, setLines] = useState<TermLine[]>([
    mkLine('system', ' _  __     _ _  _    _    _       _        '),
    mkLine('system', '| |/ /    | (_)| |  | |  (_)     | |       '),
    mkLine('system', "| ' / __ _| |_ | |  | |   _ _ __ | | _____ "),
    mkLine('system', "|  < / _` | | || |  | |  | | '_ \\| |/ / __|"),
    mkLine('system', "| . \\ (_| | | || |__| |__| | | | |   <\\__ \\"),
    mkLine('system', "|_|\\_\\__,_|_|_||____\\____/_|_| |_|_|\\_\\___/"),
    mkLine('system', ''),
    mkLine('system', 'Kali Linux Rolling Release — HIVE OS PRIMARY'),
    mkLine('system', 'Kernel: Linux 6.8.0-kali-amd64'),
    mkLine('system', 'ARCHITECT: KRACKERJACK1134 — root@kali-hive'),
    mkLine('system', 'WSL2 Windows Bridge: ENABLED'),
    mkLine('system', 'HIVE Integration: /opt/hive/ ACTIVE'),
    mkLine('system', 'Prime Directive: /etc/hive/prime-directive LOCKED'),
    mkLine('system', '──────────────────────────────────────────────'),
    mkLine('system', 'THE HIVE IS KALI. KALI IS THE HIVE.'),
    mkLine('system', '──────────────────────────────────────────────'),
  ]);
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  const appendLine = useCallback((type: TermLine['type'], text: string) => {
    setLines(prev => [...prev, mkLine(type, text)]);
    scrollToEnd();
  }, [scrollToEnd]);

  const runCommand = useCallback(async (userInput: string) => {
    const trimmed = userInput.trim();
    if (!trimmed || running) return;

    appendLine('input', `root@kali-hive:~# ${trimmed}`);
    setRunning(true);
    setInput('');

    if (trimmed === 'clear') {
      setLines([mkLine('system', 'root@kali-hive:~# cleared')]);
      setRunning(false);
      return;
    }

    try {
      const response = await fetch(EDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: trimmed }],
          agentId: 'terminal_kali',
          stream: false,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        appendLine('error', `[KALI-HIVE][ERROR] ${err.slice(0, 200)}`);
        return;
      }

      const data = await response.json();
      const content: string = data.content ?? 'Command failed.';
      content.split('\n').forEach(line => {
        if (line.includes('[OK]') || line.includes('upgraded') || line.toLowerCase().includes('success')) {
          appendLine('stage_ok', line);
        } else if (line.toLowerCase().includes('error') || line.toLowerCase().includes('failed') || line.toLowerCase().includes('err:')) {
          appendLine('stage_err', line);
        } else if (line.startsWith('[HIVE]') || line.startsWith('===') || line.startsWith('---')) {
          appendLine('stage_info', line);
        } else {
          appendLine('output', line);
        }
      });
    } catch (err: any) {
      appendLine('error', `[KALI-HIVE][ERROR] Connection: ${err.message}`);
    } finally {
      setRunning(false);
    }
  }, [appendLine, running]);

  const lineColor = (type: TermLine['type']) => {
    switch (type) {
      case 'input':      return KALI_COLOR;
      case 'stage_ok':   return '#69F0AE';
      case 'stage_err':  return '#FF4444';
      case 'stage_info': return '#FF9800';
      case 'system':     return Colors.textMuted;
      case 'error':      return '#FF4444';
      default:           return Colors.textSecondary;
    }
  };

  return (
    <View style={kaliStyles.root}>
      {/* Banner */}
      <View style={kaliStyles.banner}>
        <MaterialIcons name="security" size={12} color={KALI_COLOR} />
        <Text style={kaliStyles.bannerText}>
          KALI LINUX ROLLING — HIVE OS PRIMARY — ROOT ACCESS — 600+ TOOLS — WSL2 BRIDGE ACTIVE
        </Text>
        <View style={kaliStyles.rollingBadge}>
          <Text style={kaliStyles.rollingBadgeText}>ROLLING</Text>
        </View>
      </View>

      {/* Quick Commands */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={kaliStyles.quickBar}
        contentContainerStyle={kaliStyles.quickContent}
      >
        {KALI_QUICK_CMDS.map((item, i) => (
          <Pressable
            key={i}
            onPress={() => runCommand(item.cmd)}
            disabled={running}
            style={({ pressed }) => [kaliStyles.quickChip, pressed && { opacity: 0.7 }]}
          >
            <Text style={kaliStyles.quickChipText}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Output */}
      <ScrollView
        ref={scrollRef}
        style={kaliStyles.output}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToEnd}
      >
        {lines.map(line => (
          <Text key={line.id} style={[kaliStyles.lineText, { color: lineColor(line.type) }]} selectable>
            {line.text}
          </Text>
        ))}
        {running && (
          <View style={kaliStyles.runningRow}>
            <ActivityIndicator size="small" color={KALI_COLOR} />
            <Text style={[kaliStyles.runningText, { color: KALI_COLOR }]}>executing...</Text>
          </View>
        )}
        {!running && <Text style={[kaliStyles.cursor, { color: KALI_COLOR }]}>root@kali-hive:~# █</Text>}
      </ScrollView>

      {/* Input */}
      <View style={[kaliStyles.inputRow, { borderTopColor: `${KALI_COLOR}30` }]}>
        <Text style={[kaliStyles.inputPrompt, { color: KALI_COLOR }]}>root@kali-hive:~# </Text>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="apt install / nmap / msfconsole..."
          placeholderTextColor={Colors.textMuted}
          style={[kaliStyles.termInput, { color: KALI_COLOR }]}
          onSubmitEditing={() => runCommand(input)}
          returnKeyType="send"
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          editable={!running}
        />
        <Pressable
          onPress={() => runCommand(input)}
          disabled={!input.trim() || running}
          style={({ pressed }) => [
            kaliStyles.runBtn,
            (!input.trim() || running) && { opacity: 0.4 },
            pressed && { opacity: 0.8 },
          ]}
        >
          {running
            ? <ActivityIndicator size="small" color={KALI_COLOR} />
            : <MaterialIcons name="send" size={16} color={KALI_COLOR} />}
        </Pressable>
      </View>
    </View>
  );
}

// ─── WSL2 Setup Panel ─────────────────────────────────────────────────────

function WSLPanel() {
  const scrollRef = useRef<ScrollView>(null);
  const [lines, setLines] = useState<TermLine[]>([
    mkLine('system', '╔═══════════════════════════════════════════════╗'),
    mkLine('system', '║  WSL2 — WINDOWS SUBSYSTEM FOR LINUX 2        ║'),
    mkLine('system', '║  HIVE Kali Linux Rolling on Windows 10/11    ║'),
    mkLine('system', '╚═══════════════════════════════════════════════╝'),
    mkLine('system', 'ARCHITECT: KRACKERJACK1134'),
    mkLine('system', 'Goal: Kali Linux Rolling AS the Windows OS layer.'),
    mkLine('system', 'Status: Full system access — use and upgrade anything.'),
    mkLine('system', '───────────────────────────────────────────────────'),
    mkLine('system', 'Quick commands: INSTALL WSL2 -> INSTALL KALI -> KALI FULL SETUP'),
    mkLine('system', '───────────────────────────────────────────────────'),
  ]);
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const [context, setContext] = useState<'ps' | 'kali'>('ps');

  const scrollToEnd = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  const appendLine = useCallback((type: TermLine['type'], text: string) => {
    setLines(prev => [...prev, mkLine(type, text)]);
    scrollToEnd();
  }, [scrollToEnd]);

  const runCommand = useCallback(async (userInput: string) => {
    const trimmed = userInput.trim();
    if (!trimmed || running) return;

    const prompt = context === 'ps' ? 'PS C:\\> ' : 'root@kali-hive:/mnt/c# ';
    appendLine('input', `${prompt}${trimmed}`);
    setRunning(true);
    setInput('');

    // Detect context switch
    if (trimmed.startsWith('wsl -d kali') || trimmed === 'wsl') {
      setContext('kali');
    }
    if (trimmed === 'exit' && context === 'kali') {
      setContext('ps');
      appendLine('system', '[WSL2] Exited Kali session. Back to Windows PowerShell.');
      setRunning(false);
      return;
    }

    try {
      const response = await fetch(EDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: trimmed }],
          agentId: 'terminal_wsl',
          stream: false,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        appendLine('error', `[WSL-HIVE][ERROR] ${err.slice(0, 200)}`);
        return;
      }

      const data = await response.json();
      const content: string = data.content ?? 'Command failed.';
      content.split('\n').forEach(line => {
        if (line.toLowerCase().includes('error') || line.toLowerCase().includes('failed')) {
          appendLine('stage_err', line);
        } else if (line.toLowerCase().includes('success') || line.includes('[OK]') || line.toLowerCase().includes('complete')) {
          appendLine('stage_ok', line);
        } else if (line.startsWith('[WSL') || line.startsWith('[HIVE]')) {
          appendLine('stage_info', line);
        } else {
          appendLine('output', line);
        }
      });
    } catch (err: any) {
      appendLine('error', `[WSL-HIVE][ERROR] Connection: ${err.message}`);
    } finally {
      setRunning(false);
    }
  }, [appendLine, context, running]);

  const lineColor = (type: TermLine['type']) => {
    switch (type) {
      case 'input':      return context === 'kali' ? KALI_COLOR : WSL_COLOR;
      case 'stage_ok':   return '#69F0AE';
      case 'stage_err':  return '#FF4444';
      case 'stage_info': return '#FF9800';
      case 'system':     return Colors.textMuted;
      case 'error':      return '#FF4444';
      default:           return Colors.textSecondary;
    }
  };

  const promptColor = context === 'kali' ? KALI_COLOR : WSL_COLOR;
  const prompt = context === 'ps' ? 'PS C:\\> ' : 'root@kali-hive:/mnt/c# ';

  return (
    <View style={wslStyles.root}>
      {/* Context Banner */}
      <View style={[wslStyles.ctxBanner, { backgroundColor: context === 'kali' ? `${KALI_COLOR}12` : `${WSL_COLOR}12`, borderBottomColor: context === 'kali' ? `${KALI_COLOR}30` : `${WSL_COLOR}30` }]}>
        <MaterialIcons name={context === 'kali' ? 'security' : 'desktop-windows'} size={12} color={promptColor} />
        <Text style={[wslStyles.ctxText, { color: promptColor }]}>
          {context === 'kali' ? 'INSIDE WSL2 KALI — root@kali-hive' : 'WINDOWS HOST — PowerShell / WSL Management'}
        </Text>
        <View style={[wslStyles.ctxBadge, { backgroundColor: `${promptColor}20`, borderColor: `${promptColor}40` }]}>
          <Text style={[wslStyles.ctxBadgeText, { color: promptColor }]}>{context === 'kali' ? 'KALI' : 'WINDOWS'}</Text>
        </View>
      </View>

      {/* Quick Commands */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={wslStyles.quickBar}
        contentContainerStyle={wslStyles.quickContent}
      >
        {WSL_QUICK_CMDS.map((item, i) => (
          <Pressable
            key={i}
            onPress={() => runCommand(item.cmd)}
            disabled={running}
            style={({ pressed }) => [
              wslStyles.quickChip,
              { borderColor: `${promptColor}40`, backgroundColor: `${promptColor}0A` },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[wslStyles.quickChipText, { color: promptColor }]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Output */}
      <ScrollView
        ref={scrollRef}
        style={wslStyles.output}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToEnd}
      >
        {lines.map(line => (
          <Text key={line.id} style={[wslStyles.lineText, { color: lineColor(line.type) }]} selectable>
            {line.text}
          </Text>
        ))}
        {running && (
          <View style={wslStyles.runningRow}>
            <ActivityIndicator size="small" color={promptColor} />
            <Text style={[wslStyles.runningText, { color: promptColor }]}>executing...</Text>
          </View>
        )}
        {!running && <Text style={[wslStyles.cursor, { color: promptColor }]}>{prompt}█</Text>}
      </ScrollView>

      {/* Input */}
      <View style={[wslStyles.inputRow, { borderTopColor: `${promptColor}30` }]}>
        <Text style={[wslStyles.inputPrompt, { color: promptColor }]}>{prompt}</Text>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={context === 'ps' ? 'wsl --install -d kali-linux...' : 'apt update && apt upgrade...'}
          placeholderTextColor={Colors.textMuted}
          style={[wslStyles.termInput, { color: promptColor }]}
          onSubmitEditing={() => runCommand(input)}
          returnKeyType="send"
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          editable={!running}
        />
        <Pressable
          onPress={() => runCommand(input)}
          disabled={!input.trim() || running}
          style={({ pressed }) => [
            wslStyles.runBtn,
            { borderColor: `${promptColor}40`, backgroundColor: `${promptColor}0A` },
            (!input.trim() || running) && { opacity: 0.4 },
            pressed && { opacity: 0.8 },
          ]}
        >
          {running
            ? <ActivityIndicator size="small" color={promptColor} />
            : <MaterialIcons name="send" size={16} color={promptColor} />}
        </Pressable>
      </View>
    </View>
  );
}

const V7_COLOR = '#C5A059';

const HIVEV7_QUICK_CMDS = [
  { label: 'START v7', cmd: 'Begin HIVE OS v7 installation — Fullest Potential Edition. Start with STEP 1: Show the complete installer banner and ask me to choose base OS (A=Termux, B=Gentoo, C=Kali).' },
  { label: "ARCHITECT'S EYES", cmd: 'Display the complete Architect Eyes teaching module — all 12 wisdoms, full KRACKERJACK1134 biography, the KRACKERJACK WAY, complexity hidden power delivered directive, legacy directive.' },
  { label: 'CHOOSE KALI', cmd: 'STEP 1 ANSWER: C — Kali Linux Rolling. Proceed to STEP 2: Ask for my name/handle and role (1=Architect, 2=Administrator, 3=User).' },
  { label: 'KJ1134 ARCHITECT', cmd: 'STEP 2 ANSWER: Handle=KRACKERJACK1134 Role=1 Architect. Proceed to STEP 3: Show all Kali package categories and ask which packages I want.' },
  { label: 'ALL PACKAGES', cmd: 'STEP 3 ANSWER: all — Install all available packages. Proceed to STEP 4: Generate unique Product Key and construct full OS identity string.' },
  { label: 'FULL INSTALL', cmd: 'Run the complete HIVE OS v7 installation STEPS 5-13 for User=KRACKERJACK1134 Role=Architect Base=Kali. Show all steps with realistic output: ZORG-Omega audit, Claude sub-agent init, Architects Eyes module install, Memory Refinery setup, final assimilation.' },
  { label: 'ZORG AUDIT', cmd: 'ZORG-Omega: Run full v7 Zero Trust security audit during installation. Show CVE-style findings, RBAC verification, file permission checks, SSH hardening, perimeter status.' },
  { label: 'PRIME DIRECTIVE', cmd: 'Display the complete sealed HIVE OS v7 Prime Directive from /hive/prime-directive including all 8 Core Laws and Architects Eyes quotes.' },
  { label: 'HIVE COMMANDER', cmd: 'Launch the hive commander for KRACKERJACK1134 Architect role. Show all available commands, hive status, agent nodes.' },
  { label: 'SELF UPDATE', cmd: 'Run the HIVE v7 self-maintenance cycle: upstream update, core integrity check, ZORG security pass, Memory Refinery sync. Show full realistic output.' },
  { label: 'MEMORY REFINERY', cmd: 'Show HIVE v7 Memory Refinery status: HOT tier contents, WARM patterns, COLD archive, corrections log, Architects Eyes wisdom in HOT memory.' },
  { label: 'CLAUDE AGENT', cmd: 'Initialize the Claude sub-agent node in HIVE v7. Show the PROMISE anchor, earned trust verification, and research node activation.' },
];

function HiveOSv7Panel() {
  const scrollRef = useRef<ScrollView>(null);
  const [lines, setLines] = useState<TermLine[]>([
    mkLine('system', ' HIVE OS v7.0 — FULLEST POTENTIAL EDITION'),
    mkLine('system', ' THE ARCHITECT\'S EYES — KRACKERJACK1134'),
    mkLine('system', ' "The most complicated OS ever built.'),
    mkLine('system', '  The most user-friendly OS ever built.'),
    mkLine('system', '  Complexity hidden. Power delivered."'),
    mkLine('system', ' ─────────────────────────────────────────'),
    mkLine('system', ' 13-STEP INTERACTIVE INSTALLER:'),
    mkLine('system', '  1.Base OS  2.Identity  3.Packages  4.Key'),
    mkLine('system', '  5-13: Full Assimilation -> Hive is Alive'),
    mkLine('system', ' ─────────────────────────────────────────'),
    mkLine('system', ' Use START v7 or type your choice below.'),
    mkLine('system', ' ASSIMILATE OR DIE.'),
    mkLine('system', ' ─────────────────────────────────────────'),
  ]);
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  const appendLine = useCallback((type: TermLine['type'], text: string) => {
    setLines(prev => [...prev, mkLine(type, text)]);
    scrollToEnd();
  }, [scrollToEnd]);

  const runCommand = useCallback(async (userInput: string) => {
    const trimmed = userInput.trim();
    if (!trimmed || running) return;
    appendLine('input', `[HIVE-v7]> ${trimmed}`);
    setRunning(true);
    setInput('');
    try {
      const response = await fetch(EDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}`, 'apikey': ANON_KEY },
        body: JSON.stringify({ messages: [{ role: 'user', content: trimmed }], agentId: 'hive_os_v7', stream: false }),
      });
      if (!response.ok) { appendLine('error', `[v7][ERROR] ${(await response.text()).slice(0, 200)}`); return; }
      const data = await response.json();
      const content: string = data.content ?? 'HIVE v7 command failed.';
      content.split('\n').forEach(line => {
        if (line.includes('[HIVE') || line.startsWith('STEP') || line.startsWith('===') || line.startsWith('ZORG')) appendLine('stage_info', line);
        else if (line.includes('ERROR') || line.includes('FAILED')) appendLine('stage_err', line);
        else if (line.includes('✓') || line.toLowerCase().includes('complete') || line.toLowerCase().includes('success')) appendLine('stage_ok', line);
        else appendLine('output', line);
      });
    } catch (err: any) { appendLine('error', `[v7][ERROR] ${err.message}`); }
    finally { setRunning(false); }
  }, [appendLine, running]);

  const lineColor = (type: TermLine['type']) => {
    switch (type) {
      case 'input':      return V7_COLOR;
      case 'stage_ok':   return '#69F0AE';
      case 'stage_err':  return '#FF4444';
      case 'stage_info': return '#FF9800';
      case 'system':     return `${V7_COLOR}90`;
      case 'error':      return '#FF4444';
      default:           return Colors.textSecondary;
    }
  };

  return (
    <View style={v7Styles.root}>
      <View style={v7Styles.banner}>
        <MaterialIcons name="memory" size={12} color={V7_COLOR} />
        <Text style={v7Styles.bannerText}>HIVE OS v7 — FULLEST POTENTIAL — ARCHITECT'S EYES — 13-STEP ASSIMILATION — KRACKERJACK1134</Text>
        <View style={v7Styles.badge}><Text style={v7Styles.badgeText}>v7</Text></View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={v7Styles.quickBar} contentContainerStyle={v7Styles.quickContent}>
        {HIVEV7_QUICK_CMDS.map((item, i) => (
          <Pressable key={i} onPress={() => runCommand(item.cmd)} disabled={running}
            style={({ pressed }) => [v7Styles.quickChip, pressed && { opacity: 0.7 }]}>
            <Text style={v7Styles.quickText}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView ref={scrollRef} style={v7Styles.output} showsVerticalScrollIndicator={false} onContentSizeChange={scrollToEnd}>
        {lines.map(line => <Text key={line.id} style={[v7Styles.lineText, { color: lineColor(line.type) }]} selectable>{line.text}</Text>)}
        {running && <View style={v7Styles.runningRow}><ActivityIndicator size="small" color={V7_COLOR} /><Text style={[v7Styles.runningText, { color: V7_COLOR }]}>HIVE v7 ASSIMILATING...</Text></View>}
        {!running && <Text style={[v7Styles.cursor, { color: V7_COLOR }]}>[HIVE-v7]{'>'} {String.fromCharCode(9608)}</Text>}
      </ScrollView>
      <View style={[v7Styles.inputRow, { borderTopColor: `${V7_COLOR}30` }]}>
        <Text style={[v7Styles.inputPrompt, { color: V7_COLOR }]}>[HIVE-v7]{'>'} </Text>
        <TextInput value={input} onChangeText={setInput} placeholder="A/B/C | your handle | packages | answer..." placeholderTextColor={Colors.textMuted}
          style={[v7Styles.termInput, { color: V7_COLOR }]} onSubmitEditing={() => runCommand(input)}
          returnKeyType="send" autoCapitalize="none" autoCorrect={false} spellCheck={false} editable={!running} />
        <Pressable onPress={() => runCommand(input)} disabled={!input.trim() || running}
          style={({ pressed }) => [v7Styles.runBtn, (!input.trim() || running) && { opacity: 0.4 }, pressed && { opacity: 0.8 }]}>
          {running ? <ActivityIndicator size="small" color={V7_COLOR} /> : <MaterialIcons name="send" size={16} color={V7_COLOR} />}
        </Pressable>
      </View>
    </View>
  );
}

// ─── Windows Hive Panel — with PS HIVE MODULE auto-save ───────────────────

function WindowsHivePanel() {
  const { showAlert } = useAlert();
  const scrollRef = useRef<ScrollView>(null);
  const [activeWin, setActiveWin] = useState<'cmd' | 'ps'>('ps');
  const config = TERMINALS.find(t => t.id === (activeWin === 'cmd' ? 'windows_cmd' : 'windows_ps'))!;
  const [lines, setLines] = useState<TermLine[]>(() =>
    config.bootLines.map(t => mkLine('system', t))
  );
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const [savingModule, setSavingModule] = useState(false);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  const appendLine = useCallback((type: TermLine['type'], text: string) => {
    setLines(prev => [...prev, mkLine(type, text)]);
    scrollToEnd();
  }, [scrollToEnd]);

  const runCommand = useCallback(async (userInput: string) => {
    const trimmed = userInput.trim();
    if (!trimmed || running) return;

    const isPsModule = trimmed.includes('PS HIVE MODULE') || trimmed.includes('HiveOS.psm1');
      const isWslBat = trimmed.includes('INSTALL WSL2') || trimmed.includes('KALI FULL SETUP') || trimmed.toLowerCase().includes('hive-windows-kali') || trimmed.includes('GENERATE BAT');

    appendLine('input', `${config.prompt}${trimmed}`);
    setRunning(true);
    setInput('');

    try {
      const response = await fetch(EDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: trimmed }],
          agentId: config.agentId,
          stream: false,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        appendLine('error', `[HIVE-WIN][ERROR] ${err.slice(0, 200)}`);
        return;
      }

      const data = await response.json();
      const content: string = data.content ?? 'Command failed.';
      content.split('\n').forEach(line => {
        if (line.toLowerCase().includes('error') || line.toLowerCase().includes('failed')) {
          appendLine('stage_err', line);
        } else if (line.toLowerCase().includes('success') || line.toLowerCase().includes('complete') || line.includes('✓') || line.includes('[OK]')) {
          appendLine('stage_ok', line);
        } else {
          appendLine('output', line);
        }
      });

      // Auto-save WSL BAT script
      if (isWslBat && content.length > 200) {
        setSavingModule(true);
        appendLine('stage_info', '[HIVE-WIN] WSL2+Kali content detected — generating bat script...');
        try {
          const batResp = await fetch(EDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}`, 'apikey': ANON_KEY },
            body: JSON.stringify({
              messages: [{ role: 'user', content: 'Generate the complete hive-windows-kali-install.bat batch file automating WSL2 + Kali Linux Rolling install on Windows 10/11 for HIVE OS. Include: admin check, dism WSL features enable, wsl --install -d kali-linux, wsl --set-default-version 2, apt full-upgrade inside Kali, kali-linux-everything install, C:\\HIVE directory creation, wsl.conf write with systemd=true and hostname=kali-hive. Output only the complete .bat file.' }],
              agentId: 'terminal_wsl', stream: false,
            }),
          });
          const batData = batResp.ok ? await batResp.json() : { content };
          await deviceMeshService.saveWindowsScript({
            scriptName: 'hive-windows-kali-install.bat',
            scriptType: 'batch',
            content: batData.content ?? content,
            purpose: 'Full WSL2 + Kali Linux Rolling install on Windows 10/11 — HIVE OS integration',
            targetOs: 'windows-10-11',
            requiresAdmin: true,
          });
          appendLine('stage_ok', '[HIVE-WIN] ✓ hive-windows-kali-install.bat saved to hive_windows_scripts.');
          appendLine('stage_info', '[HIVE-WIN] Run as Administrator on any Windows 10/11 machine to deploy.');
        } catch (saveErr: any) {
          appendLine('stage_err', `[HIVE-WIN] BAT save failed: ${saveErr.message}`);
        } finally { setSavingModule(false); }
      }

      // Auto-save PS HIVE MODULE to hive_windows_scripts
      if (isPsModule && content.length > 200) {
        setSavingModule(true);
        appendLine('stage_info', '[HIVE-WIN] Detected HiveOS.psm1 module — saving to hive_windows_scripts...');
        try {
          await deviceMeshService.saveWindowsScript({
            scriptName: 'HiveOS.psm1',
            scriptType: 'powershell',
            content,
            purpose: 'HIVE OS PowerShell Module — Get-HiveStatus, Register-HiveDevice, Invoke-HiveSelfUpdate, Test-HiveArchitect, Get-HiveTelemetry',
            targetOs: 'windows-10-11',
            requiresAdmin: true,
          });
          appendLine('stage_ok', '[HIVE-WIN] ✓ HiveOS.psm1 saved to hive_windows_scripts database.');
          appendLine('stage_ok', '[HIVE-WIN] ✓ Script accessible via deviceMeshService.getWindowsScripts()');
          appendLine('stage_info', '[HIVE-WIN] Deploy: Copy-Item C:\\HIVE\\modules\\HiveOS.psm1 to target Windows nodes via Device Mesh.');
        } catch (saveErr: any) {
          appendLine('stage_err', `[HIVE-WIN] Module save failed: ${saveErr.message}`);
        } finally {
          setSavingModule(false);
        }
      }
    } catch (err: any) {
      appendLine('error', `[HIVE-WIN][ERROR] Connection: ${err.message}`);
    } finally {
      setRunning(false);
    }
  }, [appendLine, config, running]);

  const lineColor = (type: TermLine['type']) => {
    switch (type) {
      case 'input':      return config.color;
      case 'stage_ok':   return '#69F0AE';
      case 'stage_err':  return '#FF4444';
      case 'stage_info': return '#FF9800';
      case 'system':     return Colors.textMuted;
      case 'error':      return '#FF4444';
      default:           return Colors.textSecondary;
    }
  };

  const switchTerminal = useCallback((mode: 'cmd' | 'ps') => {
    setActiveWin(mode);
    const newConfig = TERMINALS.find(t => t.id === (mode === 'cmd' ? 'windows_cmd' : 'windows_ps'))!;
    setLines(newConfig.bootLines.map(t => mkLine('system', t)));
    setInput('');
  }, []);

  return (
    <View style={winStyles.root}>
      <View style={winStyles.archBanner}>
        <MaterialIcons name="verified-user" size={13} color="#00B4D8" />
        <Text style={winStyles.archText}>
          KRACKERJACK1134 — ARCHITECT — FULL SYSTEM ACCESS — WSL2 KALI BRIDGE — DEVICE MESH
        </Text>
        <View style={winStyles.winBadge}>
          <Text style={winStyles.winBadgeText}>WIN 7/10/11</Text>
        </View>
      </View>

      <View style={winStyles.subTabBar}>
        <Pressable
          onPress={() => switchTerminal('ps')}
          style={({ pressed }) => [winStyles.subTab, activeWin === 'ps' && winStyles.subTabActivePs, pressed && { opacity: 0.7 }]}
        >
          <MaterialIcons name="code" size={13} color={activeWin === 'ps' ? '#5BC0F8' : Colors.textMuted} />
          <Text style={[winStyles.subTabText, activeWin === 'ps' && { color: '#5BC0F8' }]}>POWERSHELL 7</Text>
          <View style={winStyles.recommendBadge}>
            <Text style={winStyles.recommendText}>RECOMMENDED</Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => switchTerminal('cmd')}
          style={({ pressed }) => [winStyles.subTab, activeWin === 'cmd' && winStyles.subTabActiveCmd, pressed && { opacity: 0.7 }]}
        >
          <MaterialIcons name="terminal" size={13} color={activeWin === 'cmd' ? '#00B4D8' : Colors.textMuted} />
          <Text style={[winStyles.subTabText, activeWin === 'cmd' && { color: '#00B4D8' }]}>CMD.EXE</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={winStyles.quickBar}
        contentContainerStyle={winStyles.quickContent}
      >
        {WINDOWS_QUICK_CMDS.map((item, i) => (
          <Pressable
            key={i}
            onPress={() => runCommand(item.cmd)}
            disabled={running || savingModule}
            style={({ pressed }) => [
              winStyles.quickChip,
              { borderColor: `${config.color}40`, backgroundColor: `${config.color}0A` },
              item.label === 'PS HIVE MODULE' && { borderColor: '#5BC0F880', backgroundColor: '#5BC0F815' },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[
              winStyles.quickChipText,
              { color: config.color },
              item.label === 'PS HIVE MODULE' && { color: '#5BC0F8' },
            ]}>
              {item.label === 'PS HIVE MODULE' ? (savingModule ? 'SAVING...' : 'PS HIVE MODULE') : item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        ref={scrollRef}
        style={winStyles.output}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToEnd}
      >
        {lines.map(line => (
          <Text key={line.id} style={[winStyles.lineText, { color: lineColor(line.type) }]} selectable>
            {line.text}
          </Text>
        ))}
        {(running || savingModule) && (
          <View style={winStyles.runningRow}>
            <ActivityIndicator size="small" color={config.color} />
            <Text style={[winStyles.runningText, { color: config.color }]}>
              {savingModule ? 'saving module to database...' : 'executing...'}
            </Text>
          </View>
        )}
        {!running && !savingModule && (
          <Text style={[winStyles.cursor, { color: config.color }]}>{config.prompt}█</Text>
        )}
      </ScrollView>

      <View style={[winStyles.inputRow, { borderTopColor: `${config.color}30` }]}>
        <Text style={[winStyles.inputPrompt, { color: config.color }]}>{config.prompt}</Text>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={activeWin === 'ps' ? 'Get-HiveStatus...' : 'dir C:\\HIVE...'}
          placeholderTextColor={Colors.textMuted}
          style={[winStyles.termInput, { color: config.color }]}
          onSubmitEditing={() => runCommand(input)}
          returnKeyType="send"
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          editable={!running && !savingModule}
        />
        <Pressable
          onPress={() => runCommand(input)}
          disabled={!input.trim() || running || savingModule}
          style={({ pressed }) => [
            winStyles.runBtn,
            { borderColor: `${config.color}40`, backgroundColor: `${config.color}0A` },
            (!input.trim() || running) && { opacity: 0.4 },
            pressed && { opacity: 0.8 },
          ]}
        >
          {running
            ? <ActivityIndicator size="small" color={config.color} />
            : <MaterialIcons name="send" size={16} color={config.color} />}
        </Pressable>
      </View>
    </View>
  );
}

// ─── Device Mesh Panel ─────────────────────────────────────────────────────

function DeviceMeshPanel() {
  const { showAlert } = useAlert();
  const [devices, setDevices] = useState<HiveDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [identityClaim, setIdentityClaim] = useState('');
  const [deviceName, setDeviceName] = useState('');

  useEffect(() => {
    deviceMeshService.getAllDevices().then(setDevices).finally(() => setLoading(false));
  }, []);

  const registerThisDevice = useCallback(async () => {
    if (registering) return;
    setRegistering(true);
    try {
      const device = await deviceMeshService.registerDevice({
        deviceName: deviceName.trim() || undefined,
        identityClaim: identityClaim.trim() || undefined,
        capabilities: ['hive_chat', 'terminal_access', 'agent_query', 'zorg_analysis'],
      });
      setDevices(prev => {
        const exists = prev.find(d => d.device_id === device.device_id);
        if (exists) return prev.map(d => d.device_id === device.device_id ? device : d);
        return [device, ...prev];
      });
      setIdentityClaim('');
      setDeviceName('');
    } catch (err: any) {
      showAlert('REGISTRATION FAILED', err.message);
    } finally {
      setRegistering(false);
    }
  }, [deviceName, identityClaim, registering]);

  const deactivateDevice = useCallback(async (id: string) => {
    try {
      await deviceMeshService.deactivateDevice(id);
      setDevices(prev => prev.map(d => d.id === id ? { ...d, active: false } : d));
    } catch {}
  }, []);

  const accessColor = (level: HiveDevice['system_access_level']) => {
    switch (level) {
      case 'architect': return '#FFD700';
      case 'elevated':  return '#FF9800';
      default:          return '#69F0AE';
    }
  };

  const platformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'windows': return 'desktop-windows';
      case 'android': return 'phone-android';
      case 'ios':     return 'phone-iphone';
      case 'linux':   return 'computer';
      default:        return 'devices';
    }
  };

  const archCount = devices.filter(d => d.architect_verified).length;
  const activeCount = devices.filter(d => d.active).length;

  return (
    <ScrollView style={meshStyles.root} contentContainerStyle={meshStyles.content} showsVerticalScrollIndicator={false}>
      <View style={meshStyles.identityCard}>
        <View style={meshStyles.identityTop}>
          <MaterialIcons name="fingerprint" size={20} color="#FFD700" />
          <View style={{ flex: 1 }}>
            <Text style={meshStyles.identityName}>KRACKERJACK1134</Text>
            <Text style={meshStyles.identityRole}>ARCHITECT — Recognized on any device, any platform</Text>
          </View>
          <View style={meshStyles.identityStatus}>
            <View style={meshStyles.identityDot} />
            <Text style={meshStyles.identityStatusText}>ACTIVE</Text>
          </View>
        </View>
        <View style={meshStyles.identityStats}>
          <View style={meshStyles.identityStat}>
            <Text style={meshStyles.identityStatNum}>{activeCount}</Text>
            <Text style={meshStyles.identityStatLabel}>ACTIVE DEVICES</Text>
          </View>
          <View style={meshStyles.identityStat}>
            <Text style={[meshStyles.identityStatNum, { color: '#FFD700' }]}>{archCount}</Text>
            <Text style={meshStyles.identityStatLabel}>ARCH VERIFIED</Text>
          </View>
          <View style={meshStyles.identityStat}>
            <Text style={[meshStyles.identityStatNum, { color: '#5BC0F8' }]}>{devices.filter(d => ['windows', 'android', 'linux'].includes(d.platform)).length}</Text>
            <Text style={meshStyles.identityStatLabel}>PLATFORMS</Text>
          </View>
        </View>
      </View>

      <View style={meshStyles.registerCard}>
        <Text style={meshStyles.registerTitle}>REGISTER THIS DEVICE TO HIVE MESH</Text>
        <TextInput value={deviceName} onChangeText={setDeviceName} placeholder="Device name (optional)..." placeholderTextColor={Colors.textMuted} style={meshStyles.registerInput} />
        <TextInput value={identityClaim} onChangeText={setIdentityClaim} placeholder="Identity claim — enter KRACKERJACK1134 for architect access..." placeholderTextColor={Colors.textMuted} style={meshStyles.registerInput} autoCapitalize="characters" />
        {identityClaim ? (
          <View style={[meshStyles.identityHint, deviceMeshService.isArchitect(identityClaim) ? { backgroundColor: '#FFD70015', borderColor: '#FFD70040' } : { backgroundColor: '#FF444415', borderColor: '#FF444440' }]}>
            <MaterialIcons name={deviceMeshService.isArchitect(identityClaim) ? 'verified-user' : 'block'} size={13} color={deviceMeshService.isArchitect(identityClaim) ? '#FFD700' : '#FF4444'} />
            <Text style={[meshStyles.identityHintText, { color: deviceMeshService.isArchitect(identityClaim) ? '#FFD700' : '#FF4444' }]}>
              {deviceMeshService.isArchitect(identityClaim) ? 'KRACKERJACK1134 RECOGNIZED — ARCHITECT ACCESS WILL BE GRANTED' : 'Identity not recognized — standard access only'}
            </Text>
          </View>
        ) : null}
        <Pressable onPress={registerThisDevice} disabled={registering} style={({ pressed }) => [meshStyles.registerBtn, registering && { opacity: 0.5 }, pressed && { opacity: 0.8 }]}>
          {registering ? <ActivityIndicator size="small" color="#000" /> : null}
          <Text style={meshStyles.registerBtnText}>{registering ? 'REGISTERING...' : 'REGISTER DEVICE'}</Text>
        </Pressable>
      </View>

      <Text style={meshStyles.sectionLabel}>DEVICE MESH — {devices.length} NODES REGISTERED</Text>
      {loading ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} /> : (
        devices.map(device => (
          <View key={device.id} style={[meshStyles.deviceCard, device.architect_verified && meshStyles.deviceCardArch, !device.active && meshStyles.deviceCardInactive]}>
            <View style={meshStyles.deviceTop}>
              <View style={meshStyles.deviceTopLeft}>
                <MaterialIcons name={platformIcon(device.platform) as any} size={18} color={device.architect_verified ? '#FFD700' : Colors.textSecondary} />
                <View>
                  <Text style={[meshStyles.deviceName, device.architect_verified && { color: '#FFD700' }]}>{device.device_name}{device.architect_verified ? ' 👑' : ''}</Text>
                  <Text style={meshStyles.deviceId}>{device.device_id}</Text>
                </View>
              </View>
              {!device.active && <View style={meshStyles.inactiveBadge}><Text style={meshStyles.inactiveBadgeText}>OFFLINE</Text></View>}
            </View>
            <View style={meshStyles.deviceMeta}>
              <View style={meshStyles.deviceMetaRow}><MaterialIcons name="layers" size={11} color={Colors.textMuted} /><Text style={meshStyles.deviceMetaLabel}>PLATFORM</Text><Text style={meshStyles.deviceMetaValue}>{device.platform.toUpperCase()}</Text>{device.os_version ? <Text style={meshStyles.deviceMetaValue2}>{device.os_version}</Text> : null}</View>
              <View style={meshStyles.deviceMetaRow}><MaterialIcons name="security" size={11} color={accessColor(device.system_access_level)} /><Text style={meshStyles.deviceMetaLabel}>ACCESS</Text><Text style={[meshStyles.deviceMetaValue, { color: accessColor(device.system_access_level) }]}>{device.system_access_level.toUpperCase()}</Text></View>
              <View style={meshStyles.deviceMetaRow}><MaterialIcons name="schedule" size={11} color={Colors.textMuted} /><Text style={meshStyles.deviceMetaLabel}>LAST SEEN</Text><Text style={meshStyles.deviceMetaValue}>{new Date(device.last_seen).toLocaleString()}</Text></View>
            </View>
            {device.capabilities && device.capabilities.length > 0 && (
              <View style={meshStyles.capsRow}>{device.capabilities.slice(0, 5).map((cap, i) => <View key={i} style={meshStyles.capChip}><Text style={meshStyles.capText}>{cap}</Text></View>)}</View>
            )}
            {device.active && (
              <Pressable onPress={() => deactivateDevice(device.id)} style={({ pressed }) => [meshStyles.deactivateBtn, pressed && { opacity: 0.7 }]}>
                <Text style={meshStyles.deactivateBtnText}>REMOVE FROM MESH</Text>
              </Pressable>
            )}
          </View>
        ))
      )}
      <View style={meshStyles.noteCard}>
        <MaterialIcons name="info-outline" size={13} color={Colors.textMuted} />
        <Text style={meshStyles.noteText}>HIVE Device Mesh grants KRACKERJACK1134 architect-level access from any registered device. Windows devices gain HIVE OS integration + PS module access. Kali WSL2 nodes auto-register with kali_wsl2 capability.</Text>
      </View>
    </ScrollView>
  );
}

// ─── Hive OS Build Panel ───────────────────────────────────────────────────

function HiveOSBuildPanel() {
  const scrollRef = useRef<ScrollView>(null);
  const [lines, setLines] = useState<TermLine[]>([
    mkLine('system', '╔══════════════════════════════════════════╗'),
    mkLine('system', '║   KRACKERJACK HIVE OS BUILD SYSTEM v1.0  ║'),
    mkLine('system', '║   Gentoo + Termux Hybrid | USB Bootable  ║'),
    mkLine('system', '╚══════════════════════════════════════════╝'),
    mkLine('system', 'ARCHITECT: KRACKERJACK1134 | AUTHORIZED'),
    mkLine('system', 'Build target: arm64 | EFI Boot | /hive/root'),
    mkLine('system', '──────────────────────────────────────────'),
    mkLine('system', 'Use quick commands or type build instructions.'),
    mkLine('system', '──────────────────────────────────────────'),
  ]);
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const [stageStatus, setStageStatus] = useState<Record<number, 'done' | 'active' | 'pending'>>(
    Object.fromEntries(HIVE_BUILD_STEPS.map(s => [s.stage, 'pending']))
  );

  const scrollToEnd = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  const appendLine = useCallback((type: TermLine['type'], text: string) => {
    setLines(prev => [...prev, mkLine(type, text)]);
    scrollToEnd();
  }, [scrollToEnd]);

  const runBuildCommand = useCallback(async (userInput: string) => {
    const trimmed = userInput.trim();
    if (!trimmed) return;
    appendLine('input', `root@hive-build:~# ${trimmed}`);
    setRunning(true);
    setInput('');
    const stageMatch = HIVE_BUILD_STEPS.find(s =>
      trimmed.toLowerCase().includes(`stage ${s.stage}`) ||
      trimmed.toLowerCase().includes(s.label.toLowerCase())
    );
    if (stageMatch) setStageStatus(prev => ({ ...prev, [stageMatch.stage]: 'active' }));
    try {
      const response = await fetch(EDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}`, 'apikey': ANON_KEY },
        body: JSON.stringify({ messages: [{ role: 'user', content: trimmed }], agentId: 'hive_os_build', stream: false }),
      });
      if (!response.ok) { appendLine('error', `[HIVE-BUILD][ERROR] ${(await response.text()).slice(0, 200)}`); if (stageMatch) setStageStatus(prev => ({ ...prev, [stageMatch.stage]: 'pending' })); return; }
      const data = await response.json();
      const content: string = data.content ?? 'Build command failed.';
      content.split('\n').forEach(line => {
        if (line.includes('✓') || line.toLowerCase().includes('complete') || line.toLowerCase().includes('success')) appendLine('stage_ok', line);
        else if (line.includes('[ERROR]') || line.toLowerCase().includes('error') || line.toLowerCase().includes('failed')) appendLine('stage_err', line);
        else if (line.startsWith('[HIVE-BUILD]') || line.startsWith('===') || line.startsWith('---')) appendLine('stage_info', line);
        else appendLine('output', line);
      });
      if (stageMatch) setStageStatus(prev => ({ ...prev, [stageMatch.stage]: 'done' }));
    } catch (err: any) { appendLine('error', `[HIVE-BUILD][ERROR] Connection: ${err.message}`); }
    finally { setRunning(false); }
  }, [appendLine]);

  const lineColor = (type: TermLine['type']) => { switch (type) { case 'input': return '#FF6B00'; case 'stage_ok': return '#69F0AE'; case 'stage_err': return '#FF4444'; case 'stage_info': return '#FF9800'; case 'system': return Colors.textMuted; case 'error': return '#FF4444'; default: return Colors.textSecondary; } };
  const stageColor = (s: 'done' | 'active' | 'pending') => { switch (s) { case 'done': return '#69F0AE'; case 'active': return '#FF9800'; default: return Colors.textMuted; } };
  const stageIcon = (s: 'done' | 'active' | 'pending') => { switch (s) { case 'done': return '✓'; case 'active': return '⟳'; default: return '○'; } };

  return (
    <View style={hiveStyles.root}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={hiveStyles.stagesBar} contentContainerStyle={hiveStyles.stagesContent}>
        {HIVE_BUILD_STEPS.map(step => { const status = stageStatus[step.stage]; const color = stageColor(status); return (
          <Pressable key={step.stage} onPress={() => runBuildCommand(`Execute Stage ${step.stage}: ${step.label}. Command: ${step.cmd}`)} style={({ pressed }) => [hiveStyles.stageChip, { borderColor: `${color}50`, backgroundColor: `${color}10` }, pressed && { opacity: 0.7 }]}>
            <View style={[hiveStyles.stageNumBadge, { backgroundColor: `${color}25` }]}><Text style={[hiveStyles.stageNum, { color }]}>{stageIcon(status)}</Text></View>
            <View><Text style={[hiveStyles.stageLabel, { color }]}>S{step.stage}</Text><Text style={hiveStyles.stageName} numberOfLines={1}>{step.label}</Text></View>
          </Pressable>
        ); })}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={hiveStyles.quickBar} contentContainerStyle={hiveStyles.quickBarContent}>
        {HIVE_QUICK_CMDS.map((item, i) => <Pressable key={i} onPress={() => runBuildCommand(item.cmd)} disabled={running} style={({ pressed }) => [hiveStyles.quickChip, pressed && { opacity: 0.7 }]}><Text style={hiveStyles.quickChipText}>{item.label}</Text></Pressable>)}
      </ScrollView>
      <ScrollView ref={scrollRef} style={hiveStyles.output} showsVerticalScrollIndicator={false} onContentSizeChange={scrollToEnd}>
        {lines.map(line => <View key={line.id}><Text style={[hiveStyles.lineText, { color: lineColor(line.type) }]} selectable>{line.text}</Text></View>)}
        {running && <View style={hiveStyles.runningRow}><ActivityIndicator size="small" color="#FF6B00" /><Text style={hiveStyles.runningText}>BUILDING...</Text></View>}
        {!running && <Text style={hiveStyles.cursor}>root@hive-build:~# █</Text>}
      </ScrollView>
      <View style={hiveStyles.inputRow}>
        <Text style={hiveStyles.inputPrompt}>root@hive-build:~# </Text>
        <TextInput value={input} onChangeText={setInput} placeholder="enter build command..." placeholderTextColor={Colors.textMuted} style={hiveStyles.termInput} onSubmitEditing={() => runBuildCommand(input)} returnKeyType="send" autoCapitalize="none" autoCorrect={false} spellCheck={false} editable={!running} />
        <Pressable onPress={() => runBuildCommand(input)} disabled={!input.trim() || running} style={({ pressed }) => [hiveStyles.runBtn, (!input.trim() || running) && { opacity: 0.4 }, pressed && { opacity: 0.8 }]}>
          {running ? <ActivityIndicator size="small" color="#FF6B00" /> : <MaterialIcons name="send" size={16} color="#FF6B00" />}
        </Pressable>
      </View>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────

export default function TerminalScreen() {
  const insets = useSafeAreaInsets();
  const [activeTerminal, setActiveTerminal] = useState<TerminalId>('termux');
  const [splitView, setSplitView] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('kali');
  const { width } = Dimensions.get('window');
  const isWide = width >= 768;

  const showSplit = (splitView || isWide) && viewMode === 'terminals';
  const activeConfig = TERMINALS.find(t => t.id === activeTerminal)!;
  const UNIX_TERMINALS = TERMINALS.filter(t => t.group === 'unix');

  return (
    <KeyboardAvoidingView style={[styles.root, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="terminal" size={16} color={Colors.primary} />
          <Text style={styles.headerTitle}>HIVE TERMINALS</Text>
          <View style={[styles.modeBadge, { backgroundColor: `${KALI_COLOR}20`, borderColor: `${KALI_COLOR}40` }]}>
            <Text style={[styles.modeBadgeText, { color: KALI_COLOR }]}>KALI OS</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {viewMode === 'terminals' && (
            <Pressable onPress={() => setSplitView(v => !v)} style={({ pressed }) => [styles.splitBtn, showSplit && styles.splitBtnActive, pressed && { opacity: 0.7 }]}>
              <MaterialIcons name="view-column" size={14} color={showSplit ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.splitBtnText, showSplit && { color: Colors.primary }]}>SPLIT</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Mode Switcher */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modeSwitcherScroll} contentContainerStyle={styles.modeSwitcherContent}>
        <Pressable onPress={() => setViewMode('kali')} style={({ pressed }) => [styles.modeBtn, viewMode === 'kali' && [styles.modeBtnActive, { borderBottomColor: KALI_COLOR }], pressed && { opacity: 0.7 }]}>
          <MaterialIcons name="security" size={12} color={viewMode === 'kali' ? KALI_COLOR : Colors.textMuted} />
          <Text style={[styles.modeBtnText, viewMode === 'kali' && { color: KALI_COLOR }]}>KALI OS</Text>
          <View style={[styles.modeBadge, { backgroundColor: `${KALI_COLOR}20`, borderColor: `${KALI_COLOR}40` }]}>
            <Text style={[styles.modeBadgeText, { color: KALI_COLOR }]}>PRIMARY</Text>
          </View>
        </Pressable>

        <Pressable onPress={() => setViewMode('wsl')} style={({ pressed }) => [styles.modeBtn, viewMode === 'wsl' && [styles.modeBtnActive, { borderBottomColor: WSL_COLOR }], pressed && { opacity: 0.7 }]}>
          <MaterialIcons name="computer" size={12} color={viewMode === 'wsl' ? WSL_COLOR : Colors.textMuted} />
          <Text style={[styles.modeBtnText, viewMode === 'wsl' && { color: WSL_COLOR }]}>WSL2 SETUP</Text>
        </Pressable>

        <Pressable onPress={() => setViewMode('windows')} style={({ pressed }) => [styles.modeBtn, viewMode === 'windows' && [styles.modeBtnActive, { borderBottomColor: '#00B4D8' }], pressed && { opacity: 0.7 }]}>
          <MaterialIcons name="desktop-windows" size={12} color={viewMode === 'windows' ? '#00B4D8' : Colors.textMuted} />
          <Text style={[styles.modeBtnText, viewMode === 'windows' && { color: '#00B4D8' }]}>WIN 7/10/11</Text>
        </Pressable>

        <Pressable onPress={() => setViewMode('mesh')} style={({ pressed }) => [styles.modeBtn, viewMode === 'mesh' && [styles.modeBtnActive, { borderBottomColor: '#FFD700' }], pressed && { opacity: 0.7 }]}>
          <MaterialIcons name="device-hub" size={12} color={viewMode === 'mesh' ? '#FFD700' : Colors.textMuted} />
          <Text style={[styles.modeBtnText, viewMode === 'mesh' && { color: '#FFD700' }]}>DEVICE MESH</Text>
        </Pressable>

        <Pressable onPress={() => setViewMode('hiveos')} style={({ pressed }) => [styles.modeBtn, viewMode === 'hiveos' && [styles.modeBtnActive, { borderBottomColor: '#FF6B00' }], pressed && { opacity: 0.7 }]}>
          <MaterialIcons name="memory" size={12} color={viewMode === 'hiveos' ? '#FF6B00' : Colors.textMuted} />
          <Text style={[styles.modeBtnText, viewMode === 'hiveos' && { color: '#FF6B00' }]}>HIVE OS BUILD</Text>
        </Pressable>

        <Pressable onPress={() => setViewMode('terminals')} style={({ pressed }) => [styles.modeBtn, viewMode === 'terminals' && styles.modeBtnActive, pressed && { opacity: 0.7 }]}>
          <MaterialIcons name="developer-mode" size={12} color={viewMode === 'terminals' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.modeBtnText, viewMode === 'terminals' && { color: Colors.primary }]}>A+B UNIX</Text>
        </Pressable>

        <Pressable onPress={() => setViewMode('v7')} style={({ pressed }) => [styles.modeBtn, viewMode === 'v7' && [styles.modeBtnActive, { borderBottomColor: V7_COLOR }], pressed && { opacity: 0.7 }]}>
          <MaterialIcons name="stars" size={12} color={viewMode === 'v7' ? V7_COLOR : Colors.textMuted} />
          <Text style={[styles.modeBtnText, viewMode === 'v7' && { color: V7_COLOR }]}>HIVE OS v7</Text>
          <View style={[styles.modeBadge, { backgroundColor: `${V7_COLOR}20`, borderColor: `${V7_COLOR}40` }]}>
            <Text style={[styles.modeBadgeText, { color: V7_COLOR }]}>v7</Text>
          </View>
        </Pressable>
      </ScrollView>

      {viewMode === 'v7'       && <HiveOSv7Panel />}
      {viewMode === 'kali'     && <KaliPanel />}
      {viewMode === 'wsl'      && <WSLPanel />}
      {viewMode === 'hiveos'   && <HiveOSBuildPanel />}
      {viewMode === 'windows'  && <WindowsHivePanel />}
      {viewMode === 'mesh'     && <DeviceMeshPanel />}

      {viewMode === 'terminals' && (
        <>
          {!showSplit && (
            <View style={styles.tabBar}>
              {UNIX_TERMINALS.map(t => (
                <Pressable key={t.id} onPress={() => setActiveTerminal(t.id)} style={({ pressed }) => [styles.tab, activeTerminal === t.id && [styles.tabActive, { borderBottomColor: t.color }], pressed && { opacity: 0.7 }]}>
                  <View style={[styles.tabBadge, { backgroundColor: t.bgColor, borderColor: t.borderColor }]}>
                    <Text style={[styles.tabBadgeText, { color: t.color }]}>{t.badge}</Text>
                  </View>
                  <Text style={[styles.tabLabel, activeTerminal === t.id && { color: t.color }]}>{t.label}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <View style={[styles.termArea, showSplit && styles.termAreaSplit]}>
            {showSplit ? (
              <><TerminalPanel config={UNIX_TERMINALS[0]} /><View style={styles.splitDivider} /><TerminalPanel config={UNIX_TERMINALS[1]} /></>
            ) : (
              <TerminalPanel config={activeConfig} />
            )}
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#030303' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, borderBottomWidth: 1, borderBottomColor: `${Colors.primary}25`, backgroundColor: `${Colors.primary}06` },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.primary, fontFamily: 'SpaceMono', letterSpacing: 2 },
  headerRight: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  splitBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: Radii.sm, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard },
  splitBtnActive: { borderColor: `${Colors.primary}50`, backgroundColor: `${Colors.primary}10` },
  splitBtnText: { fontSize: 10, color: Colors.textMuted, fontFamily: 'SpaceMono', fontWeight: Typography.bold },
  modeSwitcherScroll: { borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: '#060606', maxHeight: 44 },
  modeSwitcherContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  modeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  modeBtnActive: { borderBottomColor: Colors.primary },
  modeBtnText: { fontSize: 10, color: Colors.textMuted, fontFamily: 'SpaceMono', fontWeight: Typography.bold, letterSpacing: 0.5 },
  modeBadge: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: Radii.sm, borderWidth: 1 },
  modeBadgeText: { fontSize: 8, fontFamily: 'SpaceMono', fontWeight: Typography.black },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: '#060606' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: Spacing.sm + 2, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: {},
  tabBadge: { width: 20, height: 20, borderRadius: Radii.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tabBadgeText: { fontSize: 10, fontWeight: Typography.black, fontFamily: 'SpaceMono' },
  tabLabel: { fontSize: Typography.xs, color: Colors.textMuted, fontFamily: 'SpaceMono', fontWeight: Typography.bold, letterSpacing: 1 },
  termArea: { flex: 1 },
  termAreaSplit: { flexDirection: 'row' },
  splitDivider: { width: 1, backgroundColor: Colors.border },
  terminalPanel: { flex: 1, borderWidth: 0, backgroundColor: '#030303' },
  termHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 7, borderBottomWidth: 1 },
  termHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  termBadge: { width: 22, height: 22, borderRadius: Radii.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  termBadgeText: { fontSize: 11, fontWeight: Typography.black, fontFamily: 'SpaceMono' },
  termLabel: { fontSize: 11, fontWeight: Typography.bold, fontFamily: 'SpaceMono', letterSpacing: 1.5 },
  termDots: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  termDot: { width: 6, height: 6, borderRadius: Radii.full, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 4 },
  termOnline: { fontSize: 9, fontFamily: 'SpaceMono', fontWeight: Typography.bold, letterSpacing: 1 },
  quickBar: { borderBottomWidth: 1, maxHeight: 38 },
  quickBarContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 5, gap: 6 },
  quickChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radii.sm, borderWidth: 1 },
  quickChipText: { fontSize: 10, fontFamily: 'SpaceMono', fontWeight: Typography.bold },
  termOutput: { flex: 1, padding: Spacing.sm, paddingHorizontal: 10 },
  termLine: { marginBottom: 1 },
  termLineText: { fontSize: 12, fontFamily: 'SpaceMono', lineHeight: 18 },
  runningRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  runningText: { fontSize: 11, fontFamily: 'SpaceMono' },
  cursor: { fontSize: 12, fontFamily: 'SpaceMono', marginTop: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 6, borderTopWidth: 1, gap: 6 },
  inputPrompt: { fontSize: 11, fontFamily: 'SpaceMono', fontWeight: Typography.bold },
  termInput: { flex: 1, height: 36, fontSize: 12, fontFamily: 'SpaceMono', backgroundColor: 'transparent' },
  runBtn: { width: 36, height: 36, borderRadius: Radii.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

const kaliStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020408' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: Spacing.md, paddingVertical: 6, backgroundColor: `${KALI_COLOR}10`, borderBottomWidth: 1, borderBottomColor: `${KALI_COLOR}25` },
  bannerText: { flex: 1, fontSize: 9, color: KALI_COLOR, fontFamily: 'SpaceMono', letterSpacing: 0.3 },
  rollingBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radii.sm, backgroundColor: `${KALI_COLOR}20`, borderWidth: 1, borderColor: `${KALI_COLOR}40` },
  rollingBadgeText: { fontSize: 9, color: KALI_COLOR, fontFamily: 'SpaceMono', fontWeight: Typography.black },
  quickBar: { borderBottomWidth: 1, borderBottomColor: `${KALI_COLOR}20`, maxHeight: 38 },
  quickContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 5, gap: 6 },
  quickChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radii.sm, borderWidth: 1, borderColor: `${KALI_COLOR}40`, backgroundColor: `${KALI_COLOR}0A` },
  quickChipText: { fontSize: 10, color: KALI_COLOR, fontFamily: 'SpaceMono', fontWeight: Typography.bold },
  output: { flex: 1, padding: Spacing.sm, paddingHorizontal: 10 },
  lineText: { fontSize: 12, fontFamily: 'SpaceMono', lineHeight: 18, marginBottom: 1 },
  runningRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  runningText: { fontSize: 11, fontFamily: 'SpaceMono' },
  cursor: { fontSize: 12, fontFamily: 'SpaceMono', marginTop: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 6, borderTopWidth: 1, backgroundColor: '#020408', gap: 6 },
  inputPrompt: { fontSize: 10, fontFamily: 'SpaceMono', fontWeight: Typography.bold },
  termInput: { flex: 1, height: 36, fontSize: 12, fontFamily: 'SpaceMono', backgroundColor: 'transparent' },
  runBtn: { width: 36, height: 36, borderRadius: Radii.sm, borderWidth: 1, borderColor: `${KALI_COLOR}40`, backgroundColor: `${KALI_COLOR}0A`, alignItems: 'center', justifyContent: 'center' },
});

const wslStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020A06' },
  ctxBanner: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: Spacing.md, paddingVertical: 6, borderBottomWidth: 1 },
  ctxText: { flex: 1, fontSize: 9, fontFamily: 'SpaceMono', letterSpacing: 0.3 },
  ctxBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radii.sm, borderWidth: 1 },
  ctxBadgeText: { fontSize: 9, fontFamily: 'SpaceMono', fontWeight: Typography.black },
  quickBar: { borderBottomWidth: 1, borderBottomColor: `${WSL_COLOR}20`, maxHeight: 38 },
  quickContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 5, gap: 6 },
  quickChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radii.sm, borderWidth: 1 },
  quickChipText: { fontSize: 10, fontFamily: 'SpaceMono', fontWeight: Typography.bold },
  output: { flex: 1, padding: Spacing.sm, paddingHorizontal: 10 },
  lineText: { fontSize: 12, fontFamily: 'SpaceMono', lineHeight: 18, marginBottom: 1 },
  runningRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  runningText: { fontSize: 11, fontFamily: 'SpaceMono' },
  cursor: { fontSize: 12, fontFamily: 'SpaceMono', marginTop: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 6, borderTopWidth: 1, backgroundColor: '#020A06', gap: 6 },
  inputPrompt: { fontSize: 9, fontFamily: 'SpaceMono', fontWeight: Typography.bold },
  termInput: { flex: 1, height: 36, fontSize: 12, fontFamily: 'SpaceMono', backgroundColor: 'transparent' },
  runBtn: { width: 36, height: 36, borderRadius: Radii.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

const winStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#030308' },
  archBanner: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: Spacing.md, paddingVertical: 6, backgroundColor: '#00B4D810', borderBottomWidth: 1, borderBottomColor: '#00B4D825' },
  archText: { flex: 1, fontSize: 9, color: '#00B4D8', fontFamily: 'SpaceMono', letterSpacing: 0.3 },
  winBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radii.sm, backgroundColor: '#00B4D820', borderWidth: 1, borderColor: '#00B4D840' },
  winBadgeText: { fontSize: 9, color: '#00B4D8', fontFamily: 'SpaceMono', fontWeight: Typography.black },
  kjBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: Radii.sm, backgroundColor: '#FFD70015', borderWidth: 1, borderColor: '#FFD70040' },
  kjBadgeText: { fontSize: 9, color: '#FFD700', fontFamily: 'SpaceMono', fontWeight: Typography.black },
  subTabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#00B4D825', backgroundColor: '#040410' },
  subTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  subTabActivePs: { borderBottomColor: '#5BC0F8', backgroundColor: '#5BC0F808' },
  subTabActiveCmd: { borderBottomColor: '#00B4D8', backgroundColor: '#00B4D808' },
  subTabText: { fontSize: 10, fontFamily: 'SpaceMono', fontWeight: Typography.bold, color: Colors.textMuted, letterSpacing: 0.5 },
  recommendBadge: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: Radii.sm, backgroundColor: '#5BC0F820', borderWidth: 1, borderColor: '#5BC0F840' },
  recommendText: { fontSize: 8, color: '#5BC0F8', fontFamily: 'SpaceMono', fontWeight: Typography.black },
  quickBar: { borderBottomWidth: 1, borderBottomColor: '#00B4D820', maxHeight: 38 },
  quickContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 5, gap: 6 },
  quickChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radii.sm, borderWidth: 1 },
  quickChipText: { fontSize: 10, fontFamily: 'SpaceMono', fontWeight: Typography.bold },
  output: { flex: 1, padding: Spacing.sm, paddingHorizontal: 10 },
  lineText: { fontSize: 12, fontFamily: 'SpaceMono', lineHeight: 18, marginBottom: 1 },
  runningRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  runningText: { fontSize: 11, fontFamily: 'SpaceMono' },
  cursor: { fontSize: 12, fontFamily: 'SpaceMono', marginTop: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 6, borderTopWidth: 1, backgroundColor: '#040410', gap: 6 },
  inputPrompt: { fontSize: 10, fontFamily: 'SpaceMono', fontWeight: Typography.bold },
  termInput: { flex: 1, height: 36, fontSize: 12, fontFamily: 'SpaceMono', backgroundColor: 'transparent' },
  runBtn: { width: 36, height: 36, borderRadius: Radii.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

const meshStyles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  identityCard: { backgroundColor: '#100D00', borderRadius: Radii.md, borderWidth: 1, borderColor: '#FFD70040', padding: Spacing.md, gap: Spacing.md },
  identityTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  identityName: { fontSize: Typography.lg, fontWeight: Typography.black, color: '#FFD700', fontFamily: 'SpaceMono', letterSpacing: 2 },
  identityRole: { fontSize: 11, color: '#FFD70090', fontFamily: 'SpaceMono' },
  identityStatus: { alignItems: 'center', gap: 3 },
  identityDot: { width: 8, height: 8, borderRadius: Radii.full, backgroundColor: '#69F0AE', shadowColor: '#69F0AE', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6 },
  identityStatusText: { fontSize: 9, color: '#69F0AE', fontFamily: 'SpaceMono', fontWeight: Typography.black },
  identityStats: { flexDirection: 'row', gap: Spacing.md },
  identityStat: { flex: 1, alignItems: 'center', gap: 3 },
  identityStatNum: { fontSize: Typography.xl, fontWeight: Typography.black, color: Colors.textPrimary, fontFamily: 'SpaceMono' },
  identityStatLabel: { fontSize: 9, color: Colors.textMuted, fontFamily: 'SpaceMono', textAlign: 'center' },
  registerCard: { backgroundColor: '#0A0A0C', borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: Spacing.sm },
  registerTitle: { fontSize: 10, color: Colors.primary, fontFamily: 'SpaceMono', fontWeight: Typography.bold, letterSpacing: 1.5 },
  registerInput: { height: 40, backgroundColor: '#000', borderRadius: Radii.sm, borderWidth: 1, borderColor: `${Colors.primary}30`, paddingHorizontal: Spacing.md, fontSize: 12, color: Colors.textPrimary, fontFamily: 'SpaceMono' },
  identityHint: { flexDirection: 'row', alignItems: 'center', gap: 7, padding: Spacing.sm, borderRadius: Radii.sm, borderWidth: 1 },
  identityHintText: { flex: 1, fontSize: 11, fontFamily: 'SpaceMono' },
  registerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: Radii.sm, paddingVertical: Spacing.sm },
  registerBtnText: { fontSize: 12, fontWeight: Typography.black, color: '#000', fontFamily: 'SpaceMono', letterSpacing: 0.8 },
  sectionLabel: { fontSize: 10, color: Colors.textMuted, fontFamily: 'SpaceMono', letterSpacing: 1.5 },
  deviceCard: { backgroundColor: '#0A0A0C', borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: Spacing.sm },
  deviceCardArch: { borderColor: '#FFD70040', backgroundColor: '#0D0A00' },
  deviceCardInactive: { opacity: 0.5 },
  deviceTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, justifyContent: 'space-between' },
  deviceTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  deviceName: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textPrimary },
  deviceId: { fontSize: 10, color: Colors.textMuted, fontFamily: 'SpaceMono' },
  inactiveBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radii.sm, backgroundColor: '#FF444420', borderWidth: 1, borderColor: '#FF444440' },
  inactiveBadgeText: { fontSize: 9, color: '#FF4444', fontFamily: 'SpaceMono', fontWeight: Typography.black },
  deviceMeta: { gap: 5 },
  deviceMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  deviceMetaLabel: { fontSize: 9, color: Colors.textMuted, fontFamily: 'SpaceMono', width: 70, letterSpacing: 0.5 },
  deviceMetaValue: { fontSize: 11, color: Colors.textSecondary, fontFamily: 'SpaceMono' },
  deviceMetaValue2: { fontSize: 10, color: Colors.textMuted },
  capsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  capChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radii.sm, backgroundColor: `${Colors.primary}15`, borderWidth: 1, borderColor: `${Colors.primary}25` },
  capText: { fontSize: 9, color: Colors.primary, fontFamily: 'SpaceMono' },
  deactivateBtn: { paddingVertical: 4, paddingHorizontal: Spacing.sm, borderRadius: Radii.sm, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#FF444440', backgroundColor: '#FF444415' },
  deactivateBtnText: { fontSize: 10, color: '#FF4444', fontFamily: 'SpaceMono', fontWeight: Typography.bold },
  noteCard: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: Colors.bgCard, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  noteText: { flex: 1, fontSize: 11, color: Colors.textMuted, lineHeight: 17 },
});

const v7Styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080600' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: Spacing.md, paddingVertical: 6, backgroundColor: '#C5A05910', borderBottomWidth: 1, borderBottomColor: '#C5A05925' },
  bannerText: { flex: 1, fontSize: 9, color: '#C5A059', fontFamily: 'SpaceMono', letterSpacing: 0.3 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radii.sm, backgroundColor: '#C5A05920', borderWidth: 1, borderColor: '#C5A05940' },
  badgeText: { fontSize: 9, color: '#C5A059', fontFamily: 'SpaceMono', fontWeight: Typography.black },
  quickBar: { borderBottomWidth: 1, borderBottomColor: '#C5A05920', maxHeight: 38 },
  quickContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 5, gap: 6 },
  quickChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radii.sm, borderWidth: 1, borderColor: '#C5A05940', backgroundColor: '#C5A0590A' },
  quickText: { fontSize: 10, color: '#C5A059', fontFamily: 'SpaceMono', fontWeight: Typography.bold },
  output: { flex: 1, padding: Spacing.sm, paddingHorizontal: 10 },
  lineText: { fontSize: 12, fontFamily: 'SpaceMono', lineHeight: 18, marginBottom: 1 },
  runningRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  runningText: { fontSize: 11, fontFamily: 'SpaceMono' },
  cursor: { fontSize: 12, fontFamily: 'SpaceMono', marginTop: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 6, borderTopWidth: 1, backgroundColor: '#080600', gap: 6 },
  inputPrompt: { fontSize: 10, fontFamily: 'SpaceMono', fontWeight: Typography.bold },
  termInput: { flex: 1, height: 36, fontSize: 12, fontFamily: 'SpaceMono', backgroundColor: 'transparent' },
  runBtn: { width: 36, height: 36, borderRadius: Radii.sm, borderWidth: 1, borderColor: '#C5A05940', backgroundColor: '#C5A0590A', alignItems: 'center', justifyContent: 'center' },
});

const hiveStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#030303' },
  stagesBar: { borderBottomWidth: 1, borderBottomColor: '#FF6B0025', maxHeight: 60, backgroundColor: '#FF6B0006' },
  stagesContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 8, gap: 6 },
  stageChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 5, borderRadius: Radii.sm, borderWidth: 1 },
  stageNumBadge: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stageNum: { fontSize: 10, fontFamily: 'SpaceMono', fontWeight: Typography.black },
  stageLabel: { fontSize: 10, fontFamily: 'SpaceMono', fontWeight: Typography.black },
  stageName: { fontSize: 9, color: Colors.textMuted, fontFamily: 'SpaceMono', maxWidth: 80 },
  quickBar: { borderBottomWidth: 1, borderBottomColor: '#FF6B0020', maxHeight: 38 },
  quickBarContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 5, gap: 6 },
  quickChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radii.sm, borderWidth: 1, borderColor: '#FF6B0040', backgroundColor: '#FF6B000A' },
  quickChipText: { fontSize: 10, color: '#FF6B00', fontFamily: 'SpaceMono', fontWeight: Typography.bold },
  output: { flex: 1, padding: Spacing.sm, paddingHorizontal: 10 },
  lineText: { fontSize: 12, fontFamily: 'SpaceMono', lineHeight: 18, marginBottom: 1 },
  runningRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  runningText: { fontSize: 11, fontFamily: 'SpaceMono', color: '#FF6B00' },
  cursor: { fontSize: 12, fontFamily: 'SpaceMono', color: '#FF6B00', marginTop: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#FF6B0030', backgroundColor: '#050505', gap: 6 },
  inputPrompt: { fontSize: 10, fontFamily: 'SpaceMono', fontWeight: Typography.bold, color: '#FF6B00' },
  termInput: { flex: 1, height: 36, fontSize: 12, fontFamily: 'SpaceMono', backgroundColor: 'transparent', color: '#FF6B00' },
  runBtn: { width: 36, height: 36, borderRadius: Radii.sm, borderWidth: 1, borderColor: '#FF6B0040', backgroundColor: '#FF6B000A', alignItems: 'center', justifyContent: 'center' },
});
