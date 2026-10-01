#!/bin/bash
# =============================================================================
# KRACKERJACK ONE-SHOT — WSL Kali → Standalone Bootable Hybrid ISO
# Architect: KRACKERJACK1134 | HIVE-OS war-room live medium (amd64)
#
# What you get:
#   - UEFI + BIOS hybrid ISO
#   - Minimal Debian live root (lean; survives ~4GB WSL RAM)
#   - Full HIVE DNA under /opt/hive (KRACKERJACK first contact, installers, handbook)
#   - Offline-sovereign AI path (no API keys)
#   - Safe: does NOT wipe host disks
#
# Run (from WSL Kali, as root):
#   sudo bash /mnt/c/Users/ARCHITECT/THE_HIVE/scripts/krackerjack_one_shot_iso.sh
#   # or after staging:
#   sudo bash ~/THE_HIVE/scripts/krackerjack_one_shot_iso.sh
#
# Output:
#   ~/hive-iso-work/HIVE-OS-KRACKERJACK-LIVE.iso
#   /mnt/c/Users/ARCHITECT/THE_HIVE/GENESIS/iso/HIVE-OS-KRACKERJACK-LIVE.iso  (if Windows mount ok)
# =============================================================================

set -euo pipefail

echo "=========================================="
echo "  KRACKERJACK ONE-SHOT STANDALONE ISO"
echo "  HIVE-OS Live Medium (amd64 hybrid)"
echo "=========================================="

# ---------- config ----------
HIVE_SRC_DEFAULT="/mnt/c/Users/ARCHITECT/THE_HIVE"
HIVE_SRC="${HIVE_SRC:-$HIVE_SRC_DEFAULT}"
if [[ ! -d "$HIVE_SRC/NEURAL" && -d "${HOME}/THE_HIVE/NEURAL" ]]; then
  HIVE_SRC="${HOME}/THE_HIVE"
fi

WORK="${WORK:-${HOME}/hive-iso-work}"
CHROOT="$WORK/chroot"
ISO_ROOT="$WORK/iso-root"
SQUASH="$ISO_ROOT/live/filesystem.squashfs"
OUT_ISO="${OUT_ISO:-$WORK/HIVE-OS-KRACKERJACK-LIVE.iso}"
WIN_OUT="${WIN_OUT:-/mnt/c/Users/ARCHITECT/THE_HIVE/GENESIS/iso}"
DISTRO="${DISTRO:-bookworm}"
MIRROR="${MIRROR:-http://deb.debian.org/debian}"
HOSTNAME_LIVE="${HOSTNAME_LIVE:-hive-live}"
SKIP_APT="${SKIP_APT:-0}"
SKIP_DEBOOTSTRAP="${SKIP_DEBOOTSTRAP:-0}"

export DEBIAN_FRONTEND=noninteractive

die() { echo "[!] $*" >&2; exit 1; }
ok()  { echo "[+] $*"; }
step(){ echo; echo "========== [$1] $2 =========="; }

# ---------- root check ----------
if [[ "${EUID}" -ne 0 ]]; then
  die "Run as root:  sudo bash $0
(WSL will prompt for your Kali password.)"
fi

# ---------- [1/8] tools ----------
step "1/8" "Installing build tools"
if [[ "$SKIP_APT" != "1" ]]; then
  apt-get update -y
  # full-upgrade is optional / slow — keep default lean unless FORCE_FULL_UPGRADE=1
  if [[ "${FORCE_FULL_UPGRADE:-0}" == "1" ]]; then
    apt-get full-upgrade -y
  fi
  apt-get install -y --no-install-recommends \
    debootstrap squashfs-tools xorriso grub-pc-bin grub-efi-amd64-bin \
    mtools dosfstools rsync curl ca-certificates xz-utils \
    isolinux syslinux-common \
    || apt-get install -y debootstrap squashfs-tools xorriso grub-efi-amd64-bin \
         mtools dosfstools rsync curl ca-certificates
  # live-build optional (we use lean debootstrap path)
  apt-get install -y live-build 2>/dev/null || true
else
  ok "SKIP_APT=1 — using installed packages"
