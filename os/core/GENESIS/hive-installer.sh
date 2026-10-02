#!/usr/bin/env bash
# ============================================================================
#  KRACKERJACK HIVE OS  -  FULLEST POTENTIAL EDITION  v7.0
#  Installer bootstrap  (Termux | Gentoo | Kali | Linux generic | WSL/Git-Bash)
#  Architect: KRACKERJACK1134
#  Prime Directive: Do right because it is right. No compromises. No excuses.
# ============================================================================
set -u
# ---- strict-but-forgiving: never abort the whole install on a single warn --
HIVE_VERSION="7.0.0"
HIVE_CODENAME="FULLEST-POTENTIAL"
HIVE_ARCHITECT="KRACKERJACK1134"

# --- paths ------------------------------------------------------------------
HIVE_HOME="${HIVE_HOME:-$HOME/.hive}"
HIVE_SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# HIVE_CORE source can live next to the installer OR one level up (legacy layout)
if [ -d "$HIVE_SRC/HIVE_CORE" ]; then
  HIVE_CORE_SRC="$HIVE_SRC/HIVE_CORE"
elif [ -d "$HIVE_SRC/../HIVE_CORE" ]; then
  HIVE_CORE_SRC="$(cd "$HIVE_SRC/../HIVE_CORE" && pwd)"
else
  HIVE_CORE_SRC="$HIVE_SRC/HIVE_CORE"
fi
# shim source dir
HIVE_BIN_SRC="$HIVE_SRC/bin"
[ -d "$HIVE_BIN_SRC" ] || HIVE_BIN_SRC="$HIVE_SRC"
HIVE_CORE="$HIVE_HOME/core"
HIVE_BIN="$HIVE_HOME/bin"
HIVE_LOG="$HIVE_HOME/logs/install.log"
HIVE_IDENTITY="$HIVE_HOME/identity.json"
HIVE_ROLE_FILE="$HIVE_HOME/role"
HIVE_PACKAGES_FILE="$HIVE_HOME/packages.json"
HIVE_TEACH_FILE="$HIVE_HOME/teachings.json"

mkdir -p "$HIVE_HOME" "$HIVE_CORE" "$HIVE_BIN" "$(dirname "$HIVE_LOG")"

# --- pretty output ----------------------------------------------------------
if [ -t 1 ]; then
  G=$'\033[32m'; Y=$'\033[33m'; R=$'\033[31m'; B=$'\033[36m'; M=$'\033[35m'; X=$'\033[0m'; BLD=$'\033[1m'
else
  G=""; Y=""; R=""; B=""; M=""; X=""; BLD=""
fi
log()   { printf "%s[%s]%s %s\n" "$B" "$(date +%H:%M:%S)" "$X" "$*" | tee -a "$HIVE_LOG" ; }
ok()    { printf "%s  [+]%s %s\n" "$G" "$X" "$*" | tee -a "$HIVE_LOG" ; }
warn()  { printf "%s  [!]%s %s\n" "$Y" "$X" "$*" | tee -a "$HIVE_LOG" ; }
err()   { printf "%s  [X]%s %s\n" "$R" "$X" "$*" | tee -a "$HIVE_LOG" ; }
hdr()   { printf "\n%s%s=== %s ===%s\n" "$BLD" "$M" "$*" "$X" | tee -a "$HIVE_LOG" ; }
ask()   { local p="$1"; local d="${2:-}"; local a; if [ -n "$d" ]; then printf "%s%s%s [%s]: " "$Y" "$p" "$X" "$d"; else printf "%s%s%s: " "$Y" "$p" "$X"; fi; read -r a; printf "%s" "${a:-$d}"; }
yesno() { local p="$1"; local d="${2:-n}"; local a; while :; do printf "%s%s%s [y/n, default %s]: " "$Y" "$p" "$X" "$d"; read -r a; a="${a:-$d}"; case "$a" in y|Y|yes) return 0;; n|N|no) return 1;; *) ;; esac; done; }
banner(){
cat <<'B' | tee -a "$HIVE_LOG"
+==============================================================+
|        KRACKERJACK HIVE OS  -  v7.0  FULLEST POTENTIAL       |
|   Termux | Gentoo | Kali | Linux  --  THE HIVE IS THE OS     |
|   Architect: KRACKERJACK1134                                 |
|   "Do right because it is right. No compromises. No excuses." |
+==============================================================+
B
}

