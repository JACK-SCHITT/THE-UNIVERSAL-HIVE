#!/usr/bin/env bash
# bin/hive-status  -  short status line
set -u
HIVE_CORE="${HIVE_CORE:-$HOME/.hive/core}"
if [ -z "$HIVE_CORE" ] || [ ! -d "$HIVE_CORE" ]; then
  HIVE_CORE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." 2>/dev/null && pwd)/core"
fi
HIVE_CORE_NODECMD="$HIVE_CORE"
case "$HIVE_CORE_NODECMD" in
  /c/*|/C/*) HIVE_CORE_NODECMD="C:${HIVE_CORE_NODECMD:2}" ;;
  /d/*|/D/*) HIVE_CORE_NODECMD="D:${HIVE_CORE_NODECMD:2}" ;;
esac
HIVE_CORE_NODECMD="$(echo "$HIVE_CORE_NODECMD" | tr '/' '\\')"
exec node "$HIVE_CORE_NODECMD/hive-init.js" status
