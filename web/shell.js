// THE UNIVERSAL HIVE — shell. One registry, every app/agent/tool/service has a place.
const LAW = "Provide for all. Find the good. Never limit unnecessarily.";
const RAIL = [
  ["home", "⌂", "Home"], ["apps", "▦", "Apps"], ["agents", "✦", "Agents"],
  ["tools", "⚙", "Tools"], ["data", "▤", "Data"], ["workflows", "↻", "Workflows"],
  ["prompts", "✎", "Prompts"], ["memory", "❖", "Memory"], ["signal", "◈", "Signal"],
];
let MAN = null, PLACE = "home", OP = load("operator", "");

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
function store(k, v) { localStorage.setItem("hive." + k, JSON.stringify(v)); }
function load(k, d) { try { return JSON.parse(localStorage.getItem("hive." + k)) ?? d; } catch { return d; } }
async function jget(p) { const r = await fetch(p); if (!r.ok) throw new Error(r.status); return r.json(); }
async function jpost(p, b) {
  const r = await fetch(p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b || {}) });
  return { status: r.status, ...(await r.json().catch(() => ({}))) };
}

function railHTML() {
  const c = MAN ? MAN.counts : {};
  const n = { apps: c.apps, agents: c.agents, tools: c.tools, services: c.services, prompts: c.pending_prompts };
  return RAIL.map(([id, ic, label]) =>
    `<button data-place="${id}" class="${id === PLACE ? "on" : ""}"><span class="ic">${ic}</span>${label}${
      n[id] ? `<span class="n">${n[id]}</span>` : ""}</button>`).join("");
}

function go(place) {
  PLACE = place;
  $("#rail").innerHTML = railHTML();
  $("#rail").onclick = e => { const b = e.target.closest("[data-place]"); if (b) go(b.dataset.place); };
  ({ home: pHome, apps: pApps, agents: pAgents, tools: pTools, data: pData,
     workflows: pWorkflows, prompts: pPrompts, memory: pMemory, signal: pSignal }[place] || pHome)();
}

// ---- places ----------------------------------------------------------------
function pHome() {
  const c = MAN.counts;
  $("#place").innerHTML = `
    <h2>Home</h2><div class="sub">Everything in the Hive, in one place.</div>
    <div class="stat"><span><b>${c.apps}</b> apps (${c.apps_built} live)</span>·<span><b>${c.agents}</b> agents</span>·
      <span><b>${c.tools}</b> tools</span>·<span><b>${c.services}</b> services</span>${c.pending_prompts ? `·<span><b>${c.pending_prompts}</b> prompt requests waiting</span>` : ""}</div>
    <div class="cards" style="margin-top:12px">
      ${[["apps", "Apps", "Absorbed apps, each with a place. Open them right here."],
         ["agents", "Agents", "Talk to any agent; each keeps its own system prompt."],
        ["tools", "Tools", `${c.tools} deterministic tools any agent can call.`],
        ["data", "Data", "kv, documents, channels, tokens, tasks."],
        ["workflows", "Workflows", "Scheduled jobs that run on their own."],
        ["prompts", "Prompts", "Per-agent system prompts + approval workflow."],
        ["memory", "Memory", "Chained memory + learning."],
        ["signal", "Signal", "Device-local operator notes."],
      ].map(([id, t, d]) => `<div class="card"><h3>${t}</h3><p class="meta">${d}</div>
        <div class="row"><button class="pri" data-go="${id}">OPEN</button></div></div>`).join("")}
    </div>`;
  $("#place").onclick = e => { const b = e.target.closest("[data-go]"); if (b) go(b.dataset.go); };
}

