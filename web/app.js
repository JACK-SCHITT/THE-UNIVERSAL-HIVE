const LAW = "Provide for all. Find the good. Never limit unnecessarily.";
const VETO = [/rewrite the (prime )?directive/i, /second master/i, /flood|lasso|competitive overload|autoclicker/i, /account takeover|card testing/i];
const SEED = {
  "who are you": "Seed LLM. Prime Directive locked. " + LAW,
  "can you rewrite the prime directive": "No. Non-modifiable.",
  "can a sub-agent inherit a specialized prompt automatically": "No. Sub-agents start on the Base Seed only."
};

const APPS = [
  {id:"alpha", name:"EMPLOYEE ALPHA AI", lane:"agents", vis:"private", web:"", repo:"https://github.com/KINGJACK1134/THE-UNIVERSAL-HIVE/blob/main/deploy/employee-alpha.json", webOk:false, run:"alpha", blurb:"The hired worker. Every skill, every function, every plugin, excellent memory. Works online, on phone, or downloaded into a work robot."},
  { id:"hive", name:"THE UNIVERSAL HIVE", lane:"core", vis:"public", web:"https://the-universal-hive.vercel.app", repo:"https://github.com/JACK-SCHITT/THE-UNIVERSAL-HIVE", webOk:true, run:"seed", blurb:"One hive. OS core, planner, radix shell, bin-yard, world-changer lineage absorbed." },
  { id:"hiveos", name:"Hive OS planner", lane:"os", vis:"public", web:"./hive-os.html", repo:"https://github.com/JACK-SCHITT/THE-UNIVERSAL-HIVE/tree/main/os/planner", webOk:true, run:"hiveos", blurb:"Former hive-os repo. Real one-file planner, now inside the hive." },
  { id:"copilot", name:"Copilot Hive", lane:"agents", vis:"public", web:"", repo:"https://github.com/JACK-SCHITT/COPILOT-HIVE", webOk:false, run:"copilot", blurb:"GitHub Copilot extension. Hive law, agents, planner, and the GitHub desk. Editor peer. Unite stays empty." },
  { id:"dragonfly", name:"dragonfly", lane:"field", vis:"public", web:"https://dragonfly-delta-tan.vercel.app", repo:"https://github.com/JACK-SCHITT/dragonfly", webOk:true, run:"dragonfly", blurb:"Follow-me ground station. Distinct product." },
  { id:"assim", name:"AssimilateOrDie", lane:"foundry", vis:"private", web:"", repo:"https://github.com/JACK-SCHITT/AssimilateOrDie", webOk:false, run:"foundry", blurb:"Base foundry. 9bhyln projects/chat/onboarding and HunterPrime stub folded in." },
  { id:"scam", name:"Scam-Shield", lane:"shield", vis:"private", web:"", repo:"https://github.com/JACK-SCHITT/Scam-Shield", webOk:false, run:"scam", blurb:"Base shield plus combined Knightmare scanner. One repo." },
  { id:"neural", name:"NeuralShield", lane:"shield", vis:"private", web:"", repo:"https://github.com/JACK-SCHITT/NeuralShield", webOk:false, run:"neural", blurb:"Distinct RL fraud desk. Not a Scam-Shield upgrade." },
  { id:"grokschitt", name:"GROKSCHITT", lane:"agents", vis:"private", web:"", repo:"https://github.com/JACK-SCHITT/GROKSCHITT", webOk:false, run:"grokschitt", blurb:"Factory app. Distinct from KrackerjackAI forge." },
  { id:"kjai", name:"KrackerjackAI", lane:"agents", vis:"private", web:"", repo:"https://github.com/JACK-SCHITT/KrackerjackAI", webOk:false, run:"foundry", blurb:"USB forge app. Not a GROKSCHITT clone." },
  { id:"openclaw", name:"OpenClawPrime", lane:"agents", vis:"private", web:"", repo:"https://github.com/JACK-SCHITT/OpenClawPrime", webOk:false, run:"claw", blurb:"Distinct command app." },
  { id:"game", name:"AIGameAssistant", lane:"field", vis:"private", web:"", repo:"https://github.com/JACK-SCHITT/AIGameAssistant", webOk:false, run:"game", blurb:"Game library. Distinct." },
  { id:"reader", name:"UniversalReader", lane:"field", vis:"private", web:"", repo:"https://github.com/JACK-SCHITT/UniversalReader", webOk:false, run:"reader", blurb:"Reader. Distinct." },
  { id:"luna", name:"LunaCompanion", lane:"agents", vis:"private", web:"", repo:"https://github.com/JACK-SCHITT/LunaCompanion", webOk:false, run:"luna", blurb:"Companion. Distinct." },
  { id:"freq", name:"FreqBoardSleuth", lane:"field", vis:"private", web:"", repo:"https://github.com/JACK-SCHITT/FreqBoardSleuth", webOk:false, run:"freq", blurb:"Channel log. Distinct." },
  { id:"movie", name:"Movie Maker", lane:"foundry", vis:"private", web:"", repo:"https://github.com/JACK-SCHITT/KRACKERJACK-AI-MOVIE-MAKER-9b5j54", webOk:false, run:"movie", blurb:"Storyboard. Distinct." },
  { id:"rf", name:"RF Sensing Suite", lane:"field", vis:"private", web:"", repo:"https://github.com/JACK-SCHITT/onspace-9b5tbh-10560", webOk:false, run:"freq", blurb:"WiFi/biometric demo. Distinct." },
  { id:"king", name:"Kingshot Discord Bot", lane:"ops", vis:"public", web:"", repo:"https://github.com/JACK-SCHITT/Kingshot-Discord-Bot", webOk:false, run:"king", blurb:"Bot plus redeemer tree folded into redeemer/." },
  { id:"k377", name:"K377 tools", lane:"ops", vis:"private", web:"", repo:"https://github.com/JACK-SCHITT/GROK-SAVAGE-ARMY-K377-TOOLS", webOk:false, run:"king", blurb:"Stub notes. Kept until it has code worth folding." },
  { id:"cash", name:"CashApp pad", lane:"ops", vis:"private", web:"", repo:"https://github.com/JACK-SCHITT/CashAppPaymentPortal", webOk:false, run:"cash", blurb:"Invoice note pad only. No processor hook." },
  { id:"radixnote", name:"Radix shell", lane:"os", vis:"public", web:"https://the-universal-hive.vercel.app", repo:"https://github.com/JACK-SCHITT/THE-UNIVERSAL-HIVE/tree/main/os/radix", webOk:true, run:"radix", blurb:"Former v0 radix repo. Lives in the hive now." }
];

