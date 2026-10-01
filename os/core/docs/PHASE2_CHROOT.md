# Phase 2 — Chroot & Soul Binding

Run **inside** the HIVE-OS chroot after `hive_install.sh` seed plant.

## 1. Sync the truth

```bash
emerge-webrsync
emerge --sync
```

## 2. Hardened profile

```bash
eselect profile list
# amd64 forge: pick hardened/linux/amd64 (or current hardened equivalent)
# SPARC seed:  pick hardened/linux/sparc OR sparc64 equivalent — NEVER copy amd64 numbers
eselect profile set <number>
```

## 2b. KRACKERJACK AI — first contact (mandatory)

KRACKERJACK AI is the **first AI** any user interacts with on HIVE-OS.

```bash
# DNA already under /root/HIVE_SEED and optionally /opt/hive/NEURAL
bash /root/HIVE_SEED/krackerjack/first_contact.sh
# or:
python3 /root/HIVE_SEED/krackerjack/first_contact.py status
python3 /root/HIVE_SEED/krackerjack/first_contact.py handbook
```

Copy Hive + Gentoo handbooks onto the node when available:

```bash
mkdir -p /opt/hive/docs
# from bridge USB / war room:
# cp -a docs/HIVE_HANDBOOK docs/handbook /opt/hive/docs/
```

## 3. Hive-Link dependencies

```bash
emerge --ask dev-lang/python dev-vcs/git net-misc/curl app-admin/sudo app-editors/vim
```

## 4. Kernel forge

```bash
emerge --ask sys-kernel/gentoo-sources
cd /usr/src/linux
make defconfig
bash /root/HIVE_SEED/kernel/kernel_prep.sh
make menuconfig
# Enable: EFISTUB, DM-Crypt, OpenRC support, drop staging junk you do not need
make -j$(nproc)
make modules_install
make install
```

## 5. Identity

```bash
echo "HIVE-NODE-01" > /etc/conf.d/hostname
emerge --ask net-misc/dhcpcd
rc-update add dhcpcd default
```

## 6. Aegis

```bash
cp /root/HIVE_SEED/aegis/aegis_harden.start /etc/local.d/aegis_harden.start
chmod 700 /etc/local.d/aegis_harden.start
rc-update add local default
```

## 7. World compile (overnight burn)

```bash
emerge --ask --verbose --update --deep --newuse @world
```

## Truth notes

- **GRSecurity/PaX**: commercial / restricted; do not assume free full grsec.
- **USB lockdown**: best-effort; can lock you out of recovery hardware — keep a signed escape path.
- **No auto disk wipe** in Hive scripts. You choose partitions.
