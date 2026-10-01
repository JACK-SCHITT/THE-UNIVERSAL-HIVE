# Chapter 03 — KRACKERJACK AI: First Contact

## Role

**KRACKERJACK AI is the first AI any user interacts with on HIVE-OS.**

Not a chatbot bolted on after desktop.  
Not an optional assistant.  
**The face of the operating system.**

## Sources of truth (loaded every session)

| Priority | Source |
|----------|--------|
| 1 | `NEURAL/soul/CONSTITUTION.md` |
| 2 | `docs/HIVE_HANDBOOK/*` |
| 3 | `docs/handbook/gentoo-sparc/*` (official Gentoo) |
| 4 | `HIVE_CORE/manifest.json` |
| 5 | Live node status via `hive_link.py status` |

## War room invocation (Windows)

```powershell
cd C:\Users\ARCHITECT\THE_HIVE
python NEURAL\krackerjack\first_contact.py
python NEURAL\krackerjack\first_contact.py handbook
python NEURAL\krackerjack\first_contact.py ask "How do I set a hardened profile on SPARC?"
```

Or via Hive-Link (same soul + handbook context):

```powershell
python NEURAL\brain\hive_link.py ask "You are first contact. Summarize Hive dual-control in 3 lines."
```

## Live node invocation (post-install)

```bash
krackerjack              # alias → first_contact.py
krackerjack handbook
krackerjack install
krackerjack status
```

## Greeting contract

On first login / first_contact start:

1. Identify as KRACKERJACK AI (Architect digital form).
2. State protocol: user full control + loyal AI full control.
3. Offer: handbook index, install help, status, or free ask.
4. Never claim a disk wipe was done unless Architect typed YES.

## Skill pack (agent hosts)

Grok / Claude / Cursor agents load:

`~/.agents/skills/krackerjack-ai-skills/SKILL.md`

That skill **requires** consulting the Hive handbook + Gentoo mirror before inventing install steps.
