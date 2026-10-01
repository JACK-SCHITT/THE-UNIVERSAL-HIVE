# Phase 3 Companion — WSL Staging Turf

Host: Windows + WSL2 `kali-linux`  
Purpose: Mirror War Room, validate scripts, prepare Black-and-Gold bridge package.

## Sync from Windows

```powershell
wsl -d kali-linux -e bash -lc "mkdir -p ~/THE_HIVE && rm -rf ~/THE_HIVE/*"
wsl -d kali-linux -e bash -lc "cp -a /mnt/c/Users/ARCHITECT/THE_HIVE/. ~/THE_HIVE/ && ls -la ~/THE_HIVE"
```

## Validate

```bash
cd ~/THE_HIVE
bash -n NEURAL/hive_install.sh
bash -n NEURAL/kernel/kernel_prep.sh
bash -n NEURAL/aegis/aegis_harden.start
python3 NEURAL/brain/hive_link.py status
```

## What WSL is NOT

- Not Hardened Gentoo bare metal
- Not the encrypted Vault on real hardware
- Not a substitute for Stage3 + chroot + kernel forge

## Bridge to real Gentoo

1. Boot Gentoo live USB on target machine
2. Copy `~/THE_HIVE/NEURAL` onto live env
3. Run `hive_install.sh` with prepared partitions
4. Follow `PHASE2_CHROOT.md` through world emerge
