// hive.js — single bootstrap. Everything starts here.
// AI -> Hive.invoke -> resolver -> provider -> execution.
// Agents do not know providers exist.

export const CAPABILITIES = [
  "search", "filter", "sort", "archive", "extract", "hash",
  "scan", "recover", "index", "grep", "sed", "awk",
  "compress", "decompress", "metadata", "report", "agent", "status"
];

const AGENT_ONLY = new Set(["scan", "recover", "index", "report"]);

export function detectRuntime() {
  if (typeof window !== "undefined") return "browser";
  if (typeof process === "undefined") return "unknown";
  if (process.env.HIVE_FORCE_REMOTE === "1") return "remote";
  if (process.env.TERMUX_VERSION || process.platform === "android") return "android";
  if (process.platform === "win32") return "windows";
  if (process.platform === "linux" || process.platform === "darwin") return "linux";
  return "node";
}

export function routeAgent(task) {
  const t = String(task || "").toLowerCase();
  if (t.includes("radio") || t.includes("coax") || t.includes("relay") || t.includes("ptt")) return "RADIO";
  if (t.includes("forensic") || t === "scan") return "SCRAP";
  if (t.includes("recover") || t === "recover" || t === "index") return "HunterPrime";
  if (t.includes("build") || t.includes("construct") || t.includes("foundry")) return "FoundryHive";
  if (!t) return "DynamicRouter";
  return "KRACKERJACK";
}

export function resolveProvider(capability, runtime = detectRuntime()) {
  if (!CAPABILITIES.includes(capability)) return { error: "unknown", capability };
  if (runtime === "browser" || runtime === "iphone" || runtime === "remote") {
    return { provider: "remote", runtime };
  }
  if (AGENT_ONLY.has(capability)) {
    return { provider: "agent", runtime, agent: routeAgent(capability) };
  }
  if (runtime === "windows") return { provider: "busybox", fallback: ["powershell", "node", "python"], runtime };
  if (runtime === "linux") return { provider: "linux", fallback: ["busybox", "python"], runtime };
  if (runtime === "android") return { provider: "termux", fallback: ["busybox", "node", "remote"], runtime };
  return { provider: "remote", runtime };
}

async function run(bin, args) {
  const { spawn } = await import("node:child_process");
  return new Promise((resolveOut, reject) => {
    const child = spawn(bin, args, { windowsHide: true });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => { out += d; });
    child.stderr.on("data", (d) => { err += d; });
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(bin + " exited " + code + " " + err.trim()));
      else resolveOut(out);
    });
  });
}

function jail(payload) {
  const keys = ["path", "root", "source", "file", "archive", "destination"];
  const copy = { ...payload };
  for (const key of keys) {
    if (copy[key]) copy[key] = underRoot(copy[key]);
  }
  return copy;
}

