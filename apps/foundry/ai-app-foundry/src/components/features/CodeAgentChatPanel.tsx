import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { toast } from "sonner";
import type { TerminalEnv } from "./TerminalEmulator";

interface ChatFile {
  path: string;
  code: string;
}

interface DiffLine {
  type: "add" | "remove" | "same";
  content: string;
  lineNum: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  files?: ChatFile[];
  diffs?: Record<string, DiffLine[]>;
  accepted?: boolean;
  rejected?: boolean;
  timestamp: number;
}

interface Props {
  env: TerminalEnv;
  onRunCommand: (cmd: string) => void;
  activeFiles: ChatFile[];
  onFilesUpdated: (files: ChatFile[]) => void;
}

function getSessionId(): string {
  let id = sessionStorage.getItem("openclaw_terminal_session");
  if (!id) { id = `ts_${Date.now()}`; sessionStorage.setItem("openclaw_terminal_session", id); }
  return id;
}

// Simple line-by-line diff
function computeDiff(oldCode: string, newCode: string): DiffLine[] {
  const oldLines = oldCode.split("\n");
  const newLines = newCode.split("\n");
  const result: DiffLine[] = [];
  const maxLen = Math.max(oldLines.length, newLines.length);
  let lineNum = 1;

  for (let i = 0; i < maxLen; i++) {
    const o = oldLines[i];
    const n = newLines[i];
    if (o === undefined) {
      result.push({ type: "add", content: n, lineNum: lineNum++ });
    } else if (n === undefined) {
      result.push({ type: "remove", content: o, lineNum: lineNum++ });
    } else if (o !== n) {
      if (o !== undefined) result.push({ type: "remove", content: o, lineNum: lineNum });
      if (n !== undefined) result.push({ type: "add", content: n, lineNum: lineNum++ });
    } else {
      result.push({ type: "same", content: n, lineNum: lineNum++ });
    }
  }
  return result;
}

function hasDiff(diff: DiffLine[]): boolean {
  return diff.some((l) => l.type !== "same");
}

function DiffViewer({ diff, path }: { diff: DiffLine[]; path: string }) {
  const [expanded, setExpanded] = useState(false);
  const addCount = diff.filter((l) => l.type === "add").length;
  const removeCount = diff.filter((l) => l.type === "remove").length;

  const visibleLines = expanded ? diff : diff.filter((l) => l.type !== "same").slice(0, 15);

  if (!hasDiff(diff)) {
    return (
      <div className="text-white/30 text-xs px-2 py-1">No changes in {path}</div>
    );
  }

  return (
    <div className="border border-white/10 rounded overflow-hidden">
      <div
        className="flex items-center gap-2 px-2 py-1 bg-black/40 cursor-pointer hover:bg-white/5"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="text-white/50 text-xs font-mono truncate flex-1">{path}</span>
        <span className="text-green-400 text-xs">+{addCount}</span>
        <span className="text-red-400 text-xs">-{removeCount}</span>
        <span className="text-white/30 text-xs">{expanded ? "▲" : "▼"}</span>
      </div>
      <div className="overflow-x-auto max-h-48">
        {visibleLines.map((line, i) => (
          <div
            key={i}
            className={`flex items-start font-mono text-xs leading-5 ${
              line.type === "add" ? "bg-green-500/10 text-green-300" :
              line.type === "remove" ? "bg-red-500/10 text-red-300" :
              "text-white/40"
            }`}
          >
            <span className="w-8 flex-shrink-0 text-right pr-2 text-white/20 select-none">{line.lineNum}</span>
            <span className="w-4 flex-shrink-0 text-center select-none">
              {line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}
            </span>
            <span className="flex-1 whitespace-pre pl-1">{line.content}</span>
          </div>
        ))}
        {!expanded && diff.filter((l) => l.type !== "same").length > 15 && (
          <div
            className="px-3 py-1 text-white/30 text-xs cursor-pointer hover:text-white/60"
            onClick={() => setExpanded(true)}
          >
            ... {diff.filter((l) => l.type !== "same").length - 15} more changes — click to expand
          </div>
        )}
      </div>
    </div>
  );
}

const CHAT_STARTERS = [
  "Add error handling to all functions",
  "Refactor to use async/await",
  "Add TypeScript types",
  "Add unit test boilerplate",
  "Optimize for performance",
  "Add comments and docs",
  "Convert to ES modules",
  "Add input validation",
];

