import { useState, useCallback } from "react";
import type { TerminalEnv } from "./TerminalEmulator";

interface Props {
  env: TerminalEnv;
  onRunCommand: (cmd: string) => void;
}

// ── Per-env package catalogue ─────────────────────────────────────────────────
const TERMUX_PACKAGES = [
  { name: "python", description: "Python 3 interpreter", category: "Language" },
  { name: "nodejs", description: "Node.js runtime + npm", category: "Language" },
  { name: "git", description: "Version control system", category: "Dev Tools" },
  { name: "openssh", description: "SSH client + server", category: "Network" },
  { name: "curl", description: "HTTP client", category: "Network" },
  { name: "wget", description: "File downloader", category: "Network" },
  { name: "vim", description: "Text editor", category: "Editor" },
  { name: "neovim", description: "Modern vim fork", category: "Editor" },
  { name: "nano", description: "Simple text editor", category: "Editor" },
  { name: "tmux", description: "Terminal multiplexer", category: "Shell" },
  { name: "zsh", description: "Z shell", category: "Shell" },
  { name: "fish", description: "Friendly interactive shell", category: "Shell" },
  { name: "nmap", description: "Network mapper & scanner", category: "Security" },
  { name: "hydra", description: "Network login cracker", category: "Security" },
  { name: "metasploit", description: "Penetration testing framework", category: "Security" },
  { name: "sqlmap", description: "SQL injection tool", category: "Security" },
  { name: "ffmpeg", description: "Audio/video converter", category: "Media" },
  { name: "imagemagick", description: "Image processing", category: "Media" },
  { name: "golang", description: "Go programming language", category: "Language" },
  { name: "rust", description: "Rust language + cargo", category: "Language" },
  { name: "clang", description: "C/C++ compiler", category: "Compiler" },
  { name: "make", description: "Build automation tool", category: "Dev Tools" },
  { name: "cmake", description: "Cross-platform build system", category: "Dev Tools" },
  { name: "postgresql", description: "PostgreSQL database", category: "Database" },
  { name: "sqlite", description: "SQLite database", category: "Database" },
  { name: "redis", description: "In-memory data store", category: "Database" },
  { name: "termux-api", description: "Android device API access", category: "Termux" },
  { name: "termux-tools", description: "Essential Termux utilities", category: "Termux" },
  { name: "proot-distro", description: "Linux distros in Termux", category: "Termux" },
  { name: "x11-repo", description: "GUI app support (X11)", category: "Termux" },
];

const GENTOO_PACKAGES = [
  { name: "www-servers/nginx", description: "HTTP web server", category: "Server" },
  { name: "www-servers/apache", description: "Apache HTTP server", category: "Server" },
  { name: "dev-lang/python", description: "Python interpreter", category: "Language" },
  { name: "dev-lang/nodejs", description: "Node.js runtime", category: "Language" },
  { name: "dev-lang/go", description: "Go programming language", category: "Language" },
  { name: "dev-lang/rust", description: "Rust + cargo", category: "Language" },
  { name: "dev-vcs/git", description: "Version control system", category: "Dev Tools" },
  { name: "dev-db/postgresql", description: "PostgreSQL database", category: "Database" },
  { name: "dev-db/mariadb", description: "MariaDB (MySQL fork)", category: "Database" },
  { name: "dev-db/redis", description: "Redis in-memory store", category: "Database" },
  { name: "sys-kernel/genkernel", description: "Kernel build tool", category: "System" },
  { name: "sys-apps/systemd", description: "systemd init system", category: "System" },
  { name: "net-firewall/iptables", description: "Firewall management", category: "Network" },
  { name: "net-misc/openssh", description: "SSH client + server", category: "Network" },
  { name: "net-analyzer/nmap", description: "Network mapper", category: "Security" },
  { name: "app-editors/neovim", description: "Modern vim fork", category: "Editor" },
  { name: "app-editors/emacs", description: "GNU Emacs editor", category: "Editor" },
  { name: "app-shells/zsh", description: "Z shell", category: "Shell" },
  { name: "app-shells/fish", description: "Friendly interactive shell", category: "Shell" },
  { name: "app-misc/tmux", description: "Terminal multiplexer", category: "Shell" },
  { name: "media-video/ffmpeg", description: "Audio/video converter", category: "Media" },
  { name: "x11-base/xorg-server", description: "X.Org display server", category: "Desktop" },
  { name: "x11-wm/i3", description: "i3 tiling window manager", category: "Desktop" },
  { name: "x11-terms/alacritty", description: "GPU-accelerated terminal", category: "Desktop" },
  { name: "sys-devel/gcc", description: "GNU Compiler Collection", category: "Compiler" },
  { name: "sys-devel/clang", description: "LLVM/Clang compiler", category: "Compiler" },
  { name: "dev-util/cmake", description: "CMake build system", category: "Dev Tools" },
  { name: "dev-util/docker", description: "Container runtime", category: "Dev Tools" },
  { name: "app-containers/podman", description: "Rootless containers", category: "Dev Tools" },
  { name: "sec-keys/yubikey-manager", description: "YubiKey management", category: "Security" },
];

