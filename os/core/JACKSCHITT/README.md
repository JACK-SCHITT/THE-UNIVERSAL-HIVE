# JACKSCHITT AI — Windows AI (World Changer base)

**Role:** Windows hybrid shell AI (commands + natural language)  
**Not:** HIVE Server OS (separate project)  
**Architect:** KRACKERJACK1134 / JACK-SCHITT  
**Base model concept:** World Changer  

## Multi-drive layout (C–F ready)

| Drive | Role |
|-------|------|
| **C:** | Live war room + JACKSCHITT runtime (`C:\Users\ARCHITECT\THE_HIVE\JACKSCHITT`, `C:\HIVE`, `C:\ProgramData\THE_HIVE`) |
| **D:** | Gentoo / large forge volume (4TB class) — Linux later |
| **E:** | Bootable USB / Windows setup + `E:\HIVE` payload |
| **F:** | Cold bulk + mirrors (`F:\THE_HIVE`, `F:\HIVE_LOCAL_AI`, `F:\HIVE_BOOTLAB`, …) |

Paths are **discovered at runtime** via `paths.py` — if a drive is unplugged, JACKSCHITT still runs from C.

## 10-piece build (this repo)

| # | Piece | Status |
|---|--------|--------|
| **1** | Hybrid Shell Integration | **IN** — `hybrid_shell.py` |
| 2 | System controller / sensors | stub — `system_controller.py` |
| 3 | Named pipe / IPC host | pending |
| 4 | UI shell (Windows chat) | pending |
| 5 | World Changer model bridge | pending |
| 6 | Safety / ZORG handoff | pending |
| 7 | Autostart / service | pending |
| 8 | Investor demo mode | pending |
| 9 | Cross-drive sync (C↔F) | pending |
| 10 | Full Windows AI desktop | pending |

## Quick start

```powershell
cd C:\Users\ARCHITECT\THE_HIVE\JACKSCHITT
python -m jackschitt.cli "show me running processes"
python -m jackschitt.cli --chat "hello JACK"
python -m jackschitt.cli --paths
```

Or double-click: `C:\ProgramData\THE_HIVE\bin\jackschitt.cmd`

## Safety

Hybrid execution is **opt-in** (`execute=True` / `--exec`).  
Default chat mode only **suggests** PowerShell — does not run destructive commands without explicit execute.
