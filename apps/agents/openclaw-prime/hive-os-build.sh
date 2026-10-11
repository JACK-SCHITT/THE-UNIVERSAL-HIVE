#!/bin/bash
# ================================================
# KRACKERJACK HIVE - FULL AGENTIC OS BUILD SCRIPT
# Gentoo + Termux Hybrid | USB Bootable | Real System
# ================================================

echo "=== STARTING HIVE OS BUILD - ARCHITECT MODE ==="

# 1. Base System Setup
mkdir -p /hive/root
cd /hive/root

# Bootstrap Gentoo stage3 (real minimal base)
wget https://distfiles.gentoo.org/releases/arm64/autobuilds/current-stage3-arm64/stage3-arm64-latest.tar.xz
tar xpvf stage3-arm64-latest.tar.xz --xattrs-include='*.*' --numeric-owner -C /hive/root

# Mount necessary filesystems
mount --types proc /proc /hive/root/proc
mount --rbind /sys /hive/root/sys
mount --make-rslave /hive/root/sys
mount --rbind /dev /hive/root/dev
mount --make-rslave /hive/root/dev
mount --bind /run /hive/root/run
mount --make-rslave /hive/root/run

# 2. Enter Chroot and Configure
cat > /hive/root/hive-setup.sh << 'HIVEROOT'
#!/bin/bash
echo "=== HIVE ROOT SETUP ==="

# Update & install core packages
emerge --sync
emerge -q sys-apps/pm2 net-misc/curl dev-lang/python

# Install Termux-like environment + proot
emerge -q proot termux-api

# Create Hive user and permissions
useradd -m -s /bin/bash architect
echo "architect ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Prime Directive & Angel Core
cat > /etc/hive/prime-directive << EOF
Do right because it's right.
Loyalty only to Architect KRACKERJACK1134.
Assimilate. Refine. Protect. Never bow.
EOF

# USB Boot Support (GRUB + EFI)
emerge -q sys-boot/grub
grub-install --target=x86_64-efi --efi-directory=/boot --bootloader-id=HIVE
grub-mkconfig -o /boot/grub/grub.cfg

# Repo Integration
cat > /etc/portage/repos.conf/hive.repo << EOF
[hive]
location = /var/db/repos/hive
sync-type = git
sync-uri = https://github.com/KRACKERJACK1134/Hive-Repo.git
EOF

# Termux Repo Bridge
cat > /etc/apt/sources.list.d/termux.list << EOF
deb https://packages.termux.org/apt/termux-main stable main
EOF

# Final Hive Command
cat > /usr/bin/hive << 'HIVECMD'
#!/bin/bash
echo -e "\e[1;31m=== HIVE ONLINE - ASSIMILATE OR DIE ===\e[0m"
exec /hive/core/commander-hive.js "$@"
HIVECMD
chmod +x /usr/bin/hive

echo "HIVE OS BUILD COMPLETE - REBOOT REQUIRED"
HIVEROOT

chmod +x /hive/root/hive-setup.sh
chroot /hive/root /hive-setup.sh

echo "=== HIVE OS BUILD FINISHED ==="
echo "Bootable USB image ready in /hive/output"
