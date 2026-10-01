#!/bin/bash
# =============================================================================
# SPARKYLINUX → HIVE-OS KRACKERJACK BOOTABLE ISO
# Remasters official Sparky (Debian-based) with full Hive DNA.
# Prefer Sparky over Ubuntu. No API keys. Does not wipe disks.
#
# Works mostly as normal user (no sudo) via xorriso map + optional squash inject.
#
#   bash /mnt/c/Users/ARCHITECT/THE_HIVE/scripts/sparky_hive_bootable_iso.sh
# =============================================================================
set -euo pipefail

echo "=========================================="
echo "  SPARKY → HIVE-OS BOOTABLE ISO"
echo "  KRACKERJACK FIRST CONTACT"
echo "=========================================="

HIVE_SRC="${HIVE_SRC:-/mnt/c/Users/ARCHITECT/THE_HIVE}"
if [[ ! -d "$HIVE_SRC/NEURAL" ]]; then
  HIVE_SRC="${HOME}/THE_HIVE"
fi
[[ -d "$HIVE_SRC/NEURAL" ]] || { echo "[!] HIVE DNA missing at $HIVE_SRC"; exit 1; }

WORK="${WORK:-${HOME}/sparky-hive-iso}"
WIN_OUT="${WIN_OUT:-/mnt/c/Users/ARCHITECT/THE_HIVE/GENESIS/iso}"
# Sparky 8.3 minimal CLI — smallest official bootable base
SPARKY_NAME="${SPARKY_NAME:-sparkylinux-8.3-x86_64-minimalcli.iso}"
# Direct mirrors (tried in order)
URLS=(
  "https://archive.org/download/sparkylinux/${SPARKY_NAME}"
  "https://downloads.sourceforge.net/project/sparkylinux/cli/${SPARKY_NAME}"
  "https://sourceforge.net/projects/sparkylinux/files/cli/${SPARKY_NAME}/download"
)

mkdir -p "$WORK" "$WIN_OUT" "$WORK/extract" "$WORK/hive-payload" "$WORK/iso-add"
BASE_ISO="$WORK/$SPARKY_NAME"
OUT_ISO="${OUT_ISO:-$WORK/HIVE-OS-SPARKY-KRACKERJACK.iso}"
WIN_ISO="$WIN_OUT/HIVE-OS-SPARKY-KRACKERJACK.iso"

need() { command -v "$1" >/dev/null 2>&1 || { echo "[!] need $1"; exit 1; }; }
need xorriso
need curl
# rsync optional
HAS_RS=0; command -v rsync >/dev/null && HAS_RS=1
HAS_SQ=0; command -v unsquashfs >/dev/null && command -v mksquashfs >/dev/null && HAS_SQ=1

# ---------- download Sparky ----------
echo "[1/5] Sparky base ISO: $SPARKY_NAME"
if [[ -f "$BASE_ISO" && $(stat -c%s "$BASE_ISO" 2>/dev/null || stat -f%z "$BASE_ISO") -gt 100000000 ]]; then
  echo "[+] Using cached $BASE_ISO ($(du -h "$BASE_ISO" | awk '{print $1}'))"
else
  rm -f "$BASE_ISO"
  ok_dl=0
  for u in "${URLS[@]}"; do
    echo "[*] Trying $u"
    if curl -fL --retry 3 --retry-delay 2 --connect-timeout 30 -o "$BASE_ISO" "$u"; then
      sz=$(stat -c%s "$BASE_ISO" 2>/dev/null || echo 0)
      if [[ "$sz" -gt 100000000 ]]; then
        echo "[+] Downloaded $(du -h "$BASE_ISO" | awk '{print $1}')"
        ok_dl=1
        break
      fi
      echo "[!] Too small ($sz) — bad mirror"
      rm -f "$BASE_ISO"
    fi
  done
  [[ "$ok_dl" == "1" ]] || { echo "[!] All Sparky downloads failed"; exit 1; }
fi

# ---------- stage Hive payload (no secrets, no huge stage3) ----------
echo "[2/5] Staging Hive payload"
rm -rf "$WORK/hive-payload"
mkdir -p "$WORK/hive-payload"
if [[ "$HAS_RS" == "1" ]]; then
  rsync -a \
    --exclude '.git' --exclude '.env' --exclude '__pycache__' --exclude '*.pyc' \
    --exclude 'GENESIS/gentoo-sparc/*.tar.xz' --exclude 'GENESIS/iso/*.iso' \
    "$HIVE_SRC/" "$WORK/hive-payload/"