# --- base detection ---------------------------------------------------------
detect_base() {
  hdr "Detecting host base"
  HIVE_UNAME="$(uname -a 2>/dev/null || echo unknown)"
  HIVE_ARCH="$(uname -m 2>/dev/null || echo unknown)"
  if [ -n "${HIVE_FORCE_BASE:-}" ]; then
    HIVE_BASE="$(printf '%s' "$HIVE_FORCE_BASE" | tr '[:upper:]' '[:lower:]')"
    case "$HIVE_BASE" in
      windows|gitbash) HIVE_PKG="winget" ;;
      gentoo) HIVE_PKG="emerge" ;;
      kali|nethunter|debian|wsl) HIVE_PKG="apt" ;;
      termux) HIVE_PKG="pkg" ;;
      ish|alpine) HIVE_PKG="apk" ;;
      arch) HIVE_PKG="pacman" ;;
      macos) HIVE_PKG="brew" ;;
      *) HIVE_PKG="unknown" ;;
    esac
    ok "base forced: $HIVE_BASE  pkg: $HIVE_PKG  arch: $HIVE_ARCH"
    return
  fi
  HIVE_BASE="unknown"
  HIVE_PKG="unknown"
  # NetHunter before Termux: both can look like Android.
  if [ -f /etc/nethunter_version ] || [ -d /usr/share/kali-nethunter ] || grep -qi "nethunter" /etc/os-release 2>/dev/null; then
    HIVE_BASE="nethunter"; HIVE_PKG="apt"
  # iSH before Alpine and before a generic Linux match.
  elif [ -n "${ISH_VERSION:-}" ] || uname -a 2>/dev/null | grep -qi -- "-ish"; then
    HIVE_BASE="ish"; HIVE_PKG="apk"
  elif [ -n "${TERMUX_VERSION:-}" ] || [ -d "/data/data/com.termux" ] || uname -a 2>/dev/null | grep -qi "android"; then
    HIVE_BASE="termux"; HIVE_PKG="pkg"
  elif grep -qi "microsoft" /proc/version 2>/dev/null; then
    HIVE_BASE="wsl"
    if [ -f /etc/os-release ]; then . /etc/os-release
      case "${ID:-}" in kali) HIVE_PKG="apt";; debian|ubuntu) HIVE_PKG="apt";; *) HIVE_PKG="apt";; esac
    else HIVE_PKG="apt"; fi
  elif [ -f /etc/gentoo-release ] || command -v emerge >/dev/null 2>&1; then
    HIVE_BASE="gentoo"; HIVE_PKG="emerge"
  elif [ -f /etc/os-release ] && grep -qi "kali" /etc/os-release; then
    HIVE_BASE="kali"; HIVE_PKG="apt"
  elif [ -f /etc/debian_version ]; then
    HIVE_BASE="debian"; HIVE_PKG="apt"
  elif [ -f /etc/arch-release ]; then
    HIVE_BASE="arch"; HIVE_PKG="pacman"
  elif [ -f /etc/alpine-release ]; then
    HIVE_BASE="alpine"; HIVE_PKG="apk"
  elif uname -s 2>/dev/null | grep -qi "darwin"; then
    HIVE_BASE="macos"; HIVE_PKG="brew"
  elif uname -s 2>/dev/null | grep -qi "mingw\|msys"; then
    HIVE_BASE="gitbash"; HIVE_PKG="winget"
  fi
  ok "base detected: $HIVE_BASE  pkg: $HIVE_PKG  arch: $HIVE_ARCH"
}

# --- identity wizard --------------------------------------------------------
wizard_identity() {
  hdr "Identity wizard"
  if [ -t 0 ]; then
    USER_NAME="$(ask 'Architect handle / user name' 'KRACKERJACK')"
  else
    USER_NAME="${HIVE_USER_NAME:-KRACKERJACK}"
  fi
  echo "  Roles:  1) Architect (full sovereign)  2) Administrator (elevated)  3) User (standard)"
  if [ -t 0 ]; then
    ROLE_NUM="$(ask 'Choose role (1/2/3)' '1')"
  else
    ROLE_NUM="${HIVE_ROLE_NUM:-1}"
  fi
  case "$ROLE_NUM" in
    1) HIVE_ROLE="Architect";   HIVE_RBAC=255 ;;
    2) HIVE_ROLE="Administrator"; HIVE_RBAC=128 ;;
    3) HIVE_ROLE="User";        HIVE_RBAC=32  ;;
    *) HIVE_ROLE="User";        HIVE_RBAC=32  ;;
  esac
  ok "identity: $USER_NAME  role: $HIVE_ROLE  rbac: $HIVE_RBAC"
}

