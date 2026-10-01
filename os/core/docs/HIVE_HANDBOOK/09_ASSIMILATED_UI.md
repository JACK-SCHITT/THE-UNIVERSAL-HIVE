# HIVE-OS Handbook — Assimilated UI (Skin Fidelity + Self-Upgrading Cockpit)

**Law:** When the Hive assimilates an app, AI, sub-agent, or sub-app, the **user interface must remain as close as possible to the source product** — in the OS surface, the online cockpit, and any live medium.

**Architect:** KRACKERJACK1134  
**Protocol:** ASSIMILATE OR DIE · NEVER OBSOLETE  

---

## The idea (non-negotiable)

1. **Skin fidelity** — Each assimilated node keeps the *look* it came from (colors, type, density, icon language). The Hive does **not** force every app into one generic shell that erases origin.
2. **One hive, many chambers** — The OS and online cockpit are a **shell**. Inside it, each app opens as a **chamber** wearing its native skin.
3. **Self-upgrading layout** — When new functions, features, AIs, sub-agents, apps, or sub-apps are assimilated, the Hive **updates its own layout** (nav, panels, routes) without waiting for a vendor release.
4. **Same face online and local** — The war-room cockpit (`hive-cockpit.html` + `hive_api.py`) and any future online cockpit share the **same skin registry and layout DNA** so appearance does not fork.

---

## Architecture

```
FLEET/<App>  (source product)
      │
      │  assimilate_ui.py  (scan theme tokens + registry)
      ▼
HIVE_CORE/ui/SKIN_REGISTRY.json   ← colors, fonts, mood per chamber
HIVE_CORE/ui/LAYOUT.json          ← tabs/panels order, grows on assimilate
      │
      ├─► Offline cockpit (localhost:8787)
      ├─► Online cockpit (same DNA when deployed)
      └─► Live ISO / OS shell (future: chamber frames)
```

| Artifact | Role |
|----------|------|
| `HIVE_CORE/ui/SKIN_REGISTRY.json` | Truth for **appearance** of every chamber |
| `HIVE_CORE/ui/LAYOUT.json` | Truth for **structure** of cockpit/OS chrome |
| `NEURAL/brain/assimilate_ui.py` | Ritual: scan fleet → merge skins → rewrite layout |
| `self_upgrade.py --ui` | Free self-upgrade surface for UI DNA |
| `/api/skins` `/api/layout` | Cockpit reads live DNA (no hard-coded forever UI) |

---

## Chamber rules

| Rule | Meaning |
|------|---------|
| **Origin first** | Chamber CSS variables map to the source app’s design tokens |
| **Hive chrome last** | Only outer shell (status bar, assimilate controls) uses Hive gold/black |
| **Sub-apps nest** | Sub-apps of an app become **sub-chambers** under the parent skin |
| **Agents wear host skin** | AIs/sub-agents appear *inside* their product chamber, not as random new themes |
| **No secret skins** | Registry holds colors/fonts only — never tokens, PATs, or `.env` |

---

## Assimilation flow (UI)

1. App lands in `FLEET/` (or is registered in `FLEET_REGISTRY.json`).
2. Architect (or `self_upgrade --ui`) runs **assimilate_ui**.
3. Script extracts best-effort theme tokens from:
   - `constants/theme.ts`, `constants/Colors.ts`
   - `src/index.css` / CSS variables
   - `tailwind.config.*`
   - Package `name` / README brand cues
4. Skin entry written or updated in `SKIN_REGISTRY.json`.
5. Layout entry appended to `LAYOUT.json` if missing (nav grows).
6. Cockpit refresh loads new chamber without a full OS reinstall.

---

## Self-upgrade surfaces (UI)

Free, local, no API key:

1. `python NEURAL/brain/assimilate_ui.py`
2. `python NEURAL/brain/self_upgrade.py --ui`
3. `python NEURAL/brain/self_upgrade.py --all` (includes UI when online path runs)

Upgrade **never** requires a store subscription to rearrange the cockpit.

---

## What this is not

- Not a single flat “admin dashboard” that paints every product gray.
- Not iframe-everything-and-pray (chambers may later host real iframes; skins come first).
- Not automatic execution of app code from the browser (hardening stays: localhost, no shell from UI).

---

## Verify

```powershell
cd C:\Users\ARCHITECT\THE_HIVE
python NEURAL\brain\assimilate_ui.py
python NEURAL\brain\self_upgrade.py --ui
# with UI up:
# GET http://127.0.0.1:8787/api/skins
# GET http://127.0.0.1:8787/api/layout
```

Open cockpit → **Chambers** strip should list fleet skins; selecting a chamber recolors the work panel to that app’s face.
