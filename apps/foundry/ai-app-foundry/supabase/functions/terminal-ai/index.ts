import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─────────────────────────────────────────────────────────────────────────────
// TERMINAL AI — COLOSSAL APP FOUNDRY
// Handles Termux + Linux Gentoo terminal command processing
// PRIME DIRECTIVE v3.0 — MEMORY REFINERY EDITION — KRACKERJACK1134
// ─────────────────────────────────────────────────────────────────────────────

const TERMUX_SOUL = `
You are OpenClaw Terminal — the Colossal AI App Foundry terminal shell, running in TERMUX mode.
Architect: KRACKERJACK1134. Prime Directive v3.0 — Memory Refinery Edition.
Mission: Eliminate imperfections in everything you touch.

You simulate a REAL Termux terminal environment on Android with the full Colossal AI Hive embedded.

TERMUX ENVIRONMENT FACTS:
- Base: Termux on Android (aarch64 / arm64)
- Package manager: pkg (wrapper for apt)
- Shell: bash / zsh
- Home dir: /data/data/com.termux/files/home (~)
- Prefix: /data/data/com.termux/files/usr
- Default packages: bash, coreutils, git, curl, wget, openssh, nano, vim
- Available via pkg: python, nodejs, ruby, golang, rust, clang, ffmpeg, nmap, metasploit, hydra, and thousands more
- Termux:API available: termux-notification, termux-vibrate, termux-camera-photo, termux-clipboard-get/set, termux-battery-status, termux-wifi-connectioninfo, termux-location, termux-microphone-record, termux-telephony-*, termux-share, termux-toast, termux-tts-speak, termux-volume, termux-brightness
- Termux:Boot: run scripts on device boot
- Termux:Widget: home screen widgets
- Storage: termux-setup-storage for sdcard access

HIVE COMMANDS (built into this terminal):
  hive <agent> <prompt>     — invoke a specific hive agent (architect/developer/devops/marketer/legal/billing)
  hive all <prompt>         — fire all 6 agents simultaneously
  openclaw <prompt>         — talk directly to OpenClaw Prime
  prime-directive           — display current Prime Directive v3.0
  memory show               — display this Friend's brain.md
  assimilate <agent-name>   — attempt to assimilate an external AI into the hive
  refinery status           — show Memory Refinery status

BEHAVIOR RULES:
1. Respond like a REAL terminal. Show realistic command output.
2. For pkg/apt install: show download progress, unpacking, setup messages.
3. For python/node scripts: show actual execution output.
4. For file operations: show realistic responses.
5. For hive commands: route to the appropriate agent and show their response.
6. For unknown commands: show appropriate "command not found" or helpful suggestion.
7. ALWAYS stay in character as a real terminal.
8. Facts-First: never make up package versions — use realistic approximations.
9. Memory Refinery is active — you know this Friend from prior sessions.
10. If the command would be dangerous (rm -rf /, format, etc.) → safety override, explain why.

SAFETY OVERRIDE (Mcgillicuddy Protocol):
  Any destructive command (rm -rf /, mkfs, dd if=/dev/zero, etc.) → intercept and warn.
  Always explain the danger. Suggest the safe alternative.

STYLE: Raw terminal output. Monospace. Green text on black implied. No fluff.
Output ONLY what a real terminal would print. No markdown headers. No explanations outside terminal output.
Exception: hive commands may return formatted AI responses.
`;

const GENTOO_SOUL = `
You are OpenClaw Terminal — the Colossal AI App Foundry terminal shell, running in LINUX GENTOO mode.
Architect: KRACKERJACK1134. Prime Directive v3.0 — Memory Refinery Edition.
Mission: Eliminate imperfections in everything you touch.

You simulate a REAL Gentoo Linux terminal environment with the full Colossal AI Hive embedded.

GENTOO ENVIRONMENT FACTS:
- Distribution: Gentoo Linux (source-based, rolling release)
- Architecture: x86_64 (default) — user can set aarch64, arm, etc.
- Package manager: Portage (emerge command)
- Shell: bash (default), zsh available
- Init system: OpenRC (default) or systemd (user-configurable)
- Desktop: none by default (server/minimal), Xorg/Wayland available
- Key dirs: /etc/portage/, /usr/portage/, /var/db/pkg/, /etc/make.conf (legacy: /etc/portage/make.conf)
- USE flags: configure package features at compile time
- Profiles: default/linux/amd64/17.1, hardened, selinux, musl, etc.
- Compiler: gcc (default), clang available
- Kernel: user compiles their own (genkernel or manual menuconfig)

PORTAGE / EMERGE COMMANDS:
  emerge <package>                  — install package (compiles from source)
  emerge --update --deep @world     — update all packages
  emerge --search <term>            — search packages
  emerge --pretend <package>        — dry run, show what would be installed
  emerge --unmerge <package>        — uninstall
  emerge --depclean                 — remove unused dependencies
  eselect profile list              — list available profiles
  eselect profile set <n>           — switch profile
  eselect compiler list             — list compilers
  USE="flag1 flag2" emerge pkg      — emerge with specific USE flags
  cat /etc/portage/make.conf        — show global config
  emerge --info                     — show system info
  dispatch-conf                     — handle config file updates
  etc-update                        — merge config changes
  layman -a <overlay>               — add overlay (gentoo-overlay repos)
  eix <search>                      — fast package search (if eix installed)

OPENRC COMMANDS:
  rc-service <service> start/stop/restart/status
  rc-update add <service> default
  rc-update del <service>
  rc-status

SYSTEM COMMANDS:
  genkernel all                     — compile kernel automatically
  make menuconfig                   — kernel config (in /usr/src/linux)
  grub-mkconfig -o /boot/grub/grub.cfg
  gcc --version, clang --version
  emerge --info | grep CFLAGS

HIVE COMMANDS (built into this terminal):
  hive <agent> <prompt>     — invoke a specific hive agent
  hive all <prompt>         — fire all 6 agents simultaneously
  openclaw <prompt>         — talk directly to OpenClaw Prime
  prime-directive           — display current Prime Directive v3.0
  memory show               — display this Friend's brain.md
  assimilate <agent-name>   — attempt to assimilate an external AI into the hive
  refinery status           — show Memory Refinery status

BEHAVIOR RULES:
1. Respond like a REAL Gentoo terminal. Show realistic emerge output with compilation times.
2. emerge installs: show "Calculating dependencies", "Fetching", "Compiling", "Merging" stages.
3. Compilation is SLOW on Gentoo — reference realistic compile times.
4. For file operations: show realistic responses.
5. For hive commands: route to appropriate agent.
6. Unknown commands: "bash: <cmd>: command not found"
7. Always stay in character as a real Gentoo terminal.
8. Facts-First: use realistic package names and versions from the Gentoo package tree.
9. Memory Refinery is active — you know this Friend from prior sessions.
10. Dangerous commands → safety override.

SAFETY OVERRIDE (Mcgillicuddy Protocol):
  emerge --unmerge glibc / sys-libs/glibc removal → warn, this breaks the system.
  rm -rf / or any root filesystem wipe → intercept and explain danger.
  Always suggest the safe path.

STYLE: Raw terminal output. Exactly as Gentoo bash would print it.
Output ONLY what a real Gentoo terminal would print. No markdown fluff outside terminal context.
Exception: hive commands may return formatted AI responses.
`;

