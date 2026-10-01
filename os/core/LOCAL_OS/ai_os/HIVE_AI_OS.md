# HIVE AI OS — Perfect User-Friendly Federation

**Architect:** KRACKERJACK1134  
**Mind:** KRACKERJACK AI / Sparky AI (local Ollama)  
**Soul:** THE HIVE / GENESIS  

This is **one AI operating system** made of the right organs — not one illegal merge of foreign kernels into a single broken ISO.

---

## Official minimal media (amd64 — this PC)

| Organ | Media | Role | Path |
|--------|--------|------|------|
| **Kali** | netinst amd64 | Security ops + **Metasploit Framework** (apt) | `D:\HIVE_BOOTLAB\Linux\ISO_amd64\kali\` |
| **Gentoo** | install-amd64-minimal | Source-built forge core | `D:\HIVE_BOOTLAB\Linux\ISO_amd64\gentoo\` |
| **Sparky** | minimalcli x86_64 | Friendly Debian base / daily driver edge | `D:\HIVE_BOOTLAB\Linux\ISO_amd64\sparky\` |
| **Metasploit lab** | Metasploitable2 zip/VM | **Practice target** (intentional vulnerable OS) | `D:\HIVE_BOOTLAB\Linux\ISO_amd64\metasploit\` |
| **Windows host** | Your current OS | Office shell + local AI + Hive DNA | `C:\Hive`, `THE_HIVE` |
| **WSL2 Kali** | distro | Instant Kali without reboot | `wsl -d kali-linux` |

### Capricorn truth

- **Metasploit Framework** ships *inside Kali* (`msfconsole`). There is no separate “Metasploit OS ISO” for daily use.  
- **Metasploitable** is the lab victim machine — combine it as a VM target, not as your main desktop.  
- **ARM Sparky/NetHunter** stay edge-only; **amd64 Sparky** is the one for this PC.

---

## How they become “one OS”

```
                 ┌──────────────────────────────┐
                 │  KRACKERJACK AI (local)      │
                 │  http://127.0.0.1:8788       │
                 └──────────────┬───────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
   Windows + Hive DNA    WSL2 Kali (now)      Multi-boot USB (Ventoy/Rufus)
   GENESIS cockpit       msfconsole           Kali | Gentoo | Sparky ISOs
                                │
                                ▼
                     Metasploitable VM (lab only)
```

**User-friendly path (recommended default):**

1. Windows stays home.  
2. Double-click **Start Hive AI OS**.  
3. Local KRACKERJACK guides install.  
4. Use **WSL Kali** for Metasploit daily.  
5. Flash **Sparky minimalcli** or **Kali netinst** when you want bare metal.  
6. Use **Gentoo minimal** when you want the forge.  
7. Run **Metasploitable** in VirtualBox/VMware as the punching bag.

---

## Multi-boot USB (combine all ISOs)

### Option A — Ventoy (easiest, all ISOs on one stick)

1. Install Ventoy on USB.  
2. Copy every file under `ISO_amd64\**\*.iso` onto the USB.  
3. Boot → pick Kali / Gentoo / Sparky from menu.  
4. Copy `THE_HIVE\LOCAL_OS` + `GENESIS` onto installed systems after install.

### Option B — Rufus (one ISO per flash)

1. Run `D:\HIVE_BOOTLAB\Tools\rufus-4.15.exe`  
2. Select one ISO → Flash.  
3. Re-flash for the next organ when needed.

---

## After any Linux install — join the Hive

```bash
# From THE_HIVE payload
bash GENESIS/hive-installer.sh
# base: kali | gentoo | debian (Sparky) | wsl
# then: ollama + local model, same soul files
```

Windows:

```powershell
powershell -ExecutionPolicy Bypass -File C:\Users\ARCHITECT\THE_HIVE\LOCAL_OS\autoinstall\Install-HiveLocal.ps1 -PullModel
```