function pApps() {
  const apps = MAN.apps.slice().sort((a, b) => (a.lane + a.id).localeCompare(b.lane + b.id));
  $("#place").innerHTML = `<h2>Apps</h2><div class="sub">${apps.length} absorbed apps — each keeps its stack; OPEN runs it inside the shell.</div>
    <input id="app-q" placeholder="filter apps / lanes"/>
    <div class="cards" id="app-list" style="margin-top:10px"></div>`;
  const paint = q => {
    const list = apps.filter(a => !q || (a.name + a.id + a.lane).toLowerCase().includes(q));
    $("#app-list").innerHTML = list.map(a => `
      <div class="card"><h3>${a.badge || ""}${a.name || a.id}</h3>
        <p class="meta"><span class="badge ${a.built ? "live" : "app"}">${a.built ? "LIVE" : "BUILD"}</span>${a.lane} · ${a.id} · ${a.kind || "app"}</div>
      <div class="row"><button class="pri" data-open="${a.id}">OPEN</button>${a.source_repo ? `<button class="gh" data-repo="${a.source_repo}">REPO</button>` : ""}</div>
      </div>`).join("") || "<div class='card'>no matches</div>";
  };
  $("#app-q").oninput = e => paint(e.target.value.toLowerCase().trim());
  paint("");
  $("#app-list").onclick = e => {
    const open = e.target.closest("[data-open]"), rep = e.target.closest("[data-repo]");
    if (open) { const a = apps.find(x => x.id === open.dataset.open); if (a) openApp(a); }
    if (rep) window.open(rep.dataset.repo, "_blank");
  };
}

function pAgents() {
  $("#place").innerHTML = `<h2>Agents</h2><div class="sub">Every agent has its own system prompt, directive and console.</div>
    <div class="cards" id="ag-list"></div>`;
  $("#ag-list").innerHTML = MAN.agents.map(a => `
    <div class="card"><h3>${a.name}</h3>
      <div class="meta">${a.desc || a.notes || ""}<br>
        <span class="badge ${a.prompt_set ? "live" : ""}">${a.prompt_set ? "prompt set" : "base only"}</span>
        ${a.task_set ? '<span class="badge live">directive</span>' : ""}</div>
      <div class="row"><button class="pri" data-agt="${a.id}">OPEN</button>
      <button class="gh" data-prompt="${a.id}">PROMPT</button></div></div>`).join("");
  $("#ag-list").onclick = e => {
    const o = e.target.closest("[data-agt]"), p = e.target.closest("[data-prompt]");
    if (o) openAgent(o.dataset.agt);
    if (p) { go("prompts"); }
  };
}

function pTools() {
  const cats = {};
  MAN.tools.forEach(t => (cats[t.category] = cats[t.category] || []).push(t));
  $("#place").innerHTML = `<h2>Tools</h2><div class="sub">${MAN.tools.length} deterministic, sandboxed tools. RUN one right here.</div>
    ${Object.keys(cats).sort().map(cat => `
      <div class="card" style="margin-bottom:9px"><h3>${cat}</h3>
        <div class="cards">${cats[cat].map(t => `
          <div class="card"><h3>${t.name}</h3><div class="meta">${t.desc}</div>
          <div class="row"><button class="gh" data-tool="${t.name}">RUN</button></div></div>`).join("")}</div>
      </div>`).join("")}`;
  $("#place").onclick = e => { const b = e.target.closest("[data-tool]"); if (b) openTool(MAN.tools.find(t => t.name === b.dataset.tool)); };
}

function pData() {
  const s = MAN.core;
  $("#place").innerHTML = `<h2>Data</h2><div class="sub">The Hive's own store. No outside database.</div>
    <div class="card"><h3>Counters</h3><pre class="out" id="d-stats">${Object.entries(s).map(([k, v]) => k.padEnd(11) + v).join("\n")}</pre></div>
    <div class="card" style="margin-top:9px"><h3>Key / Value</h3>
      <div class="row"><input id="kv-s" placeholder="scope" value="app"/><input id="kv-k" placeholder="key"/></div>
      <input id="kv-v" placeholder="value (JSON or text)"/><button class="pri" id="kv-set">SET (operator)</button>
      <pre class="out" id="kv-o">—</pre></div>
    <div class="card" style="margin-top:9px"><h3>Channels</h3>
      <div class="row"><input id="ch-n" placeholder="channel" value="general"/><input id="ch-a" placeholder="author" value="operator"/></div>
      <textarea id="ch-m" rows="2" placeholder="message"></textarea>
      <button class="pri" id="ch-post">POST</button>
      <pre class="out" id="ch-o">—</pre></div>`;
  $("#kv-set").onclick = async () => {
    let v = $("#kv-v").value; try { v = JSON.parse(v); } catch {}
    const r = await jpost("/api/core", { module: "kv", action: "set", scope: $("#kv-s").value, key: $("#kv-k").value, val: v, operator: OP });
    $("#kv-o").textContent = r.error || JSON.stringify(r.val);
  };
  $("#ch-post").onclick = async () => {
    const name = $("#ch-n").value || "general";
    await jpost("/api/core", { module: "channel", action: "post", name, author: $("#ch-a").value, msg: $("#ch-m").value });
    const d = await jget("/api/core?module=channel&name=" + encodeURIComponent(name));
    $("#ch-o").textContent = (d.messages || []).map(m => `[${m.created}] ${m.author}: ${m.msg}`).join("\n");
  };
}