const CATEGORIES_TERMUX = ["All", "Language", "Dev Tools", "Shell", "Editor", "Network", "Security", "Database", "Media", "Compiler", "Termux"];
const CATEGORIES_GENTOO = ["All", "Language", "Dev Tools", "Server", "Shell", "Editor", "Network", "Security", "Database", "Media", "Compiler", "Desktop", "System"];

const GENTOO_USEFUL_CMDS = [
  { label: "Update World", cmd: "emerge --update --deep --newuse @world", icon: "🔄" },
  { label: "Sync Portage", cmd: "emerge --sync", icon: "🔃" },
  { label: "List Installed", cmd: "qlist -I | head -30", icon: "📋" },
  { label: "Depclean", cmd: "emerge --depclean", icon: "🧹" },
  { label: "System Info", cmd: "emerge --info", icon: "ℹ️" },
  { label: "Revdep-rebuild", cmd: "revdep-rebuild", icon: "🔧" },
  { label: "Check Config", cmd: "dispatch-conf", icon: "⚙️" },
  { label: "Profile List", cmd: "eselect profile list", icon: "📑" },
  { label: "USE flags", cmd: "cat /etc/portage/make.conf", icon: "🚩" },
  { label: "Find pkg", cmd: "eix --installed", icon: "🔍" },
];

const TERMUX_USEFUL_CMDS = [
  { label: "Update All", cmd: "pkg update && pkg upgrade -y", icon: "🔄" },
  { label: "List Installed", cmd: "pkg list-installed", icon: "📋" },
  { label: "Autoclean", cmd: "apt-get autoclean && apt-get autoremove -y", icon: "🧹" },
  { label: "Setup Storage", cmd: "termux-setup-storage", icon: "📂" },
  { label: "Battery Status", cmd: "termux-battery-status", icon: "🔋" },
  { label: "WiFi Info", cmd: "termux-wifi-connectioninfo", icon: "📶" },
  { label: "Device Info", cmd: "termux-info", icon: "ℹ️" },
  { label: "Install Python3", cmd: "pkg install python -y", icon: "🐍" },
  { label: "Install Node", cmd: "pkg install nodejs -y", icon: "🟩" },
  { label: "Install Git", cmd: "pkg install git -y", icon: "🌿" },
];