fi

command -v debootstrap >/dev/null || die "debootstrap missing"
command -v mksquashfs  >/dev/null || die "squashfs-tools missing"
command -v xorriso     >/dev/null || die "xorriso missing"

# ---------- [2/8] work dirs ----------
step "2/8" "Work directories → $WORK"
mkdir -p "$WORK" "$ISO_ROOT/live" "$ISO_ROOT/boot/grub" "$WIN_OUT"
# clean previous iso-root binaries but keep downloads if any
rm -f "$OUT_ISO" "$SQUASH" 2>/dev/null || true

# ---------- [3/8] stage Hive DNA into build cache ----------
step "3/8" "Staging Hive DNA from $HIVE_SRC"
[[ -d "$HIVE_SRC/NEURAL" ]] || die "HIVE DNA not found at $HIVE_SRC (need NEURAL/)"
HIVE_STAGE="$WORK/hive-overlay"
rm -rf "$HIVE_STAGE"
mkdir -p "$HIVE_STAGE"
rsync -a --delete \
  --exclude '.git' \
  --exclude '.env' \
  --exclude '__pycache__' \
  --exclude '*.pyc' \
  --exclude 'GENESIS/gentoo-sparc/*.tar.xz' \
  "$HIVE_SRC/" "$HIVE_STAGE/" || {
    # rsync missing — fallback
    cp -a "$HIVE_SRC/NEURAL" "$HIVE_STAGE/"
    cp -a "$HIVE_SRC/docs" "$HIVE_STAGE/" 2>/dev/null || true
    cp -a "$HIVE_SRC/HIVE_CORE" "$HIVE_STAGE/" 2>/dev/null || true
    cp -a "$HIVE_SRC/scripts" "$HIVE_STAGE/" 2>/dev/null || true
    mkdir -p "$HIVE_STAGE/GENESIS"
    cp -a "$HIVE_SRC/GENESIS/"*.json "$HIVE_STAGE/GENESIS/" 2>/dev/null || true
    cp -a "$HIVE_SRC/GENESIS/"*.md "$HIVE_STAGE/GENESIS/" 2>/dev/null || true
    cp -a "$HIVE_SRC/GENESIS/"STATUS "$HIVE_STAGE/GENESIS/" 2>/dev/null || true
    cp -a "$HIVE_SRC/GENESIS/manifests" "$HIVE_STAGE/GENESIS/" 2>/dev/null || true
  }
# never bake secrets
rm -f "$HIVE_STAGE/.env" 2>/dev/null || true
# marke
cat > "$HIVE_STAGE/GENESIS/LIVE_ISO_BUILD.txt" <<EOF
HIVE-OS KRACKERJACK LIVE ISO
built: $(date -u +%Y-%m-%dT%H:%M:%SZ)
host:  $(hostname) / $(uname -r)
distro_seed: debian $DISTRO amd64
first_ai: KRACKERJACK AI
api_keys_required: false
EOF
ok "Hive staged (stage3 tarballs excluded from ISO to keep size sane — copy separately if needed)"

# ---------- [4/8] debootstrap ----------
step "4/8" "Debootstrap minimal $DISTRO (this takes a while)"
if [[ "$SKIP_DEBOOTSTRAP" == "1" && -d "$CHROOT/bin" ]]; then
  ok "SKIP_DEBOOTSTRAP=1 — reusing $CHROOT"
else
  rm -rf "$CHROOT"
  mkdir -p "$CHROOT"
  debootstrap --variant=minbase --arch=amd64 "$DISTRO" "$CHROOT" "$MIRROR"
fi

# ---------- [5/8] chroot customize ----------
step "5/8" "Customizing live root + KRACKERJACK first contact"

# fstab / hostname
echo "$HOSTNAME_LIVE" > "$CHROOT/etc/hostname"
cat > "$CHROOT/etc/hosts" <<EOF
127.0.0.1   localhost
10.20.0.5   $HOSTNAME_LIVE
::1         localhost ip6-localhost ip6-loopback
EOF

