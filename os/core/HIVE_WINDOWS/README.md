# HIVE OS — Windows Installer Transformation

**Base:** Windows setup media on USB (boot.wim + install.wim)  
**Product:** THE HIVE OS — Windows core + full Hive DNA, AIs, and app chambers  

## What this does

1. Keeps the **Windows installer** so the stick still installs Windows.
2. Injects **HIVE DNA** via `$OEM$` so first boot becomes **HIVE OS**.
3. Rebrands shells, Control Panel, Start labels.
4. Pins **every AI** to a permanent **HIVE AI Dock** (resizable, not dismissible by casual close).
5. Each AI/app stays **100% individual** (own skin/chamber) and **100% combined** (shared Hive protocol, multi-primary routing).
6. Agents that lack knowledge **learn and continue** (local brain + offline digest + self-upgrade).

## USB layout (after deploy)

```
D:\
  setup.exe              (Windows installer — kept)
  sources\install.wim
  sources\$OEM$\...      (HIVE post-setup inject)
  Autounattend.xml       (HIVE unattended branding)
  HIVE\                  (full war-room DNA + UI + agents)
  HIVE_BOOT.txt
```

## Deploy again

```powershell
cd C:\Users\ARCHITECT\THE_HIVE
powershell -ExecutionPolicy Bypass -File .\HIVE_WINDOWS\deploy_to_usb.ps1 -Drive D
```

## After Windows install

`SetupComplete.cmd` + first logon run:

- `Apply-HiveBranding.ps1`
- `Install-HiveShells.ps1`
- `Install-HiveTaskbar.ps1`
- `Install-HiveAgents.ps1`
- Start **HIVE AI DOCK** (taskbar companion)

## Law

ASSIMILATE OR DIE · Skin fidelity · Dual force (solo + swarm) · Never obsolete