async function pWorkflows() {
  $("#place").innerHTML = `<h2>Workflows</h2><div class="sub">Durable jobs. Scheduler runs due tasks (tick).</div>
    <div class="card"><div class="row"><button class="pri" id="wf-tick">RUN DUE (tick)</button></div>
      <pre class="out" id="wf-o">—</pre></div>
    <div class="card" style="margin-top:9px"><h3>New task</h3>
      <input id="wf-name" placeholder="name"/><input id="wf-kind" placeholder="kind: note | plugin | agent"/>
      <textarea id="wf-spec" rows="3" placeholder='spec JSON, e.g. {"name":"time.now","interval_seconds":60}'></textarea>
      <button class="pri" id="wf-add">ADD</button></div>
    <div class="card" style="margin-top:9px"><h3>Tasks</h3><div id="wf-list">loading…</div></div>`;
  const refresh = async () => {
    const d = await jget("/api/core?module=task");
    $("#wf-list").innerHTML = (d.tasks || []).length ? `<div class="cards">${d.tasks.map(t => `
      <div class="card"><h3>${t.name}</h3><div class="meta">${t.kind} · ${t.id} · last ${t.last || "never"}</div>
      <div class="row"><button class="gh" data-run="${t.id}">RUN NOW</button></div></div>`).join("")}</div>` : "no tasks";
  };
  $("#wf-add").onclick = async () => {
    let spec = {}; try { spec = JSON.parse($("#wf-spec").value || "{}"); } catch {}
    await jpost("/api/core", { module: "task", action: "add", name: $("#wf-name").value || "job", kind: $("#wf-kind").value || "note", spec, operator: OP });
    refresh();
  };
  $("#wf-o").textContent = "ready";
  $("#place").onclick = e => {
    const run = e.target.closest("[data-run]");
    if (run) jpost("/api/core", { module: "task", action: "run", id: run.dataset.run, operator: OP }).then(r => $("#wf-o").textContent = JSON.stringify(r, null, 2));
    if (e.target.id === "wf-tick") jpost("/api/core", { module: "task", action: "tick", operator: OP }).then(r => $("#wf-o").textContent = JSON.stringify(r, null, 2));
  };
  refresh();
}

