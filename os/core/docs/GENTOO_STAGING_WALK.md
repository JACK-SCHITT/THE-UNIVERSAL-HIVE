# Gentoo Staging Walk — Windows → WSL → Live USB → Bare Metal

**Date:** 2026-07-18  
**Architect:** KRACKERJACK1134  
**Cold storage:** https://github.com/JACK-SCHITT/HIVE-OS-CORE

This is the practical order of operations. Windows + WSL prepare and validate.
Real install only happens on a Gentoo live environment with a disk **you** confirm.

---

## Phase 0 — War Room (this PC) ✅

| Step | Action | Command / note |
|------|--------|----------------|
| 0.1 | Hive tree present | `C:\Users\ARCHITECT\THE_HIVE` |
| 0.2 | `.env` optional | **No API keys required.** `HIVE_BRAIN=local`. GH_PAT only for optional git push |
| 0.3 | Local brain | `python NEURAL\brain\hive_link.py status` (Ollama → offline) |
| 0.4 | Cold storage push | `python scripts\hive_os_unchained.py --push` |
| 0.5 | Cockpit | open `cold-storage\hive-cockpit.html` |

Ollama fallback when xAI has no credits:

```powershell
ollama pull llama3.2:3b
python NEURAL\brain\hive_link.py ollama "Hive status. Two sentences."
# or auto (Grok → Ollama):
python NEURAL\brain\hive_link.py ask "Hive status. Two sentences."
```

---

## Phase 1 — WSL staging turf ✅ (repeatable)

Mirror excludes `.git` and `.env` on purpose.

```powershell
wsl -d kali-linux -e bash -lc "bash /mnt/c/Users/ARCHITECT/THE_HIVE/scripts/wsl_stage_hive.sh"
```

Inside WSL:

```bash
cd ~/THE_HIVE
bash -n NEURAL/hive_install.sh
bash -n NEURAL/kernel/kernel_prep.sh
bash -n NEURAL/aegis/aegis_harden.start
python3 NEURAL/brain/hive_link.py status
ls -la NEURAL/
```

**WSL is NOT the OS install.** It only proves scripts parse and DNA is complete.

---

## Phase 2 — Bridge package (Black and Gold)

What must travel to the target machine:

```
NEURAL/
  hive_make.conf
  hive_install.sh
  kernel/kernel_prep.sh
  aegis/aegis_harden.start
  brain/hive_link.py
  soul/CONSTITUTION.md
docs/
  PHASE2_CHROOT.md
  PHASE_MAP.md
  GENTOO_STAGING_WALK.md
```

Copy options:

1. USB stick: copy `THE_HIVE/NEURAL` + `docs`  
2. Git: clone private `JACK-SCHITT/HIVE-OS-CORE` on live env (PAT or SSH)  
3. From WSL: `~/THE_HIVE` already mirrors war room

---

## Phase 3 — Live USB prep (hardware — Architect)

1. Download official **Gentoo LiveGUI or minimal install ISO** from gentoo.org (verify checksums).
2. Flash to USB (balenaEtcher is on this Desktop).
3. On target: backup data, note disk names (`lsblk` / `fdisk -l`).
4. **Hive will not auto-wipe.** You partition.

Example layout (adapt to hardware):

| Partition | Size | FS | Role |
|-----------|------|-----|------|
| `*1` | ~512M | FAT32 | EFI |
| `*2` | ~1G | ext4 | boot (optional if EFISTUB-only) |
| `*3` | rest | LUKS → ext4 | ROOT vault |

---

## Phase 4 — Seed plant (`hive_install.sh`)

On live env, after network works and partitions/mounts are ready:

```bash
export HIVE_NEURAL=$HOME/THE_HIVE/NEURAL   # or /path/to/NEURAL
export TARGET_DISK=/dev/nvme0n1            # YOUR disk — confirm twice
# Mount vault root at /mnt/gentoo first (cryptsetup open + mount)
# Download official Stage3 into cwd, then:
bash $HIVE_NEURAL/hive_install.sh
# Type YES only when mounts are correct
```

Script will: unpack Stage3, inject `hive_make.conf`, copy DNA to `/root/HIVE_SEED`, prep chroot mounts.

---

## Phase 5 — Chroot soul bind

```bash
chroot /mnt/gentoo /bin/bash
source /etc/profile
export PS1="(hive-chroot) ${PS1}"
```

Follow **`docs/PHASE2_CHROOT.md`** in order:

1. `emerge-webrsync` / `emerge --sync`
2. Hardened profile
3. Python/git/curl
4. Kernel forge (`kernel_prep.sh` + menuconfig + build)
5. Hostname + dhcpcd
6. Aegis → `/etc/local.d/`
7. Overnight `@world`

---

## Phase 6 — First boot checklist

- [ ] EFI entry / EFISTUB boots
- [ ] LUKS unlock works
- [ ] Network up
- [ ] Aegis local.d ran without locking you out
- [ ] Hive-Link status inside node
- [ ] Cold storage remote still private

---

## Safety rules (non-negotiable)

1. No auto disk wipe in Hive scripts — you type YES and you choose partitions.  
2. GRSecurity/PaX is not free/assumed — hardened Gentoo profile only by default.  
3. Keep a recovery USB + known root password path.  
4. Never commit `.env` or PATs into cold storage.

---

## Current gate

| Gate | Status |
|------|--------|
| War Room + push | Software complete on this node |
| WSL validate | Ready / re-runnable |
| Live USB + target disk | **Waiting on Architect hardware decision** |
| xAI Grok credits | Optional; Ollama is local fallback |
