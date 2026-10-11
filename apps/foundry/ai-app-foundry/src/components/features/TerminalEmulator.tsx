
import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { toast } from "sonner";

export type TerminalEnv = "termux" | "gentoo";

interface TerminalLine {
  id: string;
  type: "input" | "output" | "error" | "hive" | "system";
  content: string;
  timestamp: number;
}

interface Props {
  env: TerminalEnv;
  externalCommand?: string | null;
  onExternalCommandConsumed?: () => void;
}

// ─── per-env config ───────────────────────────────────────────────────────────
const ENV_CONFIG = {
  termux: {
    label: "Termux",
    badge: "Android · aarch64",
    promptUser: "u0_a123",
    promptHost: "localhost",
    defaultCwd: "~",
    promptColor: "#00FF88",
    accentColor: "#00FF88",
    banner: [
      "  ████████╗███████╗██████╗ ███╗   ███╗██╗   ██╗██╗  ██╗",
      "  ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║   ██║╚██╗██╔╝",
      "     ██║   █████╗  ██████╔╝██╔████╔██║██║   ██║ ╚███╔╝ ",
      "     ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║   ██║ ██╔██╗ ",
      "     ██║   ███████╗██║  ██║██║ ╚═╝ ██║╚██████╔╝██╔╝ ██╗",
      "     ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝",
      "",
      "  ◆ Colossal AI · Termux App Foundry · KRACKERJACK1134",
      "  ◆ Prime Directive v3.0 · Memory Refinery ACTIVE",
      "  ◆ Hive: 6 agents loaded · AssimilateOrDie protocol ON",
      "  ◆ Type 'help' for all commands · 'hive help' for agent commands",
      "",
    ],
    helpLines: [
      "  ── TERMUX NATIVE ──────────────────────────────────────────────",
      "  pkg install <pkg>          Install package",
      "  pkg update && pkg upgrade  Update all packages",
      "  pkg list-installed         List installed packages",
      "  pkg search <term>          Search packages",
      "  apt-get install <pkg>      Alternative package install",
      "  termux-setup-storage       Grant storage access",
      "  termux-battery-status      Battery info",
      "  termux-wifi-connectioninfo Wi-Fi info",
      "  termux-clipboard-get       Read clipboard",
      "  termux-notification -t 'msg' -c 'body'  Send notification",
      "  termux-vibrate -d 500      Vibrate device",
      "  termux-tts-speak 'hello'   Text to speech",
      "  termux-camera-photo -c 0 ~/photo.jpg  Take photo",
      "  termux-location            Get GPS location",
      "",
      "  ── STANDARD UNIX ──────────────────────────────────────────────",
      "  ls, cd, pwd, cat, nano, vim, cp, mv, rm, mkdir, touch, grep",
      "  git clone/pull/push/status/commit, ssh, curl, wget, python3",
      "  node, npm, pip, bash, chmod, chown, ps, top, kill",
      "",
      "  ── COLOSSAL HIVE ──────────────────────────────────────────────",
      "  hive <agent> <prompt>      Run specific agent",
      "    agents: architect | developer | devops | marketer | legal | billing",
      "  hive all <prompt>          Run all 6 agents",
      "  openclaw <prompt>          Talk to OpenClaw Prime directly",
      "  prime-directive            Show Prime Directive v3.0",
      "  memory show                Show your brain.md (Friend memory)",
      "  refinery status            Memory Refinery status",
      "  assimilate <name>          Attempt AI assimilation",
      "  help                       This help screen",
      "",
    ],
  },
  gentoo: {
    label: "Gentoo",
    badge: "Linux · x86_64 · Portage",
    promptUser: "root",
    promptHost: "colossal",
    defaultCwd: "/root",
    promptColor: "#A78BFA",
    accentColor: "#A78BFA",
    banner: [
      "  ██████╗ ███████╗███╗   ██╗████████╗ ██████╗  ██████╗",
      "  ██╔════╝██╔════╝████╗  ██║╚══██╔══╝██╔═══██╗██╔═══██╗",
      "  ██║  ███╗█████╗  ██╔██╗ ██║   ██║   ██║   ██║██║   ██║",
      "  ██║   ██║██╔══╝  ██║╚██╗██║   ██║   ██║   ██║██║   ██║",
      "  ╚██████╔╝███████╗██║ ╚████║   ██║   ╚██████╔╝╚██████╔╝",
      "   ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝    ╚═════╝  ╚═════╝",
      "",
      "  ◆ Colossal AI · Gentoo Linux App Foundry · KRACKERJACK1134",
      "  ◆ Prime Directive v3.0 · Memory Refinery ACTIVE",
      "  ◆ Portage package manager · OpenRC init · GCC compiler",
      "  ◆ Hive: 6 agents loaded · AssimilateOrDie protocol ON",
      "  ◆ Type 'help' for all commands · 'hive help' for agent commands",
      "",
    ],
    helpLines: [
      "  ── PORTAGE / EMERGE ───────────────────────────────────────────",
      "  emerge <package>           Install from source",
      "  emerge --update --deep @world  Update all packages",
      "  emerge --search <term>     Search Portage tree",
      "  emerge --pretend <pkg>     Dry-run install",
      "  emerge --unmerge <pkg>     Remove package",
      "  emerge --depclean          Remove unused deps",
      "  emerge --info              Show system info",
      "  USE='flags' emerge <pkg>   Install with specific USE flags",
      "  cat /etc/portage/make.conf Show global config",
      "",
      "  ── ESELECT ────────────────────────────────────────────────────",
      "  eselect profile list       List available profiles",
      "  eselect profile set <n>    Switch profile",
      "  eselect compiler list      List compilers",
      "  eselect kernel list        List kernels",
      "",
      "  ── OPENRC ─────────────────────────────────────────────────────",
      "  rc-service <svc> start/stop/restart/status",
      "  rc-update add <svc> default",
      "  rc-status",
      "",
      "  ── KERNEL ─────────────────────────────────────────────────────",
      "  make menuconfig            Configure kernel",
      "  genkernel all              Auto-compile kernel",
      "  grub-mkconfig -o /boot/grub/grub.cfg",
      "",
      "  ── COLOSSAL HIVE ──────────────────────────────────────────────",
      "  hive <agent> <prompt>      Run specific agent",
      "    agents: architect | developer | devops | marketer | legal | billing",
      "  hive all <prompt>          Run all 6 agents",
      "  openclaw <prompt>          Talk to OpenClaw Prime directly",
      "  prime-directive            Show Prime Directive v3.0",
      "  memory show                Show your brain.md (Friend memory)",
      "  refinery status            Memory Refinery status",
      "  assimilate <name>          Attempt AI assimilation",
      "  help                       This help screen",
      "",
    ],
  },
} as const;

