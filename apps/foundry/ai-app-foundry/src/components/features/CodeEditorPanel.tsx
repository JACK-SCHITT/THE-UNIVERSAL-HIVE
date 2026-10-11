import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { toast } from "sonner";
import type { TerminalEnv } from "./TerminalEmulator";

interface EditorFile {
  path: string;
  code: string;
  language: string;
  modified: boolean;
  originalCode: string;
}

interface Props {
  env: TerminalEnv;
  onRunCommand: (cmd: string) => void;
  initialFiles?: Array<{ path: string; code: string }>;
}

function detectLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    tsx: "tsx", ts: "typescript", jsx: "jsx", js: "javascript",
    py: "python", sh: "bash", bash: "bash", c: "c", cpp: "cpp",
    go: "go", rs: "rust", rb: "ruby", java: "java", cs: "csharp",
    html: "html", css: "css", scss: "css", json: "json",
    yaml: "yaml", yml: "yaml", toml: "toml", md: "markdown",
    sql: "sql", conf: "bash", env: "bash", Makefile: "bash",
    Dockerfile: "bash",
  };
  return map[ext] || map[path] || "text";
}

function getFileIcon(path: string): string {
  const ext = path.split(".").pop() || "";
  const icons: Record<string, string> = {
    py: "🐍", js: "🟨", ts: "🔷", tsx: "⚛️", jsx: "⚛️",
    sh: "📜", bash: "📜", c: "⚙️", cpp: "⚙️",
    go: "🐹", rs: "🦀", rb: "💎", java: "☕", cs: "💠",
    html: "🌐", css: "🎨", json: "📊", md: "📝",
    yaml: "⚙️", yml: "⚙️", sql: "🗄️", env: "🔒",
  };
  return icons[ext] || "📄";
}