export default function CodeAgentChatPanel({ env, onRunCommand, activeFiles, onFilesUpdated }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const accent = env === "termux" ? "text-green-400" : "text-purple-400";
  const accentBg = env === "termux" ? "bg-green-500/5" : "bg-purple-500/5";
  const accentBorder = env === "termux" ? "border-green-500/20" : "border-purple-500/20";
  const accentBtn = env === "termux"
    ? "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
    : "bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isThinking) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    try {
      const { data, error } = await supabase.functions.invoke("code-agent", {
        body: {
          mode: "edit",
          prompt: text,
          existingFiles: activeFiles.slice(0, 5),
          language: activeFiles[0]?.path.split(".").pop() || "tsx",
          env,
          history: history.slice(-8),
          userId: user?.id || null,
          sessionId: getSessionId(),
        },
      });

      if (error) {
        let msg = error.message;
        if (error instanceof FunctionsHttpError) {
          try { msg = (await error.context?.text()) || msg; } catch {}
        }
        throw new Error(msg);
      }

      const returnedFiles: ChatFile[] = data?.files || [];
      const summary: string = data?.summary || data?.cleanContent || "Done.";

      // Compute diffs for each returned file vs active files
      const diffs: Record<string, DiffLine[]> = {};
      for (const rf of returnedFiles) {
        const original = activeFiles.find((f) => f.path === rf.path);
        if (original) {
          diffs[rf.path] = computeDiff(original.code, rf.code);
        } else {
          // New file — all adds
          diffs[rf.path] = rf.code.split("\n").map((line, i) => ({
            type: "add" as const,
            content: line,
            lineNum: i + 1,
          }));
        }
      }

      const aiMsg: ChatMessage = {
        id: `a_${Date.now()}`,
        role: "assistant",
        content: summary,
        files: returnedFiles,
        diffs,
        accepted: false,
        rejected: false,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Update conversation history
      setHistory((prev) => [
        ...prev.slice(-10),
        { role: "user", content: text },
        { role: "assistant", content: summary.slice(0, 400) },
      ]);
    } catch (err) {
      const errMsg: ChatMessage = {
        id: `e_${Date.now()}`,
        role: "assistant",
        content: `Error: ${(err as Error).message}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
      toast.error("Code Agent error");
    } finally {
      setIsThinking(false);
    }
  }, [activeFiles, env, history, user, isThinking]);

  const handleAccept = useCallback((msgId: string, files: ChatFile[]) => {
    onFilesUpdated(files);
    setMessages((prev) => prev.map((m) =>
      m.id === msgId ? { ...m, accepted: true, rejected: false } : m
    ));
    toast.success(`Applied ${files.length} file change${files.length !== 1 ? "s" : ""}!`);
  }, [onFilesUpdated]);

  const handleReject = useCallback((msgId: string) => {
    setMessages((prev) => prev.map((m) =>
      m.id === msgId ? { ...m, rejected: true, accepted: false } : m
    ));
    toast.success("Changes rejected — original files kept");
  }, []);

  const handleRunChanged = useCallback((files: ChatFile[]) => {
    if (files.length === 0) return;
    const f = files[0];
    const name = f.path.split("/").pop() || f.path;
    const ext = f.path.split(".").pop() || "";
    const cmds: Record<string, string> = {
      py: `python3 ~/${name}`,
      js: `node ~/${name}`,
      sh: `bash ~/${name}`,
    };
    onRunCommand(cmds[ext] || `cat ~/${name}`);
  }, [onRunCommand]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-zinc-950 border-l ${accentBorder} font-mono text-xs`}>
      {/* Header */}
      <div className={`flex-shrink-0 px-3 py-2 border-b ${accentBorder} ${accentBg}`}>
        <div className={`font-bold text-sm ${accent} mb-0.5`}>💬 Code Agent Chat</div>
        <div className="text-white/30 text-xs">
          {activeFiles.length > 0
            ? `Working on: ${activeFiles.map((f) => f.path.split("/").pop()).join(", ")}`
            : "No files loaded — use App Builder first"}
        </div>
      </div>

      {/* No files state */}
      {activeFiles.length === 0 && messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <div className="text-3xl mb-2">🏗️</div>
          <div className="text-white/40 text-xs mb-4">
            Build an app first with the App Builder panel, then come back here to chat about the code.
          </div>
          <div className={`text-xs ${accent}`}>Waiting for generated files...</div>
        </div>
      )}

      {/* Quick prompts */}
      {activeFiles.length > 0 && messages.length === 0 && (
        <div className={`flex-shrink-0 p-2 border-b ${accentBorder}`}>
          <div className="text-white/30 text-xs mb-1.5">Quick edits:</div>
          <div className="flex flex-wrap gap-1">
            {CHAT_STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="px-2 py-0.5 rounded border border-white/15 text-white/40 hover:text-white/70 hover:border-white/30 text-xs transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id}>
            {/* Message bubble */}
            <div className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs mt-0.5 ${accentBg} border ${accentBorder}`}>
                  ⚡
                </div>
              )}
              <div
                className={`max-w-[90%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-white/10 text-white/80 rounded-tr-sm"
                    : `${accentBg} border ${accentBorder} text-white/70 rounded-tl-sm`
                }`}
              >
                {msg.content}
              </div>
            </div>

            {/* Diffs + accept/reject (assistant only) */}
            {msg.role === "assistant" && msg.files && msg.files.length > 0 && !msg.accepted && !msg.rejected && (
              <div className="mt-2 ml-7 space-y-2">
                {/* Diff views */}
                {Object.entries(msg.diffs || {}).map(([path, diff]) => (
                  <DiffViewer key={path} diff={diff} path={path} />
                ))}

                {/* Accept / Reject buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(msg.id, msg.files!)}
                    className={`flex-1 py-1.5 rounded border font-bold text-xs transition-all ${accentBtn}`}
                  >
                    ✓ Accept Changes ({msg.files.length} file{msg.files.length !== 1 ? "s" : ""})
                  </button>
                  <button
                    onClick={() => handleReject(msg.id)}
                    className="px-3 py-1.5 rounded border border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/10 text-xs"
                  >
                    ✕ Reject
                  </button>
                  <button
                    onClick={() => handleRunChanged(msg.files!)}
                    className="px-2 py-1.5 rounded border border-cyan-500/30 text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/15 text-xs"
                    title="Run changed files"
                  >
                    ▶
                  </button>
                </div>
              </div>
            )}

            {/* Accepted / rejected status */}
            {msg.role === "assistant" && msg.files && msg.files.length > 0 && (msg.accepted || msg.rejected) && (
              <div className={`mt-1 ml-7 text-xs font-mono ${msg.accepted ? "text-green-400/70" : "text-red-400/60"}`}>
                {msg.accepted ? `✓ Applied to ${msg.files.length} file${msg.files.length !== 1 ? "s" : ""}` : "✕ Changes rejected"}
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex gap-2">
            <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${accentBg} border ${accentBorder}`}>⚡</div>
            <div className={`px-3 py-2 rounded-xl rounded-tl-sm border ${accentBorder} ${accentBg}`}>
              <div className="flex gap-1 items-center">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${env === "termux" ? "bg-green-400" : "bg-purple-400"}`}
                    style={{ animation: `pulse 1.2s ease-in-out infinite ${i * 0.2}s` }} />
                ))}
                <span className="text-white/30 text-xs ml-1">Analyzing code...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {activeFiles.length > 0 && (
        <div className={`flex-shrink-0 border-t ${accentBorder} p-2`}>
          <div className={`flex gap-2 items-end rounded-lg border ${accentBorder} ${accentBg} p-2`}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Tell the Code Agent what to change..."
              rows={2}
              disabled={isThinking}
              className="flex-1 bg-transparent resize-none text-xs text-white/80 placeholder:text-white/30 focus:outline-none"
              style={{ lineHeight: "1.4" }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isThinking}
              className={`px-3 py-1.5 rounded border font-bold text-xs transition-all disabled:opacity-40 flex-shrink-0 ${accentBtn}`}
            >
              Send
            </button>
          </div>
          <div className="text-white/15 text-xs text-center mt-1">Enter · Shift+Enter newline</div>
        </div>
      )}

      {/* Footer */}
      <div className={`flex-shrink-0 px-2 py-1 border-t ${accentBorder} text-white/20 text-xs flex justify-between`}>
        <span>{messages.length} messages</span>
        <span className={accent}>Chat</span>
      </div>
    </div>
  );
}