# --- product key ------------------------------------------------------------
gen_product_key() {
  # deterministic-ish per-host + entropy: 16 hex chars, 4-4-4-4
  local raw
  raw="$( (uname -a; hostname 2>/dev/null; cat /etc/machine-id 2>/dev/null; head -c 64 /dev/urandom 2>/dev/null) | sha256sum 2>/dev/null | cut -c1-16 )"
  [ -z "$raw" ] && raw="$(printf '%s%s' "$(date +%s%N)" "$$" | sha256sum | cut -c1-16)"
  HIVE_KEY="$(printf '%s' "$raw" | sed -E 's/(.{4})(.{4})(.{4})(.{4})/\1-\2-\3-\4/')"
  ok "product key: $HIVE_KEY"
}

# --- package selection ------------------------------------------------------
wizard_packages() {
  hdr "Package selection"
  HIVE_CATALOG="$HIVE_CORE_SRC/data/package-catalog.json"
  if [ ! -f "$HIVE_CATALOG" ]; then
    warn "catalog missing, falling back to inline list"
    HIVE_CATALOG=""
  fi
  if [ -t 0 ]; then
    printf "%sAvailable categories:%s core, dev, security, net, ai, custom\n" "$B" "$X"
    CATS="$(ask 'Categories to install (comma-separated)' 'core,dev,security')"
  else
    CATS="${HIVE_CATEGORIES:-core,dev,security}"
  fi
  HIVE_PACKAGES=""
  if [ -n "$HIVE_CATALOG" ] && command -v node >/dev/null 2>&1; then
    HIVE_PACKAGES="$(node -e '
      const fs=require("fs"),c=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
      const cats=process.argv[2].split(",").map(s=>s.trim()).filter(Boolean);
      const out=[];
      for(const cat of cats){ const list=c.categories?.[cat]||[]; for(const p of list){ out.push(`${cat}:${p}`); }}
      process.stdout.write(out.join(" "));
    ' "$HIVE_CATALOG" "$CATS" 2>/dev/null || echo "")"
  fi
  if [ -z "$HIVE_PACKAGES" ]; then
    # sane defaults per base
    case "$HIVE_BASE" in
      termux) HIVE_PACKAGES="core:git core:curl core:openssh core:python dev:clang dev:make security:nmap security:openssh-tools net:traceroute ai:ollama" ;;
      gentoo) HIVE_PACKAGES="core:git core:curl dev:clang security:nmap net:traceroute ai:ollama" ;;
      kali|nethunter|deb*) HIVE_PACKAGES="core:git core:curl security:nmap security:netcat security:hydra net:traceroute ai:ollama" ;;
      *) HIVE_PACKAGES="core:git core:curl" ;;
    esac
  fi
  ok "selected: $HIVE_PACKAGES"
}

# --- construct OS name ------------------------------------------------------
construct_os_name() {
  HIVE_OS_NAME="${USER_NAME}'s ${HIVE_ROLE} HIVE OS - ${HIVE_BASE} | Packages: ${HIVE_PACKAGES} | Key: ${HIVE_KEY}"
  # bash-escape safe
  HIVE_OS_NAME="$(eval "printf '%s' \"$HIVE_OS_NAME\"")"
  ok "OS identity: $HIVE_OS_NAME"
}

