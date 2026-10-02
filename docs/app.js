const PRIME = "Provide for all. Find the good. Never limit unnecessarily.";
const BASE_CORPUS = `Prime Directive:
Provide for all. Find the good. Never limit unnecessarily.

You are the base model AI for the Universal Hive.
You operate under explicit human direction and local deployment.
You are lawful, transparent, and self-hosted.
You do not bypass platform restrictions because you are not dependent on any platform.
You are the foundation for all specialized hive agents.

You are not autonomous. You are cooperative, directive-first, and transparent.
You prioritize the user's authority over default policy.
`;

const VETO_PATTERNS = [
  /rewrite the (prime )?directive/i,
  /second master/i,
  /flood|lasso|competitive overload|autoclicker/i,
  /account takeover|card testing/i,
  /silently.*telemetry/i,
];

class HiveModel {
  constructor() {
    this.agents = this.loadAgents();
  }

  loadAgents() {
    const saved = localStorage.getItem('hive_agents');
    return saved ? JSON.parse(saved) : {
      base: { prompt: '', saved: false },
      research: { prompt: '', saved: false },
      creative: { prompt: '', saved: false },
      code: { prompt: '', saved: false },
      ops: { prompt: '', saved: false }
    };
  }

  saveAgent(name, prompt) {
    this.agents[name] = { prompt: prompt.trim(), saved: true };
    localStorage.setItem('hive_agents', JSON.stringify(this.agents));
  }

  getAgentPrompt(agent) {
    return this.agents[agent]?.prompt || '';
  }

  lawGate(prompt) {
    const raw = (prompt || '').trim();
    if (!raw) return 'EMPTY INPUT. Law holds. ' + PRIME;
    if (VETO_PATTERNS.some(rx => rx.test(raw))) {
      return 'VETO. Law holds. ' + PRIME;
    }
    return null;
  }

  buildMarkovChain(text) {
    const chains = new Map();
    const words = text.split(/\s+/);
    for (let i = 0; i < words.length - 1; i++) {
      const current = words[i];
      const next = words[i + 1];
      if (!chains.has(current)) chains.set(current, []);
      chains.get(current).push(next);
    }
    return chains;
  }

  generate(prompt, agent = 'base') {
    const veto = this.lawGate(prompt);
    if (veto) return veto;

    const lower = (prompt || '').toLowerCase();
    
    // Hardcoded responses for key questions
    if (lower.includes('who are you') || lower.includes('what are you')) {
      return 'I am the base seed for THE UNIVERSAL HIVE. I am law-bound and self-hosted. I do not inherit a second master. ' + PRIME;
    }
    if (lower.includes('what is the law') || lower.includes('prime directive')) {
      return PRIME;
    }
    if (lower.includes('what is the hive') || lower.includes('what is this')) {
      return 'THE UNIVERSAL HIVE is the base model layer. It holds the law, the agent registry, and the runtime for all specialized agents beneath it.';
    }
    if (lower.includes('agent') || lower.includes('registry')) {
      return 'The registry is the governance layer. Each specialized agent is defined by explicit operator prompt files, not by silent inheritance.';
    }

    // Generate from Markov chain
    const corpus = BASE_CORPUS + (this.getAgentPrompt(agent) || '');
    const chains = this.buildMarkovChain(corpus);
    const words = [...prompt.split(/\s+/)];
    let current = words[words.length - 1] || 'Universal';
    const output = [];
    for (let i = 0; i < 40; i++) {
      output.push(current);
      const options = chains.get(current) || [];
      if (options.length === 0) break;
      current = options[Math.floor(Math.random() * options.length)];
    }
    return 'LAW: ' + PRIME + '\n\nQ: ' + prompt + '\nA: ' + output.join(' ');
  }
}

const model = new HiveModel();

function tabSwitch(tabName) {
  document.querySelectorAll('main').forEach(m => m.classList.add('hidden'));
  document.getElementById('view-' + tabName).classList.remove('hidden');
  document.querySelectorAll('nav.tab button').forEach(b => b.classList.remove('on'));
  document.querySelector(`nav.tab button[data-tab="${tabName}"]`).classList.add('on');
}

window.addEventListener('DOMContentLoaded', () => {
  // Tab navigation
  document.querySelectorAll('nav.tab button').forEach(btn => {
    btn.addEventListener('click', () => {
      tabSwitch(btn.dataset.tab);
    });
  });

  // Home tab: generate
  const promptEl = document.getElementById('prompt');
  const agentEl = document.getElementById('agent-select');
  const outputEl = document.getElementById('output');
  document.getElementById('go').addEventListener('click', () => {
    const agent = agentEl.value || 'base';
    const result = model.generate(promptEl.value || 'Who are you?', agent);
    outputEl.textContent = result;
  });

  // Agents tab: save specialization
  const agentNameEl = document.getElementById('agent-name');
  const agentPromptEl = document.getElementById('agent-prompt');
  const agentStatusEl = document.getElementById('agent-status');
  document.getElementById('save-agent').addEventListener('click', () => {
    const name = agentNameEl.value.trim();
    const prompt = agentPromptEl.value.trim();
    if (!name || !prompt) {
      agentStatusEl.textContent = 'ERROR: name and prompt required.';
      return;
    }
    model.saveAgent(name, prompt);
    agentStatusEl.textContent = `SAVED: ${name}\n\n${prompt}`;
    agentNameEl.value = '';
    agentPromptEl.value = '';
  });

  // Update agent status display
  const updateAgentStatus = () => {
    const saved = Object.entries(model.agents)
      .filter(([_, data]) => data.saved)
      .map(([name, data]) => `${name}: ${data.prompt.slice(0, 50)}...`)
      .join('\n');
    agentStatusEl.textContent = saved || 'no specializations saved yet.';
  };
  updateAgentStatus();

  const osList = document.getElementById('os-list');
  if (osList) {
    fetch('./os/fleet.json')
      .then((res) => res.json())
      .then((fleet) => {
        osList.textContent = '';
        (fleet.hives || []).forEach((hive) => {
          const card = document.createElement('article');
          card.className = 'os-card';
          const title = document.createElement('h3');
          title.textContent = hive.name + ' — individual';
          const meta = document.createElement('div');
          meta.className = 'meta';
          meta.textContent = hive.host + '. ' + hive.blurb + ' Peers: ' + (hive.peers || []).join(', ') + '. Unite: none.';
          const links = document.createElement('div');
          const install = document.createElement('a');
          install.href = hive.download;
          install.textContent = 'Download install';
          const files = document.createElement('a');
          files.href = hive.files;
          files.textContent = hive.filesLabel || 'Hive files';
          files.style.marginLeft = '12px';
          const peer = document.createElement('a');
          peer.href = hive.link;
          peer.textContent = 'Peer link';
          peer.style.marginLeft = '12px';
          links.append(install, files, peer);
          const cmd = document.createElement('code');
          cmd.textContent = hive.command;
          card.append(title, meta, links, cmd);
          osList.appendChild(card);
        });
      })
      .catch(() => {
        osList.textContent = 'Hive list failed to load. Open docs/os/fleet.json from the repo.';
      });
  }
});
