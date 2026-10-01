#!/bin/bash
# HIVE-OS — Kernel Heartbeat Prep
# Run on Gentoo node after: emerge sys-kernel/gentoo-sources
# and after: cd /usr/src/linux && make defconfig (or copy base config)
#
# NOTE (truth): classic GRSecurity/PaX is not free upstream anymore.
# Prefer Gentoo hardened profile + available hardened-sources / PaX-like
# options present on your tree. Do not pretend commercial grsec is free.

set -euo pipefail

CFG="/usr/src/linux/.config"
if [[ ! -f "$CFG" ]]; then
  echo "[!] No $CFG — run make defconfig or copy a base config first."
  exit 1
fi

echo "[+] Patching kernel .config for HIVE hardened baseline..."

append_cfg() {
  local key="$1"
  local val="$2"
  if grep -qE "^#?\\s*${key}[= ]" "$CFG" 2>/dev/null; then
    sed -i "s|^#\\?\\s*${key}[= ].*|${key}=${val}|" "$CFG" || true
  fi
  if ! grep -qE "^${key}=" "$CFG"; then
    echo "${key}=${val}" >> "$CFG"
  fi
}

# Crypto / vault
append_cfg CONFIG_CRYPTO_AES y
append_cfg CONFIG_CRYPTO_AES_NI_INTEL y
append_cfg CONFIG_DM_CRYPT y
append_cfg CONFIG_BLK_DEV_DM y

# EFI stub (boot without GRUB when configured)
append_cfg CONFIG_EFI_STUB y

# Disable common phone-home vendor hooks where possible
append_cfg CONFIG_NET_VENDOR_GOOGLE n

# Modules: keep build flexible; enforce no-module post-boot via policy later
# append_cfg CONFIG_MODULES n   # optional: uncomment only if you know you need it

echo "[+] kernel_prep complete. Next: make menuconfig && make -j\$(nproc) && make modules_install install"
echo "[!] Review .config manually before compile. This script is a starting blade, not a finished sword."