function underRoot(p) {
  const roots = (process.env.HIVE_ROOTS || "").split(",").filter(Boolean);
  if (!roots.length) throw new Error("HIVE_ROOTS unset");
  const abs = process.platform === "win32" ? p.replace(/\//g, "\\") : p;
  const ok = roots.some((root) => abs.toLowerCase().startsWith(root.toLowerCase()));
  if (!ok) throw new Error("path outside hive roots");
  return p.replace(/\\/g, "/");
}

const providers = {
  async busybox(capability, payload) {
    const bin = process.env.HIVE_BUSYBOX || "busybox";
    if (capability === "search" || capability === "grep") {
      return run(bin, ["grep", "-R", "-n", "--binary-files=without-match", payload.pattern, underRoot(payload.path)]);
    }
    if (capability === "archive" || capability === "find") {
      return run(bin, ["find", underRoot(payload.root || payload.path), "-name", payload.name]);
    }
    if (capability === "compress") return run(bin, ["tar", "-czf", payload.archive, underRoot(payload.source)]);
    if (capability === "extract" || capability === "decompress") return run(bin, ["tar", "-xzf", payload.archive]);
    if (capability === "hash") return run(bin, ["sha256sum", underRoot(payload.file)]);
    if (capability === "sort") return run(bin, ["sort", underRoot(payload.file)]);
    throw new Error("busybox has no " + capability);
  },
  async termux(capability, payload) {
    if (!process.env.TERMUX_VERSION && process.platform !== "android") throw new Error("termux unavailable");
    return providers.busybox(capability, payload);
  },
  async node(capability, payload) {
    if (capability !== "hash") throw new Error("node has no " + capability);
    const { createHash } = await import("node:crypto");
    return createHash("sha256").update(payload.text || "").digest("hex");
  },
  async powershell(capability, payload) {
    if (process.platform !== "win32") throw new Error("powershell unavailable");
    if (capability === "search" || capability === "grep") {
      const pattern = String(payload.pattern || "").replace(/'/g, "''");
      const path = String(payload.path || "").replace(/'/g, "''");
      return run("powershell", ["-NoProfile", "-Command", "Select-String -Path '" + path + "' -Pattern '" + pattern + "'"]);
    }
    throw new Error("powershell has no " + capability);
  },
  async linux(capability, payload) {
    if (capability === "search" || capability === "grep") {
      return run("grep", ["-R", "-n", payload.pattern, underRoot(payload.path)]);
    }
    if (capability === "compress") return run("tar", ["-czf", payload.archive, underRoot(payload.source)]);
    throw new Error("linux has no " + capability);
  },
  async python(capability, payload) {
    if (capability !== "hash") throw new Error("python has no " + capability);
    return run("python", ["-c", "import hashlib,sys; print(hashlib.sha256(sys.argv[1].encode()).hexdigest())", payload.text || ""]);
  },
  async remote(capability, payload, hive) {
    return hive.remote(capability, payload);
  }
};

export const Hive = {
  version: "1.3.1",
  runtime: detectRuntime(),
  capabilities: new Set(CAPABILITIES),
  agents: { SCRAP: true, HunterPrime: true, FoundryHive: true, KRACKERJACK: true, DynamicRouter: true, RADIO: true },
  workerUrl: "",
  workerUrls: [],
  nodes: [],
  health: {},
  model: null,
  state: { agents: {}, capabilities: [], settings: {}, indexes: {} },

  registerAgent(name) {
    if (!name) throw new Error("agent name required");
    this.agents[name] = true;
    return this.agents;
  },

  report(id, sample) {
    const prev = this.health[id] || {};
    this.health[id] = { id, health: "up", latency: 0, uptime: 1, ...prev, ...sample, seen: Date.now() };
    return this.health[id];
  },

  healthy(name) {
    const row = this.health[name];
    return !row || row.health !== "down";
  },

  addNode(id, url) {
    this.nodes.push({ id, url });
    this.report(id, { health: "up", platform: "node", latency: 0, uptime: 1 });
    return this.nodes;
  },

  sync(incoming) {
    const next = incoming || {};
    this.state.agents = { ...this.state.agents, ...(next.agents || {}) };
    this.state.capabilities = [...new Set([...(this.state.capabilities || []), ...(next.capabilities || [])])];
    this.state.settings = { ...this.state.settings, ...(next.settings || {}) };
    this.state.indexes = { ...this.state.indexes, ...(next.indexes || {}) };
    return this.state;
  },

  async invoke(capability, payload = {}) {
    if (!this.capabilities.has(capability)) return { success: false, error: "unknown", degraded: true };
    if (capability === "agent") {
      const route = routeAgent(payload.task);
      return { success: true, result: { route, capability } };
    }
    const decision = resolveProvider(capability, this.runtime);
    if (decision.provider === "agent") {
      return { success: true, result: { route: decision.agent, capability } };
    }
    let jailed = payload;
    try {
      jailed = jail(payload);
    } catch (e) {
      return { success: false, error: String(e.message || e) };
    }
    if (decision.provider === "remote" || this.runtime === "browser") {
      return this.remote(capability, jailed);
    }
    const chain = [decision.provider, ...(decision.fallback || [])].filter((name) => this.healthy(name));
    let last;
    for (const name of chain) {
      try {
        const result = name === "remote" ? await this.remote(capability, jailed) : await providers[name](capability, jailed, this);
        if (result && result.success === false) throw new Error(result.error || "remote failed");
        return { success: true, provider: name, result };
      } catch (e) {
        this.report(name, { health: "down", platform: this.runtime });
        last = e;
      }
    }
    return { success: false, degraded: true, error: String(last && last.message || last || "no provider") };
  },

  async remote(action, payload) {
    const urls = [...this.nodes.map((n) => n.url), ...this.workerUrls, this.workerUrl].filter(Boolean);
    const live = urls.filter((url) => this.healthy(url));
    if (!live.length) return { success: false, degraded: true, error: "no live worker" };
    let last;
    for (const url of live) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, payload })
        });
        if (!response.ok) throw new Error("worker " + response.status);
        this.report(url, { health: "up", platform: "worker" });
        return response.json();
      } catch (e) {
        this.report(url, { health: "down", platform: "worker" });
        last = e;
      }
    }
    return { success: false, degraded: true, error: String(last && last.message || last) };
  },

  async ask(prompt, model = this.model) {
    if (!model || typeof model.ask !== "function") return { success: false, error: "no model" };
    return model.ask(prompt);
  },

  async plan(task, model = this.model) {
    if (!model || typeof model.plan !== "function") return { success: false, route: routeAgent(task), error: "no model" };
    return model.plan(task);
  },

  async execute(capability, payload) {
    return this.invoke(capability, payload);
  }
};

export default Hive;