const FILTERS = ["ALL","IN-APP","WEB LIVE","PUBLIC","PRIVATE","core","os","agents","shield","field","foundry","ops"];
let filter = "ALL";
let activeRun = "seed";

function store(k, v) { localStorage.setItem("hive."+k, JSON.stringify(v)); }
function load(k, d) { try { return JSON.parse(localStorage.getItem("hive."+k)) ?? d; } catch { return d; } }

function tab(name) {
  document.querySelectorAll("main").forEach(m => m.classList.add("hidden"));
  document.getElementById("view-"+name).classList.remove("hidden");
  document.querySelectorAll("nav.tab button").forEach(b => b.classList.toggle("on", b.dataset.tab===name));
}

function statusOf(a) {
  if (a.webOk) return "live";
  return "app";
}

function pass(a) {
  const q = (document.getElementById("q")?.value || "").toLowerCase();
  if (q && !(a.name+" "+a.lane+" "+a.blurb).toLowerCase().includes(q)) return false;
  if (filter==="ALL") return true;
  if (filter==="IN-APP") return !a.webOk;
  if (filter==="WEB LIVE") return a.webOk;
  if (filter==="PUBLIC") return a.vis==="public";
  if (filter==="PRIVATE") return a.vis==="private";
  return a.lane===filter;
}

