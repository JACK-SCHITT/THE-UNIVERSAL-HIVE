# Sovereign Free Status

**Date:** 2026-07-20  
**Version:** 5.2.0-SOVEREIGN

## Law

| Requirement | Status |
|-------------|--------|
| Hive AIs work without API keys | **YES** |
| No subscription for cognition | **YES** |
| Default brain local | **YES** (`HIVE_BRAIN=local`) |
| Offline always-on fallback | **YES** (`offline_brain.py`) |
| Self-upgrade (never obsolete) | **YES** (`self_upgrade.py`) |
| Cloud optional only | **YES** (disabled in `.env`) |

## Agents (all local)

| Agent | Entry |
|-------|--------|
| KRACKERJACK AI (first) | `NEURAL/krackerjack/first_contact.py` |
| HunterPrime | `agents.py hunterprime` |
| COUNSEL | `agents.py counsel` |
| ZORG-Ω | `agents.py zorg` |

## Brain chain

1. Local Ollama (free models)  
2. Offline sovereign brain (handbook + Constitution)  
3. Cloud only if Architect sets `HIVE_BRAIN=cloud` **and** provides a key  

## Verify anytime

```powershell
cd C:\Users\ARCHITECT\THE_HIVE
$env:XAI_API_KEY=$null
python NEURAL\brain\hive_link.py status
python NEURAL\brain\hive_link.py offline "no keys"
python NEURAL\brain\self_upgrade.py --offline
```
