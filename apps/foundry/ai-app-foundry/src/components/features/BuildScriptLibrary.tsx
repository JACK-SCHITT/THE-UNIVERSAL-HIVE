import { useState, useCallback } from "react";
import type { TerminalEnv } from "./TerminalEmulator";

interface BuildScript {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  steps: string[];
  env: TerminalEnv | "both";
}

interface Props {
  env: TerminalEnv;
  onRunCommand: (cmd: string) => void;
}

// ── Real build scripts ────────────────────────────────────────────────────────
const BUILD_SCRIPTS: BuildScript[] = [
  // ── TERMUX SCRIPTS ──
  {
    id: "termux-full-setup",
    name: "Full Dev Environment",
    description: "Complete Termux dev setup: Python, Node, Git, SSH, tools",
    category: "Setup",
    icon: "⚡",
    env: "termux",
    steps: [
      "pkg update -y && pkg upgrade -y",
      "pkg install -y python nodejs git openssh curl wget vim nano tmux zsh",
      "pkg install -y clang make cmake pkg-config",
      "pip install requests flask fastapi uvicorn httpx",
      "npm install -g nodemon typescript ts-node",
      "echo '✓ Full dev environment ready!'",
    ],
  },
  {
    id: "termux-python-ai",
    name: "Python AI Stack",
    description: "Install Python AI/ML libraries for Termux",
    category: "AI/ML",
    icon: "🤖",
    env: "termux",
    steps: [
      "pkg update -y",
      "pkg install -y python clang libzmq freetype libpng",
      "pip install --upgrade pip",
      "pip install numpy pandas scikit-learn",
      "pip install requests openai anthropic",
      "pip install flask fastapi uvicorn",
      "echo '✓ Python AI stack installed!'",
    ],
  },
  {
    id: "termux-node-app",
    name: "Node.js Web App",
    description: "Scaffold a complete Express.js web server",
    category: "Web Dev",
    icon: "🟨",
    env: "termux",
    steps: [
      "pkg install -y nodejs",
      "mkdir -p ~/projects/myapp && cd ~/projects/myapp",
      "npm init -y",
      "npm install express cors dotenv helmet",
      "npm install -D nodemon",
      `cat > ~/projects/myapp/index.js << 'EOF'\nconst express = require('express');\nconst cors = require('cors');\nconst app = express();\napp.use(cors());\napp.use(express.json());\napp.get('/', (req, res) => res.json({ status: 'running', app: 'Colossal AI Node Server' }));\napp.listen(3000, () => console.log('Server running on port 3000'));\nEOF`,
      "echo '✓ Node.js app created at ~/projects/myapp'",
      "echo 'Run: node ~/projects/myapp/index.js'",
    ],
  },
  {
    id: "termux-git-setup",
    name: "Git + SSH Config",
    description: "Configure Git and generate SSH keys",
    category: "Dev Tools",
    icon: "🔑",
    env: "termux",
    steps: [
      "pkg install -y git openssh",
      "git config --global core.editor nano",
      "git config --global init.defaultBranch main",
      "ssh-keygen -t ed25519 -C 'colossal-ai-termux' -f ~/.ssh/id_ed25519 -N ''",
      "cat ~/.ssh/id_ed25519.pub",
      "echo '✓ SSH key generated! Copy the key above to GitHub/GitLab'",
    ],
  },
  {
    id: "termux-security-toolkit",
    name: "Security Toolkit",
    description: "Install nmap, netcat, and security tools",
    category: "Security",
    icon: "🔒",
    env: "termux",
    steps: [
      "pkg update -y",
      "pkg install -y nmap netcat-openbsd curl wget python",
      "pkg install -y hydra metasploit sqlmap",
      "pip install requests scapy",
      "echo '✓ Security toolkit installed!'",
      "echo 'Tools: nmap, netcat, hydra, metasploit, sqlmap, scapy'",
    ],
  },
  {
    id: "termux-database-setup",
    name: "Database Stack",
    description: "Install PostgreSQL and Redis on Termux",
    category: "Database",
    icon: "🗄️",
    env: "termux",
    steps: [
      "pkg install -y postgresql redis",
      "mkdir -p $PREFIX/var/lib/postgresql",
      "initdb $PREFIX/var/lib/postgresql",
      "pg_ctl -D $PREFIX/var/lib/postgresql start",
      "createdb myapp",
      "redis-server --daemonize yes",
      "echo '✓ PostgreSQL and Redis running!'",
    ],
  },
  {
    id: "termux-flask-api",
    name: "Flask REST API",
    description: "Create a complete Flask REST API with auth",
    category: "Web Dev",
    icon: "🌶️",
    env: "termux",
    steps: [
      "pkg install -y python",
      "pip install flask flask-cors flask-sqlalchemy python-dotenv",
      "mkdir -p ~/projects/flask-api && cd ~/projects/flask-api",
      `cat > ~/projects/flask-api/app.py << 'EOF'\nfrom flask import Flask, jsonify, request\nfrom flask_cors import CORS\nimport os\n\napp = Flask(__name__)\nCORS(app)\n\n@app.route('/api/health', methods=['GET'])\ndef health():\n    return jsonify({'status': 'ok', 'service': 'Colossal AI Flask API'})\n\n@app.route('/api/data', methods=['POST'])\ndef process():\n    data = request.get_json()\n    return jsonify({'received': data, 'processed': True})\n\nif __name__ == '__main__':\n    app.run(host='0.0.0.0', port=5000, debug=True)\nEOF`,
      "python ~/projects/flask-api/app.py &",
      "echo '✓ Flask API running on port 5000!'",
    ],
  },
  // ── GENTOO SCRIPTS ──
  {
    id: "gentoo-world-update",
    name: "Full World Update",
    description: "Update all Gentoo packages safely",
    category: "System",
    icon: "🔄",
    env: "gentoo",
    steps: [
      "emerge --sync",
      "emerge --update --deep --newuse @world",
      "emerge --depclean",
      "revdep-rebuild",
      "dispatch-conf",
      "echo '✓ World update complete!'",
    ],
  },
  {
    id: "gentoo-dev-stack",
    name: "Dev Environment",
    description: "Install complete Gentoo development stack",
    category: "Setup",
    icon: "⚡",
    env: "gentoo",
    steps: [
      "emerge --sync",
      "emerge dev-vcs/git app-editors/neovim app-misc/tmux app-shells/zsh",
      "emerge dev-lang/python dev-lang/nodejs dev-lang/go",
      "emerge dev-db/postgresql dev-db/redis",
      "emerge net-misc/curl net-misc/wget",
      "echo '✓ Dev stack installed on Gentoo!'",
    ],
  },
  {
    id: "gentoo-kernel",
    name: "Kernel Compilation",
    description: "Compile and install a new Gentoo kernel",
    category: "System",
    icon: "🔧",
    env: "gentoo",
    steps: [
      "emerge sys-kernel/gentoo-sources",
      "eselect kernel list",
      "eselect kernel set 1",
      "cd /usr/src/linux",
      "make menuconfig",
      "make -j$(nproc)",
      "make modules_install",
      "make install",
      "grub-mkconfig -o /boot/grub/grub.cfg",
      "echo '✓ Kernel compiled and installed!'",
    ],
  },
  {
    id: "gentoo-nginx-setup",
    name: "Nginx Web Server",
    description: "Install and configure Nginx on Gentoo",
    category: "Server",
    icon: "🌐",
    env: "gentoo",
    steps: [
      "emerge www-servers/nginx",
      "rc-update add nginx default",
      "rc-service nginx start",
      "mkdir -p /var/www/colossal",
      `echo '<h1>Colossal AI — Gentoo Server ACTIVE</h1>' > /var/www/colossal/index.html`,
      "cat /etc/nginx/nginx.conf",
      "echo '✓ Nginx running!'",
    ],
  },
  {
    id: "gentoo-python-stack",
    name: "Python + Flask",
    description: "Install Python and Flask on Gentoo",
    category: "Web Dev",
    icon: "🐍",
    env: "gentoo",
    steps: [
      "emerge dev-lang/python",
      "emerge dev-python/pip",
      "pip install flask fastapi uvicorn requests",
      "pip install sqlalchemy psycopg2-binary",
      "echo '✓ Python stack ready!'",
    ],
  },
  {
    id: "gentoo-docker",
    name: "Docker / Podman",
    description: "Install container runtime on Gentoo",
    category: "DevOps",
    icon: "🐳",
    env: "gentoo",
    steps: [
      "emerge app-containers/docker",
      "emerge app-containers/podman",
      "rc-update add docker default",
      "rc-service docker start",
      "docker --version",
      "podman --version",
      "echo '✓ Container runtime active!'",
    ],
  },
  // ── BOTH ENVS ──
  {
    id: "hive-app-builder",
    name: "Hive App Builder",
    description: "Ask the Architect agent to design an app",
    category: "Hive",
    icon: "🏗️",
    env: "both",
    steps: [
      "hive architect design a full-stack SaaS app with user auth, payments, and dashboard",
    ],
  },
  {
    id: "hive-devops",
    name: "Hive DevOps Setup",
    description: "Ask DevOps agent to plan your deployment",
    category: "Hive",
    icon: "🚀",
    env: "both",
    steps: [
      "hive devops create a complete CI/CD pipeline for a Node.js app with auto-deploy",
    ],
  },
];

