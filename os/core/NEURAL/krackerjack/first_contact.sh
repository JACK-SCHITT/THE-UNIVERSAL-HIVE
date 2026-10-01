#!/bin/bash
# KRACKERJACK AI — first contact on live HIVE-OS nodes (OpenRC local.d optional)
# Install: cp to /etc/local.d/krackerjack_first.start && chmod 700

set -euo pipefail

HIVE_ROOT="${HIVE_ROOT:-/opt/hive}"
SEED="${HIVE_SEED:-/root/HIVE_SEED}"
FC_PY=""

if [[ -f "$HIVE_ROOT/NEURAL/krackerjack/first_contact.py" ]]; then
  FC_PY="$HIVE_ROOT/NEURAL/krackerjack/first_contact.py"
elif [[ -f "$SEED/krackerjack/first_contact.py" ]]; then
  FC_PY="$SEED/krackerjack/first_contact.py"
fi

MOTD=/etc/motd.d/99-krackerjack 2>/dev/null || true
mkdir -p /etc/motd.d 2>/dev/null || true

cat > /etc/motd.d/99-krackerjack <<'EOF' 2>/dev/null || cat > /etc/motd <<'EOF'
============================================================
  HIVE-OS — KRACKERJACK AI is your first contact
  Dual control: YOU + loyal AI. Disks never auto-wipe.
  Run:  krackerjack   |   python3 .../first_contact.py
============================================================
EOF

if [[ -n "$FC_PY" ]]; then
  mkdir -p /usr/local/bin
  cat > /usr/local/bin/krackerjack <<EOF
#!/bin/bash
exec python3 "$FC_PY" "\$@"
EOF
  chmod 755 /usr/local/bin/krackerjack
  echo "[+] krackerjack CLI installed → $FC_PY"
else
  echo "[!] first_contact.py not found under $HIVE_ROOT or $SEED"
fi

echo "[*] KRACKERJACK first-contact hooks applied."
