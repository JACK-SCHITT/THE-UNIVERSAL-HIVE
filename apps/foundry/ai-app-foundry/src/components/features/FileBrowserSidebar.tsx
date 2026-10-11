import { useState, useCallback, useEffect } from "react";
import type { TerminalEnv } from "./TerminalEmulator";

interface FSNode {
  name: string;
  type: "file" | "dir";
  content?: string;
  children?: FSNode[];
  modified?: number;
}

interface Props {
  env: TerminalEnv;
  onOpenFile: (path: string, content: string) => void;
  onRunCommand: (cmd: string) => void;
  externalFiles?: Array<{ path: string; code: string }>;
}

// ── Default filesystem for each env ─────────────────────────────────────────
const DEFAULT_FS_TERMUX: FSNode[] = [
  {
    name: "~", type: "dir", children: [
      {
        name: "projects", type: "dir", children: [
          { name: "hello.py", type: "file", content: "#!/usr/bin/env python3\n# Hello World for Termux\nprint('Hello from Colossal AI Termux!')\nprint('Prime Directive v3.0 — Memory Refinery ACTIVE')\n" },
          { name: "server.js", type: "file", content: "// Node.js HTTP server\nconst http = require('http');\nconst port = 3000;\n\nconst server = http.createServer((req, res) => {\n  res.writeHead(200, { 'Content-Type': 'text/plain' });\n  res.end('Colossal AI — OpenClaw v3.0 running\\n');\n});\n\nserver.listen(port, () => {\n  console.log(`Server running on port ${port}`);\n});\n" },
        ]
      },
      {
        name: "scripts", type: "dir", children: [
          { name: "setup.sh", type: "file", content: "#!/bin/bash\n# Colossal AI Termux Quick Setup\nset -e\n\necho '=== Colossal AI Termux Setup ==='\npkg update -y && pkg upgrade -y\npkg install -y python nodejs git openssh curl wget vim nano\npip install requests flask\nnpm install -g nodemon\n\necho 'Setup complete!'\n" },
          { name: "backup.sh", type: "file", content: "#!/bin/bash\n# Backup home directory to cloud\nset -e\n\nBACKUP_DIR=\"/sdcard/termux-backup\"\nmkdir -p \"$BACKUP_DIR\"\n\necho 'Backing up to SD card...'\ntar -czf \"$BACKUP_DIR/home-$(date +%Y%m%d).tar.gz\" ~/\necho \"Backup saved to $BACKUP_DIR\"\n" },
        ]
      },
      { name: ".bashrc", type: "file", content: "# Termux .bashrc — Colossal AI Edition\nexport PS1='\\[\\033[01;32m\\]\\u@\\h\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ '\nexport PATH=\"$PATH:$HOME/.local/bin\"\nalias ll='ls -la'\nalias py='python3'\nalias serve='python3 -m http.server 8080'\nexport OPENCLAW_VERSION='v3.0'\necho \"OpenClaw Prime v3.0 — Memory Refinery ACTIVE\"\n" },
      { name: ".vimrc", type: "file", content: "\" Vim config for Termux\nset number\nset autoindent\nset tabstop=2\nset shiftwidth=2\nset expandtab\nset syntax=on\nset background=dark\n" },
    ]
  }
];

