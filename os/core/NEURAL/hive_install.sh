#!/bin/bash
# HIVE-OS BOOTSTRAPPER — The Sword
# Architect: KRACKERJACK1134 | Distro: HIVE-OS (Gentoo Core)
#
# SAFETY: This script will NOT auto-wipe disks. Partitioning is manual and confirmed.
# Run from a Gentoo live environment with network access.

set -euo pipefail

HIVE_NEURAL="${HIVE_NEURAL:-$HOME/THE_HIVE/NEURAL}"
TARGET_DISK="${TARGET_DISK:-}"
MOUNTPOINT="${MOUNTPOINT:-/mnt/gentoo}"
STAGE3_GLOB="${STAGE3_GLOB:-stage3-*.tar.xz}"

echo "=========================================="
echo "  HIVE-OS INSTALLER — GENESIS BOOTSTRAP"
echo "=========================================="
echo "[*] NEURAL path: $HIVE_NEURAL"
echo "[*] Mountpoint:  $MOUNTPOINT"

if [[ ! -d "$HIVE_NEURAL" ]]; then
  echo "[!] Missing NEURAL tree at $HIVE_NEURAL"
  echo "    Copy THE_HIVE/NEURAL to the live environment first (Black and Gold bridge)."
  exit 1
fi

if [[ -z "$TARGET_DISK" ]]; then
  echo "[!] TARGET_DISK not set. Example: export TARGET_DISK=/dev/nvme0n1"
  echo "    Partition manually, then re-run with partitions already prepared."
  echo ""
  echo "Expected layout (example — ADAPT TO YOUR HARDWARE):"
  echo "  \${TARGET_DISK}1  EFI   ~512M  FAT32"
  echo "  \${TARGET_DISK}2  BOOT  ~1G    ext4 (optional if EFISTUB-only)"
  echo "  \${TARGET_DISK}3  ROOT  rest   LUKS/ext4 (THE VAULT)"
  exit 1
fi

echo "[!] TARGET_DISK=$TARGET_DISK"
echo "[!] This installer will NOT partition or format. Confirm mounts yourself."
read -r -p "Type YES to continue mounting/unpacking only: " CONFIRM
if [[ "$CONFIRM" != "YES" ]]; then
  echo "[-] Aborted."
  exit 1
fi

mkdir -p "$MOUNTPOINT"

if ! mountpoint -q "$MOUNTPOINT"; then
  echo "[*] Mount root vault partition to $MOUNTPOINT first, then re-run."
  echo "    Example: cryptsetup open /dev/sda3 hivevault && mount /dev/mapper/hivevault $MOUNTPOINT"
  exit 1
fi

echo "[+] Mounted. Looking for Stage3: $STAGE3_GLOB"
STAGE3=$(ls -1 $STAGE3_GLOB 2>/dev/null | head -n1 || true)

# Assimilated GENESIS seed (Hive war room / bridge USB)
if [[ -z "$STAGE3" ]]; then
  HIVE_ROOT_GUESS="$(cd "$HIVE_NEURAL/.." 2>/dev/null && pwd || true)"
  GENESIS_STAGE="${HIVE_GENESIS_STAGE3:-}"
  if [[ -z "$GENESIS_STAGE" && -n "$HIVE_ROOT_GUESS" ]]; then
    GENESIS_STAGE=$(ls -1 "$HIVE_ROOT_GUESS"/GENESIS/gentoo-sparc/stage3-*.tar.xz 2>/dev/null | head -n1 || true)
  fi
  if [[ -n "$GENESIS_STAGE" && -f "$GENESIS_STAGE" ]]; then
    echo "[*] Using assimilated GENESIS stage3: $GENESIS_STAGE"
    STAGE3="$GENESIS_STAGE"
  fi
fi

if [[ -z "$STAGE3" ]]; then
  echo "[!] No Stage3 tarball found in $(pwd) or GENESIS/gentoo-sparc."
  echo "    Download official Gentoo Stage3 or run assimilate_gentoo first."
  exit 1
fi

echo "[+] Unpacking seed: $STAGE3"
tar xpvf "$STAGE3" --xattrs-include='*.*' --numeric-owner -C "$MOUNTPOINT"

echo "[+] Injecting Hive DNA (make.conf)"
mkdir -p "$MOUNTPOINT/etc/portage"
cp "$HIVE_NEURAL/hive_make.conf" "$MOUNTPOINT/etc/portage/make.conf"

echo "[+] Staging Aegis + kernel prep + KRACKERJACK first contact into /root/HIVE_SEED"
mkdir -p "$MOUNTPOINT/root/HIVE_SEED"
cp -a "$HIVE_NEURAL/." "$MOUNTPOINT/root/HIVE_SEED/"

# First AI on HIVE-OS: KRACKERJACK
if [[ -f "$HIVE_NEURAL/krackerjack/first_contact.sh" ]]; then
  echo "[+] KRACKERJACK first-contact seed present (activate in chroot via first_contact.sh)"
fi
if [[ -f "$HIVE_NEURAL/krackerjack/first_contact.py" ]]; then
  mkdir -p "$MOUNTPOINT/opt/hive/NEURAL"
  cp -a "$HIVE_NEURAL/." "$MOUNTPOINT/opt/hive/NEURAL/" 2>/dev/null || true
fi

echo "[+] Preparing chroot mounts"
mount --types proc /proc "$MOUNTPOINT/proc"
mount --rbind /sys "$MOUNTPOINT/sys"
mount --make-rslave "$MOUNTPOINT/sys"
mount --rbind /dev "$MOUNTPOINT/dev"
mount --make-rslave "$MOUNTPOINT/dev"
mount --bind /run "$MOUNTPOINT/run" 2>/dev/null || true

cp -L /etc/resolv.conf "$MOUNTPOINT/etc/resolv.conf"

echo "[+] SEED PLANTED. Enter the new reality:"
echo "    chroot $MOUNTPOINT /bin/bash"
echo "    source /etc/profile"
echo "    export PS1=\"(hive-chroot) \${PS1}\""
echo ""
echo "Then run Phase 2 from docs/PHASE2_CHROOT.md"
