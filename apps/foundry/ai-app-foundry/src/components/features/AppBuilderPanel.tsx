import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { toast } from "sonner";
import type { TerminalEnv } from "./TerminalEmulator";

interface GeneratedFile {
  path: string;
  code: string;
  language?: string;
}

interface BuildResult {
  files: GeneratedFile[];
  summary: string;
  appName: string;
  timestamp: number;
}

interface Props {
  env: TerminalEnv;
  onRunCommand: (cmd: string) => void;
  onFilesGenerated: (files: GeneratedFile[]) => void;
}

const APP_TEMPLATES = [
  { icon: "🌐", name: "REST API", prompt: "A complete REST API server with CRUD operations, authentication, and database integration. Include all routes, middleware, models, and a README." },
  { icon: "🤖", name: "AI Chatbot", prompt: "A command-line AI chatbot that talks to OpenAI API, maintains conversation history, and saves chats to a JSON file. Include installation script." },
  { icon: "📊", name: "Data Dashboard", prompt: "A web dashboard that reads CSV data, shows charts, and has a search/filter interface. Pure HTML + JS + Chart.js, no build step needed." },
  { icon: "🔐", name: "Auth System", prompt: "A complete JWT authentication system with signup, login, token refresh, and middleware. Include Express.js routes, bcrypt hashing, and database schema." },
  { icon: "📱", name: "Termux App", prompt: "A Termux-specific app with a bash menu interface, uses termux-api for notifications and storage, includes a setup.sh and main launcher script." },
  { icon: "🛒", name: "E-commerce API", prompt: "A complete e-commerce backend with products, cart, orders, payments (Stripe), and admin endpoints. Full Express.js + SQLite." },
  { icon: "🎮", name: "CLI Game", prompt: "A text-based adventure game in Python with save/load, inventory system, multiple rooms, and ASCII art. Full game.py with all game logic." },
  { icon: "📡", name: "Web Scraper", prompt: "A Python web scraper with proxy rotation, rate limiting, data extraction to JSON/CSV, and a scheduling system. Uses requests + BeautifulSoup." },
  { icon: "🔧", name: "Dev Tool CLI", prompt: "A CLI tool that automates git workflows: auto-commit with AI messages, branch management, PR templates, and changelog generation. Node.js with commander." },
  { icon: "🧠", name: "Memory Bot", prompt: "A personal AI assistant that remembers everything: stores conversation history, personal facts, and preferences in a local SQLite database. CLI interface." },
];

function getFileIcon(path: string): string {
  const ext = path.split(".").pop() || "";
  const icons: Record<string, string> = {
    py: "🐍", js: "🟨", ts: "🔷", tsx: "⚛️", jsx: "⚛️",
    sh: "📜", bash: "📜", c: "⚙️", cpp: "⚙️", h: "📋",
    json: "📊", md: "📝", txt: "📄", html: "🌐", css: "🎨",
    yaml: "⚙️", yml: "⚙️", toml: "⚙️", conf: "⚙️", env: "🔒",
  };
  return icons[ext] || "📄";
}

function getSessionId(): string {
  let id = sessionStorage.getItem("openclaw_terminal_session");
  if (!id) { id = `ts_${Date.now()}`; sessionStorage.setItem("openclaw_terminal_session", id); }
  return id;
}

