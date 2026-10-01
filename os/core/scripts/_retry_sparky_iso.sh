#!/bin/bash
# Retry Sparky → HIVE bootable ISO (no disk wipe)
set -euo pipefail

export HIVE_SRC="${HIVE_SRC:-/mnt/c/Users/ARCHITECT/THE_HIVE}"
export WORK="${WORK:-${HOME}/sparky-hive-iso}"
export WIN_OUT="${WIN_OUT:-$HIVE_SRC/GENESIS/iso}"
SPARKY_NAME="sparkylinux-8.3-x86_64-minimalcli.iso"
WIN_ISO="$HIVE_SRC/GENESIS/iso/$SPARKY_NAME"
BUILD_SCRIPT="$HIVE_SRC/scripts/sparky_hive_bootable_iso.sh"

echo "=========================================="
echo "  RETRY: SPARKY → HIVE BOOTABLE ISO"
echo "=========================================="
echo "HIVE_SRC=$HIVE_SRC"
echo "WORK=$WORK"

mkdir -p "$WORK" "$WIN_OUT"

# LF + executable
if [[ -f "$BUILD_SCRIPT" ]]; then
  sed -i 's/\r$//' "$BUILD_SCRIPT"
  chmod +x "$BUILD_SCRIPT"
fi

# Seed base ISO from Windows GENESIS if needed
if [[ -f "$WIN_ISO" ]]; then
  DEST="$WORK/$SPARKY_NAME"
  if [[ ! -f "$DEST" ]] || [[ "$(stat -c%s "$DEST" 2>/dev/null || echo 0)" -lt 100000000 ]]; then
    echo "[*] Seeding base ISO into WSL work..."
    cp -f "$WIN_ISO" "$DEST"
  fi
  ls -lh "$DEST"
else
  echo "[!] No Windows base ISO at $WIN_ISO — builder will try download"
fi

# Tools
echo "[*] tools: xorriso=$(command -v xorriso || echo MISSING) unsquashfs=$(command -v unsquashfs || echo MISSING)"
if ! command -v xorriso >/dev/null 2>&1; then
  echo "[*] Attempting apt install (passwordless sudo if available)..."
  sudo -n apt-get update -y || true
  sudo -n apt-get install -y xorriso squashfs-tools curl rsync || true
fi

if ! command -v xorriso >/dev/null 2>&1; then
  echo "[!] xorriso still missing."
  echo "    Open WSL Kali and run once:"
  echo "      sudo apt-get update && sudo apt-get install -y xorriso squashfs-tools curl rsync"
  exit 42
fi

# Prefer map-only if squash tools missing (still bootable)
if ! command -v unsquashfs >/dev/null 2>&1; then
  export INJECT_SQUASH=0
  echo "[*] unsquashfs missing — building boot-preserve ISO with /hive payload (INJECT_SQUASH=0)"
fi

bash "$BUILD_SCRIPT"
echo "[+] retry wrapper complete"
ls -lh "$WORK"/HIVE-OS-*.iso 2>/dev/null || true
ls -lh "$WIN_OUT"/HIVE-OS-*.iso 2>/dev/null || true