# sources
cat > "$CHROOT/etc/apt/sources.list" <<EOF
deb $MIRROR $DISTRO main contrib non-free non-free-firmware
deb $MIRROR $DISTRO-updates main contrib non-free non-free-firmware
deb http://security.debian.org/debian-security $DISTRO-security main contrib non-free non-free-firmware
EOF

# mount for chroot ops
mount --bind /dev  "$CHROOT/dev"
mount --bind /dev/pts "$CHROOT/dev/pts"
mount --bind /proc "$CHROOT/proc"
mount --bind /sys  "$CHROOT/sys"
mount --bind /run  "$CHROOT/run"
cp -L /etc/resolv.conf "$CHROOT/etc/resolv.conf" 2>/dev/null || true

cleanup_mounts() {
  umount -lf "$CHROOT/dev/pts" 2>/dev/null || true
  umount -lf "$CHROOT/dev" 2>/dev/null || true
  umount -lf "$CHROOT/proc" 2>/dev/null || true
  umount -lf "$CHROOT/sys" 2>/dev/null || true
  umount -lf "$CHROOT/run" 2>/dev/null || true
}
trap cleanup_mounts EXIT

chroot "$CHROOT" /bin/bash -c "
set -e
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y --no-install-recommends \
  linux-image-amd64 live-boot systemd-sysv \
  grub-common \
  network-manager iproute2 iputils-ping isc-dhcp-client \
  sudo less nano vim-tiny \
  python3 python3-minimal \
  git curl ca-certificates \
  gdisk parted fdisk dosfstools e2fsprogs cryptsetup \
  rsync openssh-client \
  locales
# locales quiet
sed -i 's/^# *en_US.UTF-8/en_US.UTF-8/' /etc/locale.gen 2>/dev/null || true
locale-gen en_US.UTF-8 2>/dev/null || true
# live user: architect (password: hive — CHANGE ON FIRST BOOT)
if ! id architect >/dev/null 2>&1; then
  useradd -m -s /bin/bash -G sudo,audio,video,plugdev architect
fi
echo 'architect:hive' | chpasswd
echo 'root:hive' | chpasswd
# passwordless sudo for live convenience (live medium only)
echo 'architect ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/architect
chmod 440 /etc/sudoers.d/architect
# autologin getty on tty1
mkdir -p /etc/systemd/system/getty@tty1.service.d
cat > /etc/systemd/system/getty@tty1.service.d/autologin.conf <<'AEOF'
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin architect --noclear %I \$TERM
AEOF
# motd
cat > /etc/motd <<'MEOF'

╔══════════════════════════════════════════════════════════════╗
║  HIVE-OS LIVE — KRACKERJACK AI FIRST CONTACT                 ║
║  Architect: KRACKERJACK1134                                  ║
║  Dual control · Zero API keys · Never obsolete               ║
║                                                              ║
║  Run:  krackerjack                                           ║
║        krackerjack status                                    ║
║        krackerjack handbook                                  ║
║        sudo bash /opt/hive/NEURAL/hive_install.sh  (target)  ║
║                                                              ║
║  Live passwords default to: hive  — CHANGE THEM              ║
╚══════════════════════════════════════════════════════════════╝

