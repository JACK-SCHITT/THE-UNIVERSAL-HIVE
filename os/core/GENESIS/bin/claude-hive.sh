#!/usr/bin/env bash
# bin/claude-hive  -  Claude sub-agent CLI
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
sub="${1:-init}"; shift || true
case "$sub" in
  init|promise|research|verify) exec node "$HIVE_CORE_NODECMD/claude-subagent.js" "$sub" "$@" ;;
  *) echo "usage: claude-hive [init|promise|research Q|verify claim]" >&2; exit 2 ;;
esac