export default function PackageManagerPanel({ env, onRunCommand }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeTab, setActiveTab] = useState<"browse" | "commands">("browse");
  const [installing, setInstalling] = useState<string | null>(null);

  const packages = env === "termux" ? TERMUX_PACKAGES : GENTOO_PACKAGES;
  const categories = env === "termux" ? CATEGORIES_TERMUX : CATEGORIES_GENTOO;
  const usefulCmds = env === "termux" ? TERMUX_USEFUL_CMDS : GENTOO_USEFUL_CMDS;

  const filtered = packages.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleInstall = useCallback(
    (pkgName: string) => {
      const cmd = env === "termux" ? `pkg install ${pkgName} -y` : `emerge ${pkgName}`;
      setInstalling(pkgName);
      onRunCommand(cmd);
      setTimeout(() => setInstalling(null), 2000);
    },
    [env, onRunCommand]
  );

  const handleSearch = useCallback(() => {
    if (!search.trim()) return;
    const cmd = env === "termux" ? `pkg search ${search}` : `emerge --search ${search}`;
    onRunCommand(cmd);
  }, [env, search, onRunCommand]);

  const isTermux = env === "termux";
  const accent = isTermux ? "text-green-400" : "text-purple-400";
  const accentBg = isTermux ? "bg-green-500/10 border-green-500/30" : "bg-purple-500/10 border-purple-500/30";
  const accentHover = isTermux ? "hover:bg-green-500/20 hover:border-green-400/50" : "hover:bg-purple-500/20 hover:border-purple-400/50";
  const btnActive = isTermux ? "bg-green-500/15 border-green-400/40 text-green-300" : "bg-purple-500/15 border-purple-400/40 text-purple-300";

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-white/10 font-mono text-xs">
      {/* Header */}
      <div className={`flex-shrink-0 px-3 py-2 border-b border-white/10 ${isTermux ? "bg-green-500/5" : "bg-purple-500/5"}`}>
        <div className={`font-bold text-sm ${accent} mb-0.5`}>
          {isTermux ? "📦 pkg" : "📦 emerge"}
        </div>
        <div className="text-white/30 text-xs">
          {isTermux ? "Termux Package Manager" : "Portage Package Manager"}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex border-b border-white/10">
        {(["browse", "commands"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 text-xs font-medium transition-all capitalize ${
              activeTab === tab
                ? `${isTermux ? "text-green-400 border-b-2 border-green-400 bg-green-500/5" : "text-purple-400 border-b-2 border-purple-400 bg-purple-500/5"}`
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {tab === "browse" ? "Browse" : "Quick Cmds"}
          </button>
        ))}
      </div>

      {activeTab === "browse" ? (
        <>
          {/* Search */}
          <div className="flex-shrink-0 p-2 border-b border-white/10">
            <div className="flex gap-1">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder={isTermux ? "Search packages..." : "Search portage..."}
                className="flex-1 bg-black/60 border border-white/15 rounded px-2 py-1 text-white/80 placeholder:text-white/25 focus:outline-none focus:border-white/30 text-xs"
              />
              <button
                onClick={handleSearch}
                className={`px-2 py-1 rounded border text-xs transition-all ${accentBg} ${accent} ${accentHover}`}
                title={`Run ${isTermux ? "pkg search" : "emerge --search"}`}
              >
                🔍
              </button>
            </div>
          </div>

          {/* Category chips */}
          <div className="flex-shrink-0 p-2 flex flex-wrap gap-1 border-b border-white/10 max-h-16 overflow-y-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-1.5 py-0.5 rounded text-xs transition-all border ${
                  activeCategory === cat ? btnActive : "text-white/30 border-white/10 hover:text-white/60 hover:border-white/20"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Package list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-white/25 text-center py-6">
                No packages found
              </div>
            ) : (
              filtered.map((pkg) => (
                <div
                  key={pkg.name}
                  className="flex items-start gap-2 px-2 py-1.5 border-b border-white/5 hover:bg-white/3 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold truncate ${accent} text-xs`}>{pkg.name}</div>
                    <div className="text-white/40 text-xs leading-tight mt-0.5 truncate">{pkg.description}</div>
                    <div className="text-white/20 text-xs mt-0.5">{pkg.category}</div>
                  </div>
                  <button
                    onClick={() => handleInstall(pkg.name)}
                    disabled={installing === pkg.name}
                    className={`flex-shrink-0 px-2 py-0.5 rounded border text-xs transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 ${accentBg} ${accent} ${accentHover}`}
                  >
                    {installing === pkg.name ? "⏳" : "Install"}
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer count */}
          <div className="flex-shrink-0 px-2 py-1.5 border-t border-white/10 text-white/20 text-xs flex justify-between">
            <span>{filtered.length} packages</span>
            <span className={accent}>{isTermux ? "pkg" : "emerge"}</span>
          </div>
        </>
      ) : (
        /* Quick Commands tab */
        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-white/30 text-xs mb-2 uppercase tracking-wider">Quick Commands</div>
          <div className="space-y-1">
            {usefulCmds.map((c) => (
              <button
                key={c.cmd}
                onClick={() => onRunCommand(c.cmd)}
                className={`w-full flex items-center gap-2 p-2 rounded border text-left transition-all ${accentBg} ${accentHover}`}
              >
                <span className="text-base flex-shrink-0">{c.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className={`font-bold text-xs ${accent}`}>{c.label}</div>
                  <div className="text-white/40 text-xs truncate font-mono">{c.cmd}</div>
                </div>
                <span className="text-white/20 flex-shrink-0">▶</span>
              </button>
            ))}
          </div>

          {/* Hive quick cmds */}
          <div className="text-white/30 text-xs mt-4 mb-2 uppercase tracking-wider">Hive Commands</div>
          <div className="space-y-1">
            {[
              { label: "Prime Directive", cmd: "prime-directive", icon: "⚡" },
              { label: "Memory Show", cmd: "memory show", icon: "🧠" },
              { label: "Refinery Status", cmd: "refinery status", icon: "🔬" },
              { label: "Ask Architect", cmd: `hive architect how do I set up a ${isTermux ? "Termux" : "Gentoo"} dev environment?`, icon: "🏗️" },
              { label: "Ask Developer", cmd: `hive developer write a hello world script for ${isTermux ? "Python on Termux" : "Gentoo with gcc"}`, icon: "💻" },
              { label: "Ask DevOps", cmd: `hive devops what should I install first on ${isTermux ? "Termux" : "Gentoo Linux"}?`, icon: "🚀" },
            ].map((c) => (
              <button
                key={c.cmd}
                onClick={() => onRunCommand(c.cmd)}
                className="w-full flex items-center gap-2 p-2 rounded border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 text-left transition-all"
              >
                <span className="text-base flex-shrink-0">{c.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-cyan-400">{c.label}</div>
                  <div className="text-white/30 text-xs truncate font-mono">{c.cmd}</div>
                </div>
                <span className="text-white/20 flex-shrink-0">▶</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
