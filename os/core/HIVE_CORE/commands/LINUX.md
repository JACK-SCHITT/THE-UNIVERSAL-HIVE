# HIVE-OS — Linux Command Book (WSL / Live / Chroot)

Source of truth: `HIVE_CORE/commands/COMMANDS.json`

## WSL staging (safe)

```bash
bash /mnt/c/Users/ARCHITECT/THE_HIVE/scripts/wsl_stage_hive.sh
cd ~/THE_HIVE
bash -n NEURAL/hive_install.sh
bash -n NEURAL/kernel/kernel_prep.sh
bash -n NEURAL/aegis/aegis_harden.start
python3 NEURAL/brain/hive_link.py status
python3 NEURAL/brain/agents.py krackerjack "First contact"
```

## Installer dry-run (must refuse)

```bash
unset TARGET_DISK
bash ~/THE_HIVE/NEURAL/hive_install.sh
# Expect: TARGET_DISK not set
```

## Live forge (Architect chooses disk)

```bash
lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT,MODEL
# partition + LUKS + mount YOUR vault to /mnt/gentoo
export HIVE_NEURAL=$HOME/THE_HIVE/NEURAL
export TARGET_DISK=/dev/DISK_YOU_CONFIRM
bash $HIVE_NEURAL/hive_install.sh   # type YES only if mounts correct
chroot /mnt/gentoo /bin/bash
source /etc/profile
# then docs/PHASE2_CHROOT.md
```

## Chroot hardening path

```bash
emerge-webrsync && emerge --sync
eselect profile list
# set hardened profile
emerge --ask sys-kernel/gentoo-sources
cd /usr/src/linux && make defconfig
bash /root/HIVE_SEED/kernel/kernel_prep.sh
make menuconfig && make -j$(nproc) && make modules_install && make install
cp /root/HIVE_SEED/aegis/aegis_harden.start /etc/local.d/
chmod 700 /etc/local.d/aegis_harden.start
rc-update add local default
emerge --ask --verbose --update --deep --newuse @world
```

## Rules

- No auto-wipe
- Recovery path before Aegis lockdown
- KRACKERJACK is first contact always