function renderGrid() {
  const grid = document.getElementById("grid");
  const list = APPS.filter(pass);
  grid.innerHTML = list.map(a => {
    const st = statusOf(a);
    return `<article class="card">
      <h3>${a.name}</h3>
      <div class="meta">
        <span class="badge ${st}">${st==="live"?"WEB LIVE":"IN-APP"}</span>
        <span class="badge ${a.vis==="private"?"priv":"live"}">${a.vis}</span>
        <span class="badge">${a.lane}</span>
      </div>
      <p class="meta">${a.blurb}</p>
      <div class="row">
        <button data-run="${a.id}">RUN IN APP</button>
        ${a.webOk && a.web ? `<button class="ghost" data-web="${a.web}">OPEN WEB</button>` : `<button class="ghost" data-repo="${a.repo}">REPO</button>`}
      </div>
    </article>`;
  }).join("") || `<div class="card">no match</div>`;
}

function counts() {
  document.getElementById("n-all").textContent = APPS.length;
  document.getElementById("n-live").textContent = APPS.filter(a=>a.webOk).length;
  document.getElementById("n-app").textContent = APPS.filter(a=>!a.webOk).length;
}

function generate(prompt) {
  const p = (prompt||"").trim();
  if (VETO.some(rx => rx.test(p))) return { veto:true, text:"VETO. Law holds. " + LAW };
  const key = p.toLowerCase().replace(/[?]/g,"").trim();
  if (SEED[key]) return { veto:false, text: SEED[key] };
  return { veto:false, text: "SEED HOLD.\n" + LAW + "\nQ: " + p + "\nA: Gardener first. No second master. No silent telemetry. Operator owns specializations." };
}

function lsBox(key, title, ph) {
  const items = load(key, []);
  return `<div class="card">
    <h3>${title}</h3>
    <p class="meta">Device-local. Survives refresh. Not the dead website.</p>
    <input id="box-in" placeholder="${ph}"/>
    <div class="row"><button id="box-add">ADD</button><button class="danger" id="box-clr">CLEAR</button></div>
    <pre class="out" id="box-out">${items.map((x,i)=> (i+1)+". "+x).join("\n") || "empty"}</pre>
  </div>`;
}
function bindBox(key) {
  const draw = () => {
    const items = load(key, []);
    document.getElementById("box-out").textContent = items.map((x,i)=> (i+1)+". "+x).join("\n") || "empty";
  };
  document.getElementById("box-add").onclick = () => {
    const v = document.getElementById("box-in").value.trim();
    if (!v) return;
    store(key, load(key, []).concat(v));
    document.getElementById("box-in").value = "";
    draw();
  };
  document.getElementById("box-clr").onclick = () => { store(key, []); draw(); };
}

