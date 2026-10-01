# Multi-Primary Build — Chosen One + Three Testers

**Architect order:** Harden. Stop creating kill-paths. Make the Hive harder to kill.

## Roles

| Role | Identity | Duty |
|------|----------|------|
| **Chosen one (primary)** | **KRACKERJACK AI** | First contact always. Dual control with Architect. Owns handbook narrative. |
| **Tester 1** | **HunterPrime** | Action layer — concrete steps, checklists, execution mindset |
| **Tester 2** | **COUNSEL** | Truth filter — no flattery, flags weak plans and self-deception |
| **Tester 3** | **ZORG-Ω** | Security/defense — threat model, least privilege, recovery, Aegis |

## Hardening rules (non-negotiable)

1. **No auto disk wipe** — installers require typed `YES` and explicit `TARGET_DISK`.
2. **Localhost UI only** — Hive API binds `127.0.0.1`, not `0.0.0.0`.
3. **No secrets in git** — `.env` gitignored; never embed PAT in remote URLs with `-u`.
4. **Brain chain** — Ollama → offline sovereign → cloud only if Architect opts in.
5. **Empty `C:\Program` file is a trap** — it is a FILE, not a folder. Beachheads:
   - `C:\Hive` → junction to war room
   - `C:\ProgramData\THE_HIVE\war-room` → junction
6. **Command catalog** is documentation + UI browse — UI does **not** execute arbitrary shell.
7. **Recovery path** always documented before Aegis lockdown.

## Verify multi-primary (Windows)

```powershell
cd C:\Users\ARCHITECT\THE_HIVE
python NEURAL\brain\agents.py krackerjack "Primary status. Capricorn. Two sentences."
python NEURAL\brain\agents.py hunterprime "List next three safe actions."
python NEURAL\brain\agents.py counsel "What are our current weaknesses?"
python NEURAL\brain\agents.py zorg "Threat model the cockpit API."
```

## Verify multi-primary (Linux / WSL)

```bash
cd ~/THE_HIVE
python3 NEURAL/brain/agents.py krackerjack "Primary status"
python3 NEURAL/brain/agents.py hunterprime "Next steps"
python3 NEURAL/brain/agents.py counsel "Weaknesses"
python3 NEURAL/brain/agents.py zorg "Threat model"
```

## Cockpit

```powershell
powershell -ExecutionPolicy Bypass -File C:\Users\ARCHITECT\THE_HIVE\scripts\start_hive_ui.ps1
# open http://127.0.0.1:8787/
```