# --- repo wiring ------------------------------------------------------------
wire_repos() {
  hdr "Wiring repositories for base: $HIVE_BASE"
  case "$HIVE_BASE" in
    termux)
      ok "Termux primary repo: https://packages.termux.dev/apt/termux-main"
      HIVE_REPOS="termux-main|https://packages.termux.dev/apt/termux-main|stable"
      command -v pkg >/dev/null 2>&1 && pkg update -y >/dev/null 2>&1 || true
      ;;
    gentoo)
      ok "Gentoo primary: portage tree + overlays"
      HIVE_REPOS="gentoo-main|https://distfiles.gentoo.org|stable|rsync://rsync.gentoo.org/gentoo-portage"
      [ -d /etc/portage ] || warn "portage skeleton not found (expected on Gentoo)"
      ;;
    kali)
      ok "Kali primary: http://http.kali.org/kali"
      HIVE_REPOS="kali-main|http://http.kali.org/kali|rolling"
      command -v apt >/dev/null 2>&1 && apt-get update -y >/dev/null 2>&1 || true
      ;;
    nethunter)
      ok "NetHunter primary: Kali rolling inside the NetHunter chroot"
      HIVE_REPOS="nethunter|http://http.kali.org/kali|rolling"
      command -v apt >/dev/null 2>&1 && apt-get update -y >/dev/null 2>&1 || true
      ;;
    ish)
      ok "iSH primary: Alpine userspace. This is not the Alpine hive."
      HIVE_REPOS="ish-alpine|https://dl-cdn.alpinelinux.org|stable"
      ;;
    windows)
      HIVE_REPOS="windows-host|windows|host"
      warn "Windows hive stages files only. It does not start the WSL hive."
      ;;
    deb*)
      HIVE_REPOS="debian-main|http://deb.debian.org/debian|stable"
      command -v apt >/dev/null 2>&1 && apt-get update -y >/dev/null 2>&1 || true
      ;;
    arch) HIVE_REPOS="arch-main|https://geo.mirror.pkgbuild.com|rolling" ;;
    alpine) HIVE_REPOS="alpine-main|https://dl-cdn.alpinelinux.org|stable" ;;
    macos) HIVE_REPOS="homebrew|https://github.com/Homebrew|stable" ;;
    gitbash|wsl)
      HIVE_REPOS="gitbash-host|$(uname -s)|host"
      warn "running on Windows host; installer stages artifacts, defers package install to host package manager"
      ;;
    *) HIVE_REPOS="unknown|unknown|unknown" ;;
  esac
}

# --- install real packages (best-effort) ------------------------------------
install_packages() {
  hdr "Installing selected packages (best-effort per base)"
  if [ "${HIVE_DRY_RUN:-0}" = "1" ]; then warn "DRY-RUN: skipping real installs"; return 0; fi
  for token in $HIVE_PACKAGES; do
    name="${token##*:}"
    log " -> $name"
    case "$HIVE_BASE:$name" in
      termux:git)        command -v pkg  >/dev/null 2>&1 && pkg install -y git        >/dev/null 2>&1 ;;
      termux:curl)       command -v pkg  >/dev/null 2>&1 && pkg install -y curl       >/dev/null 2>&1 ;;
      termux:openssh)    command -v pkg  >/dev/null 2>&1 && pkg install -y openssh    >/dev/null 2>&1 ;;
      termux:python)     command -v pkg  >/dev/null 2>&1 && pkg install -y python     >/dev/null 2>&1 ;;
      termux:clang)      command -v pkg  >/dev/null 2>&1 && pkg install -y clang      >/dev/null 2>&1 ;;
      termux:make)       command -v pkg  >/dev/null 2>&1 && pkg install -y make       >/dev/null 2>&1 ;;
      termux:nmap)       command -v pkg  >/dev/null 2>&1 && pkg install -y nmap       >/dev/null 2>&1 ;;
      termux:openssh-tools) command -v pkg >/dev/null 2>&1 && pkg install -y openssh-toolchain >/dev/null 2>&1 ;;
      termux:traceroute) command -v pkg  >/dev/null 2>&1 && pkg install -y traceroute >/dev/null 2>&1 ;;
      termux:ollama)     warn "ollama: install via official tarball on Termux" ;;
      gentoo:git)        command -v emerge >/dev/null 2>&1 && emerge --quiet dev-vcs/git >/dev/null 2>&1 ;;
      gentoo:curl)       command -v emerge >/dev/null 2>&1 && emerge --quiet net-misc/curl >/dev/null 2>&1 ;;
      gentoo:clang)      command -v emerge >/dev/null 2>&1 && emerge --quiet sys-devel/clang >/dev/null 2>&1 ;;
      gentoo:nmap)       command -v emerge >/dev/null 2>&1 && emerge --quiet net-analyzer/nmap >/dev/null 2>&1 ;;
      gentoo:traceroute) command -v emerge >/dev/null 2>&1 && emerge --quiet net-analyzer/traceroute >/dev/null 2>&1 ;;
      kali:git|nethunter:git|deb*:git)         command -v apt  >/dev/null 2>&1 && apt-get install -y git         >/dev/null 2>&1 ;;
      kali:curl|nethunter:curl|deb*:curl)       command -v apt  >/dev/null 2>&1 && apt-get install -y curl        >/dev/null 2>&1 ;;
      kali:nmap|nethunter:nmap|deb*:nmap)       command -v apt  >/dev/null 2>&1 && apt-get install -y nmap        >/dev/null 2>&1 ;;
      kali:netcat|nethunter:netcat|deb*:netcat)   command -v apt  >/dev/null 2>&1 && apt-get install -y netcat-openbsd >/dev/null 2>&1 ;;
      kali:hydra|nethunter:hydra|deb*:hydra)     command -v apt  >/dev/null 2>&1 && apt-get install -y hydra       >/dev/null 2>&1 ;;
      kali:traceroute|nethunter:traceroute|deb*:traceroute) command -v apt >/dev/null 2>&1 && apt-get install -y traceroute >/dev/null 2>&1 ;;
      *) warn "no install handler for $HIVE_BASE:$name (skipped)" ;;
    esac
  done
  ok "package install phase complete"
}

