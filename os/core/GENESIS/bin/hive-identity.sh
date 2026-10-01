#!/usr/bin/env bash
# HIVE OS  -  identity wizard (idempotent, can re-run)
# source of truth for identity fields; everything else reads from identity.json
set -u
HIVE_HOME="${HIVE_HOME:-$HOME/.hive}"
HIVE_IDENTITY="$HIVE_HOME/identity.json"
HIVE_ROLE_FILE="$HIVE_HOME/role"
HIVE_KEY_FILE="$HIVE_HOME/product_key"
mkdir -p "$HIVE_HOME"
GREEN=$'\033[32m'; YEL=$'\033[33m'; RED=$'\033[31m'; CYAN=$'\033[36m'; NC=$'\033[0m'

ask(){ local p="$1" d="${2:-}"; if [ -n "$d" ]; then printf "%s%s%s [%s]: " "$YEL" "$p" "$NC" "$d"; else printf "%s%s%s: " "$YEL" "$p" "$NC"; fi; read -r a; printf "%s" "${a:-$d}"; }
yesno(){ local p="$1" d="${2:-n}"; local a; while :; do printf "%s%s%s [y/n, default %s]: " "$YEL" "$p" "$NC" "$d"; read -r a; a="${a:-$d}"; case "$a" in y|Y) return 0;; n|N) return 1;; esac; done; }
gen_key(){
  local raw; raw="$( (uname -a; hostname 2>/dev/null; cat /etc/machine-id 2>/dev/null; head -c 64 /dev/urandom 2>/dev/null) | sha256sum 2>/dev/null | cut -c1-16 )"
  [ -z "$raw" ] && raw="$(printf '%s%s' "$(date +%s%N)" "$$" | sha256sum | cut -c1-16)"
  printf '%s' "$raw" | sed -E 's/(.{4})(.{4})(.{4})(.{4})/\1-\2-\3-\4/'
}

show(){
  echo "${CYAN}--- current identity ---${NC}"
  if [ -f "$HIVE_IDENTITY" ]; then
    cat "$HIVE_IDENTITY"
  else
    echo "(no identity yet)"
  fi
  echo "${CYAN}-----------------------${NC}"
}

re_enter(){
  echo "${GREEN}== Re-enter identity ==${NC}"
  USER_NAME="$(ask 'Handle / user name' 'KRACKERJACK')"
  echo "  1) Architect   2) Administrator   3) User"
  R="$(ask 'Role (1/2/3)' '1')"
  case "$R" in 1) ROLE="Architect";; 2) ROLE="Administrator";; 3) ROLE="User";; *) ROLE="User";; esac
  KEY="$(gen_key)"
  BASE="$(uname -s 2>/dev/null || echo unknown)"
  cat > "$HIVE_IDENTITY" <<JSON
{
  "user_name": "$USER_NAME",
  "role": "$ROLE",
  "product_key": "$KEY",
  "base": "$BASE",
  "rebuilt_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
JSON
  echo "$ROLE" > "$HIVE_ROLE_FILE"
  echo "$KEY"   > "$HIVE_KEY_FILE"
  echo "${GREEN}[+]${NC} identity refreshed"
  show
}

rotate_key(){
  KEY="$(gen_key)"
  if [ -f "$HIVE_IDENTITY" ] && command -v node >/dev/null 2>&1; then
    node -e 'const fs=require("fs");const p=process.argv[1];const j=JSON.parse(fs.readFileSync(p,"utf8"));j.product_key=process.argv[2];fs.writeFileSync(p,JSON.stringify(j,null,2));' "$HIVE_IDENTITY" "$KEY"
  else
    echo "$KEY" > "$HIVE_KEY_FILE"
  fi
  echo "${GREEN}[+]${NC} new key: $KEY"
}

case "${1:-}" in
  show) show ;;
  re|rebuild|reset) re_enter ;;
  rotate-key|rotate) rotate_key ;;
  *) echo "usage: hive-identity {show|re|rotate-key}"; exit 2 ;;
esac