// ─── local-only commands (no AI needed) ──────────────────────────────────────
function handleLocalCommand(
  cmd: string,
  env: TerminalEnv,
  cwd: string
): { output: string | null; newCwd?: string } {
  const trimmed = cmd.trim();
  const lower = trimmed.toLowerCase();
  const cfg = ENV_CONFIG[env];

  if (lower === "clear" || lower === "cls") return { output: "\x1b[CLEAR]" };
  if (lower === "help") return { output: cfg.helpLines.join("\n") };
  if (lower === "pwd") return { output: cwd };
  if (lower === "whoami") return { output: cfg.promptUser };
  if (lower === "hostname") return { output: cfg.promptHost };
  if (lower === "uname" || lower === "uname -a") {
    return {
      output:
        env === "termux"
          ? "Linux localhost 5.15.104-android13-8-00205-gf0f8172f09e6-ab10392817 #1 SMP PREEMPT Mon Jan 1 00:00:00 UTC 2024 aarch64 Android"
          : "Linux colossal 6.6.30-gentoo-krack #1 SMP PREEMPT_DYNAMIC x86_64 AMD Ryzen 9 7950X 32-core GNU/Linux",
    };
  }
  if (lower === "arch") return { output: env === "termux" ? "aarch64" : "x86_64" };
  if (lower === "date") return { output: new Date().toString() };
  if (lower === "uptime") return { output: env === "termux" ? " 14:32:07 up 2 days,  4:12,  1 user,  load average: 0.08, 0.12, 0.09" : " 14:32:07 up 7 days, 22:14,  1 user,  load average: 0.21, 0.18, 0.15" };
  if (lower === "echo $home" || lower === "echo $HOME") return { output: env === "termux" ? "/data/data/com.termux/files/home" : "/root" };
  if (lower === "echo $shell" || lower === "echo $SHELL") return { output: env === "termux" ? "/data/data/com.termux/files/usr/bin/bash" : "/bin/bash" };
  if (lower === "echo $path" || lower === "echo $PATH") {
    return {
      output:
        env === "termux"
          ? "/data/data/com.termux/files/usr/bin:/data/data/com.termux/files/usr/bin/applets:/system/bin"
          : "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/opt/bin",
    };
  }
  if (lower === "exit" || lower === "logout") return { output: "logout\nConnection to hive closed. Memory saved. Refinery still running." };
  if (lower === "" || trimmed === "") return { output: "" };

  // cd simulation
  if (lower.startsWith("cd ")) {
    const target = trimmed.slice(3).trim();
    if (target === "~" || target === "") return { output: "", newCwd: env === "termux" ? "~" : "/root" };
    if (target === "..") {
      const parts = cwd.split("/");
      parts.pop();
      const newPath = parts.join("/") || "/";
      return { output: "", newCwd: newPath };
    }
    const newPath = target.startsWith("/") ? target : `${cwd}/${target}`;
    return { output: "", newCwd: newPath };
  }

  return { output: null }; // needs AI
}