else
  cp -a "$HIVE_SRC/NEURAL" "$WORK/hive-payload/"
  cp -a "$HIVE_SRC/docs" "$WORK/hive-payload/" 2>/dev/null || true
  cp -a "$HIVE_SRC/HIVE_CORE" "$WORK/hive-payload/" 2>/dev/null || true
  cp -a "$HIVE_SRC/scripts" "$WORK/hive-payload/" 2>/dev/null || true
  mkdir -p "$WORK/hive-payload/GENESIS"
  cp -a "$HIVE_SRC/GENESIS/"*.json "$WORK/hive-payload/GENESIS/" 2>/dev/null || true
  cp -a "$HIVE_SRC/GENESIS/"*.md "$WORK/hive-payload/GENESIS/" 2>/dev/null || true
  cp -a "$HIVE_SRC/GENESIS/STATUS" "$WORK/hive-payload/GENESIS/" 2>/dev/null || true
  cp -a "$HIVE_SRC/README.md" "$WORK/hive-payload/" 2>/dev/null || true
fi
rm -f "$WORK/hive-payload/.env" 2>/dev/null || true

cat > "$WORK/hive-payload/LIVE_README.txt" <<'EOF'
HIVE-OS on SPARKYLINUX LIVE
===========================
Base: SparkyLinux (Debian family) — not Ubuntu.
First AI: KRACKERJACK  →  run:  krackerjack

Hive DNA lives at:
  /opt/hive          (if squash inject succeeded)
  /run/live/medium/hive   or  /lib/live/mount/medium/hive  (ISO root copy)
  /hive              (ISO root)

Zero API keys required. Self-upgradeable Hive brain on disk.

Gentoo bare-metal install still uses:
  /opt/hive/NEURAL/hive_install.sh + docs/HIVE_HANDBOOK/
EOF

# launcher scripts placed on ISO root and into payload
mkdir -p "$WORK/iso-add/hive" "$WORK/iso-add"
# copy payload to iso-add/hive
if [[ "$HAS_RS" == "1" ]]; then
  rsync -a "$WORK/hive-payload/" "$WORK/iso-add/hive/"
else
  cp -a "$WORK/hive-payload/." "$WORK/iso-add/hive/"
fi

cat > "$WORK/iso-add/krackerjack" <<'EOF'
#!/bin/bash
# Find Hive DNA on live medium or installed path
for root in /opt/hive /hive /run/live/medium/hive /lib/live/mount/medium/hive \
            /run/live/medium/HIVE /media/cdrom/hive /cdrom/hive; do
  if [[ -f "$root/NEURAL/krackerjack/first_contact.py" ]]; then
    export HIVE_ROOT="$root"
    export HIVE_BRAIN=local
    exec python3 "$root/NEURAL/krackerjack/first_contact.py" "$@"
  fi
done
echo "KRACKERJACK: Hive DNA not found. Look for /hive on the live medium."
ls -la /hive /opt/hive 2>/dev/null || true
exit 1
EOF
chmod +x "$WORK/iso-add/krackerjack"

cat > "$WORK/iso-add/HIVE-START.txt" <<'EOF'
============================================
  HIVE-OS / KRACKERJACK on SparkyLinux LIVE
============================================
1. Boot this ISO (UEFI or BIOS).
2. Log into Sparky live session.
3. Open a terminal and run:

     bash /hive/../krackerjack
   or:
     bash /run/live/medium/krackerjack
   or copy once:
     sudo cp -a /run/live/medium/hive /opt/hive
     sudo cp /run/live/medium/krackerjack /usr/local/bin/
     krackerjack

Zero API keys. Sparky base (Debian), not Ubuntu.
============================================
EOF

# profile snippet for squash inject
mkdir -p "$WORK/hive-payload/iso-hooks"
cat > "$WORK/hive-payload/iso-hooks/usr-local-bin-krackerjack" <<'EOF'
#!/bin/bash
export HIVE_ROOT=/opt/hive
export HIVE_BRAIN=local
exec python3 /opt/hive/NEURAL/krackerjack/first_contact.py "$@"
EOF
cat > "$WORK/hive-payload/iso-hooks/profile-hive.sh" <<'EOF'
if [[ $- == *i* ]] && [[ -z "${HIVE_FC_SHOWN:-}" ]]; then
  export HIVE_FC_SHOWN=1
  echo ">>> HIVE-OS / KRACKERJACK first contact — type: krackerjack"
