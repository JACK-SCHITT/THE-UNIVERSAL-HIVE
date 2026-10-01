#!/bin/bash
# Assimilate Gentoo SPARC into HIVE-OS (Linux/WSL/live)
set -euo pipefail

HIVE_ROOT="${HIVE_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
STAGE_DIR="$HIVE_ROOT/GENESIS/gentoo-sparc"
MANIFEST_DIR="$HIVE_ROOT/GENESIS/manifests"
HANDBOOK="$HIVE_ROOT/docs/handbook/gentoo-sparc"
HIVE_HB="$HIVE_ROOT/docs/HIVE_HANDBOOK"
KNOWLEDGE="$HIVE_ROOT/NEURAL/krackerjack/knowledge"
CORE="$HIVE_ROOT/HIVE_CORE/manifest.json"

echo "=========================================="
echo "  HIVE ASSIMILATION — GENTOO SPARC"
echo "  Root: $HIVE_ROOT"
echo "=========================================="

mkdir -p "$STAGE_DIR" "$MANIFEST_DIR" "$KNOWLEDGE"

STAGE=$(ls -1 "$STAGE_DIR"/stage3-*.tar.xz 2>/dev/null | head -n1 || true)
if [[ -z "${STAGE}" ]]; then
  echo "[!] No stage3 in $STAGE_DIR"
  exit 1
fi
STAGE_NAME=$(basename "$STAGE")
BYTES=$(wc -c < "$STAGE" | tr -d ' ')
echo "[+] Stage3: $STAGE_NAME ($BYTES bytes)"

HB_COUNT=0
[[ -d "$HANDBOOK" ]] && HB_COUNT=$(find "$HANDBOOK" -name '*.md' | wc -l | tr -d ' ')
HIVE_HB_COUNT=0
[[ -d "$HIVE_HB" ]] && HIVE_HB_COUNT=$(find "$HIVE_HB" -name '*.md' | wc -l | tr -d ' ')

SHA=""
if command -v sha512sum >/dev/null 2>&1; then
  SHA=$(sha512sum "$STAGE" | awk '{print $1}')
fi

cat > "$HIVE_ROOT/GENESIS/ASSIMILATED.json" <<EOF
{
  "status": "ASSIMILATED",
  "protocol": "ASSIMILATE OR DIE",
  "arch": "sparc64",
  "init": "openrc",
  "stage3": "$STAGE_NAME",
  "stage3_path": "$STAGE",
  "stage3_bytes": $BYTES,
  "stage3_sha512": "$SHA",
  "handbook_chapters": $HB_COUNT,
  "hive_handbook": $HIVE_HB_COUNT,
  "first_ai": "KRACKERJACK AI",
  "assimilated_at": "$(date -Iseconds)",
  "architect": "KRACKERJACK1134",
  "source": "https://distfiles.gentoo.org/releases/sparc/autobuilds/"
}
EOF
echo ASSIMILATED > "$HIVE_ROOT/GENESIS/STATUS"
echo "$STAGE_NAME" > "$STAGE_DIR/CURRENT_STAGE3.txt"

# digest for KRACKERJACK
{
  echo "# KRACKERJACK Handbook Digest"
  echo
  echo "Stage3: $STAGE_NAME"
  echo "Status: ASSIMILATED"
  echo
  echo "## Hive chapters"
  if [[ -d "$HIVE_HB" ]]; then
    for f in "$HIVE_HB"/*.md; do
      echo "### $(basename "$f")"
      head -n 40 "$f"
      echo
    done
  fi
  echo "## Gentoo index"
  [[ -f "$HANDBOOK/00_INDEX.md" ]] && cat "$HANDBOOK/00_INDEX.md"
} > "$KNOWLEDGE/HANDBOOK_DIGEST.md"

echo "[+] ASSIMILATION COMPLETE → GENESIS/ASSIMILATED.json"
echo "    krackerjack: python3 $HIVE_ROOT/NEURAL/krackerjack/first_contact.py status"