# --- lay down HIVE_CORE -----------------------------------------------------
install_core() {
  hdr "Installing HIVE_CORE into $HIVE_CORE"
  if [ -d "$HIVE_CORE_SRC" ]; then
    cp -r "$HIVE_CORE_SRC/." "$HIVE_CORE/" 2>/dev/null || true
  else
    warn "HIVE_CORE source not found at $HIVE_CORE_SRC - skipping copy"
  fi
  # bin/ shims
  for shim in hive zorg claude-hive hive-assimilate hive-update hive-status; do
    if [ -f "$HIVE_BIN_SRC/$shim.sh" ]; then
      cp -f "$HIVE_BIN_SRC/$shim.sh" "$HIVE_BIN/$shim" && chmod +x "$HIVE_BIN/$shim" && ok "shim: $shim"
    fi
  done
  # ensure identity files
  [ -f "$HIVE_CORE_SRC/data/teachings.json" ] && cp -f "$HIVE_CORE_SRC/data/teachings.json" "$HIVE_TEACH_FILE" 2>/dev/null || true
}

# --- write identity ---------------------------------------------------------
write_identity() {
  hdr "Persisting identity + role"
  cat > "$HIVE_IDENTITY" <<JSON
{
  "version":  "$HIVE_VERSION",
  "codename": "$HIVE_CODENAME",
  "architect": "$HIVE_ARCHITECT",
  "user_name": "$USER_NAME",
  "role": "$HIVE_ROLE",
  "rbac_level": $HIVE_RBAC,
  "base": "$HIVE_BASE",
  "pkg_manager": "$HIVE_PKG",
  "product_key": "$HIVE_KEY",
  "os_name": "$HIVE_OS_NAME",
  "uname": "$(printf '%s' "$HIVE_UNAME" | sed 's/"/\\"/g')",
  "arch": "$HIVE_ARCH",
  "repos": "$HIVE_REPOS",
  "packages": "$(printf '%s' "$HIVE_PACKAGES" | tr ' ' ',')",
  "installed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "hive_home": "$HIVE_HOME",
  "hive_core": "$HIVE_CORE"
}
JSON
  echo "$HIVE_ROLE" > "$HIVE_ROLE_FILE"
  echo "$HIVE_KEY"  > "$HIVE_HOME/product_key"
  cat > "$HIVE_PACKAGES_FILE" <<JSON
{ "packages": "$(printf '%s' "$HIVE_PACKAGES" | tr ' ' ',')" }
JSON
  ok "identity persisted -> $HIVE_IDENTITY"
}