fi
EOF

# ---------- optional: inject into squashfs for /opt/hive ----------
INJECT_SQUASH="${INJECT_SQUASH:-auto}"
SQUASH_DONE=0

if [[ "$INJECT_SQUASH" != "0" && "$HAS_SQ" == "1" ]]; then
  echo "[3/5] Attempting squashfs inject (native /opt/hive)..."
  rm -rf "$WORK/extract"
  mkdir -p "$WORK/extract"
  # Extract ISO filesystem
  xorriso -osirrox on -indev "$BASE_ISO" -extract / "$WORK/extract" 2>"$WORK/xorriso-extract.log" || {
    echo "[!] xorriso extract failed — see $WORK/xorriso-extract.log"
  }
  SQUASH_PATH=""
  for cand in \
    "$WORK/extract/live/filesystem.squashfs" \
    "$WORK/extract/casper/filesystem.squashfs" \
    "$WORK/extract/live/filesystem.sfs"; do
    [[ -f "$cand" ]] && SQUASH_PATH="$cand" && break
  done
  # find any squashfs
  if [[ -z "$SQUASH_PATH" ]]; then
    SQUASH_PATH=$(find "$WORK/extract" -name '*.squashfs' -o -name 'filesystem.sfs' 2>/dev/null | head -n1 || true)
  fi

  if [[ -n "$SQUASH_PATH" && -f "$SQUASH_PATH" ]]; then
    echo "[*] Squash: $SQUASH_PATH ($(du -h "$SQUASH_PATH" | awk '{print $1}'))"
    rm -rf "$WORK/squash-root"
    # unsquash as user; ignore device node failures
    unsquashfs -f -d "$WORK/squash-root" "$SQUASH_PATH" 2>"$WORK/unsquash.log" || true
    if [[ -d "$WORK/squash-root/bin" || -d "$WORK/squash-root/usr" ]]; then
      mkdir -p "$WORK/squash-root/opt/hive"
      if [[ "$HAS_RS" == "1" ]]; then
        rsync -a "$WORK/hive-payload/" "$WORK/squash-root/opt/hive/"
      else
        cp -a "$WORK/hive-payload/." "$WORK/squash-root/opt/hive/"
      fi
      mkdir -p "$WORK/squash-root/usr/local/bin" "$WORK/squash-root/etc/profile.d"
      cp "$WORK/hive-payload/iso-hooks/usr-local-bin-krackerjack" "$WORK/squash-root/usr/local/bin/krackerjack"
      chmod 755 "$WORK/squash-root/usr/local/bin/krackerjack"
      cp "$WORK/hive-payload/iso-hooks/profile-hive.sh" "$WORK/squash-root/etc/profile.d/hive-first-contact.sh"
      chmod 644 "$WORK/squash-root/etc/profile.d/hive-first-contact.sh"
      cat > "$WORK/squash-root/etc/motd" <<'MOTD'

*** HIVE-OS / KRACKERJACK on SparkyLinux ***
Type:  krackerjack
Hive:  /opt/hive
Zero API keys. Dual control. Never obsolete.

MOTD
      echo "[*] Rebuilding squashfs (slow, uses CPU)..."
      NEW_SQUASH="$WORK/filesystem.squashfs.new"
      # gzip is faster/less RAM than xz on small WSL
      mksquashfs "$WORK/squash-root" "$NEW_SQUASH" -comp gzip -noappend -e boot 2>"$WORK/mksquash.log" \
        || mksquashfs "$WORK/squash-root" "$NEW_SQUASH" -comp gzip -noappend 2>>"$WORK/mksquash.log"
      if [[ -f "$NEW_SQUASH" ]]; then
        cp -f "$NEW_SQUASH" "$SQUASH_PATH"
        # update size file if casper-style
        if [[ -f "$WORK/extract/casper/filesystem.size" ]]; then
          printf '%s' "$(du -sx --block-size=1 "$WORK/squash-root" | cut -f1)" > "$WORK/extract/casper/filesystem.size"
        fi
        SQUASH_DONE=1
        echo "[+] Squash inject OK — /opt/hive + krackerjack inside live root"
      else
        echo "[!] mksquashfs failed — ISO will still ship /hive on medium"
      fi
    else
      echo "[!] unsquashfs incomplete — shipping /hive on ISO root only"
    fi
  else
    echo "[!] No squashfs found in ISO — shipping /hive on ISO root only"
  fi
