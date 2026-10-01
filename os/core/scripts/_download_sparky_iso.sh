#!/bin/bash
# Download complete Sparky 8.3 minimal CLI ISO (previous cache was truncated ~98MB)
set -euo pipefail

HIVE="${HIVE_SRC:-/mnt/c/Users/ARCHITECT/THE_HIVE}"
WORK="${WORK:-${HOME}/sparky-hive-iso}"
NAME="sparkylinux-8.3-x86_64-minimalcli.iso"
mkdir -p "$WORK" "$HIVE/GENESIS/iso"

echo "=========================================="
echo "  DOWNLOAD COMPLETE SPARKY BASE ISO"
echo "=========================================="

# Remove truncated copies
for f in "$WORK/$NAME" "$HIVE/GENESIS/iso/$NAME"; do
  if [[ -f "$f" ]]; then
    sz=$(stat -c%s "$f" 2>/dev/null || echo 0)
    if [[ "$sz" -lt 500000000 ]]; then
      echo "[*] Removing truncated $f ($sz bytes)"
      rm -f "$f"
    fi
  fi
done

# If already good, keep
if [[ -f "$WORK/$NAME" ]] && [[ "$(stat -c%s "$WORK/$NAME")" -gt 500000000 ]]; then
  echo "[+] Already have complete ISO in WORK"
else
  URLS=(
    "https://sourceforge.net/projects/sparkylinux/files/cli/${NAME}/download"
    "https://downloads.sourceforge.net/project/sparkylinux/cli/${NAME}"
    "https://mirror.math.princeton.edu/pub/sparkylinux/cli/${NAME}"
    "https://archive.org/download/sparkylinux/${NAME}"
  )
  ok=0
  for u in "${URLS[@]}"; do
    echo "[*] Trying: $u"
    if curl -fL --retry 5 --retry-delay 3 --connect-timeout 40 \
        -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" \
        -o "$WORK/$NAME.part" "$u"; then
      sz=$(stat -c%s "$WORK/$NAME.part" 2>/dev/null || echo 0)
      echo "[*] downloaded size=$sz"
      if [[ "$sz" -gt 500000000 ]]; then
        mv -f "$WORK/$NAME.part" "$WORK/$NAME"
        ok=1
        break
      fi
      echo "[!] Too small — not a full ISO"
      file "$WORK/$NAME.part" 2>/dev/null || true
      head -c 120 "$WORK/$NAME.part" 2>/dev/null | tr -cd '[:print:]\n' || true
      echo
      rm -f "$WORK/$NAME.part"
    else
      echo "[!] curl failed for this URL"
      rm -f "$WORK/$NAME.part"
    fi
  done
  if [[ "$ok" != "1" ]]; then
    echo "[!] All downloads failed or truncated"
    exit 1
  fi
fi

cp -f "$WORK/$NAME" "$HIVE/GENESIS/iso/$NAME"
ls -lh "$WORK/$NAME" "$HIVE/GENESIS/iso/$NAME"

echo "[*] xorriso TOC (must show full session without size mismatch):"
xorriso -indev "$WORK/$NAME" -toc 2>&1 | head -50

# Hard fail if still truncated relative to TOC
toc_out=$(xorriso -indev "$WORK/$NAME" -toc 2>&1 || true)
if echo "$toc_out" | grep -qi "larger than readable"; then
  echo "[!] ISO still reports truncated readable size"
  exit 2
fi

echo "[+] Complete Sparky base ISO ready"