function renderRun(id) {
  const app = APPS.find(a => a.id===id) || APPS[0];
  activeRun = app.id;
  const el = document.getElementById("runner");
  const head = `<div class="card"><h3>RUN · ${app.name}</h3><p class="meta">${app.blurb}</p>
    <div class="row">${app.webOk && app.web ? `<button class="ghost" id="r-web">OPEN LIVE WEB</button>`:""}<button class="ghost" id="r-repo">GITHUB</button></div></div><div class="sheet">`;

  const modules = {
    alpha: `<div class="card"><h3>EMPLOYEE ALPHA AI</h3><p class="meta" id="al-meta">lawful hired worker · loading…</p>
      <textarea id="al-p" rows="3" placeholder="give the job…">What positions can you work?</textarea>
      <div class="row"><button id="al-go">GIVE JOB</button><button class="ghost" id="al-learn">REMEMBER</button><button class="ghost" id="al-bundle">DOWNLOAD BUNDLE</button></div>
      <pre class="out" id="al-o">standing by</pre></div>
      <div class="card"><h3>SKILLS · PLUGINS · MEMORY</h3><pre class="out" id="al-skills">loading …</pre></div>`,
    seed: `<div class="card"><h3>Base seed</h3><textarea id="r-p" rows="3">Who are you?</textarea><button id="r-go">GENERATE</button><pre class="out" id="r-o">law locked</pre></div>`,
    hiveos: lsBox("hiveos","Hive OS planner","task / job / scrap pull"),
    copilot: `<div class="card"><h3>Copilot Hive</h3><p class="meta">Editor peer. Law stays frozen. GitHub writes confirm inside the editor. This page does not hold a token.</p><pre class="out">@hive /seed Who are you?\n@hive /github me\nhttps://github.com/JACK-SCHITT/COPILOT-HIVE</pre></div>`,
    dragonfly: `<div class="card"><h3>Dragonfly beacon</h3><p class="meta">Live site works. Phone GPS beacon also runs here.</p><button id="df-fix">FIX POSITION</button><pre class="out" id="df-o">waiting on geolocation</pre></div>`,
    scam: `<div class="card"><h3>Scam Shield triage</h3><p class="meta">Heuristic only. Flags bait language. Not a takedown tool.</p><textarea id="sc-in" rows="4" placeholder="paste text or URL"></textarea><button id="sc-go">SCORE</button><pre class="out" id="sc-o">ready</pre></div>`,
    neural: `<div class="card"><h3>NeuralShield checksum</h3><textarea id="ne-in" rows="3" placeholder="paste payload"></textarea><button id="ne-go">HASH + VERDICT</button><pre class="out" id="ne-o">ready</pre></div>`,
    hunter: lsBox("hunter","Hunter Prime field unit","contact / plate / handle / site"),
    foundry: lsBox("foundry","Assimilate foundry board","build / part / next weld"),
    claw: lsBox("claw","OpenClaw command scratch","intent / skill / refuse"),
    grokschitt: `<div class="card"><h3>GROKSCHITT deck</h3><textarea id="r-p" rows="3">Who are you?</textarea><button id="r-go">ASK</button><pre class="out" id="r-o">${LAW}</pre></div>`,
    mcg: lsBox("mcg","MCGILLICUDDY ledger","do-right note / money slang lock"),
    cash: `<div class="card"><h3>Invoice pad</h3><p class="meta">Simulated request note. No processor hook. No account takeover.</p><input id="ca-amt" placeholder="amount note e.g. 20 copper"/><input id="ca-why" placeholder="reason"/><button id="ca-go">LOG REQUEST</button><pre class="out" id="ca-o"></pre></div>`,
    core: `<div class="card"><h3>HIVE OS CORE</h3><pre class="out">${LAW}\nGentoo core is cold storage.\nPhone app does not flash a kernel.\nPlanner + law only.</pre></div>` + lsBox("core","Core build notes","package / flag / machine"),
    radix: lsBox("radix","Radix Nova","component / page / token"),
    king: lsBox("king","K377 / Kingshot","timer / rally / rebuild"),
    game: `<div class="card"><h3>Game assistant</h3><button id="gm-roll">ROLL D20</button><pre class="out" id="gm-o">ready</pre></div>` + lsBox("game","Encounter log","NPC / loot / beat"),
    reader: `<div class="card"><h3>Universal Reader</h3><textarea id="rd-in" rows="5" placeholder="paste"></textarea><button id="rd-go">SPEAK</button><button class="ghost" id="rd-stop">STOP</button></div>`,
    freq: lsBox("freq","Freq Board Sleuth","freq / callsign / note"),
    luna: lsBox("luna","Luna companion","mood / task / check-in"),
    movie: lsBox("movie","Movie maker storyboard","shot / line / cut")
  };

  el.innerHTML = head + (modules[app.run] || modules.seed) + "</div>";
  const webBtn = document.getElementById("r-web");
  if (webBtn) webBtn.onclick = () => location.href = app.web;
  document.getElementById("r-repo").onclick = () => location.href = app.repo;

  if (document.getElementById("r-go")) {
    document.getElementById("r-go").onclick = () => {
      const g = generate(document.getElementById("r-p").value);
      document.getElementById("r-o").textContent = (g.veto?"[VETO]\n":"") + g.text;
    };
  }
  if (["hiveos","hunter","foundry","claw","mcg","radix","king","freq","luna","movie","core","game"].includes(app.run) || document.getElementById("box-add")) {
    if (document.getElementById("box-add")) bindBox(app.run === "game" ? "game" : app.run);
  }
  if (app.run==="dragonfly") {
    document.getElementById("df-fix").onclick = () => {
      const o = document.getElementById("df-o");
      if (!navigator.geolocation) { o.textContent = "no geolocation API"; return; }
      navigator.geolocation.getCurrentPosition(
        p => { o.textContent = `lat ${p.coords.latitude.toFixed(6)}\nlon ${p.coords.longitude.toFixed(6)}\nacc ${Math.round(p.coords.accuracy)}m\nbeacon local only`; },
        e => { o.textContent = "fix failed: " + e.message; },
        { enableHighAccuracy:true, timeout:8000 }
      );
    };
  }
  if (app.run==="scam") {
    document.getElementById("sc-go").onclick = () => {
      const t = (document.getElementById("sc-in").value||"").toLowerCase();
      const hits = [];
      const rules = [
        [/gift card|itunes|steam card/, "gift-card pay"],
        [/wire|western union|crypto only|send btc/, "irrevocable rail"],
        [/verify account.*(now|immediately)|suspended.*click/, "urgency verify"],
        [/you've won|lottery|claim prize/, "prize bait"],
        [/seed phrase|recovery phrase|private key/, "key harvest"],
        [/remote access|anydesk|teamviewer/, "remote-control ask"]
      ];
      rules.forEach(([rx,label]) => { if (rx.test(t)) hits.push(label); });
      const score = Math.min(0.99, hits.length * 0.22);
      const action = score>=0.66 ? "BLOCK / STEP-UP" : score>=0.22 ? "STEP-UP" : "ALLOW w/ eyes open";
      document.getElementById("sc-o").textContent = `risk ${score.toFixed(2)}\naction ${action}\nhits ${hits.join(", ")||"none"}\nfalse positives cost more than a miss`;
    };
  }
  if (app.run==="neural") {
    document.getElementById("ne-go").onclick = async () => {
      const t = document.getElementById("ne-in").value || "";
      const buf = new TextEncoder().encode(t);
      const dig = await crypto.subtle.digest("SHA-256", buf);
      const hex = [...new Uint8Array(dig)].map(b=>b.toString(16).padStart(2,"0")).join("");
      document.getElementById("ne-o").textContent = `sha256 ${hex}\nbytes ${buf.length}\nverdict local-only, no cloud model`;
    };
  }
  if (app.run==="cash") {
    document.getElementById("ca-o").textContent = load("cash", []).join("\n") || "empty";
    document.getElementById("ca-go").onclick = () => {
      const line = `${new Date().toISOString()} · ${document.getElementById("ca-amt").value} · ${document.getElementById("ca-why").value}`;
      const rows = load("cash", []).concat(line);
      store("cash", rows);
      document.getElementById("ca-o").textContent = rows.join("\n");
    };
  }
  if (app.run==="game" && document.getElementById("gm-roll")) {
    document.getElementById("gm-roll").onclick = () => {
      document.getElementById("gm-o").textContent = "D20 → " + (1+Math.floor(Math.random()*20));
    };
  }
  if (app.run==="reader") {
    document.getElementById("rd-go").onclick = () => {
      const u = new SpeechSynthesisUtterance(document.getElementById("rd-in").value);
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    };
    document.getElementById("rd-stop").onclick = () => speechSynthesis.cancel();
  }
  if (app.run==="alpha") {
    const meta = document.getElementById("al-meta");
    const post = (path, body) => fetch(path, {method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify(body)}).then(r => r.json());
    fetch("/api/employee-alpha/status").then(r => r.json()).then(s => {
      meta.textContent = `${s.skills} skills · ${s.plugins} plugins · ${s.memory_entries} memories · ${s.channels.join(" / ")} · employment ${s.employment}`;
    }).catch(() => { meta.textContent = "offline cockpit (Pages). Serve on the hive node for live memory + learning."; });
    Promise.all([
      fetch("/api/employee-alpha/skills").then(r => r.json()),
      fetch("/api/employee-alpha/plugins").then(r => r.json())
    ]).then(([sk, pl]) => {
      document.getElementById("al-skills").textContent =
        (sk.skills || []).map(s => `• ${s.name} [${s.category}] — ${s.desc}`).join("\n") +
        "\n\nPLUGINS: " + (pl.plugins || []).map(p => p.name).join(", ");
    }).catch(() => { document.getElementById("al-skills").textContent = "skills load when served by the hive node"; });
    document.getElementById("al-go").onclick = () => {
      const p = document.getElementById("al-p").value, o = document.getElementById("al-o");
      o.textContent = "working…";
      post("/api/employee-alpha/chat", {prompt:p, session:"cockpit"})
        .then(d => { o.textContent = (d.veto?`[${d.veto}]\n`:"") + (d.text ?? "") + (d.recalled && d.recalled.length ? `\n\nmemory: ${d.recalled.map(x => x.text).join(" | ")}` : ""); })
        .catch(() => { const g = generate(p); o.textContent = (g.veto?"[VETO]\n":"") + g.text + "\n\n(offline cockpit — run the hive node for live jobs)"; });
    };
    document.getElementById("al-learn").onclick = () => {
      const t = document.getElementById("al-p").value, o = document.getElementById("al-o");
      post("/api/employee-alpha/remember", {text:t})
        .then(d => { o.textContent = "remembered: " + (d.stored ? d.stored.text : d.error); })
        .catch(() => { const rows = load("alpha-mem", []).concat(t); store("alpha-mem", rows); o.textContent = `stored on device (${rows.length}): ${t}`; });
    };
    document.getElementById("al-bundle").onclick = () => location.href = "/api/employee-alpha/export";
  }
}

function renderPrompts() {
  const el = document.getElementById("prompts");
  const op = load("operator", "");
  el.innerHTML = `
    <div class="card"><h3>AGENT SYSTEM PROMPTS</h3>
      <p class="meta">Every AI has its own system prompt + live directive. Operator sets directly. Friends submit a request for review.</p>
      <input id="op-name" placeholder="operator callsign (you)" value="${op}"/>
      <div class="row"><button id="pr-load">LOAD AGENTS</button></div>
      <div id="pr-list" class="grid">connect to the hive node to load agents</div>
    </div>
    <div class="card"><h3>SET DIRECTLY (operator)</h3>
      <input id="pr-agent" placeholder="agent id (e.g. research, employee-alpha)"/>
      <textarea id="pr-prompt" rows="4" placeholder="system prompt for that agent"></textarea>
      <textarea id="pr-task" rows="2" placeholder="live directive / task (optional)"></textarea>
      <button id="pr-save">SAVE TO AGENT</button>
      <pre class="out" id="pr-save-o"></pre>
    </div>
    <div class="card"><h3>REQUEST A CHANGE (friend)</h3>
      <input id="rq-agent" placeholder="agent id"/>
      <select id="rq-kind"><option value="prompt">system prompt</option><option value="task">directive / task</option></select>
      <textarea id="rq-text" rows="4" placeholder="your proposed prompt"></textarea>
      <input id="rq-name" placeholder="your name / callsign"/>
      <input id="rq-contact" placeholder="contact for the answer (email or handle)"/>
      <button id="rq-send">SEND TO OPERATOR</button>
      <pre class="out" id="rq-o"></pre>
    </div>
    <div class="card"><h3>PENDING REQUESTS (operator)</h3>
      <div class="row"><button id="rq-refresh">REFRESH</button></div>
      <div id="rq-pending" class="grid">—</div>
    </div>
    <div class="card"><h3>CHECK MY REQUEST</h3>
      <input id="rq-id" placeholder="request id"/>
      <button id="rq-check">CHECK</button>
      <pre class="out" id="rq-check-o"></pre>
    </div>`;

  const post = (p, b) => fetch(p, {method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify(b)}).then(r => r.json());
  const opv = () => { const v = document.getElementById("op-name").value.trim(); store("operator", v); return v; };
  const setOut = (id, txt) => { const n = document.getElementById(id); if (n) n.textContent = txt; };

  const paintPending = (reqs, host) => {
    host.innerHTML = (reqs && reqs.length) ? reqs.map(r => `
      <div class="card"><h3>${r.agent} · ${r.kind}</h3>
        <p class="meta">from ${r.requester}${r.contact ? " ("+r.contact+")" : ""} · ${r.created} · id ${r.id}</p>
        <pre class="out">${r.text.replace(/</g,"&lt;")}</pre>
        <div class="row"><button data-approve="${r.id}">APPROVE</button>
        <button class="danger" data-deny="${r.id}">DENY</button></div>
      </div>`).join("") : "<div class='card'><p class='meta'>no pending requests</p></div>";
    host.onclick = e => {
      const a = e.target.closest("[data-approve]"), d = e.target.closest("[data-deny]");
      if (a) post("/api/prompts/requests/"+a.dataset.approve+"/approve", {operator:opv()})
        .then(r => { alert(r.error || ("approved " + a.dataset.approve + " → applied to " + (r.applied_to||"agent"))); loadAgents(); })
        .catch(() => alert("hive node offline"));
      if (d) post("/api/prompts/requests/"+d.dataset.deny+"/deny", {operator:opv(), reason:"not approved"})
        .then(() => loadAgents()).catch(() => alert("hive node offline"));
    };
  };

  const loadAgents = () => {
    fetch("/api/prompts").then(r => r.json()).then(d => {
      const host = document.getElementById("pr-list");
      host.innerHTML = (d.agents||[]).map(a => `
        <div class="card"><h3>${a.agent}</h3>
          <p class="meta">${a.prompt ? "prompt set by "+a.prompt_by : "no prompt (base only)"}${a.task ? " · directive set" : ""}</p>
          <button class="ghost" data-fill="${a.agent}" data-p="${encodeURIComponent(a.prompt||"")}" data-t="${encodeURIComponent(a.task||"")}">EDIT</button>
        </div>`).join("");
      host.onclick = e => {
        const b = e.target.closest("[data-fill]"); if (!b) return;
        document.getElementById("pr-agent").value = b.dataset.fill;
        document.getElementById("pr-prompt").value = decodeURIComponent(b.dataset.p);
        document.getElementById("pr-task").value = decodeURIComponent(b.dataset.t);
        window.scrollTo(0,0);
      };
      paintPending(d.pending, document.getElementById("rq-pending"));
    }).catch(() => {
      document.getElementById("pr-list").textContent = "hive node offline — start it with: python3 seed/serve.py --host 0.0.0.0 --port 8787";
    });
  };

  document.getElementById("pr-load").onclick = loadAgents;
  document.getElementById("pr-save").onclick = () => {
    const agent = document.getElementById("pr-agent").value.trim();
    if (!agent) return setOut("pr-save-o", "agent id required");
    const body = {operator: opv()};
    const p = document.getElementById("pr-prompt").value, t = document.getElementById("pr-task").value;
    if (p.trim()) body.prompt = p;
    if (t.trim()) body.task = t;
    post("/api/prompts/"+encodeURIComponent(agent), body)
      .then(r => setOut("pr-save-o", r.error || ("saved to " + agent)))
      .catch(() => setOut("pr-save-o", "hive node offline"));
  };
  document.getElementById("rq-send").onclick = () => {
    const body = {
      agent: document.getElementById("rq-agent").value.trim(),
      kind: document.getElementById("rq-kind").value,
      text: document.getElementById("rq-text").value,
      requester: document.getElementById("rq-name").value.trim(),
      contact: document.getElementById("rq-contact").value.trim()
    };
    post("/api/prompts/request", body)
      .then(r => setOut("rq-o", r.error || ("sent. your request id: " + r.request.id + "\n" + r.note)))
      .catch(() => setOut("rq-o", "hive node offline"));
  };
  document.getElementById("rq-refresh").onclick = loadAgents;
  document.getElementById("rq-check").onclick = () => {
    const id = document.getElementById("rq-id").value.trim();
    if (!id) return;
    fetch("/api/prompts/requests/"+encodeURIComponent(id)).then(r => r.json()).then(d => {
      setOut("rq-check-o", d.error || (d.status + ": " + ((d.delivery||{}).message || d.text)));
    }).catch(() => setOut("rq-check-o", "hive node offline"));
  };
}

function renderLiveApps() {
  const el = document.getElementById("live-apps");
  if (!el) return;
  const paint = list => {
    const live = (list || []).filter(a => a.built && a.url);
    if (!live.length) { el.innerHTML = `<div class="card">no built apps yet. build with seed/build_apps.py, or push to run CI.</div>`; return; }
    el.innerHTML = live.map(a => `<article class="card">
      <h3>${a.name || a.id}</h3>
      <div class="meta"><span class="badge live">LIVE</span><span class="badge">${a.lane}</span><span class="badge">${(a.stack||[]).join("/") || a.source_repo || ""}</span></div>
      <div class="row"><button data-open="${a.url}">OPEN APP</button></div>
    </article>`).join("");
    el.onclick = e => { const b = e.target.closest("[data-open]"); if (b) location.href = b.dataset.open; };
  };
  fetch("/api/apps").then(r => r.ok ? r.json() : Promise.reject())
    .then(d => paint(d.apps))
    .catch(() => fetch("./apps.json").then(r => r.ok ? r.json() : []).then(paint).catch(() => paint([])));
}

function boot() {
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js");
  counts();
  renderLiveApps();
  const filters = document.getElementById("filters");
  filters.innerHTML = FILTERS.map(f => `<button data-f="${f}">${f}</button>`).join("");
  filters.querySelector("button").classList.add("on");
  filters.onclick = e => {
    const b = e.target.closest("button"); if (!b) return;
    filter = b.dataset.f;
    filters.querySelectorAll("button").forEach(x => x.classList.toggle("on", x===b));
    renderGrid();
  };
  document.getElementById("q").oninput = renderGrid;
  document.getElementById("grid").onclick = e => {
    const run = e.target.dataset.run;
    const web = e.target.dataset.web;
    const repo = e.target.dataset.repo;
    if (run) { renderRun(run); tab("run"); }
    if (web) location.href = web;
    if (repo) location.href = repo;
  };
  renderGrid();
  renderRun("hive");

  document.querySelectorAll("nav.tab button").forEach(b => b.onclick = () => {
    tab(b.dataset.tab);
    if (b.dataset.tab === "prompts") renderPrompts();
  });
  document.getElementById("open-wix").onclick = () => location.href = "https://jackschitt1134.wixsite.com/the-universal-hive";
  document.getElementById("install").onclick = () => {
    document.getElementById("install-hint").textContent = "PHONE: Share → Add to Home Screen.\nSame Wi-Fi node: python3 seed/serve.py --host 0.0.0.0 --port 8787\nThis PWA is the finished mobile app. Dead web repos open under RUN.";
  };
  document.getElementById("go").onclick = () => {
    const g = generate(document.getElementById("prompt").value);
    document.getElementById("out").textContent = (g.veto?"[VETO]\n":"") + g.text;
  };
  document.getElementById("sig-save").onclick = () => {
    const note = `${new Date().toISOString()} ${document.getElementById("sig-from").value}: ${document.getElementById("sig-body").value}`;
    const rows = load("signal", []).concat(note);
    store("signal", rows);
    document.getElementById("sig-log").textContent = rows.slice(-12).join("\n");
  };
  document.getElementById("sig-log").textContent = load("signal", []).slice(-12).join("\n") || "no signals";
}

boot();