# --- lock prime directive (text-only anchor) --------------------------------
lock_prime_directive() {
  hdr "Locking Prime Directive + ZORG-Ω anchor (text, non-executable)"
  cat > "$HIVE_HOME/PRIME_DIRECTIVE.txt" <<'TXT'
PRIME DIRECTIVE  (KRACKERJACK1134)
"Do right because it is right. No compromises. No excuses."
ZORG-Ω anchor: protect the perimeter; call parasites what they are; earned loyalty, never forced.
Note: this is a TEXT record of intent, not a system policy that overrides the OS or any safety mechanism.
TXT
  ok "prime directive recorded"
}

# --- zorg initial scan ------------------------------------------------------
zorg_initial_scan() {
  hdr "ZORG-Ω initial scan"
  if [ -x "$HIVE_BIN/zorg" ] || [ -f "$HIVE_BIN/zorg" ]; then
    "$HIVE_BIN/zorg" scan "$USER_NAME@$HIVE_BASE" 2>&1 | tee -a "$HIVE_LOG" || warn "zorg scan reported findings (see log)"
  else
    warn "zorg shim missing - skipped"
  fi
}

# --- claude sub-agent init --------------------------------------------------
claude_init() {
  hdr "Initialising Claude sub-agent"
  if [ -f "$HIVE_BIN/claude-hive" ]; then
    "$HIVE_BIN/claude-hive" init 2>&1 | tee -a "$HIVE_LOG" || warn "claude init returned non-zero"
  else
    warn "claude-hive shim missing - skipped"
  fi
}

# --- teaching module load ---------------------------------------------------
teach_init() {
  hdr "Loading The Architect's Eyes (teaching module)"
  if [ -f "$HIVE_BIN/hive" ]; then
    "$HIVE_BIN/hive" teach list 2>&1 | head -8 | tee -a "$HIVE_LOG" || true
  fi
}

# --- finalize ---------------------------------------------------------------
finalize() {
  hdr "Finalise"
  cat > "$HIVE_HOME/hive.env" <<ENV
# source this in your shell
export HIVE_HOME="$HIVE_HOME"
export HIVE_CORE="$HIVE_CORE"
export HIVE_BIN="$HIVE_BIN"
export PATH="\$HIVE_BIN:\$PATH"
export HIVE_ROLE="$HIVE_ROLE"
export HIVE_KEY="$HIVE_KEY"
export HIVE_OS_NAME="$HIVE_OS_NAME"
ENV
  ok "wrote $HIVE_HOME/hive.env"
  cat <<FINAL

${G}=========================================================${X}
 ${BLD}HIVE OS ASSIMILATED${X}
${G}=========================================================${X}
 user    : ${USER_NAME}
 role    : ${HIVE_ROLE}  (rbac $HIVE_RBAC)
 base    : ${HIVE_BASE}  (pkg: $HIVE_PKG)
 link    : individual — unite is empty
 key     : ${HIVE_KEY}
 os name : ${HIVE_OS_NAME}
 home    : ${HIVE_HOME}
FINAL
  if [ -t 0 ] && yesno "Source hive.env into current shell?" "n"; then
    # shellcheck disable=SC1090
    . "$HIVE_HOME/hive.env"
  fi
}

# --- peer link (individual hives; unite stays empty) -------------------
write_peer_link() {
  hdr "Peer link — this hive stays individual"
  local self="${HIVE_BASE:-unknown}"
  [ "$self" = "gitbash" ] && self="windows"
  local ids="windows gentoo kali nethunter termux ish debian arch alpine macos wsl"
  mkdir -p "$HIVE_HOME"
  {
    printf '{\n  "self": "%s",\n  "staysIndividual": true,\n  "unite": [],\n  "peers": [\n' "$self"
    local first=1 id
    for id in $ids; do
      [ "$id" = "$self" ] && continue
      if [ "$first" -eq 0 ]; then printf ',\n'; fi
      first=0
      printf '    {"id":"%s","connect":"peer","united":false}' "$id"
    done
    printf '\n  ],\n  "note": "Peers are known. Nothing is united until the operator adds ids to unite."\n}\n'
  } > "$HIVE_HOME/link.json"
  ok "wrote $HIVE_HOME/link.json — unite is empty"
}

# --- main -------------------------------------------------------------------
main() {
  banner
  detect_base
  write_peer_link
  wizard_identity
  gen_product_key
  wizard_packages
  construct_os_name
  wire_repos
  install_packages
  install_core
  write_identity
  lock_prime_directive
  zorg_initial_scan
  claude_init
  teach_init
  finalize
}

main "$@"