function pPrompts() {
  $("#place").innerHTML = `<h2>Prompts</h2><div class="sub">Each agent's own system prompt + live directive. Operator sets directly; friends request, operator approves, it applies and returns.</div>
    <div class="card"><input id="op" placeholder="operator callsign" value="${OP}"/><div class="row"><button class="gh" id="pr-load">LOAD</button></div>
      <div id="pr-list" class="cards" style="margin-top:9px"></div></div>
    <div class="card" style="margin-top:9px"><h3>Set directly (operator)</h3>
      <input id="pr-a" placeholder="agent id"/><textarea id="pr-p" rows="3" placeholder="system prompt"></textarea>
      <textarea id="pr-t" rows="2" placeholder="live directive / task (optional)"></textarea>
      <button class="pri" id="pr-save">SAVE</button><pre class="out" id="pr-o">—</pre></div>
    <div class="card" style="margin-top:9px"><h3>Request a change (friend)</h3>
      <input id="rq-a" placeholder="agent id"/><select id="rq-k"><option value="prompt">system prompt</option><option value="task">directive/task</option></select>
      <textarea id="rq-t" rows="3" placeholder="proposed prompt"></textarea><input id="rq-n" placeholder="your name"/>
      <input id="rq-c" placeholder="contact for the answer"/><button class="pri" id="rq-send">SEND TO OPERATOR</button>
      <pre class="out" id="rq-o">—</pre></div>
    <div class="card" style="margin-top:9px"><h3>Pending (operator)</h3><div id="rq-list">—</div></div>
    <div class="card" style="margin-top:9px"><h3>Check my request</h3><input id="rq-id" placeholder="request id"/><button class="gh" id="rq-chk">CHECK</button><pre class="out" id="rq-chk-o">—</pre></div>`;
  const opv = () => { OP = $("#op").value.trim(); store("operator", OP); $("#who").textContent = OP || ""; return OP; };
  const load = async () => {
    const d = await jget("/api/prompts");
    $("#pr-list").innerHTML = d.agents.map(a => `
      <div class="card"><h3>${a.agent}</h3><div class="meta">${a.prompt ? "prompt by " + a.prompt_by : "base only"}${a.task ? " · directive" : ""}</div>
      <button class="gh" data-fill="${a.agent}" data-p="${encodeURIComponent(a.prompt || "")}" data-t="${encodeURIComponent(a.task || "")}">EDIT</button></div>`).join("");
    $("#rq-list").innerHTML = (d.pending || []).length ? `<div class="cards">${d.pending.map(r => `
      <div class="card"><h3>${r.agent} · ${r.kind}</h3><div class="meta">from ${r.requester}${r.contact ? " (" + r.contact + ")" : ""} · ${r.id}</div>
      <pre class="out">${r.text.replace(/</g, "&lt;")}</pre>
      <div class="row"><button class="pri" data-ap="${r.id}">APPROVE</button><button class="dn" data-dn="${r.id}">DENY</button></div></div>`).join("")}</div>` : "no pending";
  };
  $("#pr-list").onclick = e => {
    const b = e.target.closest("[data-fill]"); if (!b) return;
    $("#pr-a").value = b.dataset.fill; $("#pr-p").value = decodeURIComponent(b.dataset.p); $("#pr-t").value = decodeURIComponent(b.dataset.t);
  };
  $("#rq-list").onclick = async e => {
    const ap = e.target.closest("[data-ap]"), dn = e.target.closest("[data-dn]");
    if (ap) { const r = await jpost(`/api/prompts/requests/${ap.dataset.ap}/approve`, { operator: opv() }); alert(r.error || ("approved → " + r.applied_to)); load(); }
    if (dn) { await jpost(`/api/prompts/requests/${dn.dataset.dn}/deny`, { operator: opv() }); load(); }
  };
  $("#pr-load").onclick = () => { opv(); load(); };
  $("#pr-save").onclick = async () => {
    const body = { operator: opv() };
    if ($("#pr-p").value.trim()) body.prompt = $("#pr-p").value;
    if ($("#pr-t").value.trim()) body.task = $("#pr-t").value;
    const r = await jpost("/api/prompts/" + encodeURIComponent($("#pr-a").value.trim()), body);
    $("#pr-o").textContent = r.error || ("saved to " + $("#pr-a").value.trim());
  };
  $("#rq-send").onclick = async () => {
    const r = await jpost("/api/prompts/request", { agent: $("#rq-a").value.trim(), kind: $("#rq-k").value, text: $("#rq-t").value,
      requester: $("#rq-n").value.trim(), contact: $("#rq-c").value.trim() });
    $("#rq-o").textContent = r.error || ("sent. request id: " + r.request.id + "\n" + r.note);
  };
  $("#rq-chk").onclick = async () => {
    const d = await jget("/api/prompts/requests/" + encodeURIComponent($("#rq-id").value.trim()));
    $("#rq-chk-o").textContent = d.error || (d.status + ": " + ((d.delivery || {}).message || d.text));
  };
  load().catch(() => $("#pr-list").textContent = "hive node offline");
}