// Lightweight syntax highlighter using regex
function highlight(code: string, lang: string): string {
  let html = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  if (["text", "markdown"].includes(lang)) return html;

  // Strings
  html = html.replace(/(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g,
    '<span style="color:#a3e635">$1$2$1</span>');

  // Comments
  html = html.replace(/(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/)/g,
    '<span style="color:#6b7280;font-style:italic">$1</span>');

  // Keywords
  const kw = ["import","export","from","const","let","var","function","class","interface","type","return","if","else","for","while","do","switch","case","break","continue","new","this","super","extends","implements","async","await","try","catch","finally","throw","typeof","instanceof","in","of","null","undefined","true","false","void","static","readonly","public","private","protected","abstract","package","def","self","print","elif","pass","lambda","yield","with","as","global","nonlocal","del","raise","except","import","from","and","or","not","is","in","emerge","pkg","apt","sudo","echo","cd","ls","mkdir","chmod","curl","wget","git","make","cargo","go","python","node","bash","sh","source","export","alias","set","unset","eval"];
  const kwRe = new RegExp(`\\b(${kw.join("|")})\\b`, "g");
  html = html.replace(kwRe, '<span style="color:#818cf8">$1</span>');

  // Numbers
  html = html.replace(/\b(\d+\.?\d*)\b/g,
    '<span style="color:#fb923c">$1</span>');

  return html;
}

function getSessionId(): string {
  let id = sessionStorage.getItem("openclaw_terminal_session");
  if (!id) { id = `ts_${Date.now()}`; sessionStorage.setItem("openclaw_terminal_session", id); }
  return id;
}

const DEFAULT_FILES: EditorFile[] = [
  {
    path: "main.py",
    code: "# Welcome to Colossal AI Code Editor\n# Prime Directive v3.0 — Memory Refinery ACTIVE\n# KRACKERJACK1134\n\ndef main():\n    print('Hello from Colossal AI!')\n    print('Type your code or use AI to generate it.')\n\nif __name__ == '__main__':\n    main()\n",
    language: "python",
    modified: false,
    originalCode: "",
  },
];

export default function CodeEditorPanel({ env, onRunCommand, initialFiles }: Props) {
  const { user } = useAuth();
  const [files, setFiles] = useState<EditorFile[]>(() => {
    if (initialFiles && initialFiles.length > 0) {
      return initialFiles.map((f) => ({
        path: f.path,
        code: f.code,
        language: detectLanguage(f.path),
        modified: false,
        originalCode: f.code,
      }));
    }
    return DEFAULT_FILES;
  });
  const [activeIdx, setActiveIdx] = useState(0);
  const [showLineNums, setShowLineNums] = useState(true);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiBar, setShowAiBar] = useState(false);
  const [isAiEditing, setIsAiEditing] = useState(false);
  const [fontSize, setFontSize] = useState(13);
  const [showFind, setShowFind] = useState(false);
  const [findText, setFindText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumRef = useRef<HTMLDivElement>(null);

  // Sync initialFiles → editor files
  useEffect(() => {
    if (!initialFiles || initialFiles.length === 0) return;
    setFiles((prev) => {
      const existing = new Map(prev.map((f) => [f.path, f]));
      const updated: EditorFile[] = [...prev];
      for (const nf of initialFiles) {
        const ex = existing.get(nf.path);
        if (!ex) {
          updated.push({ path: nf.path, code: nf.code, language: detectLanguage(nf.path), modified: false, originalCode: nf.code });
        }
      }
      return updated;
    });
  }, [initialFiles]);

  const accent = env === "termux" ? "text-green-400" : "text-purple-400";
  const accentBg = env === "termux" ? "bg-green-500/5" : "bg-purple-500/5";
  const accentBorder = env === "termux" ? "border-green-500/20" : "border-purple-500/20";
  const accentBtn = env === "termux"
    ? "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
    : "bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20";

  const activeFile = files[activeIdx] || files[0];

  const updateCode = useCallback((code: string) => {
    setFiles((prev) => prev.map((f, i) =>
      i === activeIdx ? { ...f, code, modified: code !== f.originalCode } : f
    ));
  }, [activeIdx]);

  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumRef.current) {
      lineNumRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  const handleTab = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = textareaRef.current!;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newCode = activeFile.code.slice(0, start) + "  " + activeFile.code.slice(end);
      updateCode(newCode);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
    if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "f" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setShowFind((v) => !v);
    }
  }, [activeFile.code, updateCode]);

  const handleSave = useCallback(() => {
    setFiles((prev) => prev.map((f, i) =>
      i === activeIdx ? { ...f, modified: false, originalCode: f.code } : f
    ));
    toast.success(`Saved: ${activeFile.path}`);
  }, [activeIdx, activeFile.path]);

  const handleNewFile = useCallback(() => {
    const name = prompt("File name (e.g. utils.py):");
    if (!name?.trim()) return;
    const nf: EditorFile = { path: name.trim(), code: `# ${name}\n`, language: detectLanguage(name.trim()), modified: false, originalCode: "" };
    setFiles((prev) => [...prev, nf]);
    setActiveIdx(files.length);
  }, [files.length]);

  const handleCloseFile = useCallback((idx: number) => {
    if (files.length === 1) return;
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setActiveIdx((prev) => Math.min(prev, files.length - 2));
  }, [files.length]);

  const handleRunFile = useCallback(() => {
    const ext = activeFile.path.split(".").pop() || "";
    const name = activeFile.path.split("/").pop() || activeFile.path;
    const cmds: Record<string, string> = {
      py: `python3 ~/${name}`,
      js: `node ~/${name}`,
      sh: `bash ~/${name}`,
      go: `go run ~/${name}`,
      rs: `rustc ~/${name} -o /tmp/out && /tmp/out`,
    };
    onRunCommand(cmds[ext] || `cat ~/${name}`);
  }, [activeFile, onRunCommand]);

  const handleSendToTerminal = useCallback(() => {
    const name = activeFile.path.split("/").pop() || activeFile.path;
    onRunCommand(`cat > ~/${name} << 'HEREDOC'\n${activeFile.code}\nHEREDOC`);
    toast.success(`Sent ${name} to terminal`);
  }, [activeFile, onRunCommand]);

  const handleAiEdit = useCallback(async () => {
    if (!aiPrompt.trim() || !activeFile) return;
    setIsAiEditing(true);
    try {
      const { data, error } = await supabase.functions.invoke("code-agent", {
        body: {
          mode: "edit",
          prompt: aiPrompt,
          existingFiles: [{ path: activeFile.path, code: activeFile.code }],
          language: activeFile.language,
          env,
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
      // Try to extract the edited file
      const files_out: Array<{ path: string; code: string }> = data?.files || [];
      const editedFile = files_out.find((f) => f.path === activeFile.path) || files_out[0];
      if (editedFile?.code) {
        updateCode(editedFile.code);
        toast.success("AI edit applied!");
      } else if (data?.rawContent) {
        // Try to extract code block
        const match = data.rawContent.match(/```[\w]*\n([\s\S]*?)```/);
        if (match) updateCode(match[1]);
        else toast.error("AI returned no structured code. Check Builder panel.");
      }
      setAiPrompt("");
      setShowAiBar(false);
    } catch (err) {
      toast.error(`AI edit failed: ${(err as Error).message}`);
    } finally {
      setIsAiEditing(false);
    }
  }, [aiPrompt, activeFile, env, user, updateCode]);

  const lineCount = (activeFile?.code || "").split("\n").length;
  const lineNums = Array.from({ length: lineCount }, (_, i) => i + 1);

  const highlightedCode = highlight(activeFile?.code || "", activeFile?.language || "text");
  const findMatches = findText ? (activeFile?.code || "").split(findText).length - 1 : 0;

  return (
    <div className={`flex flex-col h-full bg-zinc-950 border-l ${accentBorder} font-mono text-xs`}>
      {/* Header */}
      <div className={`flex-shrink-0 px-3 py-1.5 border-b ${accentBorder} ${accentBg} flex items-center gap-2`}>
        <span className={`font-bold text-sm ${accent}`}>📝 Code Editor</span>
        <span className="text-white/30 text-xs flex-1">v3.0 · AI-powered</span>
        <button onClick={() => setFontSize((f) => Math.max(10, f - 1))} className="text-white/30 hover:text-white/60 px-1">A-</button>
        <button onClick={() => setFontSize((f) => Math.min(20, f + 1))} className="text-white/30 hover:text-white/60 px-1">A+</button>
        <button onClick={() => setShowLineNums((v) => !v)} className={`px-1 rounded text-xs ${showLineNums ? accent : "text-white/30"}`} title="Toggle line numbers">#</button>
      </div>

      {/* File tabs */}
      <div className={`flex-shrink-0 flex items-end border-b ${accentBorder} bg-black/40 overflow-x-auto`}>
        {files.map((f, i) => (
          <div
            key={f.path}
            className={`flex items-center gap-1 px-2.5 py-1.5 border-r ${accentBorder} cursor-pointer flex-shrink-0 transition-all group ${
              i === activeIdx ? `${accentBg} border-b-2 ${env === "termux" ? "border-b-green-400" : "border-b-purple-400"}` : "text-white/30 hover:text-white/60 hover:bg-white/5"
            }`}
            onClick={() => setActiveIdx(i)}
          >
            <span className="text-xs">{getFileIcon(f.path)}</span>
            <span className={`text-xs max-w-[80px] truncate ${i === activeIdx ? accent : ""}`}>{f.path.split("/").pop()}</span>
            {f.modified && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" title="Modified" />}
            {files.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); handleCloseFile(i); }}
                className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 text-xs ml-0.5 transition-all"
              >×</button>
            )}
          </div>
        ))}
        <button
          onClick={handleNewFile}
          className="px-2 py-1.5 text-white/30 hover:text-white/60 flex-shrink-0 text-sm"
          title="New file"
        >+</button>
      </div>

      {/* Toolbar */}
      <div className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 border-b ${accentBorder} bg-black/20 flex-wrap`}>
        <button onClick={handleSave} className={`px-2 py-0.5 rounded border text-xs ${accentBtn}`} title="Ctrl+S">💾 Save</button>
        <button onClick={handleSendToTerminal} className={`px-2 py-0.5 rounded border text-xs ${accentBtn}`} title="Write to terminal FS">→ Term</button>
        <button onClick={handleRunFile} className="px-2 py-0.5 rounded border border-cyan-500/30 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 text-xs">▶ Run</button>
        <button
          onClick={() => setShowAiBar((v) => !v)}
          className={`px-2 py-0.5 rounded border text-xs ${showAiBar ? accentBtn : "border-white/15 text-white/40 hover:text-white/70"}`}
          title="AI Edit"
        >⚡ AI Edit</button>
        <button
          onClick={() => setShowFind((v) => !v)}
          className={`px-2 py-0.5 rounded border text-xs ${showFind ? accentBtn : "border-white/15 text-white/40 hover:text-white/70"}`}
          title="Ctrl+F"
        >🔍 Find</button>
        <button
          onClick={() => { navigator.clipboard.writeText(activeFile.code); toast.success("Copied!"); }}
          className="px-2 py-0.5 rounded border border-white/15 text-white/40 hover:text-white/70 text-xs"
        >📋 Copy</button>
        <span className="ml-auto text-white/20 text-xs">{activeFile.language} · {lineCount}L</span>
      </div>

      {/* Find bar */}
      {showFind && (
        <div className={`flex-shrink-0 flex items-center gap-2 px-2 py-1 border-b ${accentBorder} bg-black/30`}>
          <input
            autoFocus
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            placeholder="Find in file..."
            className="flex-1 bg-black/60 border border-white/15 rounded px-2 py-0.5 text-white/80 placeholder:text-white/25 focus:outline-none text-xs"
          />
          <span className={`text-xs ${findMatches > 0 ? accent : "text-white/30"}`}>{findMatches} found</span>
          <button onClick={() => setShowFind(false)} className="text-white/30 hover:text-white/60 text-xs">✕</button>
        </div>
      )}

      {/* AI Edit bar */}
      {showAiBar && (
        <div className={`flex-shrink-0 p-2 border-b ${accentBorder} bg-black/40`}>
          <div className="flex gap-1">
            <input
              autoFocus
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAiEdit(); if (e.key === "Escape") setShowAiBar(false); }}
              placeholder="e.g. add error handling, refactor to async/await, add tests..."
              className="flex-1 bg-black/60 border border-white/15 rounded px-2 py-1 text-white/80 placeholder:text-white/25 focus:outline-none text-xs"
            />
            <button
              onClick={handleAiEdit}
              disabled={isAiEditing || !aiPrompt.trim()}
              className={`px-3 py-1 rounded border font-bold text-xs transition-all disabled:opacity-40 ${accentBtn}`}
            >
              {isAiEditing ? "⏳" : "⚡"}
            </button>
          </div>
          <div className="text-white/15 text-xs mt-0.5">AI will rewrite the current file · Enter to apply · Esc to cancel</div>
        </div>
      )}

      {/* Editor area */}
      <div className="flex-1 overflow-hidden flex relative">
        {/* Line numbers */}
        {showLineNums && (
          <div
            ref={lineNumRef}
            className="flex-shrink-0 overflow-hidden bg-black/60 border-r border-white/5 select-none"
            style={{ width: "40px", overflowY: "hidden" }}
          >
            <div className="py-2">
              {lineNums.map((n) => (
                <div
                  key={n}
                  className="text-white/20 text-right pr-2 leading-5"
                  style={{ fontSize: `${fontSize}px`, lineHeight: "20px" }}
                >
                  {n}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Textarea (actual input) */}
        <textarea
          ref={textareaRef}
          value={activeFile?.code || ""}
          onChange={(e) => updateCode(e.target.value)}
          onKeyDown={handleTab}
          onScroll={handleScroll}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          className="absolute inset-0 bg-transparent text-transparent caret-white resize-none focus:outline-none p-2 z-10"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: "20px",
            fontFamily: "'Fira Code', 'Courier New', monospace",
            left: showLineNums ? "40px" : "0",
            caretColor: env === "termux" ? "#00FF88" : "#A78BFA",
          }}
        />

        {/* Syntax highlighted overlay */}
        <div
          className="absolute inset-0 p-2 pointer-events-none overflow-hidden"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: "20px",
            fontFamily: "'Fira Code', 'Courier New', monospace",
            left: showLineNums ? "40px" : "0",
          }}
        >
          <pre
            className="whitespace-pre-wrap break-words text-white/85 m-0 p-0"
            style={{ fontSize: "inherit", fontFamily: "inherit", lineHeight: "inherit" }}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </div>
      </div>

      {/* Status bar */}
      <div className={`flex-shrink-0 px-2 py-0.5 border-t ${accentBorder} text-white/20 text-xs flex justify-between items-center bg-black/40`}>
        <span>{activeFile?.modified ? <span className="text-orange-400">● Modified</span> : <span className="text-green-400/60">● Saved</span>}</span>
        <span>{activeFile?.path}</span>
        <span className={accent}>{activeFile?.language}</span>
      </div>
    </div>
  );
}
