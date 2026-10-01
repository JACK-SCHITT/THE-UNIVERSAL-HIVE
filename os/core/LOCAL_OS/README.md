# HIVE LOCAL OS — Fully local AI install stack

## Policy (non-negotiable)

- **All install / assist AIs run local** via **Ollama**
- **Cloud models forbidden** as the install brain (including `*:cloud`)
- Default model: **`phi3:mini`**
- Models directory: **`D:\HIVE_LOCAL_AI\ollama\models`** (keeps C: free)

## What “bootable” means here

| Piece | Role |
|--------|------|
| **Payload ISO** | Ships DNA, LOCAL_OS, media, tools, autoinstall scripts |
| **KRACKERJACK first-boot** | Local web assistant at boot/install time (`:8788`) |
| **Windows auto-install** | `Install-HiveLocal.ps1` wires Ollama + DNA + WSL + assistant |
| **PC OS boot kernel** | Still needs a real **amd64** live/install ISO (Kali/Debian/Gentoo) flashed with Rufus — then this payload auto-runs |

You cannot legally/practically dump all of Windows into one free ISO.  
You **can** ship everything *you use for the Hive federation* and auto-install it on first contact.

## Quick start (this machine — now)

```powershell
# 1) Pull local model (once)
$env:OLLAMA_MODELS = 'D:\HIVE_LOCAL_AI\ollama\models'
ollama pull phi3:mini

# 2) Auto-install + open KRACKERJACK
powershell -ExecutionPolicy Bypass -File C:\Users\ARCHITECT\THE_HIVE\LOCAL_OS\autoinstall\Install-HiveLocal.ps1 -PullModel

# Or assistant only:
C:\Users\ARCHITECT\THE_HIVE\LOCAL_OS\autoinstall\Start-KrackerjackLocal.cmd
```

Open: http://127.0.0.1:8788/

## Rebuild payload ISO (WSL)

```bash
bash /mnt/c/Users/ARCHITECT/THE_HIVE/LOCAL_OS/autoinstall/Build-FederationPayloadIso.sh
```

Output: `D:\HIVE_BOOTLAB\HIVE-FEDERATION-BOOTLAB.iso`

## Agents that stay local

| Agent | Runtime |
|--------|---------|
| KRACKERJACK AI (install) | Ollama `phi3:mini` + this assistant |
| Sparky AI | Same local Ollama endpoint (bind later) |
| GENESIS cockpit API | Local Python/Node on 127.0.0.1 |
| ZORG / Hive CLI | Local scripts under GENESIS |

Cloud keys (xAI etc.) are **optional toys**, never required for install.
