# Chapter 02 — Installing HIVE-OS on SPARC (and hybrid forge)

Official Gentoo steps still apply. Hive **overlays** them; it does not replace understanding.

Canonical upstream: [Handbook:SPARC](https://wiki.gentoo.org/wiki/Handbook:SPARC)  
Offline mirror: `docs/handbook/gentoo-sparc/`

## 0. Hardware reality

| Target | Notes |
|--------|--------|
| Real SPARC / SPARC64 | Boot Gentoo SPARC media; use SPARC64 OpenRC stage3 from GENESIS |
| QEMU SPARC64 | Emulate for forge validation; slow but legal path |
| amd64 war room (this PC) | Hosts DNA, handbook, KRACKERJACK; does **not** boot SPARC stage3 natively |

## 1. Media (official + Hive)

Follow handbook **Choosing the media** + **Networking**.  
Carry onto the machine:

```
GENESIS/gentoo-sparc/stage3-sparc64-openrc-*.tar.xz
NEURAL/                    # entire tree
docs/HIVE_HANDBOOK/
docs/handbook/gentoo-sparc/
docs/PHASE2_CHROOT.md
```

## 2. Disks

Follow handbook **Preparing the disks**.  
Hive expected example (adapt):

| Partition | Role |
|-----------|------|
| EFI / SPARC boot partition | Platform boot |
| ROOT (LUKS optional) | Vault |

**Hive will not auto-wipe.** Architect partitions.

## 3. Stage file → seed plant

```bash
export HIVE_NEURAL=/path/to/NEURAL
export TARGET_DISK=/dev/YOURDISK
# mount root at /mnt/gentoo
cp /path/to/GENESIS/gentoo-sparc/stage3-*.tar.xz .
bash $HIVE_NEURAL/hive_install.sh
# type YES only when mounts are correct
```

`hive_install.sh` unpacks stage3, injects `hive_make.conf`, copies DNA to `/root/HIVE_SEED`.

## 4. Chroot (official Base + Hive Phase 2)

```bash
chroot /mnt/gentoo /bin/bash
source /etc/profile
export PS1="(hive-chroot) ${PS1}"
```

Then:

1. Official: `emerge-webrsync` / sync (handbook Base)
2. Hive: hardened profile (see PHASE2_CHROOT.md) — use **sparc** hardened profile on SPARC, not amd64
3. Kernel (handbook Kernel + `kernel_prep.sh`)
4. System/tools/bootloader (handbook)
5. Aegis local.d
6. Install KRACKERJACK first-contact:

```bash
mkdir -p /opt/hive
cp -a /root/HIVE_SEED /opt/hive/NEURAL
# enable first-login motd + krackerjack CLI
cp /opt/hive/NEURAL/krackerjack/first_contact.sh /etc/local.d/krackerjack_first.start
chmod 700 /etc/local.d/krackerjack_first.start
rc-update add local default
```

## 5. Finalizing

Handbook Finalizing + Hive first-boot checklist (`docs/GENTOO_STAGING_WALK.md` Phase 6).

On first interactive shell, **KRACKERJACK AI** greets and offers handbook topics.
