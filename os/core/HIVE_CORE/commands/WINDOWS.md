# HIVE-OS — Windows Command Book

Source of truth: `HIVE_CORE/commands/COMMANDS.json`  
UI: `scripts/start_hive_ui.ps1` → http://127.0.0.1:8787/

## Daily

```powershell
cd C:\Users\ARCHITECT\THE_HIVE
python NEURAL\brain\hive_link.py status
python NEURAL\brain\hive_link.py offline "Hive status"
python NEURAL\brain\agents.py krackerjack "First contact"
python NEURAL\brain\agents.py hunterprime "Next safe steps"
python NEURAL\brain\agents.py counsel "Weaknesses"
python NEURAL\brain\agents.py zorg "Threat model"
powershell -ExecutionPolicy Bypass -File scripts\start_hive_ui.ps1
```

## Cold storage

```powershell
python scripts\hive_os_unchained.py
python scripts\hive_os_unchained.py --push
git -C C:\Users\ARCHITECT\THE_HIVE status -sb
```

## Bridge / seeds

```powershell
wsl -d kali-linux -e bash -lc "bash /mnt/c/Users/ARCHITECT/THE_HIVE/scripts/wsl_stage_hive.sh"
powershell -ExecutionPolicy Bypass -File scripts\bootstrap_local_brain.ps1
powershell -ExecutionPolicy Bypass -File scripts\download_gentoo_handbook.ps1
powershell -ExecutionPolicy Bypass -File scripts\download_gentoo_sparc.ps1
```

## Beachheads

```powershell
Get-Item C:\Hive, C:\ProgramData\THE_HIVE\war-room | Format-List FullName, LinkType, Target
# TRAP: C:\Program is an empty FILE — not a directory
Get-Item C:\Program -Force | Format-List FullName, Length, PSIsContainer
```

## Hardening notes

- Never commit `.env`
- UI binds localhost only
- UI does not execute shell — copy commands yourself