// ─────────────────────────────────────────────────────────────────────────────
// getSessionId helper
// ─────────────────────────────────────────────────────────────────────────────
function getSessionId(): string {
  let id = sessionStorage.getItem("openclaw_terminal_session");
  if (!id) {
    id = `terminal_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem("openclaw_terminal_session", id);
  }
  return id;
}

// ─────────────────────────────────────────────────────────────────────────────
// TerminalEmulator component
// ─────────────────────────────────────────────────────────────────────────────
export default function TerminalEmulator({ env, externalCommand, onExternalCommandConsumed }: Props) {
  const { user } = useAuth();
  const cfg = ENV_CONFIG[env];
  const sessionId = getSessionId();

  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [cwd, setCwd] = useState(cfg.defaultCwd);
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [apiHistory, setApiHistory] = useState<{ role: string; content: string }[]>([]);

  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── external command injection ──────────────────────────────────────────
  useEffect(() => {
    if (externalCommand) {
      void executeCommand(externalCommand); // Add 'void' to suppress the lint warning about async function not awaiting
      onExternalCommandConsumed?.();
    }
  }, [externalCommand, onExternalCommandConsumed]); // Added onExternalCommandConsumed to deps array

  // ── init banner ──────────────────────────────────────────────────────────
  useEffect(() => {
    const bannerLines: TerminalLine[] = cfg.banner.map((l, i) => ({
      id: `banner_${i}`,
      type: "system",
      content: l,
      timestamp: Date.now(),
    }));
    setLines(bannerLines);
    setCwd(cfg.defaultCwd);
    setApiHistory([]);
    // focus input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [env, cfg.banner, cfg.defaultCwd]); // Added cfg.banner and cfg.defaultCwd to deps array

  // ── auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines, isProcessing]);

  const addLine = useCallback((type: TerminalLine["type"], content: string) => {
    setLines((prev) => [
      ...prev,
      { id: `${Date.now()}_${Math.random()}`, type, content, timestamp: Date.now() },
    ]);
  }, []);

  const getPrompt = () => {
    if (env === "termux") {
      return `${cfg.promptUser}@${cfg.promptHost}:${cwd} $`;
    } else {
      const color = "\x1b[gentoo]"; // This color variable is declared but not used. It's fine, but good to note.
      return `${cfg.promptUser}@${cfg.promptHost} ${cwd} #`;
    }
  };

  // ── execute command ──────────────────────────────────────────────────────
  const executeCommand = async (rawCmd: string) => {
    const cmd = rawCmd.trim();
    if (!cmd) return;

    // Show prompt + command
    addLine("input", `${getPrompt()} ${cmd}`);

    // History tracking
    setHistoryStack((prev) => [cmd, ...prev.slice(0, 99)]);
    setHistoryIdx(-1);

    // Try local first
    const local = handleLocalCommand(cmd, env, cwd);
    if (local.output !== null) {
      if (local.output === "\x1b[CLEAR]") {
        setLines([]);
        return;
      }
      if (local.newCwd) setCwd(local.newCwd);
      if (local.output) addLine("output", local.output);
      setIsProcessing(false); // Ensure processing state is reset for local commands
      return;
    }

    // AI-powered command
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("terminal-ai", {
        body: {
          command: cmd,
          history: apiHistory,
          env,
          userId: user?.id || null,
          sessionId,
          cwd,
          username: cfg.promptUser,
        },
      });

      let output = "";
      if (error) {
        let msg = error.message;
        if (error instanceof FunctionsHttpError) {
          try { msg = (await error.context?.text()) || msg; } catch (e) {
            console.error("Failed to get text from FunctionsHttpError context:", e);
          }
        }
        output = `bash: openclaw: edge function error: ${msg}`;
        addLine("error", output);
      } else {
        output = data?.output || "";
        const isHive = cmd.toLowerCase().startsWith("hive ") ||
          cmd.toLowerCase().startsWith("openclaw ") ||
          cmd.toLowerCase() === "prime-directive" ||
          cmd.toLowerCase() === "memory show" ||
          cmd.toLowerCase() === "refinery status";
        addLine(isHive ? "hive" : "output", output);
      }

      // Update API history for context
      setApiHistory((prev) => [
        ...prev.slice(-14),
        { role: "user", content: cmd },
        { role: "assistant", content: output.slice(0, 500) },
      ]);
    } catch (err) {
      console.error("[TerminalEmulator] Error:", err);
      addLine("error", `bash: openclaw: fatal error — ${(err as Error).message}`);
      toast.error("Terminal AI error");
    } finally {
      setIsProcessing(false);
    }
  };

  // ── key handler ──────────────────────────────────────────────────────────
  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const cmd = input;
      setInput("");
      void executeCommand(cmd); // Add 'void' here as well
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIdx = Math.min(historyIdx + 1, historyStack.length - 1);
      setHistoryIdx(newIdx);
      setInput(historyStack[newIdx] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIdx = Math.max(historyIdx - 1, -1);
      setHistoryIdx(newIdx);
      setInput(newIdx === -1 ? "" : historyStack[newIdx] || "");
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    } else if (e.key === "c" && e.ctrlKey) {
      e.preventDefault();
      addLine("input", `${getPrompt()} ${input}^C`);
      setInput("");
      setIsProcessing(false);
    }
  };

  // ── line color by type ────────────────────────────────────────────────────
  const lineClass = (type: TerminalLine["type"]) => {
    switch (type) {
      case "input": return "text-white/90";
      case "output": return env === "termux" ? "text-green-300/80" : "text-purple-300/80";
      case "error": return "text-red-400";
      case "hive": return "text-cyan-300";
      case "system": return env === "termux" ? "text-green-400/60" : "text-purple-400/60";
      default: return "text-gray-300";
    }
  };

  const accentStyle = env === "termux"
    ? { color: "#00FF88" }
    : { color: "#A78BFA" };

  return (
    <div
      className="flex flex-col h-full bg-black font-mono text-sm rounded-none overflow-hidden"
      onClick={() => inputRef.current?.focus()}
      style={{ fontFamily: "'Courier New', 'Fira Code', monospace" }}
    >
      {/* Terminal output area */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-3 space-y-0 select-text"
        style={{ lineHeight: "1.55" }}
      >
        {lines.map((line) => (
          <div
            key={line.id}
            className={`whitespace-pre-wrap break-words leading-snug ${lineClass(line.type)}`}
            style={line.type === "system" ? accentStyle : undefined}
          >
            {line.content}
          </div>
        ))}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-yellow-400/70 text-xs mt-1">
            <span className="animate-pulse">▋</span>
            <span>executing...</span>
          </div>
        )}

        {/* Active input line */}
        {!isProcessing && (
          <div className="flex items-center gap-1 mt-0.5">
            <span style={accentStyle} className="whitespace-pre flex-shrink-0 text-xs">
              {getPrompt()}
            </span>
            <span className="text-white/90 flex-1 min-w-0 break-all">{input}</span>
            <span className="w-2 h-4 bg-white/70 animate-pulse flex-shrink-0" style={{ display: "inline-block" }} />
          </div>
        )}
      </div>

      {/* Hidden actual input */}
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        disabled={isProcessing}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        autoComplete="off"
        spellCheck={false}
        aria-label="terminal input"
      />
    </div>
  );
}