MEOF
# clean apt cache to shrink squash
apt-get clean
rm -rf /var/lib/apt/lists/*
"

# inject Hive DNA
ok "Injecting /opt/hive"
mkdir -p "$CHROOT/opt/hive"
rsync -a "$HIVE_STAGE/" "$CHROOT/opt/hive/" || cp -a "$HIVE_STAGE/." "$CHROOT/opt/hive/"

# krackerjack launche
cat > "$CHROOT/usr/local/bin/krackerjack" <<'EOF'
#!/bin/bash
export HIVE_ROOT=/opt/hive
export HIVE_BRAIN=local
export OLLAMA_HOST="${OLLAMA_HOST:-http://127.0.0.1:11434}"
FC=/opt/hive/NEURAL/krackerjack/first_contact.py
HL=/opt/hive/NEURAL/brain/hive_link.py
if [[ -f "$FC" ]]; then
  exec python3 "$FC" "$@"
elif [[ -f "$HL" ]]; then
  exec python3 "$HL" "$@"
else
  echo "KRACKERJACK DNA missing under /opt/hive"
  exit 1
fi
EOF
chmod 755 "$CHROOT/usr/local/bin/krackerjack"

# profile hook
cat > "$CHROOT/etc/profile.d/hive-first-contact.sh" <<'EOF'
# KRACKERJACK first contact banner (interactive shells)
if [[ $- == *i* ]] && [[ -z "${HIVE_FC_SHOWN:-}" ]]; then
  export HIVE_FC_SHOWN=1
  export HIVE_ROOT=/opt/hive
  export HIVE_BRAIN=local
  echo
  echo ">>> KRACKERJACK AI is your first contact on this live medium."
  echo ">>> Type:  krackerjack     or     krackerjack status"
  echo
fi
EOF
chmod 644 "$CHROOT/etc/profile.d/hive-first-contact.sh"

# live-boot marke
touch "$CHROOT/etc/live-boot" 2>/dev/null || true
mkdir -p "$CHROOT/etc/live"

# first-boot note
cat > "$CHROOT/opt/hive/LIVE_README.txt" <<'EOF'
HIVE-OS KRACKERJACK LIVE MEDIUM
================================
This is a RESCUE / FORGE ISO — not a full installed Gentoo root.

1. Boot this ISO on target hardware (UEFI or BIOS).
2. Network up:  sudo dhclient -v   OR   nmtui
3. Talk to first AI:  krackerjack
4. Copy GENESIS stage3 onto the box if installing Gentoo Hive.
5. Install: follow /opt/hive/docs/GENTOO_STAGING_WALK.md
            and /opt/hive/docs/HIVE_HANDBOOK/
6. NEVER auto-wipe: hive_install.sh requires typed YES.

Sovereign: zero API keys required for KRACKERJACK cognition.
EOF

cleanup_mounts
trap - EXIT

# ---------- [6/8] squashfs ----------
step "6/8" "Compressing filesystem.squashfs (CPU heavy)"
# drop caches hint
sync
mksquashfs "$CHROOT" "$SQUASH" -comp xz -e boot || \
  mksquashfs "$CHROOT" "$SQUASH" -comp gzip -e boot
ok "squashfs: $(du -h "$SQUASH" | awk '{print $1}')"

# kernel + initrd into ISO
step "6b" "Copying kernel + initrd"
KVER=$(ls "$CHROOT/boot/vmlinuz-"* 2>/dev/null | head -n1 | sed 's/.*vmlinuz-//')
[[ -n "$KVER" ]] || die "No kernel in chroot /boot — linux-image-amd64 install failed?"
cp -a "$CHROOT/boot/vmlinuz-$KVER" "$ISO_ROOT/live/vmlinuz"
# initrd name varies
if [[ -f "$CHROOT/boot/initrd.img-$KVER" ]]; then
  cp -a "$CHROOT/boot/initrd.img-$KVER" "$ISO_ROOT/live/initrd.img"
elif [[ -f "$CHROOT/boot/initramfs-$KVER.img" ]]; then
  cp -a "$CHROOT/boot/initramfs-$KVER.img" "$ISO_ROOT/live/initrd.img"
else
  die "No initrd for kernel $KVER"
fi
ok "kernel $KVER"

# ---------- [7/8] GRUB hybrid boot ----------
step "7/8" "GRUB configs (BIOS + UEFI)"
cat > "$ISO_ROOT/boot/grub/grub.cfg" <<'EOF'
set timeout=8
set default=0

menuentry "HIVE-OS KRACKERJACK LIVE (amd64)" {
    linux /live/vmlinuz boot=live components quiet splash username=architect
    initrd /live/initrd.img
}

menuentry "HIVE-OS KRACKERJACK LIVE (verbose)" {
    linux /live/vmlinuz boot=live components username=architect
    initrd /live/initrd.img
}

menuentry "HIVE-OS KRACKERJACK LIVE (failsafe)" {
    linux /live/vmlinuz boot=live components memtest noapic noapm nodma nomce nosmp username=architect
    initrd /live/initrd.img
}
EOF

# create ISO with xorriso + grub embedding
step "7b" "Building hybrid ISO with xorriso"
# Use grub-mkrescue if available (simpler UEFI+BIOS), else xorriso manual
if command -v grub-mkrescue >/dev/null 2>&1; then
  # stage tree for grub-mkrescue
  grub-mkrescue -o "$OUT_ISO" "$ISO_ROOT" \
    --compress=xz \
    -V "HIVE_OS_KJ" \
    2>/tmp/grub-mkrescue.log || {
      ok "grub-mkrescue failed — falling back to xorriso (see /tmp/grub-mkrescue.log)"
      xorriso -as mkisofs \
        -r -V "HIVE_OS_KJ" \
        -o "$OUT_ISO" \
        -J -joliet-long \
        -b boot/grub/i386-pc/eltorito.img \
        -no-emul-boot -boot-load-size 4 -boot-info-table \
        "$ISO_ROOT" || {
          # last resort: data ISO with live layout (may need manual boot setup)
          xorriso -as mkisofs -r -V "HIVE_OS_KJ" -J -joliet-long -o "$OUT_ISO" "$ISO_ROOT"
        }
    }
else
  # Install grub-common tools into iso via chroot modules if present on host
  apt-get install -y grub-common grub-pc-bin grub-efi-amd64-bin mtools 2>/dev/null || true
  if command -v grub-mkrescue >/dev/null 2>&1; then
    grub-mkrescue -o "$OUT_ISO" "$ISO_ROOT" -V "HIVE_OS_KJ"
  else
    xorriso -as mkisofs -r -V "HIVE_OS_KJ" -J -joliet-long -o "$OUT_ISO" "$ISO_ROOT"
    echo "[!] Built data ISO without full El Torito — install grub-mkrescue and re-run for hybrid boot"
  fi
fi

[[ -f "$OUT_ISO" ]] || die "ISO was not created"
ok "ISO: $OUT_ISO ($(du -h "$OUT_ISO" | awk '{print $1}'))"

# ---------- [8/8] publish to Windows GENESIS ----------
step "8/8" "Publishing to Windows GENESIS/iso"
mkdir -p "$WIN_OUT"
cp -f "$OUT_ISO" "$WIN_OUT/HIVE-OS-KRACKERJACK-LIVE.iso" 2>/dev/null && \
  ok "Copied → $WIN_OUT/HIVE-OS-KRACKERJACK-LIVE.iso" || \
  echo "[*] Could not copy to Windows mount — ISO still at $OUT_ISO"

# checksum
if command -v sha256sum >/dev/null; then
  sha256sum "$OUT_ISO" | tee "$OUT_ISO.sha256"
  cp -f "$OUT_ISO.sha256" "$WIN_OUT/" 2>/dev/null || true
fi

# record in GENESIS
if [[ -d "$HIVE_SRC/GENESIS" ]]; then
  cat > "$HIVE_SRC/GENESIS/LIVE_ISO.json" <<EOF
{
  "name": "HIVE-OS-KRACKERJACK-LIVE",
  "path_wsl": "$OUT_ISO",
  "path_windows": "GENESIS/iso/HIVE-OS-KRACKERJACK-LIVE.iso",
  "arch": "amd64",
  "base": "debian-$DISTRO",
  "first_ai": "KRACKERJACK AI",
  "api_keys_required": false,
  "built_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "default_user": "architect",
  "default_password": "hive",
  "note": "Change live passwords on first boot. Stage3 not embedded."
}
EOF
fi

echo
echo "=========================================="
echo "  DONE — STANDALONE ISO READY"
echo "=========================================="
echo "  ISO:  $OUT_ISO"
echo "  Flash: use balenaEtcher / Rufus / dd"
echo "  Boot → login architect / hive"
echo "  First AI: krackerjack"
echo "  Install path: /opt/hive/docs/GENTOO_STAGING_WALK.md"
echo "=========================================="
echo "  Next (optional): re-run with FORCE_FULL_UPGRADE=1 for host updates"
echo "  Next (optional): copy GENESIS stage3 onto USB alongside ISO for bare-metal Gentoo seed"
echo "=========================================="
