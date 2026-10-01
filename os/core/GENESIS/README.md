# KRACKERJACK HIVE OS  -  Fullest Potential Edition  v7.0

The Hive is the OS. Sovereign, self-assimilating, role-based, RBAC-gated, with a
Memory Refinery that keeps the system alive even when upstream dies.

## Quick start (one command, Git-Bash / WSL / Termux / macOS / Linux)

```bash
bash ./hive-installer.sh
```

You'll be asked:

1.  **Base**  - Termux / Gentoo / Kali / Debian / Arch / Alpine / macOS / WSL / Windows.
2.  **Identity**  - your handle.
3.  **Role**  - Architect (255) / Administrator (128) / User (32).
4.  **Categories**  - core, dev, security, net, ai, custom.

After install, your identity is at `~/.hive/identity.json` and your CLI is on the
PATH (source `~/.hive/hive.env`).

## What you get

```
~/.hive/
  identity.json            # user / role / key / base / os_name
  role                     # one-word role file
  product_key              # one-line key file
  packages.json            # selected package spec
  teachings.json           # the Architect's Eyes
  refinery.json            # tamper-evident digest chain
  claude-memory.json       # sub-agent memory
  PRIME_DIRECTIVE.txt      # text anchor of intent
  hive.env                 # source me
  core/                    # HIVE_CORE Node modules
    identity.js
    role-engine.js
    zorg-core.js
    claude-subagent.js
    teaching-module.js
    refinery.js
    package-manager.js
    simplification-engine.js
    hive-init.js
    data/
      teachings.json
      package-catalog.json
      prime-directive.json
    node_modules/
      minimist/            # vendored
  bin/                     # CLI shims
    hive
    zorg
    claude-hive
    hive-assimilate
    hive-update
    hive-status
  logs/
    install.log
    audit.log
    refinery.log
```

## CLI examples

```bash
# Show identity + status
hive status
hive identity show

# Architect's Eyes
hive teach eyes
hive teach random
hive teach say krackerjack

# ZORG-Ω shadow scan
hive zorg scan 127.0.0.1 full
zorg 127.0.0.1 ports

# Claude sub-agent
hive claude init
hive claude research "memory refinery"
hive claude verify "KRACKERJACK HIVE is a no-limits OS"

# Package manager (cross-base)
hive package list
hive package resolve git,clang,nmap
hive package install git,clang,nmap --dryRun

# Refinery (self-evolution)
hive refinery run
hive refinery verify
hive refinery chain

# Simplification engine (natural language)
hive ask "make my system secure"
hive ask "update everything"
hive ask "install nmap and hydra"
hive ask "teach me something"

# Re-enter identity / rotate key
hive-identity re
hive-identity rotate-key
```

## Cockpit (GUI)

```bash
# 1. start the API
python3 hive-cockpit-api.py
# 2. open hive-cockpit.html in your browser
```

The cockpit calls the same Node modules via a tiny local API. No external
services.  No cloud.  No telemetry.

## Windows war-room integration

The existing `bin/hive.cmd` keeps working.  The new `GENESIS/hive.cmd` wrapper
bootstraps `~/.hive` on first run and then dispatches to the bash shim or to
`node hive-init.js boot` if bash isn't available.

## Design notes

- **Default-deny RBAC.**  Every action is gated by `role-engine.js`.  The
  `bypassGuard()` rejects any request that smells like a "no-limits" override.
- **No claim of overriding the host OS.**  The Hive runs on top of whatever
  base you choose.  Prime-Directive and ZORG-Ω anchors are TEXT records of
  intent, not system policies that override the kernel.
- **Refinery chain is tamper-evident.**  Each entry links to the previous via
  SHA-256.  `hive refinery verify` walks the chain.
- **Simplification engine** turns natural-language requests into step plans.
  Architect sees the controls; User gets one-line answers.
- **Teaching module** is data-driven; sayings come from
  `HIVE_CORE/data/teachings.json`.  Anyone can extend it; the `eyes` view is
  regenerated automatically.
- **ZORG-Ω** is ruthless by design but stays inside the host's own tools
  (nmap, ss, find, npm audit, pip-audit) when they're available; it degrades
  gracefully when they aren't.

## License

MIT  -  Architect: KRACKERJACK1134.

"Do right because it is right.  No compromises.  No excuses."