export default function AppBuilderPanel({ env, onRunCommand, onFilesGenerated }: Props) {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildHistory, setBuildHistory] = useState<BuildResult[]>([]);
  const [activeBuild, setActiveBuild] = useState<BuildResult | null>(null);
  const [activeFile, setActiveFile] = useState<GeneratedFile | null>(null);
  const [mode, setMode] = useState<"build" | "file" | "script" | "debug">("build");
  const [buildProgress, setBuildProgress] = useState("");

  const accent = env === "termux" ? "text-green-400" : "text-purple-400";
  const accentBg = env === "termux" ? "bg-green-500/5" : "bg-purple-500/5";
  const accentBorder = env === "termux" ? "border-green-500/20" : "border-purple-500/20";
  const accentBtn = env === "termux"
    ? "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
    : "bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20";

  const handleBuild = useCallback(async (buildPrompt?: string) => {
    const finalPrompt = buildPrompt || prompt;
    if (!finalPrompt.trim()) return;

    setIsBuilding(true);
    setBuildProgress("Initializing Code Agent...");
    setActiveBuild(null);
    setActiveFile(null);

    const progressSteps = [
      "Reading Friend memory...",
      "Analyzing requirements...",
      "Designing architecture...",
      "Generating code files...",
      "Writing implementations...",
      "Adding documentation...",
      "Finalizing output...",
    ];

    let stepIdx = 0;
    const progressInterval = setInterval(() => {
      if (stepIdx < progressSteps.length) {
        setBuildProgress(progressSteps[stepIdx++]);
      }
    }, 1200);

    try {
      const { data, error } = await supabase.functions.invoke("code-agent", {
        body: {
          mode,
          prompt: finalPrompt,
          env,
          language: mode === "script" ? "sh" : "tsx",
          userId: user?.id || null,
          sessionId: getSessionId(),
        },
      });

      clearInterval(progressInterval);
      setBuildProgress("");

      if (error) {
        let msg = error.message;
        if (error instanceof FunctionsHttpError) {
          try { msg = (await error.context?.text()) || msg; } catch {}
        }
        throw new Error(msg);
      }

      const files: GeneratedFile[] = data?.files || [];
      const summary: string = data?.summary || data?.cleanContent || "";

      // If no structured files but raw content, create one
      if (files.length === 0 && data?.rawContent) {
        const ext = mode === "script" ? "sh" : mode === "file" ? "tsx" : "txt";
        const name = finalPrompt.slice(0, 20).replace(/[^a-z0-9]/gi, "-").toLowerCase() + "." + ext;
        files.push({ path: name, code: data.rawContent, language: ext });
      }

      const appName = finalPrompt.slice(0, 40);
      const result: BuildResult = { files, summary, appName, timestamp: Date.now() };

      setActiveBuild(result);
      if (files.length > 0) setActiveFile(files[0]);
      setBuildHistory((prev) => [result, ...prev.slice(0, 9)]);
      onFilesGenerated(files);

      toast.success(`Generated ${files.length} file${files.length !== 1 ? "s" : ""}!`);
    } catch (err) {
      clearInterval(progressInterval);
      setBuildProgress("");
      toast.error(`Code Agent error: ${(err as Error).message}`);
    } finally {
      setIsBuilding(false);
    }
  }, [prompt, mode, env, user, onFilesGenerated]);

  const handleSendToTerminal = useCallback((file: GeneratedFile) => {
    // Write the file to the terminal using a heredoc-style command
    const escapedContent = file.code.replace(/'/g, "'\\''");
    const cmd = `cat > ~/${file.path.split("/").pop() || "output.txt"} << 'HEREDOC'\n${file.code}\nHEREDOC`;
    onRunCommand(cmd);
    toast.success(`Sending ${file.path} to terminal...`);
  }, [onRunCommand]);

  const handleRunFile = useCallback((file: GeneratedFile) => {
    const ext = file.path.split(".").pop() || "";
    const name = file.path.split("/").pop() || "file";
    const cmds: Record<string, string> = {
      py: `python3 ~/${name}`,
      js: `node ~/${name}`,
      sh: `bash ~/${name}`,
      ts: `ts-node ~/${name}`,
    };
    onRunCommand(cmds[ext] || `cat ~/${name}`);
  }, [onRunCommand]);

  return (
    <div className={`flex flex-col h-full bg-zinc-950 border-l ${accentBorder} font-mono text-xs`}>
      {/* Header */}
      <div className={`flex-shrink-0 px-3 py-2 border-b ${accentBorder} ${accentBg}`}>
        <div className={`font-bold text-sm ${accent} mb-0.5`}>🏗️ App Builder</div>
        <div className="text-white/30 text-xs">Code Agent v3.0 · AI-powered</div>
      </div>

      {/* Mode tabs */}
      <div className={`flex-shrink-0 flex border-b ${accentBorder}`}>
        {(["build", "file", "script", "debug"] as const).map((m) => {
          const labels = { build: "🏗️ App", file: "📄 File", script: "📜 Script", debug: "🐛 Debug" };
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-1.5 text-xs font-medium transition-all ${
                mode === m
                  ? `${env === "termux" ? "text-green-400 border-b-2 border-green-400 bg-green-500/5" : "text-purple-400 border-b-2 border-purple-400 bg-purple-500/5"}`
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {labels[m]}
            </button>
          );
        })}
      </div>

      {/* Template picker */}
      {mode === "build" && !activeBuild && (
        <div className={`flex-shrink-0 p-2 border-b ${accentBorder}`}>
          <div className="text-white/30 text-xs mb-1.5">Quick Templates:</div>
          <div className="grid grid-cols-2 gap-1">
            {APP_TEMPLATES.slice(0, 6).map((t) => (
              <button
                key={t.name}
                onClick={() => { setPrompt(t.prompt); }}
                className={`p-1.5 rounded border text-left transition-all hover:border-white/25 bg-black/40 border-white/10`}
              >
                <div className="text-sm">{t.icon}</div>
                <div className="text-white/60 text-xs truncate">{t.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Prompt input */}
      {!activeBuild && (
        <div className={`flex-shrink-0 p-2 border-b ${accentBorder}`}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleBuild(); }}
            placeholder={
              mode === "build" ? "Describe the app to build (Ctrl+Enter to build)..."
              : mode === "file" ? "Describe the file to generate..."
              : mode === "script" ? `Describe the ${env} script to write...`
              : "Paste code here + describe the bug to fix..."
            }
            rows={4}
            className="w-full bg-black/60 border border-white/15 rounded px-2 py-1.5 text-white/80 placeholder:text-white/25 focus:outline-none focus:border-white/30 text-xs resize-none"
          />
          <button
            onClick={() => handleBuild()}
            disabled={isBuilding || !prompt.trim()}
            className={`mt-1.5 w-full py-2 rounded border font-bold text-xs transition-all disabled:opacity-40 ${accentBtn}`}
          >
            {isBuilding ? `⏳ ${buildProgress}` : mode === "build" ? "🏗️ Build App" : mode === "file" ? "📄 Generate File" : mode === "script" ? "📜 Write Script" : "🐛 Debug & Fix"}
          </button>
          <div className="text-white/15 text-xs text-center mt-1">Ctrl+Enter to run · Code Agent v3.0 active</div>
        </div>
      )}

      {/* Build result */}
      {activeBuild && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Build header */}
          <div className={`flex-shrink-0 flex items-center gap-2 px-2 py-1.5 border-b ${accentBorder} bg-black/30`}>
            <span className={`text-xs font-bold ${accent} flex-1 truncate`}>
              ✓ {activeBuild.files.length} files · {activeBuild.appName.slice(0, 25)}
            </span>
            <button
              onClick={() => { setActiveBuild(null); setActiveFile(null); setPrompt(""); }}
              className="text-xs text-white/40 hover:text-white/70 px-1"
            >
              ✕ New
            </button>
          </div>

          {/* File list */}
          <div className={`flex-shrink-0 border-b ${accentBorder} overflow-y-auto`} style={{ maxHeight: "30%" }}>
            {activeBuild.files.map((f) => (
              <div
                key={f.path}
                onClick={() => setActiveFile(f)}
                className={`flex items-center gap-1.5 px-2 py-1 cursor-pointer transition-all ${activeFile?.path === f.path ? `${accentBg} border-l-2 ${accentBorder}` : "hover:bg-white/5"}`}
              >
                <span>{getFileIcon(f.path)}</span>
                <span className={`flex-1 truncate ${activeFile?.path === f.path ? accent : "text-white/60"}`}>
                  {f.path.split("/").pop()}
                </span>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSendToTerminal(f); }}
                    className={`px-1 py-0.5 rounded text-xs ${accentBtn} border`}
                    title="Send to terminal"
                  >→ Term</button>
                </div>
              </div>
            ))}
          </div>

          {/* Active file content */}
          {activeFile && (
            <div className="flex-1 overflow-y-auto p-2">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-xs font-bold ${accent}`}>{activeFile.path}</span>
                <button onClick={() => handleSendToTerminal(activeFile)} className={`px-2 py-0.5 rounded border text-xs ${accentBtn}`}>→ Terminal</button>
                <button onClick={() => handleRunFile(activeFile)} className="px-2 py-0.5 rounded border border-white/15 text-white/50 hover:text-white/80 text-xs">▶ Run</button>
              </div>
              <pre className={`text-xs font-mono whitespace-pre-wrap break-words leading-relaxed text-white/70 bg-black/40 rounded p-2 border border-white/10`}>
                {activeFile.code.slice(0, 3000)}
                {activeFile.code.length > 3000 && `\n... (${(activeFile.code.length - 3000)} more chars)`}
              </pre>
            </div>
          )}

          {/* Summary */}
          {activeBuild.summary && (
            <div className={`flex-shrink-0 p-2 border-t ${accentBorder} bg-black/20`}>
              <div className="text-white/30 text-xs mb-1">Summary:</div>
              <div className="text-white/50 text-xs leading-relaxed">{activeBuild.summary.slice(0, 200)}</div>
            </div>
          )}
        </div>
      )}

      {/* Build history */}
      {!activeBuild && buildHistory.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          <div className={`px-2 py-1 text-white/30 text-xs uppercase tracking-wider border-b ${accentBorder}`}>Build History</div>
          {buildHistory.map((b, i) => (
            <div
              key={b.timestamp}
              onClick={() => { setActiveBuild(b); if (b.files.length > 0) setActiveFile(b.files[0]); }}
              className={`flex items-center gap-2 px-2 py-2 border-b ${accentBorder} cursor-pointer hover:bg-white/5`}
            >
              <span className="text-white/30 text-xs">#{buildHistory.length - i}</span>
              <div className="flex-1 min-w-0">
                <div className={`text-xs truncate ${accent}`}>{b.appName}</div>
                <div className="text-white/30 text-xs">{b.files.length} files</div>
              </div>
              <span className="text-white/20 text-xs">→</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
