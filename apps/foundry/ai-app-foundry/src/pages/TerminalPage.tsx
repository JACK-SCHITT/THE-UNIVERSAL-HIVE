import { useState, useCallback, useRef } from "react";
import TerminalEmulator, { type TerminalEnv } from "@/components/features/TerminalEmulator";
import PackageManagerPanel from "@/components/features/PackageManagerPanel";
import FileBrowserSidebar from "@/components/features/FileBrowserSidebar";
import BuildScriptLibrary from "@/components/features/BuildScriptLibrary";
import AppBuilderPanel from "@/components/features/AppBuilderPanel";
import OpenClawSkills from "@/components/features/OpenClawSkills";
import CodeEditorPanel from "@/components/features/CodeEditorPanel";
import AppDeploymentPanel from "@/components/features/AppDeploymentPanel";
import CodeAgentChatPanel from "@/components/features/CodeAgentChatPanel";

// ── Environment metadata ──────────────────────────────────────────────────────
const ENV_META = {
  termux: {
    label: "Termux",
    fullLabel: "Termux App Foundry",
    icon: "📱",
    tag: "Android · aarch64",
    color: "text-green-400",
    border: "border-green-500/40",
    activeBg: "bg-green-500/10",
    tileBg: "bg-gradient-to-br from-green-950/80 to-black",
    tileBorder: "border-green-500/50",
    tileHover: "hover:border-green-400/70 hover:from-green-900/60",
    badgeBg: "bg-green-500/15 text-green-300 border-green-500/30",
    glow: "shadow-[0_0_30px_rgba(0,255,136,0.12)]",
    desc: "Full Linux environment on Android with Termux API, pkg package manager, and the entire Colossal AI Hive.",
    details: [
      { icon: "📦", text: "pkg package manager" },
      { icon: "📱", text: "termux-api Android hooks" },
      { icon: "🐍", text: "Python · Node · Go · Rust" },
      { icon: "🔒", text: "SSH · nmap · security tools" },
      { icon: "⚡", text: "All 6 hive agents active" },
      { icon: "🧠", text: "Memory Refinery ON" },
    ],
    promptDemo: "u0_a123@localhost:~ $",
  },
  gentoo: {
    label: "Gentoo",
    fullLabel: "Gentoo Linux Foundry",
    icon: "🐧",
    tag: "x86_64 · Portage · OpenRC",
    color: "text-purple-400",
    border: "border-purple-500/40",
    activeBg: "bg-purple-500/10",
    tileBg: "bg-gradient-to-br from-purple-950/80 to-black",
    tileBorder: "border-purple-500/50",
    tileHover: "hover:border-purple-400/70 hover:from-purple-900/60",
    badgeBg: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    glow: "shadow-[0_0_30px_rgba(168,85,247,0.12)]",
    desc: "Source-based rolling release Linux with full Portage control, USE flags, custom kernel, and Colossal AI Hive.",
    details: [
      { icon: "📦", text: "emerge / Portage" },
      { icon: "⚙️", text: "USE flags · make.conf" },
      { icon: "🔧", text: "Custom kernel (genkernel)" },
      { icon: "🚦", text: "OpenRC init system" },
      { icon: "⚡", text: "All 6 hive agents active" },
      { icon: "🧠", text: "Memory Refinery ON" },
    ],
    promptDemo: "root@colossal /root #",
  },
} as const;

// ── Sidebar panels ────────────────────────────────────────────────────────────
type SidePanel = "pkg" | "files" | "scripts" | "builder" | "skills" | "editor" | "deploy" | "chat" | null;

