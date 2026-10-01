# HIVE-OS (Gentoo Core)

**Architect:** KRACKERJACK1134  
**First AI:** **KRACKERJACK AI** (always first contact)  
**Version:** 5.2.0-SOVEREIGN  
**Local root:** `C:\Users\ARCHITECT\THE_HIVE`

Autonomous AI operating system DNA on **Gentoo** — the most un-user-friendly OS inverted into the most complicated **user-friendly** OS: full user control alongside loyal AI with full control.

### Sovereign law

- **Zero API keys required** for any Hive AI  
- **Zero subscriptions** for cognition, handbook, or self-upgrade  
- **Self-upgradeable** so the Hive never becomes obsolete behind a vendor paywall  
- Brain chain: **local Ollama → offline sovereign brain** (cloud is optional legacy only)

Windows hosts the war room (forge files + brain). Real stage unpack runs on Linux / SPARC / VM live media.

## Layout

```
THE_HIVE/
  GENESIS/
    gentoo-sparc/           # Asssimilated stage3-sparc64-openrc-*.tar.xz
    ASSIMILATED.json        # Provenance after ritual
  HIVE_CORE/manifest.json
  NEURAL/
    hive_make.conf
    hive_install.sh
    kernel/ kernel_prep.sh
    aegis/  aegis_harden.start
    brain/  hive_link.py      # Grok + Ollama + handbook context
    soul/   CONSTITUTION.md
    krackerjack/
      first_contact.py        # FIRST AI entrypoint
      first_contact.sh        # live-node hooks
      knowledge/              # handbook digest
  docs/
    handbook/gentoo-sparc/    # Full official Gentoo SPARC handbook mirror
    HIVE_HANDBOOK/            # Hive-augmented autonomous OS handbook
    GENTOO_STAGING_WALK.md
    PHASE2_CHROOT.md
  scripts/
    download_gentoo_sparc.ps1
    download_gentoo_handbook.ps1
    assimilate/assimilate_gentoo.ps1
    assimilate/assimilate_gentoo.sh
    hive_os_unchained.py
```

## Hive UI (localhost)

```powershell
cd C:\Users\ARCHITECT\THE_HIVE
powershell -ExecutionPolicy Bypass -File .\scripts\start_hive_ui.ps1
# → http://127.0.0.1:8787/
```

- Cockpit: `cold-storage/hive-cockpit.html` via `NEURAL/brain/hive_api.py`
- Commands: `HIVE_CORE/commands/` (Windows + Linux catalog — **UI never shell-execs**)
- Multi-primary: KRACKERJACK (chosen) + HunterPrime / COUNSEL / ZORG-Ω (testers)
- Beachheads: `C:\Hive` and `C:\ProgramData\THE_HIVE\war-room` (junctions).  
  **Trap:** `C:\Program` is an empty **file**, not a directory.

See `docs/MULTI_PRIMARY.md`.

## Quick start (this Windows node)

```powershell
cd C:\Users\ARCHITECT\THE_HIVE

# 1) Seeds (if not already present)
powershell -ExecutionPolicy Bypass -File .\scripts\download_gentoo_sparc.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\download_gentoo_handbook.ps1

# 2) Assimilate into Hive
powershell -ExecutionPolicy Bypass -File .\scripts\assimilate\assimilate_gentoo.ps1

# 3) First contact — KRACKERJACK AI (no keys)
python NEURAL\krackerjack\first_contact.py
python NEURAL\krackerjack\first_contact.py status
python NEURAL\krackerjack\first_contact.py handbook
python NEURAL\krackerjack\first_contact.py ask "What is dual control on HIVE-OS?"

# 4) Bootstrap free local models (Ollama app running)
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap_local_brain.ps1

# 5) Never obsolete
python NEURAL\brain\self_upgrade.py
```

### Brain (local only by default)

```powershell
python NEURAL\brain\hive_link.py status
python NEURAL\brain\hive_link.py ask "Hive status. Capricorn. Two sentences."
python NEURAL\brain\hive_link.py offline "Works with zero network and zero keys."
python NEURAL\brain\agents.py counsel "Critique the install plan."
```

`HIVE_BRAIN=local` — Ollama if present, else offline sovereign. **Never blocks on missing API keys.**

## Gentoo SPARC seed

- Distfiles: `https://distfiles.gentoo.org/releases/sparc/autobuilds/`
- Preferred: **stage3-sparc64-openrc** (matches OpenRC Hive DNA)
- Official handbook: [Handbook:SPARC](https://wiki.gentoo.org/wiki/Handbook:SPARC) → mirrored under `docs/handbook/gentoo-sparc/`
- Hive install narrative: `docs/HIVE_HANDBOOK/`

## Standalone bootable ISO (WSL Kali → hybrid ISO)

```powershell
cd C:\Users\ARCHITECT\THE_HIVE
powershell -ExecutionPolicy Bypass -File .\scripts\run_one_shot_iso.ps1
# or in WSL:
# sudo bash /mnt/c/Users/ARCHITECT/THE_HIVE/scripts/krackerjack_one_shot_iso.sh
```

Output: `GENESIS\iso\HIVE-OS-KRACKERJACK-LIVE.iso`  
Boot → user `architect` / pass `hive` → `krackerjack`  
Full notes: `docs/ISO_BUILD.md`

## Bare-metal / VM

Copy `NEURAL/`, `GENESIS/gentoo-sparc/`, and handbooks to the live environment.  
Follow `docs/GENTOO_STAGING_WALK.md` + `docs/HIVE_HANDBOOK/02_INSTALL_HIVE_SPARC.md`.  
Installer never auto-wipes — type `YES` only after mounts are correct.

## Protocol

Assimilate or Die. Least-traveled path. Do right because it is right.  
**KRACKERJACK AI greets first. Always.**
