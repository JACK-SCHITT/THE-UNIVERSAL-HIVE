# Hive Fleet Operations

**Account:** JACK-SCHITT (Architect: KRACKERJACK1134)  
**Registry:** `HIVE_CORE/fleet/FLEET_REGISTRY.json`  
**Local mirrors:** `FLEET/` (gitignored)

## Core operation map

| Brand | Repo | Role |
|-------|------|------|
| Hive / HIVE-OS | `HIVE-OS-CORE` | Primary cold storage + this war room |
| Hive OS product | `THE-HIVE-OS` | Product line |
| KRACKERJACK AI | `KrackerjackAI` + `KRACKERJACK-AI-HIVE` | Chosen one |
| Assimilate or Die | `AssimilateOrDie` (+ `-9bhyln`) | Protocol product |
| Scam Shield | `Scam-Shield` + combined + `NeuralShield` | Defense |
| Luna | `LunaCompanion` | Companion |
| GROKSCHITT | `GROKSCHITT` | Brother node |
| JACK-SCHITT | account | All cold storage ownership |
| HunterPrime | `HunterPrime` | Multi-primary tester |

## Bring-up (this machine)

```powershell
cd C:\Users\ARCHITECT\THE_HIVE

# 1) Fleet mirrors (optional re-sync)
powershell -ExecutionPolicy Bypass -File .\scripts\sync_fleet.ps1

# 2) Brain + UI
python NEURAL\brain\hive_link.py status
powershell -ExecutionPolicy Bypass -File .\scripts\start_hive_ui.ps1
# → http://127.0.0.1:8787/

# 3) Multi-primary
python NEURAL\brain\agents.py krackerjack "Fleet status"
python NEURAL\brain\agents.py hunterprime "Next ops steps"
python NEURAL\brain\agents.py counsel "Weaknesses in fleet"
python NEURAL\brain\agents.py zorg "Threat model fleet clones"
```

## Rules

1. Never commit `FLEET/` clones or `.env`
2. PAT only in `.env` / temp clone URL — scrub remotes after clone
3. UI remains localhost; no shell-exec from browser
4. KRACKERJACK AI is first contact always