else
  echo "[3/5] Squash inject skipped (install squashfs-tools for /opt/hive in-root)"
  # still extract for rebuild? not needed if we use -map on original
fi

# ---------- rebuild bootable ISO ----------
echo "[4/5] Building bootable ISO (preserve Sparky boot)"

# Always map hive + launcher onto ISO; if we remastered extract tree, use that
if [[ "$SQUASH_DONE" == "1" && -d "$WORK/extract" ]]; then
  # copy iso-add files into extract root
  cp -a "$WORK/iso-add/hive" "$WORK/extract/hive"
  cp -a "$WORK/iso-add/krackerjack" "$WORK/extract/krackerjack"
  cp -a "$WORK/iso-add/HIVE-START.txt" "$WORK/extract/HIVE-START.txt"
  chmod +x "$WORK/extract/krackerjack"

  # Rebuild from modified tree, keep boot image from original
  rm -f "$OUT_ISO"
  # Method: xorriso from original as boot template + overwrite tree is hard;
  # use: growisofs-style — clone boot from original ISO
  xorriso -indev "$BASE_ISO" -outdev "$OUT_ISO" -boot_image any keep \
    -map "$WORK/extract/live" /live \
    -map "$WORK/iso-add/hive" /hive \
    -map "$WORK/iso-add/krackerjack" /krackerjack \
    -map "$WORK/iso-add/HIVE-START.txt" /HIVE-START.txt \
    -chmod 0755 /krackerjack -- \
    2>"$WORK/xorriso-build.log" || true

  # If map of live failed (path differs), full rebuild via grub-mkrescue-like extract approach
  if [[ ! -f "$OUT_ISO" || $(stat -c%s "$OUT_ISO" 2>/dev/null || echo 0) -lt 100000000 ]]; then
    echo "[*] Primary map rebuild incomplete — trying full extract rebuild"
    rm -f "$OUT_ISO"
    # Ensure hive on extract
    cp -a "$WORK/iso-add/hive" "$WORK/extract/hive" 2>/dev/null || true
    cp -a "$WORK/iso-add/krackerjack" "$WORK/extract/krackerjack" 2>/dev/null || true
    cp -a "$WORK/iso-add/HIVE-START.txt" "$WORK/extract/HIVE-START.txt" 2>/dev/null || true

    # Detect eltorito from original
    # Sparky uses isolinux + EFI
    ISOLINUX_BIN=""
    EFI_IMG=""
    [[ -f "$WORK/extract/isolinux/isolinux.bin" ]] && ISOLINUX_BIN="isolinux/isolinux.bin"
    [[ -f "$WORK/extract/boot/isolinux/isolinux.bin" ]] && ISOLINUX_BIN="boot/isolinux/isolinux.bin"
    for e in \
      "$WORK/extract/boot/grub/efi.img" \
      "$WORK/extract/EFI/boot/efiboot.img" \
      "$WORK/extract/boot/efiboot.img" \
      "$WORK/extract/efi.img"; do
      [[ -f "$e" ]] && EFI_IMG="$e" && break
    done
    # find efi img relative
    EFI_REL=""
    if [[ -n "$EFI_IMG" ]]; then
      EFI_REL="${EFI_IMG#$WORK/extract/}"
    fi

    XORRISO_ARGS=(
      -as mkisofs
      -r -J -joliet-long
      -V "HIVE_SPARKY"
      -o "$OUT_ISO"
    )
    if [[ -n "$ISOLINUX_BIN" ]]; then
      XORRISO_ARGS+=(
        -b "$ISOLINUX_BIN"
        -c isolinux/boot.cat
        -no-emul-boot -boot-load-size 4 -boot-info-table
        -isohybrid-mbr /usr/lib/ISOLINUX/isohdpfx.bin
      )
      # isohdpfx may be missing
      if [[ ! -f /usr/lib/ISOLINUX/isohdpfx.bin ]]; then
        # strip mbr hybrid if missing
        XORRISO_ARGS=()
        for a in -as mkisofs -r -J -joliet-long -V HIVE_SPARKY -o "$OUT_ISO" \
          -b "$ISOLINUX_BIN" -c isolinux/boot.cat -no-emul-boot -boot-load-size 4 -boot-info-table; do
          XORRISO_ARGS+=("$a")
        done
        # fix boot.cat path if isolinux under boot/
        if [[ "$ISOLINUX_BIN" == boot/* ]]; then
          XORRISO_ARGS=()
          XORRISO_ARGS+=(-as mkisofs -r -J -joliet-long -V HIVE_SPARKY -o "$OUT_ISO"
            -b "$ISOLINUX_BIN" -c boot/isolinux/boot.cat -no-emul-boot -boot-load-size 4 -boot-info-table)
        fi
      fi
    fi
    if [[ -n "$EFI_REL" ]]; then
      XORRISO_ARGS+=(-eltorito-alt-boot -e "$EFI_REL" -no-emul-boot -isohybrid-gpt-basdat)
    fi
    XORRISO_ARGS+=("$WORK/extract")
    echo "[*] xorriso ${XORRISO_ARGS[*]}"
    xorriso "${XORRISO_ARGS[@]}" 2>"$WORK/xorriso-full.log" || {
      echo "[!] Full rebuild failed — fallback: boot-preserve map only"
      rm -f "$OUT_ISO"
      xorriso -indev "$BASE_ISO" -outdev "$OUT_ISO" -boot_image any keep \
        -map "$WORK/iso-add/hive" /hive \
        -map "$WORK/iso-add/krackerjack" /krackerjack \
        -map "$WORK/iso-add/HIVE-START.txt" /HIVE-START.txt \
        -chmod 0755 /krackerjack --
    }
  fi
else
  # Fast path: keep original Sparky boot 100%, just add /hive
  echo "[*] Boot-preserve map (Sparky boot untouched + /hive payload)"
  rm -f "$OUT_ISO"
  xorriso -indev "$BASE_ISO" -outdev "$OUT_ISO" -boot_image any keep \
    -map "$WORK/iso-add/hive" /hive \
    -map "$WORK/iso-add/krackerjack" /krackerjack \
    -map "$WORK/iso-add/HIVE-START.txt" /HIVE-START.txt \
    -chmod 0755 /krackerjack --
fi

[[ -f "$OUT_ISO" ]] || { echo "[!] ISO not created"; exit 1; }
SZ=$(stat -c%s "$OUT_ISO" 2>/dev/null || echo 0)
[[ "$SZ" -gt 100000000 ]] || { echo "[!] ISO too small ($SZ)"; ls -la "$OUT_ISO"; exit 1; }

echo "[5/5] Publishing"
cp -f "$OUT_ISO" "$WIN_ISO" 2>/dev/null || cp -f "$OUT_ISO" "$WIN_OUT/" 2>/dev/null || true
if command -v sha256sum >/dev/null; then
  sha256sum "$OUT_ISO" | tee "$OUT_ISO.sha256"
  cp -f "$OUT_ISO.sha256" "$WIN_OUT/" 2>/dev/null || true
fi

# metadata
cat > "$HIVE_SRC/GENESIS/LIVE_ISO.json" <<EOF
{
  "name": "HIVE-OS-SPARKY-KRACKERJACK",
  "base": "SparkyLinux 8.3 minimalcli (Debian family)",
  "not_ubuntu": true,
  "path_wsl": "$OUT_ISO",
  "path_windows": "GENESIS/iso/HIVE-OS-SPARKY-KRACKERJACK.iso",
  "bytes": $SZ,
  "squash_injected": $SQUASH_DONE,
  "first_ai": "KRACKERJACK AI",
  "api_keys_required": false,
  "hive_on_iso": "/hive",
  "launcher": "/krackerjack",
  "built_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo
echo "=========================================="
echo "  BOOTABLE ISO READY"
echo "=========================================="
echo "  $OUT_ISO"
echo "  $(du -h "$OUT_ISO" | awk '{print $1}')"
echo "  Windows: $WIN_ISO"
echo "  Flash with balenaEtcher / Rufus / dd"
echo "  On boot: bash /hive path or /krackerjack"
echo "  squash inject: $SQUASH_DONE"
echo "=========================================="
