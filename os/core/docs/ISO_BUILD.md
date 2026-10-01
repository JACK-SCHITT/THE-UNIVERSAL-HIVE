# KRACKERJACK One-Shot Standalone ISO

**Architect:** KRACKERJACK1134  
**Script:** `scripts/krackerjack_one_shot_iso.sh`  
**Launcher (Windows):** `scripts/run_one_shot_iso.ps1`

## What it builds

| Item | Detail |
|------|--------|
| Format | Hybrid ISO (BIOS + UEFI via grub-mkrescue when available) |
| Base | Debian bookworm minbase + live-boot (amd64) |
| Hive DNA | `/opt/hive` — NEURAL, docs, HIVE_CORE, scripts |
| First AI | `krackerjack` → KRACKERJACK AI |
| API keys | **Not required** |
| Stage3 | **Not** embedded (keeps ISO smaller; copy USB-side if needed) |

This is a **forge / rescue live medium**, not a full Gentoo install image.  
Use it to boot hardware, talk to KRACKERJACK, then run Gentoo Hive install from handbook + `hive_install.sh`.

## Run (recommended)

### From Windows PowerShell

```powershell
cd C:\Users\ARCHITECT\THE_HIVE
powershell -ExecutionPolicy Bypass -File .\scripts\run_one_shot_iso.ps1
```

Enter your **WSL Kali sudo password** when prompted.

### From WSL Kali

```bash
sudo bash /mnt/c/Users/ARCHITECT/THE_HIVE/scripts/krackerjack_one_shot_iso.sh
```

## Output

- WSL: `~/hive-iso-work/HIVE-OS-KRACKERJACK-LIVE.iso`
- Windows: `THE_HIVE\GENESIS\iso\HIVE-OS-KRACKERJACK-LIVE.iso`
- Checksum: `*.iso.sha256`
- Metadata: `GENESIS/LIVE_ISO.json`

## Flash & boot

1. balenaEtcher / Rufus / `dd if=... of=/dev/sdX bs=4M status=progress`
2. Boot UEFI or BIOS
3. Autologin user: **architect** / password: **hive** (change immediately)
4. `krackerjack` → first contact

## Environment knobs

| Var | Default | Meaning |
|-----|---------|---------|
| `HIVE_SRC` | `/mnt/c/Users/ARCHITECT/THE_HIVE` | DNA source |
| `WORK` | `~/hive-iso-work` | Build directory |
| `DISTRO` | `bookworm` | Debian suite |
| `MIRROR` | `http://deb.debian.org/debian` | debootstrap mirror |
| `SKIP_APT=1` | off | Skip host apt install |
| `SKIP_DEBOOTSTRAP=1` | off | Reuse existing chroot |
| `FORCE_FULL_UPGRADE=1` | off | `apt full-upgrade` host first |

## RAM note

WSL node has ~4GB RAM. This builder uses **lean debootstrap**, not a full Kali desktop live-build, so it can finish without OOM.

## After boot — Gentoo Hive install

```bash
krackerjack handbook
# copy stage3 if needed, mount vault, then:
export HIVE_NEURAL=/opt/hive/NEURAL
export TARGET_DISK=/dev/YOURDISK
# mount root at /mnt/gentoo first
sudo bash /opt/hive/NEURAL/hive_install.sh
```

Follow `docs/GENTOO_STAGING_WALK.md` and `docs/HIVE_HANDBOOK/`.