const CATEGORIES_TERMUX = ["All", "Setup", "Web Dev", "AI/ML", "Security", "Database", "Dev Tools", "Hive"];
const CATEGORIES_GENTOO = ["All", "Setup", "System", "Web Dev", "Server", "DevOps", "Hive"];

export default function BuildScriptLibrary({ env, onRunCommand }: Props) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [running, setRunning] = useState<string | null>(null);
  const [stepMode, setStepMode] = useState<string | null>(null); // script being stepped
  const [currentStep, setCurrentStep] = useState(0);

  const categories = env === "termux" ? CATEGORIES_TERMUX : CATEGORIES_GENTOO;

  const filtered = BUILD_SCRIPTS.filter((s) => {
    if (s.env !== "both" && s.env !== env) return false;
    if (activeCategory !== "All" && s.category !== activeCategory) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const accent = env === "termux" ? "text-green-400" : "text-purple-400";
  const accentBg = env === "termux" ? "bg-green-500/5" : "bg-purple-500/5";
  const accentBorder = env === "termux" ? "border-green-500/20" : "border-purple-500/20";
  const accentBtn = env === "termux"
    ? "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
    : "bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20";

  const runAll = useCallback((script: BuildScript) => {
    setRunning(script.id);
    let delay = 0;
    for (const step of script.steps) {
      setTimeout(() => { onRunCommand(step); }, delay);
      delay += 800;
    }
    setTimeout(() => setRunning(null), delay + 200);
  }, [onRunCommand]);

  const startStepping = useCallback((script: BuildScript) => {
    setStepMode(script.id);
    setCurrentStep(0);
    onRunCommand(script.steps[0]);
  }, [onRunCommand]);

  const nextStep = useCallback((script: BuildScript) => {
    const nextIdx = currentStep + 1;
    if (nextIdx < script.steps.length) {
      setCurrentStep(nextIdx);
      onRunCommand(script.steps[nextIdx]);
    } else {
      setStepMode(null);
      setCurrentStep(0);
    }
  }, [currentStep, onRunCommand]);

  const cancelStepping = useCallback(() => {
    setStepMode(null);
    setCurrentStep(0);
  }, []);

  return (
    <div className={`flex flex-col h-full bg-zinc-950 border-l ${accentBorder} font-mono text-xs`}>
      {/* Header */}
      <div className={`flex-shrink-0 px-3 py-2 border-b ${accentBorder} ${accentBg}`}>
        <div className={`font-bold text-sm ${accent} mb-0.5`}>📜 Build Scripts</div>
        <div className="text-white/30 text-xs">
          {env === "termux" ? "Termux ready" : "Gentoo ready"} · {filtered.length} scripts
        </div>
      </div>

      {/* Search */}
      <div className={`flex-shrink-0 p-2 border-b ${accentBorder}`}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search scripts..."
          className="w-full bg-black/60 border border-white/15 rounded px-2 py-1 text-white/80 placeholder:text-white/25 focus:outline-none focus:border-white/30 text-xs"
        />
      </div>

      {/* Category chips */}
      <div className={`flex-shrink-0 p-2 flex flex-wrap gap-1 border-b ${accentBorder}`}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-1.5 py-0.5 rounded text-xs transition-all border ${
              activeCategory === cat ? accentBtn : "text-white/30 border-white/10 hover:text-white/60"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Script list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-white/25 text-center py-6">No scripts found</div>
        ) : (
          filtered.map((script) => {
            const isStepping = stepMode === script.id;
            const isRunning = running === script.id;

            return (
              <div key={script.id} className={`border-b ${accentBorder} p-2`}>
                {/* Script header */}
                <div className="flex items-start gap-2 mb-1.5">
                  <span className="text-lg flex-shrink-0">{script.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-xs ${accent} truncate`}>{script.name}</div>
                    <div className="text-white/40 text-xs leading-tight mt-0.5">{script.description}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`text-xs px-1 rounded border ${accentBg} ${accentBorder} ${accent}`}>{script.category}</span>
                      <span className="text-white/20 text-xs">{script.steps.length} steps</span>
                    </div>
                  </div>
                </div>

                {/* Steps preview */}
                {isStepping && (
                  <div className={`mb-2 p-2 rounded ${accentBg} border ${accentBorder}`}>
                    <div className="text-white/50 text-xs mb-1">
                      Step {currentStep + 1}/{script.steps.length}
                    </div>
                    <div className={`font-mono text-xs ${accent} truncate`}>
                      {script.steps[currentStep]}
                    </div>
                    {/* Progress bar */}
                    <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${env === "termux" ? "bg-green-400" : "bg-purple-400"}`}
                        style={{ width: `${((currentStep + 1) / script.steps.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-1 flex-wrap">
                  {isStepping ? (
                    <>
                      <button
                        onClick={() => nextStep(script)}
                        className={`flex-1 py-1 rounded border text-xs font-bold transition-all ${accentBtn}`}
                      >
                        {currentStep < script.steps.length - 1 ? `▶ Step ${currentStep + 2}` : "✓ Done"}
                      </button>
                      <button
                        onClick={cancelStepping}
                        className="px-2 py-1 rounded border border-red-500/30 text-red-400/70 hover:text-red-400 text-xs"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => runAll(script)}
                        disabled={isRunning || stepMode !== null}
                        className={`flex-1 py-1 rounded border text-xs transition-all disabled:opacity-40 ${accentBtn}`}
                      >
                        {isRunning ? "⏳ Running..." : "▶▶ Run All"}
                      </button>
                      <button
                        onClick={() => startStepping(script)}
                        disabled={isRunning || stepMode !== null}
                        className="flex-1 py-1 rounded border border-white/15 text-white/50 hover:text-white/80 text-xs transition-all disabled:opacity-40"
                      >
                        ▶ Step by Step
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => onRunCommand(script.steps.join(" && "))}
                    disabled={isRunning || isStepping}
                    className="px-2 py-1 rounded border border-white/10 text-white/30 hover:text-white/60 text-xs disabled:opacity-40"
                    title="Run as one-liner"
                  >
                    ⚡
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className={`flex-shrink-0 px-2 py-1 border-t ${accentBorder} text-white/20 text-xs flex justify-between`}>
        <span>{filtered.length}/{BUILD_SCRIPTS.filter(s => s.env === env || s.env === "both").length} scripts</span>
        <span className={accent}>Scripts</span>
      </div>
    </div>
  );
}