const PANEL_TABS = [
  { id: "pkg" as SidePanel, icon: "📦", label: "Packages" },
  { id: "files" as SidePanel, icon: "📁", label: "Files" },
  { id: "scripts" as SidePanel, icon: "📜", label: "Scripts" },
  { id: "builder" as SidePanel, icon: "🏗️", label: "Builder" },
  { id: "editor" as SidePanel, icon: "📝", label: "Editor" },
  { id: "chat" as SidePanel, icon: "💬", label: "Chat" },
  { id: "deploy" as SidePanel, icon: "🚀", label: "Deploy" },
  { id: "skills" as SidePanel, icon: "⚡", label: "Skills" },
];

type ViewMode = "selector" | "terminal";

export default function TerminalPage() {
  const [activeEnv, setActiveEnv] = useState<TerminalEnv | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("selector");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePanel, setActivePanel] = useState<SidePanel>("pkg");
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<Array<{ path: string; code: string }>>([]);
  const [chatFiles, setChatFiles] = useState<Array<{ path: string; code: string }>>([]);

  const terminalRef = useRef<{ executeCommand: (cmd: string) => void } | null>(null);

  const handleLaunch = useCallback((env: TerminalEnv) => {
    setActiveEnv(env);
    setViewMode("terminal");
  }, []);

  const handleSwitchEnv = useCallback((env: TerminalEnv) => {
    setActiveEnv(env);
  }, []);

  const handleCommand = useCallback((cmd: string) => {
    setPendingCommand(cmd);
  }, []);

  const handleCommandConsumed = useCallback(() => {
    setPendingCommand(null);
  }, []);

  const handleFilesGenerated = useCallback((files: Array<{ path: string; code: string }>) => {
    setGeneratedFiles(files);
    setChatFiles(files); // Sync to chat panel
  }, []);

  const handleChatFilesUpdated = useCallback((files: Array<{ path: string; code: string }>) => {
    setGeneratedFiles((prev) => {
      const map = new Map(prev.map((f) => [f.path, f]));
      files.forEach((f) => map.set(f.path, f));
      return Array.from(map.values());
    });
    setChatFiles(files);
  }, []);

  const handleOpenFile = useCallback((path: string, content: string) => {
    // Echo file info to terminal
    setPendingCommand(`echo "Opened: ${path} (${content.length} bytes)"`);
  }, []);

  const meta = activeEnv ? ENV_META[activeEnv] : null;

  // ── SELECTOR VIEW ────────────────────────────────────────────────────────────
  if (viewMode === "selector") {
    return (
      <div className="min-h-[calc(100vh-56px)] bg-black flex flex-col">
        <div className="text-center px-6 pt-12 pb-8">
          <div className="text-xs font-mono text-white/30 uppercase tracking-widest mb-2">
            Colossal AI · Terminal Module v3.0
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight">
            Choose Your{" "}
            <span className="bg-gradient-to-r from-green-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Terminal Environment
            </span>
          </h1>
          <p className="text-white/40 text-sm max-w-2xl mx-auto font-mono">
            Both environments carry the full Colossal AI Hive — 6 agents, Memory Refinery v3.0,
            real File Browser, Build Script Library, AI App Builder, and OpenClaw Skills Panel.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="px-6 pb-6 max-w-4xl mx-auto w-full">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-8">
            {[
              { icon: "📦", label: "Package Manager" },
              { icon: "📁", label: "File Browser" },
              { icon: "📜", label: "Build Scripts" },
              { icon: "🏗️", label: "App Builder" },
              { icon: "⚡", label: "OpenClaw Skills" },
            ].map((f) => (
              <div key={f.label} className="text-center p-2 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xl mb-1">{f.icon}</div>
                <div className="text-white/50 text-xs font-mono">{f.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex items-start justify-center px-6 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
            {(["termux", "gentoo"] as TerminalEnv[]).map((env) => {
              const m = ENV_META[env];
              return (
                <button
                  key={env}
                  onClick={() => handleLaunch(env)}
                  className={`relative text-left rounded-2xl border-2 p-6 transition-all duration-300 cursor-pointer group ${m.tileBg} ${m.tileBorder} ${m.tileHover} ${m.glow} hover:scale-[1.02]`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{m.icon}</span>
                      <div>
                        <div className={`font-black text-xl ${m.color}`}>{m.label}</div>
                        <div className="text-white/40 text-xs font-mono">{m.tag}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono border ${m.badgeBg}`}>
                      HIVE ACTIVE
                    </span>
                  </div>
                  <p className="text-white/50 text-sm mb-4 leading-relaxed">{m.desc}</p>
                  <div className="grid grid-cols-2 gap-1.5 mb-5">
                    {m.details.map((d) => (
                      <div key={d.text} className="flex items-center gap-1.5 text-xs text-white/50">
                        <span>{d.icon}</span><span className="truncate">{d.text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg bg-black/60 border border-white/10 px-3 py-2 font-mono text-xs mb-4">
                    <span className={m.color}>{m.promptDemo} </span>
                    <span className="text-white/60">hive architect build me an app</span>
                    <span className="animate-pulse text-white/80">_</span>
                  </div>
                  <div className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border font-bold text-sm transition-all ${m.activeBg} ${m.border} ${m.color}`}>
                    <span>Launch {m.label} Terminal →</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-white/5 bg-zinc-950/80 px-6 py-2 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-white/20">
          <span>⚡ OpenClaw Prime v3.0</span>
          <span>·</span><span>🧠 Memory Refinery: ACTIVATED</span>
          <span>·</span><span>🏗️ Code Agent: READY</span>
          <span>·</span><span>⬡ Collective Assimilation: ON</span>
          <span>·</span><span>KRACKERJACK1134</span>
        </div>
      </div>
    );
  }

  // ── TERMINAL VIEW ────────────────────────────────────────────────────────────
  if (!meta || !activeEnv) return null;

  const panelWidth = activePanel ? "w-56" : "w-0";

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-black">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      {!isFullscreen && (
        <div className="flex-shrink-0 border-b border-white/10 bg-zinc-950/95">
          <div className="px-3 py-2 flex items-center gap-2 flex-wrap">
            {/* Back */}
            <button
              onClick={() => setViewMode("selector")}
              className="flex items-center gap-1 px-2 py-1 rounded border border-white/15 text-white/40 hover:text-white/70 hover:border-white/30 text-xs font-mono transition-all"
            >
              ← Envs
            </button>

            {/* Env switch */}
            <div className="flex gap-1">
              {(["termux", "gentoo"] as TerminalEnv[]).map((env) => {
                const m = ENV_META[env];
                return (
                  <button
                    key={env}
                    onClick={() => handleSwitchEnv(env)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-mono font-medium transition-all ${
                      activeEnv === env
                        ? `${m.activeBg} ${m.border} ${m.color}`
                        : "text-white/30 border-white/10 hover:text-white/60 hover:border-white/25"
                    }`}
                  >
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                    {activeEnv === env && (
                      <span className={`hidden sm:inline text-xs px-1 rounded ${m.badgeBg} border ml-0.5`}>{m.tag}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className={`hidden lg:block text-xs font-mono ${meta.color} opacity-60 flex-1 truncate`}>
              {meta.fullLabel} · Prime Directive v3.0 · Memory Refinery ON · Code Agent READY
            </div>

            {/* Right controls */}
            <div className="ml-auto flex items-center gap-1.5">
              <span className="hidden sm:flex items-center gap-1 text-xs font-mono text-green-400/50">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />HIVE
              </span>
              <span className="hidden sm:flex items-center gap-1 text-xs font-mono text-cyan-400/50">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />REFINERY
              </span>
              <span className="hidden sm:flex items-center gap-1 text-xs font-mono text-orange-400/50">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />AGENT
              </span>
              <button
                onClick={() => setIsFullscreen(true)}
                className="px-2 py-1 rounded border text-xs font-mono text-white/30 border-white/10 hover:text-white/60 hover:border-white/25 transition-all"
              >
                ⛶ Full
              </button>
            </div>
          </div>

          {/* Panel tabs */}
          <div className="px-3 pb-2 flex items-center gap-1">
            {PANEL_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePanel(activePanel === tab.id ? null : tab.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-mono transition-all ${
                  activePanel === tab.id
                    ? `${meta.activeBg} ${meta.border} ${meta.color}`
                    : "text-white/30 border-white/10 hover:text-white/60 hover:border-white/25"
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
            <span className="ml-2 text-xs font-mono text-white/20 hidden md:inline">
              ↑↓ history · Ctrl+L clear · Ctrl+C stop
            </span>
          </div>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* Exit fullscreen */}
        {isFullscreen && (
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-2 right-3 z-20 px-2 py-1 rounded text-xs font-mono text-white/30 border border-white/10 hover:text-white/60 bg-black/80 transition-all"
          >
            ✕ Exit Full
          </button>
        )}

        {/* Terminal */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <TerminalEmulator
            key={activeEnv}
            env={activeEnv}
            externalCommand={pendingCommand}
            onExternalCommandConsumed={handleCommandConsumed}
          />
        </div>

        {/* Panel sidebar */}
        {activePanel && !isFullscreen && (
          <div className={`${panelWidth} flex-shrink-0 flex flex-col overflow-hidden transition-all`} style={{ width: "224px" }}>
            {activePanel === "pkg" && (
              <PackageManagerPanel env={activeEnv} onRunCommand={handleCommand} />
            )}
            {activePanel === "files" && (
              <FileBrowserSidebar
                env={activeEnv}
                onOpenFile={handleOpenFile}
                onRunCommand={handleCommand}
                externalFiles={generatedFiles.length > 0 ? generatedFiles : undefined}
              />
            )}
            {activePanel === "scripts" && (
              <BuildScriptLibrary env={activeEnv} onRunCommand={handleCommand} />
            )}
            {activePanel === "builder" && (
              <AppBuilderPanel
                env={activeEnv}
                onRunCommand={handleCommand}
                onFilesGenerated={handleFilesGenerated}
              />
            )}
            {activePanel === "skills" && (
              <OpenClawSkills env={activeEnv} onRunCommand={handleCommand} />
            )}
            {activePanel === "editor" && (
              <CodeEditorPanel
                env={activeEnv}
                onRunCommand={handleCommand}
                initialFiles={generatedFiles.length > 0 ? generatedFiles : undefined}
              />
            )}
            {activePanel === "deploy" && (
              <AppDeploymentPanel
                env={activeEnv}
                generatedFiles={generatedFiles}
                onRunCommand={handleCommand}
              />
            )}
            {activePanel === "chat" && (
              <CodeAgentChatPanel
                env={activeEnv}
                onRunCommand={handleCommand}
                activeFiles={chatFiles.length > 0 ? chatFiles : generatedFiles}
                onFilesUpdated={handleChatFilesUpdated}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Bottom status bar ────────────────────────────────────────────── */}
      {!isFullscreen && (
        <div className="flex-shrink-0 border-t border-white/5 bg-zinc-950/80 px-3 py-1 flex items-center gap-3 text-xs font-mono text-white/20 overflow-x-auto">
          <span>{meta.icon} {meta.label} · {meta.tag}</span>
          <span>·</span>
          <span>OpenClaw v3.0</span>
          <span>·</span>
          <span className="text-green-400/40">Memory Refinery: ACTIVATED</span>
          <span>·</span>
          <span className="text-orange-400/40">Code Agent: READY</span>
          {generatedFiles.length > 0 && (
            <>
              <span>·</span>
              <span className="text-cyan-400/60">{generatedFiles.length} files generated</span>
            </>
          )}
          <span className="ml-auto flex-shrink-0">type 'help' · Ctrl+L clear</span>
        </div>
      )}
    </div>
  );
}
