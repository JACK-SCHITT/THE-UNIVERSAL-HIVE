#!/bin/bash
# Stage HIVE war room into WSL home and validate scripts
set -euo pipefail
SRC="${1:-/mnt/c/Users/ARCHITECT/THE_HIVE}"
DST="${HOME}/THE_HIVE"

echo "[*] Staging $SRC -> $DST"
rm -rf "$DST"
mkdir -p "$DST"
if command -v rsync >/dev/null 2>&1; then
  rsync -a --exclude '.git' --exclude '.env' --exclude '__pycache__' --exclude '*.pyc' "$SRC/" "$DST/"
else
  # cp without .git (Windows mounts often break git object perms)
  shopt -s dotglob nullglob
  for item in "$SRC"/*; do
    base="$(basename "$item")"
    [[ "$base" == ".git" ]] && continue
    [[ "$base" == ".env" ]] && continue
    cp -a "$item" "$DST"/
  done
  # hidden files except .git / .env
  for item in "$SRC"/.[!.]* "$SRC"/..?*; do
    [[ -e "$item" ]] || continue
    base="$(basename "$item")"
    [[ "$base" == ".git" ]] && continue
    [[ "$base" == ".env" ]] && continue
    cp -a "$item" "$DST"/
  done
fi

cd "$DST"
echo "[*] bash -n validation"
bash -n NEURAL/hive_install.sh
bash -n NEURAL/kernel/kernel_prep.sh
bash -n NEURAL/aegis/aegis_harden.start
echo "[+] shell scripts syntax OK"

if command -v python3 >/dev/null; then
  python3 NEURAL/brain/hive_link.py status || true
fi

echo "[+] WSL staging complete: $DST"
echo "[*] Next real step: Gentoo live USB + hive_install.sh on target disk"
