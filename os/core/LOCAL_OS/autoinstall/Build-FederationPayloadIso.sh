#!/usr/bin/env bash
# Rebuild HIVE federation payload ISO including LOCAL_OS + local AI policy.
# Run from WSL: bash /mnt/c/Users/ARCHITECT/THE_HIVE/LOCAL_OS/autoinstall/Build-FederationPayloadIso.sh
set -euo pipefail

STAGE=/mnt/d/HIVE_ISO_STAGE
OUT=/mnt/d/HIVE_BOOTLAB/HIVE-FEDERATION-BOOTLAB.iso
HIVE=/mnt/c/Users/ARCHITECT/THE_HIVE
BOOTLAB=/mnt/d/HIVE_BOOTLAB

echo "[*] Refresh stage from BOOTLAB (no node_modules)..."
mkdir -p "$STAGE"
rsync -a --delete \
  --exclude node_modules --exclude .git --exclude .expo \
  "$BOOTLAB/" "$STAGE/" || true

echo "[*] Inject LOCAL_OS + GENESIS slim + policy..."
mkdir -p "$STAGE/LOCAL_OS" "$STAGE/GENESIS" "$STAGE/DNA_NOTES"
rsync -a --exclude node_modules --exclude .git "$HIVE/LOCAL_OS/" "$STAGE/LOCAL_OS/"
rsync -a --exclude node_modules --exclude .git \
  --include '*/' \
  --include 'bin/***' --include 'manifests/***' --include 'gentoo-sparc/***' \
  --include '*.md' --include '*.json' --include '*.jsonl' --include '*.py' --include '*.html' --include '*.sh' --include '*.cmd' --include 'LICENSE' --include 'STATUS' \
  --exclude '*' \
  "$HIVE/GENESIS/" "$STAGE/GENESIS/" || cp -a "$HIVE/GENESIS/." "$STAGE/GENESIS/" 2>/dev/null || true

cat > "$STAGE/FEDERATION.json" <<'JSON'
{
  "name": "HIVE OS Federation",
  "ai_mode": "local_only",
  "first_boot_assistant": "LOCAL_OS/firstboot/krackerjack_local_assistant.py",
  "autoinstall_windows": "LOCAL_OS/autoinstall/Install-HiveLocal.ps1",
  "default_local_model": "phi3:mini",
  "cloud_forbidden": true
}
JSON

cat > "$STAGE/README_ISO.txt" <<'EOF'
HIVE OS FEDERATION PAYLOAD ISO — LOCAL AI FIRST
================================================
On Windows after copy:
  powershell -ExecutionPolicy Bypass -File LOCAL_OS\autoinstall\Install-HiveLocal.ps1 -PullModel
  OR double-click LOCAL_OS\autoinstall\Start-KrackerjackLocal.cmd

KRACKERJACK AI install assistant: http://127.0.0.1:8788/
All install brain traffic = local Ollama only.
EOF

echo "[*] xorriso build -> $OUT"
rm -f "$OUT"
xorriso -as mkisofs -R -J -joliet-long -V "HIVE_FEDERATION" -o "$OUT" "$STAGE"
ls -lh "$OUT"
echo "[+] ISO_OK"
