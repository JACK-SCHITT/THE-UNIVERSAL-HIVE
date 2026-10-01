# Chapter 07 — Sovereign Free Hive (No Subscriptions)

## Law

**All Hive AIs work 100% without API keys.**

Paid cloud endpoints (if ever configured) are **optional legacy toys**.  
They must never be required for:

- First contact (KRACKERJACK AI)
- HunterPrime / COUNSEL / ZORG-Ω
- Handbook guidance
- Install / chroot coaching
- Self-upgrade
- Day-to-day dual-control operation

## Brain chain (mandatory order)

```
USER
  → KRACKERJACK AI (first contact)
       → Local Ollama (free models on this machine)
            → Offline sovereign brain (always on, handbook + Constitution)
                 → [OPTIONAL] cloud only if Architect explicitly sets HIVE_BRAIN=cloud
```

Default: `HIVE_BRAIN=local`

## Free components

| Component | Cost | Notes |
|-----------|------|-------|
| offline_brain.py | $0 | No network |
| Ollama + open models | $0 | Hardware/electricity only |
| Gentoo handbook mirror | $0 | wiki.gentoo.org |
| SPARC stage3 seeds | $0 | distfiles.gentoo.org |
| self_upgrade.py | $0 | Keeps Hive from rotting |
| Portage / OpenRC | $0 | Gentoo |

## Never obsolete

Run periodically:

```powershell
cd C:\Users\ARCHITECT\THE_HIVE
python NEURAL\brain\self_upgrade.py
# or offline-only:
python NEURAL\brain\self_upgrade.py --offline
# models only:
python NEURAL\brain\self_upgrade.py --models
```

Self-upgrade refreshes free mirrors, free models, free seeds, and local DNA.  
The Hive must not depend on a vendor subscription to stay current.

## Bootstrap local models

```powershell
# Ollama app must be running
ollama pull llama3.2:3b
# or:
python NEURAL\brain\self_upgrade.py --models
```

If no model is present, **offline sovereign brain still answers**.

## Agents (all local)

```powershell
python NEURAL\brain\agents.py krackerjack "Status."
python NEURAL\brain\agents.py hunterprime "Next three install steps."
python NEURAL\brain\agents.py counsel "Critique this plan: ..."
python NEURAL\brain\agents.py zorg "Threat model for open SSH."
```

## What we refuse

- Requiring monthly AI SaaS to boot or think
- Silently failing when a cloud key expires
- Hiding power behind a paywall
- Letting the OS go obsolete because a vendor sunset an API
