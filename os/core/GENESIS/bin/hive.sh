#!/usr/bin/env bash
# bin/hive  -  HIVE OS unified CLI
#   hive status
#   hive ask "make my system secure"
#   hive teach list|eyes|random|say <key>
#   hive zorg scan [target]
#   hive claude research "..."|verify "..."|init
#   hive identity show|re|rotate
#   hive package list|resolve p1,p2|install p1,p2 --dry
#   hive refinery run [urls...]|verify|chain|patch --name --version
#   hive simplify "natural language request"
#   hive version
set -u
HIVE_HOME="${HIVE_HOME:-$HOME/.hive}"
HIVE_CORE="${HIVE_CORE:-$HIVE_HOME/core}"
# auto-detect when shim is colocated with the install (HIVE_HOME/bin/hive)
if [ ! -d "$HIVE_CORE" ]; then
  _guess="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." 2>/dev/null && pwd)"
  if [ -d "$_guess/core" ]; then HIVE_HOME="$_guess"; HIVE_CORE="$_guess/core"; fi
fi
if [ ! -d "$HIVE_CORE" ]; then
  _walk="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)"
  while [ "$_walk" != "/" ] && [ ! -f "$_walk/identity.json" ]; do _walk="$(dirname "$_walk")"; done
  if [ -f "$_walk/identity.json" ]; then HIVE_HOME="$_walk"; HIVE_CORE="$_walk/core"; fi
fi
export HIVE_HOME HIVE_CORE
CYAN=$'\033[36m'; YEL=$'\033[33m'; GRN=$'\033[32m'; RED=$'\033[31m'; NC=$'\033[0m'
log(){ printf "%s[hive]%s %s\n" "$CYAN" "$NC" "$*"; }
err(){ printf "%s[hive]%s %s\n" "$RED" "$NC" "$*" >&2; }
die(){ err "$*"; exit 1; }

if [ ! -d "$HIVE_CORE" ]; then die "HIVE core not found at $HIVE_CORE. Run the installer first."; fi
# Convert POSIX path to Windows path for node (msys /c/Users/x -> C:\Users\x)
HIVE_CORE_NODECMD="$HIVE_CORE"
case "$HIVE_CORE_NODECMD" in
  /c/*|/C/*) HIVE_CORE_NODECMD="C:${HIVE_CORE_NODECMD:2}" ;;
  /d/*|/D/*) HIVE_CORE_NODECMD="D:${HIVE_CORE_NODECMD:2}" ;;
esac
HIVE_CORE_NODECMD="$(echo "$HIVE_CORE_NODECMD" | tr '/' '\\')"

cmd="${1:-}"; shift || true
case "$cmd" in
  version|--version|-v)
    node "$HIVE_CORE_NODECMD/identity.js" show ;;
  status)
    node "$HIVE_CORE_NODECMD/hive-init.js" status ;;
  boot)
    node "$HIVE_CORE_NODECMD/hive-init.js" boot ;;
  ask|simplify|simplify-exec)
    text="${*:-}"
    if [ "$cmd" = "ask" ] || [ "$cmd" = "simplify-exec" ]; then
      node "$HIVE_CORE_NODECMD/simplification-engine.js" --execute "$text"
    else
      node "$HIVE_CORE_NODECMD/simplification-engine.js" --plan "$text"
    fi ;;
  teach)
    sub="${1:-list}"; shift || true
    case "$sub" in
      list)   node "$HIVE_CORE_NODECMD/teaching-module.js" list ;;
      say)    node "$HIVE_CORE_NODECMD/teaching-module.js" say "$@" ;;
      random) node "$HIVE_CORE_NODECMD/teaching-module.js" random ;;
      eyes)   node "$HIVE_CORE_NODECMD/teaching-module.js" eyes ;;
      *) err "hive teach: unknown subcommand $sub"; exit 2 ;;
    esac ;;
  zorg)
    sub="${1:-scan}"; shift || true
    case "$sub" in
      scan)  target="${1:-127.0.0.1}"; type="${2:-full}"; node "$HIVE_CORE_NODECMD/zorg-core.js" scan "$target" "$type" ;;
      *) err "hive zorg: unknown subcommand $sub"; exit 2 ;;
    esac ;;
  claude)
    sub="${1:-init}"; shift || true
    case "$sub" in
      init|promise|research|verify) node "$HIVE_CORE_NODECMD/claude-subagent.js" "$sub" "$@" ;;
      *) err "hive claude: unknown subcommand $sub"; exit 2 ;;
    esac ;;
  identity)
    node "$HIVE_CORE_NODECMD/identity.js" show ;;
  package|pm)
    sub="${1:-list}"; shift || true
    case "$sub" in
      list)    node "$HIVE_CORE_NODECMD/package-manager.js" --list ;;
      resolve) node "$HIVE_CORE_NODECMD/package-manager.js" --resolve "$@" ;;
      install) node "$HIVE_CORE_NODECMD/package-manager.js" --install "$@" ;;
      *) err "hive package: unknown subcommand $sub"; exit 2 ;;
    esac ;;
  refinery)
    sub="${1:-run}"; shift || true
    case "$sub" in
      run)    node "$HIVE_CORE_NODECMD/refinery.js" run "$@" ;;
      verify) node "$HIVE_CORE_NODECMD/refinery.js" verify ;;
      chain)  node "$HIVE_CORE_NODECMD/refinery.js" chain ;;
      patch)  node "$HIVE_CORE_NODECMD/refinery.js" patch "$@" ;;
      *) err "hive refinery: unknown subcommand $sub"; exit 2 ;;
    esac ;;
  role)
    sub="${1:-list}"; shift || true
    case "$sub" in
      list)  node "$HIVE_CORE_NODECMD/role-engine.js" list ;;
      who)   node "$HIVE_CORE_NODECMD/role-engine.js" who ;;
      check) node "$HIVE_CORE_NODECMD/role-engine.js" check "$@" ;;
      *) err "hive role: unknown subcommand $sub"; exit 2 ;;
    esac ;;
  help|--help|-h|"")
    cat <<HELP
hive v7  -  KRACKERJACK HIVE OS CLI
  hive status                          Brain / role / identity / refinery
  hive ask "make my system secure"     Natural-language plan + execution
  hive teach list|eyes|random|say K    Architect's Eyes teaching module
  hive zorg scan [target] [type]       ZORG-Ω security scan
  hive claude init|promise|research Q  Claude sub-agent
  hive identity show                   Identity banner
  hive role list|who|check A [who]     RBAC engine
  hive package list|resolve|i p,p,p    Package manager
  hive refinery run|verify|chain|patch Self-evolution Refinery
  hive version                         Print version
  hive help                            This help
HELP
    ;;
  *) err "unknown subcommand: $cmd (try 'hive help')"; exit 2 ;;
esac
