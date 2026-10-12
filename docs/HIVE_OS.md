# HIVE OS — self-contained ecosystem blueprint

Goal: THE UNIVERSAL HIVE does on its own what people currently rent from many
products — deploy, database, design, chat, agents, workflows, voice — and runs it
on any device and any OS, either as an OS or as an installable app. No outside
service required. Remote models are opt-in only.

Prime Directive stays frozen: **Provide for all. Find the good. Never limit unnecessarily.**

## What each rented product maps to inside the Hive

| Borrowed capability | Product(s) | Hive module | Status |
|---|---|---|---|
| Deploy / static hosting | Vercel | `scripts/ci_build_all.sh`, `.github/workflows/pages.yml`, `seed/apps.py`, `seed/ci_site.py` | built |
| Database / rows / config | Supabase | `seed/store.py` (SQLite: `kv`, `coll`, `channel`, `token`, `task`) | built |
| Auth tokens | Supabase / Clerk | `seed/store.py` `token_*`, `seed/prompts.py` operator set | built |
| Realtime chat | Slack | `seed/store.py` channels + `/api/core?module=channel` | built |
| Agents / chat AI | Kimi, Famous AI, OnSpace | `seed/registry.py`, `seed/base_seed.py`, `seed/employee_alpha.py`, `seed/plugins.py` | built |
| Per-agent system prompts + approvals | (custom) | `seed/prompts.py` + PROMPTS cockpit tab | built |
| Model routing (local + remote) | OpenAI / Ollama | `seed/models.py` (seed, ollama, llama.cpp, mnn, openai) | built |
| Workflow automation | Zapier / Operit | `seed/core_api.py` `tick()` + `task` table | built |
| Voice (talk + speak) | Operit | `web/app.js` WEB SPEECH (STT + TTS) | built |
| Design / canvas | Figma | `os/core/HIVE_WINDOWS/ui`, `web/hive-os.html` | scaffold |
| Ubuntu-in-a-box | Operit (Ubuntu 24) | `os/` Gentoo/genesis tree + proot plan | scaffold |
| Offline models | Operit (llama.cpp/MNN) | `seed/models.py` providers + bundled seed | partial |
| Installable app (any device) | OnSpace / PWA | `web/` PWA (`manifest.json`, `sw.js`) | built |

## The one API surface

Everything above is reachable from one place:

```
GET  /api/health
GET  /api/apps                         # built apps
GET  /api/core?module=stats            # data layer counters
GET  /api/core?module=coll&name=notes  # documents
POST /api/core   {module,action,...}   # kv/coll/channel/token/task/model
GET  /api/models                       # local + remote providers
GET  /api/prompts                      # every agent's prompt + pending requests
POST /api/prompts/<agent>              # operator sets prompt/task directly
POST /api/prompts/request              # friend submits a change request
POST /api/prompts/requests/<id>/approve
GET  /api/employee-alpha/*             # the hired worker
```

Operator-only writes are gated by an operator callsign (`seed/prompts.py` `OPERATORS`).

## HIVE OS (Gentoo) build order

Target: an installable image + a live overlay. The `os/core` tree (HIVE-OS-CORE)
is the genesis set.

1. Base: Gentoo stage3 + `seed/` + `os/core/HIVE_CORE` + Python 3.
2. Service: `seed/serve.py` bound to `0.0.0.0:8787` managed by OpenRC/systemd unit.
3. Scheduler: `python3 seed/core_api.py tick` on a timer for workflow automation.
4. Models: bundle the seed model; register local servers in `seed/models.py`.
5. Desktop shell: `os/core/HIVE_WINDOWS/ui` (the Figma-like canvas + app grid).
6. First-boot identity: `os/core/HIVE_CORE/identity.js` `$HIVE_HOME` + `refinery.js`
   memory chain — the same tamper-evident store the Python side mirrors.

## Operit-class Android shape

Android-first AI assistant with deep system reach:

- **Ubuntu 24 env**: proot/chroot rootfs exposed as a tool to agents (run Linux commands).
- **Offline models**: `seed/models.py` local providers (llama.cpp, MNN) — no egress by default.
- **Memory**: `seed/memory.py` chained JSONL, shared format with `refinery.js`.
- **Workflows**: `seed/core_api.py` tasks (interval schedules, plugin/agent jobs).
- **Plugins**: `seed/plugins.py` (grow the tool count; 40+ is the target).
- **Voice**: PWA STT + TTS today; native wrapper later for always-on wake.
- **Device bridge**: notifications, files, share, clipboard, URL open via the
  bundled Android device skill; native host for sockets/radio where the web sandbox
  forbids it (AirDrop-class, USB gadget) — those need a thin native shell, not a page.

## Honest limits

- A web page cannot open raw AirDrop, keep a Bluetooth SPP socket alive like a native
  app, or act as a USB gadget. Those need the native wrapper.
- Restoring deleted GitHub repos is UI-only (Settings → Deleted repositories, 90 days);
  there is no public REST endpoint. Content already absorbed into `apps/` is the backup.