function pMemory() {
  $("#place").innerHTML = `<h2>Memory</h2><div class="sub">EMPLOYEE ALPHA's persistent, tamper-evident memory.</div>
    <div class="card"><h3>Status</h3><pre class="out" id="m-s">—</pre>
      <div class="row"><button class="gh" id="m-chain">SHOW CHAIN</button><button class="gh" id="m-verify">VERIFY</button></div></div>
    <div class="card" style="margin-top:9px"><h3>Teach a fact</h3>
      <textarea id="m-t" rows="2" placeholder="fact to remember"></textarea><button class="pri" id="m-rem">REMEMBER</button>
      <pre class="out" id="m-o">—</pre></div>`;
  jget("/api/employee-alpha/status").then(s => $("#m-s").textContent = JSON.stringify(s, null, 2)).catch(() => $("#m-s").textContent = "offline");
  $("#m-chain").onclick = async () => {
    const r = await jpost("/api/employee-alpha/chat", { prompt: '@plugin memory.chain {"n":10}' });
    $("#m-o").textContent = JSON.stringify(r.plugin ? r.plugin.result : r.text, null, 2);
  };
  $("#m-verify").onclick = async () => {
    const r = await jpost("/api/employee-alpha/chat", { prompt: "@plugin memory.verify" });
    $("#m-o").textContent = JSON.stringify(r.plugin ? r.plugin.result : r.text, null, 2);
  };
  $("#m-rem").onclick = async () => {
    const r = await jpost("/api/employee-alpha/remember", { text: $("#m-t").value });
    $("#m-o").textContent = r.stored ? "remembered: " + r.stored.text : (r.error || "?");
  };
}

function pSignal() {
  const rows = load("signal", []);
  $("#place").innerHTML = `<h2>Signal</h2><div class="sub">Device-local notes. Not a third-party drop.</div>
    <div class="card"><input id="s-f" placeholder="callsign"/><textarea id="s-b" rows="4" placeholder="note"></textarea>
      <div class="row"><button class="pri" id="s-add">LOCK NOTE</button><button class="dn" id="s-clr">CLEAR</button></div>
      <pre class="out" id="s-o">${rows.slice(-14).join("\n") || "none"}</pre></div>`;
  const draw = () => $("#s-o").textContent = load("signal", []).slice(-14).join("\n") || "none";
  $("#s-add").onclick = () => { store("signal", load("signal", []).concat(`${new Date().toISOString()} ${$("#s-f").value}: ${$("#s-b").value}`)); draw(); };
  $("#s-clr").onclick = () => { store("signal", []); draw(); };
}

// ---- windows ---------------------------------------------------------------
function openWin(title, bodyHTML, { nopad = false } = {}, extURL = null) {
  $("#win-title").textContent = title;
  const body = $("#win-body"); body.className = "body" + (nopad ? " nopad" : ""); body.innerHTML = bodyHTML;
  $("#win").classList.add("open");
  $("#win-close").onclick = () => $("#win").classList.remove("open");
  $("#win-ext").style.display = extURL ? "" : "none";
  $("#win-ext").onclick = () => extURL && window.open(extURL, "_blank");
}
function openApp(a) {
  if (a.built && a.url) return openWin(a.name || a.id, `<iframe src="${a.url}"></iframe>`, { nopad: true }, a.url);
  if (a.web && a.embed) return openWin(a.name || a.id, `<iframe src="${a.web}"></iframe>`, { nopad: true }, a.web);
  openWin(a.name || a.id,
    `<div class="card"><h3>${a.name || a.id}</h3><div class="meta">${a.blurb || ""}</div>
      <p>${a.web ? "External app. " : "Not built on this node yet. "}${a.web ? `<a href="${a.web}" target="_blank">open live site</a> · ` : ""}
      ${a.source_repo ? `<a href="${a.source_repo}" target="_blank">source</a>` : ""}</p></div>`,
    {}, a.web || a.source_repo);
}
function openAgent(id) {
  const a = MAN.agents.find(x => x.id === id) || { id, name: id };
  openWin("Agent · " + a.name,
    `<div class="card"><div class="meta">${a.desc || ""}</div>
      <textarea id="ag-p" rows="3" placeholder="talk to ${id}…">Who are you?</textarea>
      <div class="row"><button class="pri" id="ag-go">SEND</button><button class="gh" id="ag-edit">EDIT PROMPT</button></div>
      <pre class="out" id="ag-o">ready</pre></div>`, {}, null);
  $("#ag-edit").onclick = () => { $("#win").classList.remove("open"); go("prompts"); };
  $("#ag-go").onclick = async () => {
    const p = $("#ag-p").value; $("#ag-o").textContent = "thinking…";
    const r = (id === "employee-alpha")
      ? await jpost("/api/employee-alpha/chat", { prompt: p, session: "shell" })
      : await jpost("/api/generate", { agent: id, prompt: p });
    $("#ag-o").textContent = (r.veto ? `[${r.veto}]\n` : "") + (r.text ?? r.seed_voice ?? JSON.stringify(r)) +
      (r.recalled && r.recalled.length ? "\n\nmemory: " + r.recalled.map(x => x.text).join(" | ") : "");
  };
}
function openTool(t) {
  openWin("Tool · " + t.name,
    `<div class="card"><div class="meta">${t.desc}</div>
      <textarea id="tl-args" rows="4" placeholder='args JSON, e.g. {"text":"hello"}'>{}</textarea>
      <button class="pri" id="tl-run">RUN</button><pre class="out" id="tl-o">—</pre></div>`);
  $("#tl-run").onclick = async () => {
    const r = await jpost("/api/employee-alpha/chat", { prompt: `@plugin ${t.name} ${$("#tl-args").value || "{}"}` });
    $("#tl-o").textContent = JSON.stringify(r.plugin ? r.plugin.result : r.text, null, 2);
  };
}

