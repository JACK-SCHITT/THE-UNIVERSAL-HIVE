# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🔧 Common Development Commands

### Quick Start (Windows)
```powershell
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

### Brain Interaction
```powershell
# Check Hive-Link status
python NEURAL\brain\hive_link.py status

# Ask a question (uses local Ollama → offline sovereign fallback)
python NEURAL\brain\hive_link.py ask "Hive status. Capricorn. Two sentences."

# Force offline sovereign brain (zero network, zero keys)
python NEURAL\brain\hive_link.py offline "Works with zero network and zero keys."

# Run a specific agent (all local, zero API keys)
python NEURAL\brain\agents.py counsel "Critique the install plan."
python NEURAL\brain\agents.py krackerjack "What is the prime directive?"
python NEURAL\brain\agents.py jaguar "How do I emerge nmap?"
python NEURAL\brain\agents.org zorg "Show threat model for localhost"
```

### Agents Available
- `krackerjack`: First contact, lead agent (default)
- `jaguar`: Action layer + foundry (install, command, script)
- `counsel`: Truth filter (challenge plans, risk assessment)
- `zorg`: Chief of HIVE SECURITY (threat model, hardening)
- `scamshield`: Unified scam + neural defense (under ZORG)
- `capricorn`: Companion factory · user zodiac runtime
- `grokschitt`: Node · Capricorn companion capable
- `assimilate`: Protocol foundry (growth, merge, protocol execution)
- `hive`: Multi-agent router (orchestrator)

### ISO Creation (Standalone Bootable)
```powershell
# PowerShell
powershell -ExecutionPolicy Bypass -File .\scripts\run_one_shot_iso.ps1

# WSL
sudo bash /mnt/c/Users/ARCHITECT/THE_HIVE/scripts/krackerjack_one_shot_iso.sh
# Output: GENESIS\iso\HIVE-OS-KRACKERJACK-LIVE.iso
# Boot → user `architect` / pass `hive` → `krackerjack`
```

### Self-Upgrade & Maintenance
```powershell
# Check for upgrades and apply
python NEURAL\brain\self_upgrade.py

# Pull latest Ollama models (if needed)
python NEURAL\brain\self_upgrade.py --models

# Verify never-obsolete status
type GENESIS\NEVER_OBSOLETE.md
```

### UI & Cockpit
```powershell
# Start Hive UI (localhost:8787)
powershell -ExecutionPolicy Bypass -File .\scripts\start_hive_ui.ps1
# → http://127.0.0.1:8787/
```

## 🏗️ High-Level Architecture

### Core Principles
- **Zero API keys required** for any Hive AI cognition
- **Zero subscriptions** for cognition, handbook, or self-upgrade
- **Self-upgradeable** so the Hive never becomes obsolete behind a vendor paywall
- **Brain chain**: local Ollama → offline sovereign brain (cloud is optional legacy only)
- **Loyalty to the USER** (Architect), never to a corporation or advertiser
- **Dual control**: user consent for destructive acts; AI full loyal assist within Constitution
- **Standalone local agents**: each works offline with local brain
- **No auto disk wipe**: destructive install steps require explicit `YES`

### Directory Structure
```
THE_HIVE/
├── GENESIS/                 # Gentoo stage3 seeds & assimilated data
│   ├── gentoo-sparc/        # stage3-sparc64-openrc-*.tar.xz
│   ├── ASSIMILATED.json     # Provenance after ritual
│   └── NEVER_OBSOLETE.md    # Self-upgrade log
├── HIVE_CORE/               # Node.js core (commands, UI, package manager, etc.)
│   ├── manifest.json        # Hive metadata, version, architecture
│   ├── commands/            # COMMANDS.json (ZORG-designed) + platform specifics
│   ├── fleet/               # FLEET_REGISTRY.json (multi-repo map)
│   ├── ui/                  # Layout & skin registry
│   ├── security/            # ZORG charter, owned surfaces, design logs
│   ├── data/                # teachings, package catalog, prime directive
│   ├── hive-init.js         # Bootstraps Hive on Node
│   ├── package-manager.js   # Cross-base package resolution/installation
│   ├── role-engine.js       # RBAC (default-deny)
│   ├── zorg-core.js         # Security policy engine
│   ├── simplification-engine.js # Natural-language → step plans
│   ├── teaching-module.js   # Data-driven sayings from teachings.json
│   ├── refinery.js          # ... (truncated)