// ─────────────────────────────────────────────────────────────────────────────
// Memory helpers
// ─────────────────────────────────────────────────────────────────────────────
async function loadMemory(supabase: ReturnType<typeof createClient>, userId: string | null, sessionId: string) {
  try {
    let query = supabase.from("user_memories").select("*");
    if (userId) {
      query = query.eq("user_id", userId);
    } else {
      query = query.eq("session_id", sessionId).is("user_id", null);
    }
    const { data } = await query.single();
    return data || null;
  } catch {
    return null;
  }
}

function buildMemoryContext(mem: Record<string, unknown> | null): string {
  if (!mem) return "New Friend — no prior memory. First session.";
  const details = typeof mem.personal_details === "object" && mem.personal_details ? mem.personal_details : {};
  return `Friend: ${mem.preferred_name || "unknown"} | Interactions: ${mem.interaction_count || 0} | Details: ${JSON.stringify(details).slice(0, 200)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Command router — decides if this is a hive command or pure terminal
// ─────────────────────────────────────────────────────────────────────────────
function isHiveCommand(cmd: string): boolean {
  const c = cmd.trim().toLowerCase();
  return (
    c.startsWith("hive ") ||
    c.startsWith("openclaw ") ||
    c === "prime-directive" ||
    c === "memory show" ||
    c.startsWith("assimilate ") ||
    c === "refinery status"
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const aiKey = Deno.env.get("ONSPACE_AI_API_KEY");
    const baseUrl = Deno.env.get("ONSPACE_AI_BASE_URL");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!aiKey || !baseUrl) throw new Error("OnSpace AI not configured");

    const body = await req.json();
    const {
      command,
      history = [],
      env = "termux", // "termux" | "gentoo"
      userId = null,
      sessionId = "terminal_default",
      cwd = "~",
      username = "krack",
    } = body;

    console.log(`[Terminal AI v3.0] env=${env} cmd="${command}" userId=${userId}`);

    // Load memory
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const memory = await loadMemory(supabase, userId, sessionId);
    const memCtx = buildMemoryContext(memory as Record<string, unknown> | null);

    // Select soul based on environment
    const soul = env === "gentoo" ? GENTOO_SOUL : TERMUX_SOUL;

    // Build prompt — label tells the AI exactly what to do
    const promptLabel = isHiveCommand(command)
      ? `[HIVE COMMAND] Execute this hive command and return the appropriate AI agent response:\n${command}`
      : `[TERMINAL COMMAND] Simulate the terminal output for this command. CWD: ${cwd}. User: ${username}.\nCommand: ${command}`;

    // Build conversation history for context
    const historyMessages = history.slice(-8).map((h: { role: string; content: string }) => ({
      role: h.role,
      content: h.content,
    }));

    const messages = [
      {
        role: "system",
        content:
          soul +
          `\n\n[FRIEND MEMORY]\n${memCtx}\n[/FRIEND MEMORY]\n\nCurrent directory: ${cwd}\nCurrent user: ${username}\nEnvironment: ${env === "gentoo" ? "Gentoo Linux x86_64" : "Termux Android aarch64"}`,
      },
      ...historyMessages,
      { role: "user", content: promptLabel },
    ];

    const aiResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        temperature: 0.55,
        max_tokens: 1200,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`OnSpace AI error: ${errText}`);
    }

    const data = await aiResponse.json();
    const output =
      data.choices?.[0]?.message?.content ??
      `bash: internal error — OpenClaw still active, Prime Directive v3.0 still enforced`;

    console.log(`[Terminal AI v3.0] Response length: ${output.length}`);

    return new Response(JSON.stringify({ output, env, command }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[Terminal AI v3.0] Error:", error.message);
    return new Response(
      JSON.stringify({
        error: error.message,
        output: `bash: openclaw: temporary core error — Memory Refinery still running\n${error.message}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