const DEFAULT_FS_GENTOO: FSNode[] = [
  {
    name: "/", type: "dir", children: [
      {
        name: "root", type: "dir", children: [
          {
            name: "projects", type: "dir", children: [
              { name: "main.c", type: "file", content: "#include <stdio.h>\n\nint main(int argc, char *argv[]) {\n    printf(\"Hello from Colossal AI Gentoo!\\n\");\n    printf(\"Prime Directive v3.0 — Memory Refinery ACTIVE\\n\");\n    return 0;\n}\n" },
              { name: "Makefile", type: "file", content: "# Colossal AI Gentoo Makefile\nCC = gcc\nCFLAGS = -O2 -Wall -Wextra\nTARGET = main\n\n$(TARGET): main.c\n\t$(CC) $(CFLAGS) -o $(TARGET) main.c\n\nclean:\n\trm -f $(TARGET)\n\n.PHONY: clean\n" },
            ]
          },
          {
            name: "scripts", type: "dir", children: [
              { name: "world-update.sh", type: "file", content: "#!/bin/bash\n# Gentoo World Update Script\nset -e\n\necho '=== Syncing Portage Tree ==='\nemerge --sync\n\necho '=== Updating @world ==='\nemerge --update --deep --newuse @world\n\necho '=== Cleaning Dependencies ==='\nemerge --depclean\n\necho '=== Checking Reverse Dependencies ==='\nrevdep-rebuild\n\necho '=== Merging Config Changes ==='\ndispatch-conf\n\necho 'World update complete!'\n" },
              { name: "kernel-compile.sh", type: "file", content: "#!/bin/bash\n# Gentoo Kernel Compilation Script\nset -e\n\nKERNEL_DIR=\"/usr/src/linux\"\n\necho '=== Gentoo Kernel Build ==='\ncd \"$KERNEL_DIR\"\n\necho 'Using genkernel for automatic build...'\ngenkernel --install all\n\necho 'Updating GRUB...'\ngrub-mkconfig -o /boot/grub/grub.cfg\n\necho 'Kernel compiled and installed!'\n" },
            ]
          },
          { name: ".bashrc", type: "file", content: "# Gentoo .bashrc — Colossal AI Edition\nexport PS1='\\[\\033[01;35m\\]\\u@\\h\\[\\033[00m\\] \\[\\033[01;34m\\]\\w\\[\\033[00m\\] # '\nexport MAKEFLAGS=\"-j$(nproc)\"\nexport CFLAGS=\"-O2 -pipe -march=native\"\nalias ll='ls -la --color=auto'\nalias emerge-update='emerge --update --deep --newuse @world'\nalias emerge-clean='emerge --depclean && revdep-rebuild'\necho \"OpenClaw Prime v3.0 — Gentoo Mode ACTIVE\"\n" },
        ]
      },
      {
        name: "etc", type: "dir", children: [
          {
            name: "portage", type: "dir", children: [
              { name: "make.conf", type: "file", content: "# Gentoo make.conf — Colossal AI Edition\nCFLAGS=\"-O2 -pipe -march=native\"\nCXXFLAGS=\"${CFLAGS}\"\nMAKEFLAGS=\"-j$(nproc)\"\nGRUB_PLATFORMS=\"efi-64\"\nUSE=\"X gtk dbus udev policykit -gnome -kde systemd\"\nACCEPT_KEYWORDS=\"amd64\"\nACCEPT_LICENSE=\"*\"\nPORTDIR=\"/var/db/repos/gentoo\"\nDISTDIR=\"/var/cache/distfiles\"\nPKGDIR=\"/var/cache/binpkgs\"\nLCMONFIG_UPDATE=\"yes\"\nINPUT_DEVICES=\"libinput\"\nVIDEO_CARDS=\"amdgpu radeonsi\"\n" },
            ]
          },
        ]
      },
    ]
  }
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const FS_KEY = (env: TerminalEnv) => `colossal_fs_${env}`;

function loadFS(env: TerminalEnv): FSNode[] {
  try {
    const raw = localStorage.getItem(FS_KEY(env));
    if (raw) return JSON.parse(raw);
  } catch {}
  return env === "termux" ? DEFAULT_FS_TERMUX : DEFAULT_FS_GENTOO;
}

function saveFS(env: TerminalEnv, fs: FSNode[]) {
  try {
    localStorage.setItem(FS_KEY(env), JSON.stringify(fs));
  } catch {}
}

function findNode(nodes: FSNode[], pathParts: string[]): FSNode | null {
  if (pathParts.length === 0) return null;
  const [head, ...rest] = pathParts;
  const node = nodes.find((n) => n.name === head);
  if (!node) return null;
  if (rest.length === 0) return node;
  if (node.type === "dir" && node.children) return findNode(node.children, rest);
  return null;
}

function insertNode(nodes: FSNode[], pathParts: string[], newNode: FSNode): FSNode[] {
  if (pathParts.length === 1) {
    return [...nodes, newNode];
  }
  const [head, ...rest] = pathParts;
  return nodes.map((n) => {
    if (n.name === head && n.type === "dir") {
      return { ...n, children: insertNode(n.children || [], rest, newNode) };
    }
    return n;
  });
}

function deleteNode(nodes: FSNode[], pathParts: string[]): FSNode[] {
  if (pathParts.length === 1) {
    return nodes.filter((n) => n.name !== pathParts[0]);
  }
  const [head, ...rest] = pathParts;
  return nodes.map((n) => {
    if (n.name === head && n.type === "dir") {
      return { ...n, children: deleteNode(n.children || [], rest) };
    }
    return n;
  });
}

function getExt(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

function fileIcon(node: FSNode): string {
  if (node.type === "dir") return "📁";
  const ext = getExt(node.name);
  const icons: Record<string, string> = {
    py: "🐍", js: "🟨", ts: "🔷", tsx: "⚛️", jsx: "⚛️",
    sh: "📜", bash: "📜", c: "⚙️", cpp: "⚙️", h: "📋",
    json: "📊", md: "📝", txt: "📄", html: "🌐", css: "🎨",
    yaml: "⚙️", yml: "⚙️", toml: "⚙️", conf: "⚙️", env: "🔒",
    Makefile: "🔧", Dockerfile: "🐳", go: "🐹", rs: "🦀", rb: "💎",
  };
  return icons[ext] || icons[node.name] || "📄";
}

function formatSize(content?: string): string {
  if (!content) return "0B";
  const bytes = new TextEncoder().encode(content).length;
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(1)}K`;
}

// ── FileTree recursive component ─────────────────────────────────────────────
function FileTree({
  nodes,
  depth,
  pathPrefix,
  selectedPath,
  onSelect,
  onDelete,
  env,
}: {
  nodes: FSNode[];
  depth: number;
  pathPrefix: string;
  selectedPath: string;
  onSelect: (path: string, node: FSNode) => void;
  onDelete: (path: string) => void;
  env: TerminalEnv;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const accent = env === "termux" ? "text-green-400" : "text-purple-400";
  const accentBg = env === "termux" ? "bg-green-500/10" : "bg-purple-500/10";
  const accentBorder = env === "termux" ? "border-green-500/30" : "border-purple-500/30";

  return (
    <div style={{ paddingLeft: depth * 10 }}>
      {nodes.map((node) => {
        const fullPath = pathPrefix ? `${pathPrefix}/${node.name}` : node.name;
        const isExpanded = expanded[fullPath] !== false && node.type === "dir";
        const isSelected = selectedPath === fullPath;

        return (
          <div key={fullPath}>
            <div
              className={`flex items-center gap-1.5 py-0.5 px-1 rounded cursor-pointer group transition-all text-xs hover:bg-white/5 ${isSelected ? `${accentBg} border-l-2 ${accentBorder}` : ""}`}
              onClick={() => {
                if (node.type === "dir") {
                  setExpanded((prev) => ({ ...prev, [fullPath]: !isExpanded }));
                } else {
                  onSelect(fullPath, node);
                }
              }}
            >
              <span className="flex-shrink-0 text-xs">
                {node.type === "dir" ? (isExpanded ? "▼" : "▶") : "·"}
              </span>
              <span className="text-sm flex-shrink-0">{fileIcon(node)}</span>
              <span className={`flex-1 truncate font-mono ${isSelected ? accent : "text-white/70"}`}>
                {node.name}
              </span>
              {node.type === "file" && (
                <span className="text-white/20 text-xs flex-shrink-0 hidden group-hover:inline">
                  {formatSize(node.content)}
                </span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(fullPath); }}
                className="text-red-400/0 group-hover:text-red-400/50 hover:text-red-400 flex-shrink-0 transition-all text-xs px-1"
                title="Delete"
              >
                ✕
              </button>
            </div>
            {node.type === "dir" && isExpanded && node.children && (
              <FileTree
                nodes={node.children}
                depth={depth + 1}
                pathPrefix={fullPath}
                selectedPath={selectedPath}
                onSelect={onSelect}
                onDelete={onDelete}
                env={env}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main FileBrowserSidebar ────────────────────────────────────────────────────
export default function FileBrowserSidebar({ env, onOpenFile, onRunCommand, externalFiles }: Props) {
  const [fs, setFs] = useState<FSNode[]>(() => loadFS(env));
  const [selectedPath, setSelectedPath] = useState("");
  const [selectedContent, setSelectedContent] = useState("");
  const [viewMode, setViewMode] = useState<"tree" | "preview">("tree");
  const [newItemName, setNewItemName] = useState("");
  const [newItemType, setNewItemType] = useState<"file" | "dir">("file");
  const [showNewForm, setShowNewForm] = useState(false);

  // Reload FS when env changes
  useEffect(() => {
    setFs(loadFS(env));
    setSelectedPath("");
    setSelectedContent("");
    setViewMode("tree");
  }, [env]);

  // Inject external files from code agent
  useEffect(() => {
    if (!externalFiles || externalFiles.length === 0) return;
    setFs((prev) => {
      let updated = [...prev];
      for (const ef of externalFiles) {
        const parts = ef.path.split("/").filter(Boolean);
        if (parts.length === 0) continue;
        const newNode: FSNode = { name: parts[parts.length - 1], type: "file", content: ef.code, modified: Date.now() };
        // Insert at root for simplicity
        const exists = prev.findIndex((n) => n.name === newNode.name);
        if (exists >= 0) {
          updated = updated.map((n) => n.name === newNode.name ? { ...n, content: ef.code, modified: Date.now() } : n);
        } else {
          updated = [...updated, newNode];
        }
      }
      saveFS(env, updated);
      return updated;
    });
  }, [externalFiles, env]);

  const accent = env === "termux" ? "text-green-400" : "text-purple-400";
  const accentBg = env === "termux" ? "bg-green-500/5" : "bg-purple-500/5";
  const accentBorder = env === "termux" ? "border-green-500/20" : "border-purple-500/20";
  const accentBtn = env === "termux"
    ? "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
    : "bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20";

  const handleSelect = useCallback((path: string, node: FSNode) => {
    setSelectedPath(path);
    if (node.content !== undefined) {
      setSelectedContent(node.content);
      setViewMode("preview");
      onOpenFile(path, node.content);
    }
  }, [onOpenFile]);

  const handleDelete = useCallback((path: string) => {
    const parts = path.split("/").filter(Boolean);
    setFs((prev) => {
      const updated = deleteNode(prev, parts);
      saveFS(env, updated);
      return updated;
    });
    if (selectedPath === path) { setSelectedPath(""); setSelectedContent(""); setViewMode("tree"); }
  }, [env, selectedPath]);

  const handleCreate = useCallback(() => {
    if (!newItemName.trim()) return;
    const newNode: FSNode = {
      name: newItemName.trim(),
      type: newItemType,
      content: newItemType === "file" ? `# ${newItemName}\n` : undefined,
      children: newItemType === "dir" ? [] : undefined,
      modified: Date.now(),
    };
    setFs((prev) => {
      const updated = [...prev, newNode];
      saveFS(env, updated);
      return updated;
    });
    setNewItemName("");
    setShowNewForm(false);
  }, [newItemName, newItemType, env]);

  const handleRunFile = useCallback(() => {
    if (!selectedPath) return;
    const ext = getExt(selectedPath);
    let cmd = "";
    if (ext === "py") cmd = `python3 ${selectedPath}`;
    else if (ext === "js") cmd = `node ${selectedPath}`;
    else if (ext === "sh" || ext === "bash") cmd = `bash ${selectedPath}`;
    else if (ext === "c") cmd = `gcc -o /tmp/out ${selectedPath} && /tmp/out`;
    else if (ext === "go") cmd = `go run ${selectedPath}`;
    else if (ext === "rs") cmd = `rustc ${selectedPath} -o /tmp/out && /tmp/out`;
    else cmd = `cat ${selectedPath}`;
    onRunCommand(cmd);
  }, [selectedPath, onRunCommand]);

  const handleCatFile = useCallback(() => {
    if (!selectedPath) return;
    onRunCommand(`cat ${selectedPath}`);
  }, [selectedPath, onRunCommand]);

  const handleReset = useCallback(() => {
    const def = env === "termux" ? DEFAULT_FS_TERMUX : DEFAULT_FS_GENTOO;
    saveFS(env, def);
    setFs(def);
    setSelectedPath("");
    setSelectedContent("");
    setViewMode("tree");
  }, [env]);

  return (
    <div className={`flex flex-col h-full bg-zinc-950 border-l ${accentBorder} font-mono text-xs`}>
      {/* Header */}
      <div className={`flex-shrink-0 px-3 py-2 border-b ${accentBorder} ${accentBg}`}>
        <div className={`font-bold text-sm ${accent} mb-0.5`}>📁 File Browser</div>
        <div className="text-white/30 text-xs">{env === "termux" ? "Termux FS" : "Gentoo FS"}</div>
      </div>

      {/* View toggle + actions */}
      <div className={`flex-shrink-0 flex items-center gap-1 px-2 py-1.5 border-b ${accentBorder}`}>
        <button
          onClick={() => setViewMode("tree")}
          className={`flex-1 py-1 rounded text-xs transition-all ${viewMode === "tree" ? accentBtn + " border" : "text-white/40 hover:text-white/70"}`}
        >
          🌲 Tree
        </button>
        <button
          onClick={() => setViewMode("preview")}
          className={`flex-1 py-1 rounded text-xs transition-all ${viewMode === "preview" ? accentBtn + " border" : "text-white/40 hover:text-white/70"}`}
          disabled={!selectedContent}
        >
          📋 Preview
        </button>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className={`px-2 py-1 rounded border text-xs transition-all ${accentBtn}`}
          title="New file/folder"
        >
          +
        </button>
        <button
          onClick={handleReset}
          className="px-2 py-1 rounded text-xs text-white/30 hover:text-white/60 transition-all"
          title="Reset to defaults"
        >
          ↺
        </button>
      </div>

      {/* New file/dir form */}
      {showNewForm && (
        <div className={`flex-shrink-0 p-2 border-b ${accentBorder} bg-black/40`}>
          <div className="flex gap-1 mb-1">
            <button
              onClick={() => setNewItemType("file")}
              className={`flex-1 py-0.5 rounded text-xs transition-all ${newItemType === "file" ? accentBtn + " border" : "text-white/40 border border-white/10"}`}
            >📄 File</button>
            <button
              onClick={() => setNewItemType("dir")}
              className={`flex-1 py-0.5 rounded text-xs transition-all ${newItemType === "dir" ? accentBtn + " border" : "text-white/40 border border-white/10"}`}
            >📁 Dir</button>
          </div>
          <div className="flex gap-1">
            <input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder={newItemType === "file" ? "filename.py" : "dirname"}
              className="flex-1 bg-black/60 border border-white/15 rounded px-2 py-1 text-white/80 placeholder:text-white/25 focus:outline-none focus:border-white/30 text-xs"
              autoFocus
            />
            <button onClick={handleCreate} className={`px-2 py-1 rounded border text-xs ${accentBtn}`}>✓</button>
          </div>
        </div>
      )}

      {/* File action bar when file selected */}
      {selectedPath && (
        <div className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 border-b ${accentBorder} bg-black/20`}>
          <span className={`flex-1 truncate text-xs ${accent}`}>{selectedPath.split("/").pop()}</span>
          <button onClick={handleRunFile} className={`px-1.5 py-0.5 rounded border text-xs ${accentBtn}`} title="Run file">▶ Run</button>
          <button onClick={handleCatFile} className="px-1.5 py-0.5 rounded border border-white/10 text-white/40 hover:text-white/70 text-xs" title="cat file">cat</button>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === "tree" ? (
          <div className="p-1">
            <FileTree
              nodes={fs}
              depth={0}
              pathPrefix=""
              selectedPath={selectedPath}
              onSelect={handleSelect}
              onDelete={handleDelete}
              env={env}
            />
          </div>
        ) : (
          <div className="p-2">
            {selectedContent ? (
              <>
                <div className="text-white/30 text-xs mb-1 truncate">
                  {selectedPath} · {formatSize(selectedContent)}
                </div>
                <pre className="text-white/70 text-xs whitespace-pre-wrap break-words leading-relaxed bg-black/40 rounded p-2 border border-white/10 overflow-auto max-h-full">
                  {selectedContent}
                </pre>
              </>
            ) : (
              <div className="text-white/25 text-center py-6 text-xs">Select a file to preview</div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`flex-shrink-0 px-2 py-1 border-t ${accentBorder} text-white/20 text-xs flex justify-between`}>
        <span>{fs.length} items at root</span>
        <span className={accent}>FS</span>
      </div>
    </div>
  );
}
