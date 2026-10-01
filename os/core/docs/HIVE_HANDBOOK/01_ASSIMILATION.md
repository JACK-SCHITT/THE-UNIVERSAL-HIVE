# Chapter 01 — Assimilation of Gentoo into HIVE-OS

## Definition

**Assimilation** = official Gentoo artifacts become Hive DNA:

1. Downloaded into `GENESIS/`
2. Checksum-recorded
3. Registered in `HIVE_CORE/manifest.json`
4. Handbook mirrored offline
5. Installer + first AI taught the seed paths
6. Stage3 becomes the only legal base for bare-metal / VM Hive boots on that arch

Until assimilation completes, Hive is a **War Room** (scripts + soul).  
After assimilation, Hive is a **seeded OS lineage**.

## Ritual (Windows war room)

```powershell
cd C:\Users\ARCHITECT\THE_HIVE
powershell -ExecutionPolicy Bypass -File .\scripts\assimilate\assimilate_gentoo.ps1
```

## Ritual (Linux / live / WSL)

```bash
cd ~/THE_HIVE   # or /mnt/c/Users/ARCHITECT/THE_HIVE
bash scripts/assimilate/assimilate_gentoo.sh
```

## What the ritual does

| Step | Action |
|------|--------|
| 1 | Locate `GENESIS/gentoo-sparc/stage3-*-openrc-*.tar.xz` |
| 2 | Verify size / optional SHA512 against `.DIGESTS` |
| 3 | Write `GENESIS/ASSIMILATED.json` (provenance) |
| 4 | Symlink/copy stage3 pointer for `hive_install.sh` |
| 5 | Index handbook into KRACKERJACK knowledge pack |
| 6 | Bump manifest `assimilated` + arch list |
| 7 | Mark status file `GENESIS/STATUS=ASSIMILATED` |

## Safety

- Assimilation **never** formats disks.
- Assimilation **never** runs as root on Windows for wipe.
- Real install still requires live env + typed `YES` in `hive_install.sh`.

## Multi-arch note

SPARC64 OpenRC is the **declared first full seed**.  
amd64/arm64 seeds may be added later under `GENESIS/gentoo-<arch>/` with the same ritual.  
Hive DNA (`NEURAL/`) is arch-agnostic; stage3 and kernel config are not.