// ---- command palette -------------------------------------------------------
function paletteItems() {
  return [
    ...MAN.apps.map(a => ({ k: "app", id: a.id, name: a.name || a.id, meta: a.lane, open: () => openApp(a) })),
    ...MAN.agents.map(a => ({ k: "agent", id: a.id, name: a.name, meta: "agent", open: () => openAgent(a.id) })),
    ...MAN.tools.map(t => ({ k: "tool", id: t.name, name: t.name, meta: "tool · " + t.category, open: () => openTool(t) })),
    ...MAN.services.map(s => ({ k: "service", id: s.id, name: s.name, meta: "service", open: () => go({ store: "data", models: "data", channels: "data", workflows: "workflows" }[s.id] || s.id) })),
  ];
}
function openPalette(q) {
  $("#pal").classList.add("open"); $("#pal-in").value = q || ""; $("#pal-in").focus(); renderPal();
}
function renderPal() {
  const q = $("#pal-in").value.toLowerCase();
  const items = paletteItems().filter(i => !q || (i.name + i.id + i.meta + i.k).toLowerCase().includes(q)).slice(0, 40);
  $("#pal-res").innerHTML = items.map((i, n) => `<button data-i="${n}"><b>${i.name}</b> <span class="k">${i.k} · ${i.meta}</span></button>`).join("") || "<div style='padding:12px' class='k'>no match</div>";
  $("#pal-res").onclick = e => { const b = e.target.closest("[data-i]"); if (!b) return; $("#pal").classList.remove("open"); items[+b.dataset.i].open(); };
}

// ---- boot ------------------------------------------------------------------
async function boot() {
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
  $("#who").textContent = OP || "";
  $("#cmd").onfocus = () => openPalette($("#cmd").value);
  $("#cmd").oninput = () => openPalette($("#cmd").value);
  $("#pal-in").oninput = renderPal;
  $("#pal-in").onkeydown = e => { if (e.key === "Enter") { const first = $("#pal-res button"); if (first) first.click(); } if (e.key === "Escape") $("#pal").classList.remove("open"); };
  $("#pal").onclick = e => { if (e.target.id === "pal") $("#pal").classList.remove("open"); };
  document.addEventListener("keydown", e => { if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") { e.preventDefault(); openPalette(""); } });
  $("#win").onclick = e => { if (e.target.id === "win") $("#win").classList.remove("open"); };
  try {
    MAN = await jget("/api/shell");
    $("#dot").className = "dot up";
    $("#rail-foot").textContent = `online · ${MAN.counts.apps} apps · ${MAN.counts.tools} tools`;
  } catch {
    MAN = { law: LAW, apps: [], agents: [], tools: [], services: [], counts: { apps: 0, apps_built: 0, agents: 0, tools: 0, services: 0, pending_prompts: 0 }, core: {}, models: {} };
    $("#dot").className = "dot";
    $("#rail-foot").textContent = "offline shell (Pages) — run the hive node for live data";
  }
  go("home");
}
boot();
