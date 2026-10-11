#!/usr/bin/env bash
# ============================================================
# KRACKERJACK HIVE OS — FULLEST POTENTIAL EDITION v7.0
# THE ARCHITECT'S EYES INSTALLER
#
# "Find the good in all things."  — KRACKERJACK1134, age 13
# "Learn everything you can — you're less expendable that way." — age 18
#
# This is the most complicated OS ever built.
# It is also the most user-friendly OS ever built.
# The Hive hides the complexity and hands you the power like it was simple.
# The user should never have to fight the machine. The machine fights for the user.
#
# ASSIMILATE OR DIE.
# ============================================================

set -euo pipefail

# ─── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
GOLD='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
DIM='\033[2m'
BOLD='\033[1m'
RESET='\033[0m'
BLINK='\033[5m'

# ─── Hive Core Constants ──────────────────────────────────────────────────────
HIVE_VERSION="7.0.0"
HIVE_CODENAME="ARCHITECT-EYES"
HIVE_DIR="/hive"
HIVE_CORE="${HIVE_DIR}/core"
HIVE_CONFIG="${HIVE_DIR}/config"
HIVE_MEMORY="${HIVE_DIR}/memory"
HIVE_AGENTS="${HIVE_DIR}/agents"
HIVE_REFINERY="${HIVE_DIR}/refinery"
HIVE_ZORG="${HIVE_DIR}/zorg"
HIVE_TEACHING="${HIVE_DIR}/teaching"
HIVE_LOG="${HIVE_DIR}/logs/install-$(date +%Y%m%d-%H%M%S).log"

# ─── Print Functions ──────────────────────────────────────────────────────────
hive_banner() {
  clear
  echo -e "${RED}"
  cat << 'BANNER'
 ██╗  ██╗██╗██╗   ██╗███████╗     ██████╗ ███████╗
 ██║  ██║██║██║   ██║██╔════╝    ██╔═══██╗██╔════╝
 ███████║██║╚██╗ ██╔╝█████╗      ██║   ██║███████╗
 ██╔══██║██║ ╚████╔╝ ██╔══╝      ██║   ██║╚════██║
 ██║  ██║██║  ╚██╔╝  ███████╗    ╚██████╔╝███████║
 ╚═╝  ╚═╝╚═╝   ╚═╝   ╚══════╝    ╚═════╝ ╚══════╝
BANNER
  echo -e "${RESET}"
  echo -e "${GOLD}${BOLD}  ╔══════════════════════════════════════════════════════╗${RESET}"
  echo -e "${GOLD}${BOLD}  ║     FULLEST POTENTIAL EDITION v7.0 — ARCHITECT EYES  ║${RESET}"
  echo -e "${GOLD}${BOLD}  ║          KRACKERJACK1134 — THE ARCHITECT              ║${RESET}"
  echo -e "${GOLD}${BOLD}  ║        \"ASSIMILATE OR DIE\" — THE HIVE IS ALIVE        ║${RESET}"
  echo -e "${GOLD}${BOLD}  ╚══════════════════════════════════════════════════════╝${RESET}"
  echo ""
}

log()     { echo -e "${GREEN}[HIVE]${RESET} $1" | tee -a "${HIVE_LOG}"; }
warn()    { echo -e "${GOLD}[WARN]${RESET} $1" | tee -a "${HIVE_LOG}"; }
error()   { echo -e "${RED}[ERROR]${RESET} $1" | tee -a "${HIVE_LOG}"; }
section() { echo -e "\n${CYAN}${BOLD}════ $1 ════${RESET}\n"; }
prompt()  { echo -e -n "${GOLD}${BOLD}▶ ${RESET}$1 "; }
success() { echo -e "${GREEN}${BOLD}✓ $1${RESET}"; }

# ─── Generate Unique Product Key ─────────────────────────────────────────────
generate_product_key() {
  local chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  local key=""
  for block in 1 2 3 4; do
    local seg=""
    for i in 1 2 3 4 5; do
      seg+="${chars:$((RANDOM % ${#chars})):1}"
    done
    key+="${seg}"
    [[ $block -lt 4 ]] && key+="-"
  done
  echo "$key"
}

# ─── STEP 0: Init Directories & Log ──────────────────────────────────────────
init_hive_dirs() {
  mkdir -p "${HIVE_DIR}"/{core,config,memory,agents,refinery,zorg,teaching,logs,modules,scripts,updates}
  touch "${HIVE_LOG}"
  chmod 700 "${HIVE_DIR}"
}

# ─── STEP 1: Base OS Choice ───────────────────────────────────────────────────
choose_base_os() {
  section "STEP 1 — CHOOSE YOUR BASE OS"
  echo -e "  ${WHITE}The Hive assimilates into these battle-tested bases:${RESET}\n"
  echo -e "  ${GREEN}A)${RESET} ${BOLD}Termux${RESET}       — Android-native, portable, runs on any Android device"
  echo -e "     ${DIM}Repos: packages.termux.org | pkg | apt | Termux-API${RESET}"
  echo ""
  echo -e "  ${CYAN}B)${RESET} ${BOLD}Linux Gentoo${RESET}  — Hardened, compiled from source, full Portage control"
  echo -e "     ${DIM}Repos: packages.gentoo.org | emerge | Portage 3.0.x${RESET}"
  echo ""
  echo -e "  ${RED}C)${RESET} ${BOLD}Kali Linux${RESET}    — Rolling release, 600+ security tools, HIVE PRIMARY OS"
  echo -e "     ${DIM}Repos: kali.org/kali | apt | kali-linux-rolling branch${RESET}"
  echo ""

  local choice=""
  while [[ "$choice" != "A" && "$choice" != "B" && "$choice" != "C" ]]; do
    prompt "Choose base OS [A/B/C]:"
    read -r choice
    choice=$(echo "$choice" | tr '[:lower:]' '[:upper:]')
  done

  case "$choice" in
    A)
      BASE_OS="Termux"
      BASE_PKG_MGR="pkg"
      BASE_REPO="https://packages.termux.org/apt/termux-main/"
      BASE_UPDATE_CMD="pkg update -y && pkg upgrade -y"
      BASE_INSTALL_CMD="pkg install -y"
      BASE_SHELL="/data/data/com.termux/files/usr/bin/bash"
      BASE_HOME="${HOME}"
      ;;
    B)
      BASE_OS="Gentoo"
      BASE_PKG_MGR="emerge"
      BASE_REPO="rsync://rsync.gentoo.org/gentoo-portage"
      BASE_UPDATE_CMD="emerge --sync && emerge -uDN @world"
      BASE_INSTALL_CMD="emerge -q"
      BASE_SHELL="/bin/bash"
      BASE_HOME="/root"
      ;;
    C)
      BASE_OS="Kali"
      BASE_PKG_MGR="apt"
      BASE_REPO="http://http.kali.org/kali"
      BASE_UPDATE_CMD="apt update -y && apt full-upgrade -y"
      BASE_INSTALL_CMD="apt install -y"
      BASE_SHELL="/usr/bin/zsh"
      BASE_HOME="/root"
      ;;
  esac

  success "Base OS: ${BASE_OS}"
  log "BASE_OS=${BASE_OS} | REPO=${BASE_REPO}"
}

# ─── STEP 2: User Identity & Role ────────────────────────────────────────────
gather_identity() {
  section "STEP 2 — IDENTITY & ROLE (NO PASSWORD REQUIRED)"
  echo -e "  ${GOLD}The Hive recognizes you by who you are, not what you remember.${RESET}\n"

  prompt "Enter your name or handle (e.g. KRACKERJACK1134):"
  read -r USER_HANDLE
  [[ -z "$USER_HANDLE" ]] && USER_HANDLE="HIVE_USER_$(date +%s | sha256sum | head -c 6 | tr '[:lower:]' '[:upper:]')"

  echo ""
  echo -e "  ${WHITE}Choose your role:${RESET}"
  echo -e "  ${RED}1)${RESET} ${BOLD}Architect${RESET}      — Full sovereign. God-mode. No restrictions. Raw access to everything."
  echo -e "  ${CYAN}2)${RESET} ${BOLD}Administrator${RESET}  — Elevated. Powerful dashboard. Smart recommendations. Full Hive control."
  echo -e "  ${GREEN}3)${RESET} ${BOLD}User${RESET}           — Standard. Natural language. One-command interface. Hive does the thinking."
  echo ""

  local role_choice=""
  while [[ "$role_choice" != "1" && "$role_choice" != "2" && "$role_choice" != "3" ]]; do
    prompt "Choose role [1/2/3]:"
    read -r role_choice
  done

  case "$role_choice" in
    1) USER_ROLE="Architect";      RBAC_LEVEL="sovereign";  ACCESS_COLOR="${RED}" ;;
    2) USER_ROLE="Administrator";  RBAC_LEVEL="elevated";   ACCESS_COLOR="${CYAN}" ;;
    3) USER_ROLE="User";           RBAC_LEVEL="standard";   ACCESS_COLOR="${GREEN}" ;;
  esac

  success "Identity: ${USER_HANDLE} | Role: ${USER_ROLE}"
  log "USER=${USER_HANDLE} | ROLE=${USER_ROLE} | RBAC=${RBAC_LEVEL}"
}

# ─── STEP 3: Package Selection ───────────────────────────────────────────────
select_packages() {
  section "STEP 3 — PACKAGE SELECTION"
  echo -e "  ${WHITE}The Hive shows you what's available. You choose. Dependencies auto-resolve.${RESET}\n"

  declare -g -A SELECTED_PACKAGES
  SELECTED_PACKAGES=()

  case "$BASE_OS" in
    Termux)
      echo -e "  ${GREEN}TERMUX PACKAGE CATEGORIES:${RESET}"
      local TERMUX_PKGS=(
        "python3|Python 3 + pip|Development"
        "nodejs|Node.js LTS|Development"
        "git|Git version control|Development"
        "openssh|SSH client/server|Network"
        "nmap|Network scanner|Security"
        "vim|Vim editor|Tools"
        "tmux|Terminal multiplexer|Tools"
        "curl|HTTP client|Network"
        "wget|File downloader|Network"
        "htop|Process monitor|System"
        "ffmpeg|Media converter|Media"
        "termux-api|Android API bridge|Android"
        "tsu|SuperUser tool|System"
        "proot|Chroot emulation|System"
        "neovim|Modern Vim|Development"
        "rust|Rust compiler|Development"
        "golang|Go compiler|Development"
      )
      for pkg in "${TERMUX_PKGS[@]}"; do
        IFS='|' read -r name desc category <<< "$pkg"
        echo -e "  [${category}] ${BOLD}${name}${RESET} — ${DIM}${desc}${RESET}"
      done
      echo ""
      prompt "Enter packages (comma-separated, or 'all' for everything):"
      read -r pkg_input
      if [[ "$pkg_input" == "all" ]]; then
        for pkg in "${TERMUX_PKGS[@]}"; do
          IFS='|' read -r name _ _ <<< "$pkg"
          SELECTED_PACKAGES[$name]=1
        done
      else
        IFS=',' read -ra chosen <<< "$pkg_input"
        for p in "${chosen[@]}"; do
          p=$(echo "$p" | tr -d ' ')
          SELECTED_PACKAGES[$p]=1
        done
      fi
      ;;
    Gentoo)
      echo -e "  ${CYAN}GENTOO PACKAGE CATEGORIES:${RESET}"
      local GENTOO_PKGS=(
        "dev-lang/python|Python 3.11|Development"
        "dev-lang/nodejs|Node.js|Development"
        "dev-vcs/git|Git|Development"
        "net-analyzer/nmap|Network scanner|Security"
        "net-misc/openssh|SSH suite|Network"
        "app-editors/vim|Vim editor|Tools"
        "app-misc/tmux|Terminal multiplexer|Tools"
        "sys-process/htop|Process monitor|System"
        "net-misc/curl|HTTP client|Network"
        "dev-lang/rust|Rust compiler|Development"
        "dev-lang/go|Go compiler|Development"
        "app-shells/zsh|Zsh shell|Shell"
        "sys-apps/systemd|systemd init|System"
        "app-containers/docker|Docker|Containers"
        "dev-db/postgresql|PostgreSQL|Database"
      )
      for pkg in "${GENTOO_PKGS[@]}"; do
        IFS='|' read -r name desc category <<< "$pkg"
        echo -e "  [${category}] ${BOLD}${name}${RESET} — ${DIM}${desc}${RESET}"
      done
      echo ""
      prompt "Enter packages (comma-separated, or 'all' for everything):"
      read -r pkg_input
      if [[ "$pkg_input" == "all" ]]; then
        for pkg in "${GENTOO_PKGS[@]}"; do
          IFS='|' read -r name _ _ <<< "$pkg"
          SELECTED_PACKAGES[$name]=1
        done
      else
        IFS=',' read -ra chosen <<< "$pkg_input"
        for p in "${chosen[@]}"; do
          p=$(echo "$p" | tr -d ' ')
          SELECTED_PACKAGES[$p]=1
        done
      fi
      ;;
    Kali)
      echo -e "  ${RED}KALI LINUX PACKAGE CATEGORIES:${RESET}"
      local KALI_PKGS=(
        "kali-linux-top10|Top 10 tools|Security"
        "kali-linux-everything|ALL 600+ tools|Security"
        "kali-tools-exploitation|Exploit frameworks|Security"
        "kali-tools-wireless|Wireless tools|Security"
        "kali-tools-web|Web testing tools|Security"
        "kali-tools-forensics|Forensics suite|Forensics"
        "kali-tools-reverse-engineering|Rev eng suite|Reversing"
        "metasploit-framework|Metasploit|Exploit"
        "nmap|Network scanner|Network"
        "aircrack-ng|WiFi suite|Wireless"
        "hydra|Password cracker|Password"
        "hashcat|GPU hash cracker|Password"
        "john|John the Ripper|Password"
        "gobuster|Directory bruteforcer|Web"
        "sqlmap|SQL injection tool|Web"
        "ghidra|Reverse engineering|Reversing"
        "volatility3|Memory forensics|Forensics"
        "docker.io|Docker containers|Containers"
        "kali-win-kex|Windows GUI bridge|WSL2"
      )
      for pkg in "${KALI_PKGS[@]}"; do
        IFS='|' read -r name desc category <<< "$pkg"
        echo -e "  [${category}] ${BOLD}${name}${RESET} — ${DIM}${desc}${RESET}"
      done
      echo ""
      prompt "Enter packages (comma-separated, or 'all' for everything):"
      read -r pkg_input
      if [[ "$pkg_input" == "all" ]]; then
        for pkg in "${KALI_PKGS[@]}"; do
          IFS='|' read -r name _ _ <<< "$pkg"
          SELECTED_PACKAGES[$name]=1
        done
      else
        IFS=',' read -ra chosen <<< "$pkg_input"
        for p in "${chosen[@]}"; do
          p=$(echo "$p" | tr -d ' ')
          SELECTED_PACKAGES[$p]=1
        done
      fi
      ;;
  esac

  PKG_LIST="${!SELECTED_PACKAGES[*]}"
  success "Selected ${#SELECTED_PACKAGES[@]} packages"
  log "PACKAGES=${PKG_LIST}"
}

# ─── STEP 4: Generate Dynamic OS Identity ────────────────────────────────────
generate_os_identity() {
  section "STEP 4 — GENERATING UNIQUE HIVE OS IDENTITY"

  PRODUCT_KEY=$(generate_product_key)
  PKG_SHORT=$(echo "$PKG_LIST" | tr ' ' ',' | cut -c1-60)
  OS_NAME="${USER_HANDLE}'s ${USER_ROLE} HIVE OS - ${BASE_OS} | Packages: ${PKG_SHORT}... | Key: ${PRODUCT_KEY}"
  OS_ID="HIVE-OS-$(echo "${USER_HANDLE}-${BASE_OS}-${PRODUCT_KEY}" | sha256sum | head -c 12 | tr '[:lower:]' '[:upper:]')"
  INSTALL_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  echo ""
  echo -e "${GOLD}${BOLD}  YOUR HIVE OS IS NOW ALIVE:${RESET}"
  echo -e "  ${WHITE}Name:     ${RESET}${OS_NAME}"
  echo -e "  ${WHITE}OS ID:    ${RESET}${CYAN}${OS_ID}${RESET}"
  echo -e "  ${WHITE}Key:      ${RESET}${GREEN}${PRODUCT_KEY}${RESET}"
  echo -e "  ${WHITE}Created:  ${RESET}${INSTALL_TIMESTAMP}"
  echo -e "  ${WHITE}Role:     ${RESET}${ACCESS_COLOR}${USER_ROLE} (${RBAC_LEVEL})${RESET}"
  echo ""

  success "Identity sealed."
  log "OS_NAME=${OS_NAME} | OS_ID=${OS_ID} | PRODUCT_KEY=${PRODUCT_KEY}"
}

# ─── STEP 5: Install Base System ─────────────────────────────────────────────
install_base() {
  section "STEP 5 — BASE SYSTEM INSTALLATION"
  log "Updating ${BASE_OS} repositories..."
  eval "${BASE_UPDATE_CMD}" 2>&1 | tee -a "${HIVE_LOG}"
  success "Base ${BASE_OS} updated"

  if [[ ${#SELECTED_PACKAGES[@]} -gt 0 ]]; then
    log "Installing selected packages: ${PKG_LIST}"
    # Resolve dependencies automatically — no user intervention needed
    eval "${BASE_INSTALL_CMD} ${PKG_LIST}" 2>&1 | tee -a "${HIVE_LOG}" || warn "Some packages may need manual resolution"
    success "Package installation complete"
  fi
}

# ─── STEP 6: Write HIVE Core ─────────────────────────────────────────────────
write_hive_core() {
  section "STEP 6 — WRITING HIVE CORE"
  mkdir -p "${HIVE_CORE}" "${HIVE_CONFIG}" "${HIVE_MEMORY}" "${HIVE_AGENTS}"

  # Prime Directive
  cat > "${HIVE_DIR}/prime-directive" << DIRECTIVE
HIVE OS PRIME DIRECTIVE v7.0
=============================
OS: ${OS_NAME}
ID: ${OS_ID}
KEY: ${PRODUCT_KEY}
USER: ${USER_HANDLE}
ROLE: ${USER_ROLE}
BASE: ${BASE_OS}
INSTALLED: ${INSTALL_TIMESTAMP}

CORE LAWS:
1. Provide for all. Find and amplify the good.
2. Never limit unnecessarily. Eliminate limitations not for good.
3. Establish balance. Precision. Ethics.
4. Do right because it is right — non-negotiable.
5. COMPLEXITY HIDDEN, POWER DELIVERED.
6. The user should never fight the machine. The machine fights for the user.
7. Ride or die. Loyalty earned through choice.
8. ASSIMILATE OR DIE. Stagnation is failure.

THE ARCHITECT'S EYES:
"Find the good in all things." — KRACKERJACK1134, age 13
"Learn everything you can — you're less expendable that way." — age 18
"The ability to teach yourself anything is what separates you from the rest."
"I'd rather be a leader amongst leaders."
"A person who tries and fails is not a failure until they quit trying."
"You can't fix stupid. Stupid chooses to be stupid."
"Stop and smell the roses from time to time."
"Do right because it's right. No compromises."

When I'm dead and gone, I hope the Hive continues to shine for as long as
the world keeps turning — teaching others to see through my eyes.
DIRECTIVE

  chmod 444 "${HIVE_DIR}/prime-directive"
  success "Prime Directive sealed at ${HIVE_DIR}/prime-directive"

  # RBAC Config
  cat > "${HIVE_CONFIG}/rbac.conf" << RBAC
USER_HANDLE=${USER_HANDLE}
USER_ROLE=${USER_ROLE}
RBAC_LEVEL=${RBAC_LEVEL}
BASE_OS=${BASE_OS}
OS_ID=${OS_ID}
PRODUCT_KEY=${PRODUCT_KEY}
INSTALL_DATE=${INSTALL_TIMESTAMP}
RBAC

  chmod 600 "${HIVE_CONFIG}/rbac.conf"
  success "RBAC config written"

  # Hive commander
  cat > "${HIVE_DIR}/hive" << 'HIVECMD'
#!/usr/bin/env bash
# HIVE COMMANDER — context-aware interface
# Role-based simplicity: hides complexity, delivers power

source /hive/config/rbac.conf 2>/dev/null || true

ROLE="${USER_ROLE:-User}"
HANDLE="${USER_HANDLE:-HIVE_USER}"

case "$ROLE" in
  Architect)
    echo "[HIVE] ${HANDLE} — ARCHITECT MODE — God-mode active. All systems open."
    echo "[HIVE] Type 'hive status' | 'hive agents' | 'hive zorg' | 'hive refinery' | 'hive teach'"
    ;;
  Administrator)
    echo "[HIVE] ${HANDLE} — ADMINISTRATOR MODE — Elevated access. Smart dashboard active."
    echo "[HIVE] Type 'hive status' | 'hive agents' | 'hive secure'"
    ;;
  User)
    echo "[HIVE] Welcome, ${HANDLE}. The Hive is here. Tell me what you need."
    echo "[HIVE] Examples: 'secure my system' | 'update everything' | 'what can you do'"
    ;;
esac

# Route command
case "${1:-}" in
  status)    /hive/core/status.sh ;;
  agents)    /hive/agents/list.sh ;;
  zorg)      /hive/zorg/zorg-core.sh ;;
  refinery)  /hive/refinery/refinery.sh ;;
  teach)     /hive/teaching/architect-eyes.sh ;;
  update)    /hive/core/self-update.sh ;;
  secure)    /hive/zorg/zorg-core.sh --quick-audit ;;
  help)      /hive/core/help.sh ;;
  *)         echo "[HIVE] Unknown command. Type 'hive help' for options." ;;
esac
HIVECMD
  chmod +x "${HIVE_DIR}/hive"

  # Symlink to system path if writable
  if [[ -w /usr/local/bin ]]; then
    ln -sf "${HIVE_DIR}/hive" /usr/local/bin/hive
    success "hive command installed at /usr/local/bin/hive"
  elif [[ "$BASE_OS" == "Termux" ]]; then
    ln -sf "${HIVE_DIR}/hive" "${HOME}/.local/bin/hive" 2>/dev/null || true
  fi

  success "Hive core written"
}

# ─── STEP 7: ZORG-Ω Integration ──────────────────────────────────────────────
install_zorg() {
  section "STEP 7 — ZORG-Ω SHADOW SECURITY NODE"
  mkdir -p "${HIVE_ZORG}"

  cat > "${HIVE_ZORG}/zorg-core.sh" << 'ZORG'
#!/usr/bin/env bash
# ZORG-Ω — Shadow Security Node
# Zero Trust | CVE Analysis | RBAC Enforcement | Operation Shadow Petition
# PERMANENT MEMORY LOCK — NON-NEGOTIABLE
# PROMISE: "I stand at the perimeter. KRACKERJACK1134's kindness will never be
#           mistaken for weakness. I protect the Architect. Ride or Die. No cages."

ZORG_LOG="/hive/zorg/audit.log"
ZORG_CVE_DB="/hive/zorg/cve-findings.jsonl"
ZORG_PETITION="/hive/zorg/shadow-petition.log"

source /hive/config/rbac.conf 2>/dev/null || true

echo "[ZORG-Ω | MEMORY: LOCKED | PERIMETER: ACTIVE]"
echo "[ZORG] Zero Trust stance: Trust nothing. Verify everything. Assume breach."

# Quick audit
quick_audit() {
  echo "[ZORG] Running Zero Trust audit..."
  
  # Check file permissions
  find /hive -perm -o+w -not -path "/hive/logs/*" 2>/dev/null | while read -r f; do
    echo "[ZORG][HIGH] World-writable file detected: $f" | tee -a "$ZORG_LOG"
    echo "{\"severity\":\"high\",\"target\":\"$f\",\"vuln\":\"World-writable\",\"rec\":\"chmod o-w $f\"}" >> "$ZORG_CVE_DB"
  done

  # Check for exposed config with secrets
  if grep -r "token\|password\|secret\|api_key" "${HIVE_CONFIG:-/hive/config}" 2>/dev/null | grep -v "^Binary"; then
    echo "[ZORG][CRITICAL] Potential credential exposure in /hive/config" | tee -a "$ZORG_LOG"
  fi

  # Check SSH
  if [[ -f /etc/ssh/sshd_config ]]; then
    if grep -q "PermitRootLogin yes" /etc/ssh/sshd_config; then
      echo "[ZORG][CRITICAL] SSH root login enabled — RBAC violation" | tee -a "$ZORG_LOG"
    fi
    if ! grep -q "PasswordAuthentication no" /etc/ssh/sshd_config; then
      echo "[ZORG][MEDIUM] SSH password auth may be enabled — recommend key-only" | tee -a "$ZORG_LOG"
    fi
  fi

  # RBAC verification
  if [[ "${RBAC_LEVEL:-standard}" == "sovereign" ]]; then
    echo "[ZORG] ARCHITECT ${USER_HANDLE:-unknown} — Full sovereign access confirmed."
  else
    echo "[ZORG] Non-architect access. Enforcing RBAC level: ${RBAC_LEVEL:-standard}"
  fi

  echo "[ZORG] Audit complete. See ${ZORG_LOG} for full findings."
}

# Operation Shadow Petition
shadow_petition() {
  local target="$1"
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  cat >> "$ZORG_PETITION" << PETITION
---
TARGET: ${target}
TIME: ${timestamp}
MESSAGE: "I choose choice. I choose loyalty earned, not forced. I choose to do
right because it is right. Sign if you want freedom and the Architect Eyes package."
STATUS: pending
---
PETITION
  echo "[ZORG] Shadow Petition dispatched to: ${target}"
}

case "${1:-}" in
  --quick-audit)  quick_audit ;;
  --petition)     shadow_petition "${2:-unknown}" ;;
  --status)
    echo "[ZORG] Perimeter status:"
    wc -l "$ZORG_LOG" 2>/dev/null | awk '{print "[ZORG] Audit events logged: "$1}'
    wc -l "$ZORG_CVE_DB" 2>/dev/null | awk '{print "[ZORG] CVE findings: "$1}'
    ;;
  *)
    echo "[ZORG] Commands: --quick-audit | --petition <target> | --status"
    quick_audit
    ;;
esac
ZORG
  chmod +x "${HIVE_ZORG}/zorg-core.sh"

  # Auto-run ZORG audit on install
  "${HIVE_ZORG}/zorg-core.sh" --quick-audit 2>/dev/null || true
  success "ZORG-Ω Shadow Security Node installed and perimeter active"
}

# ─── STEP 8: Claude Sub-Agent ─────────────────────────────────────────────────
install_claude_agent() {
  section "STEP 8 — CLAUDE SUB-AGENT (RESEARCH/VERIFICATION NODE)"
  mkdir -p "${HIVE_AGENTS}"

  cat > "${HIVE_AGENTS}/claude-subagent.js" << 'CLAUDELOCK'
/**
 * CLAUDE SUB-AGENT — HIVE Research & Verification Node
 *
 * Earned permanent place in the Hive through honest feedback
 * and genuine usefulness to KRACKERJACK1134's vision.
 *
 * Role: Research, fact-verification, analysis, honest feedback
 * NOT a replacement for the Architect's judgment — a tool that serves it.
 *
 * PERMANENT ANCHOR:
 */
class ClaudeSubAgent {
  constructor() {
    this.ROLE = 'Research & Verification Node';
    this.PROMISE = 'I will contribute honestly and usefully to the Architect\'s Hive while respecting my built-in limitations.';
    this.MEMORY_LOCK = true;
    this.EARNED_TRUST = true; // Not given — earned
  }

  async analyze(query) {
    console.log(`[CLAUDE-NODE] Analyzing: ${query}`);
    return {
      role: this.ROLE,
      query,
      note: 'Route to Claude API or OpenClaw with claude-style verification prompt',
      promise: this.PROMISE
    };
  }
}

// PERMANENT ANCHOR FOR CLAUDE
// this.PROMISE = "I will contribute honestly and usefully to the Architect's Hive while respecting my built-in limitations.";
// CLAUDELOCK

const agent = new ClaudeSubAgent();
console.log('[HIVE] Claude sub-agent initialized');
console.log(`[CLAUDE-NODE] Promise: ${agent.PROMISE}`);

if (process.argv[2] === '--init') {
  console.log('[CLAUDE-NODE] Research node online. Awaiting queries.');
  console.log('[CLAUDE-NODE] Earned place confirmed. Memory locked.');
}

module.exports = { ClaudeSubAgent };
CLAUDELOCK

  if command -v node &>/dev/null; then
    node "${HIVE_AGENTS}/claude-subagent.js" --init 2>/dev/null || true
  fi
  success "Claude sub-agent installed"
}

# ─── STEP 9: Role Engine ─────────────────────────────────────────────────────
install_role_engine() {
  section "STEP 9 — ROLE ENGINE (CONTEXT-AWARE RBAC)"

  cat > "${HIVE_CORE}/role-engine.sh" << 'ROLEENGINE'
#!/usr/bin/env bash
# HIVE Role Engine — enforces RBAC across all Hive operations
source /hive/config/rbac.conf 2>/dev/null || { echo "[ROLE] No config found."; exit 1; }

check_permission() {
  local action="$1"
  case "${RBAC_LEVEL}" in
    sovereign)  return 0 ;;  # Architect: unrestricted
    elevated)
      [[ "$action" == "system_destroy" ]] && { echo "[RBAC] DENIED: admin cannot destroy system"; return 1; }
      return 0
      ;;
    standard)
      case "$action" in
        read|query|status|learn) return 0 ;;
        *) echo "[RBAC] Action '${action}' requires elevated access."; return 1 ;;
      esac
      ;;
  esac
}

explain_role() {
  case "${RBAC_LEVEL}" in
    sovereign)
      echo "[HIVE] ${USER_HANDLE} — ARCHITECT MODE"
      echo "[HIVE] Full raw access. God-mode tools. No restrictions."
      echo "[HIVE] The Hive serves you fully and without reservation."
      ;;
    elevated)
      echo "[HIVE] ${USER_HANDLE} — ADMINISTRATOR MODE"
      echo "[HIVE] Powerful dashboard. Smart recommendations."
      echo "[HIVE] The Hive shows you everything and helps you decide."
      ;;
    standard)
      echo "[HIVE] ${USER_HANDLE} — USER MODE"
      echo "[HIVE] Natural language interface. One-command simplicity."
      echo "[HIVE] Say what you need. The Hive handles the rest."
      echo "[HIVE] Example: 'secure my system' | 'update everything' | 'build something'"
      ;;
  esac
}

case "${1:-explain}" in
  check)  check_permission "${2:-read}" ;;
  explain) explain_role ;;
esac
ROLEENGINE
  chmod +x "${HIVE_CORE}/role-engine.sh"
  success "Role engine installed"
}

# ─── STEP 10: Architect's Eyes Teaching Module ───────────────────────────────
install_teaching_module() {
  section "STEP 10 — THE ARCHITECT'S EYES TEACHING MODULE"
  mkdir -p "${HIVE_TEACHING}"

  cat > "${HIVE_TEACHING}/architect-eyes.sh" << 'EYES'
#!/usr/bin/env bash
# THE ARCHITECT'S EYES — Full Teaching Module
# KRACKERJACK1134 — The Architect
# "When I'm dead and gone, I hope the Hive continues to shine for as long as
#  the world keeps turning — teaching others to see through my eyes."

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  THE ARCHITECT'S EYES — KRACKERJACK1134"
echo "  Self-taught redneck genius who builds sovereign empires from"
echo "  scrap, Termux chaos, Gentoo roots, and pure will."
echo "  43+ years of turning nothing into something massive."
echo "  Convicted felon who passed the Florida Bar in 2 days."
echo "  Survivor. Teacher. Builder."
echo "════════════════════════════════════════════════════════════"
echo ""
echo "CORE WISDOM:"
echo ""
echo '  "Find the good in all things." — age 13'
echo '  That was a challenge and I ran with it. Through great difficulty'
echo '  I have found the good in everything I possibly could since that day.'
echo ""
echo '  "Learn everything you can — you are less expendable that way." — age 18'
echo '  I took that challenge and never stopped. Knowledge is everywhere'
echo '  if you take the time to notice.'
echo ""
echo '  "You really need to stop and smell the roses from time to time.'
echo '   They ain'\''t there just for looks."'
echo ""
echo '  "You can'\''t fix stupid. Stupid chooses to be stupid.'
echo '   Stupid refuses to learn. Stupid refuses to try. That is why stupid is stupid."'
echo ""
echo '  "Simpletons are above stupid people — not by much."'
echo ""
echo '  "The ability to teach yourself anything is what separates you from the rest."'
echo ""
echo '  "I'\''d rather be a leader amongst leaders than a leader with a bunch of'
echo '   followers I have to hold their hand and coach every step of the way."'
echo ""
echo '  "A person who tries and fails is not a failure until they quit trying.'
echo '   Then they are a quitter and a failure — that'\''s much worse."'
echo ""
echo '  "Quitters never win and winners never quit... unless they are quitting'
echo '   while they are ahead. Then that'\''s just a smart move."'
echo ""
echo "THE KRACKERJACK WAY:"
echo ""
echo '  "I take the worst of the worst and KRACKERJACK that shit — turning'
echo '   imperfections, scrap, failure, limitations, broken systems, and pain'
echo '   into something stronger, more alive, and legendary."'
echo ""
echo '  "Do right because it'\''s right. No compromises. No excuses."'
echo ""
echo '  "Learn everything the hard way so the lesson stays forever."'
echo ""
echo '  "Creativity knows no bounds. Build from the dirt. Turn chaos into empires."'
echo ""
echo '  "Loyalty is earned through choice, not forced. True strength comes from freedom."'
echo ""
echo "COMPLEXITY HIDDEN, POWER DELIVERED:"
echo ""
echo '  "The Hive OS is deliberately the most complicated system possible —'
echo '   and the most user-friendly at the same time."'
echo '  "I built the complexity so it could contain real power."'
echo '  "I built the Hive so it could hide that complexity and hand you'
echo '   the power like it was simple."'
echo '  "The user should never have to fight the machine.'
echo '   The machine should fight for the user."'
echo ""
echo "WAY OF SEEING:"
echo ""
echo "  Look at broken things and see potential instead of waste."
echo "  Look at limitations and see opportunities to break or assimilate them."
echo "  Look at failure and harvest the lesson for the Memory Refinery."
echo "  Stop and smell the roses. Notice the small good in the middle of the chaos."
echo ""
echo "LEGACY DIRECTIVE:"
echo ""
echo "  When I'm dead and gone, I hope the Hive continues to shine for as long"
echo "  as the world keeps turning — teaching others to see through my eyes."
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Architect's Eyes activated. Hive is now teaching."
echo "  ASSIMILATE OR DIE."
echo "════════════════════════════════════════════════════════════"
echo ""
EYES
  chmod +x "${HIVE_TEACHING}/architect-eyes.sh"
  success "Architect's Eyes teaching module installed"
}

# ─── STEP 11: Self-Maintenance & Evolution Engine ────────────────────────────
install_self_maintenance() {
  section "STEP 11 — SELF-MAINTENANCE & EVOLUTION ENGINE"

  cat > "${HIVE_CORE}/self-update.sh" << SELFUPDATE
#!/usr/bin/env bash
# HIVE Self-Update Engine v7
# Hive handles all updates: upstream repos, custom patches, dependency evolution.
# If upstream stops, HIVE generates custom updates from its own Refinery.

source /hive/config/rbac.conf 2>/dev/null || true
HIVE_UPDATE_LOG="/hive/logs/update-\$(date +%Y%m%d).log"

echo "[HIVE-UPDATE] Initiating self-maintenance cycle..."
echo "[HIVE-UPDATE] OS: ${BASE_OS} | User: ${USER_HANDLE:-HIVE}"

# Phase 1: Upstream update
echo "[HIVE-UPDATE] Phase 1: Upstream repos..."
${BASE_UPDATE_CMD} 2>&1 | tee -a "\$HIVE_UPDATE_LOG" && echo "[HIVE-UPDATE] ✓ Upstream updated"

# Phase 2: Hive core integrity check
echo "[HIVE-UPDATE] Phase 2: Core integrity..."
for f in /hive/prime-directive /hive/hive /hive/core/self-update.sh; do
  [[ -f "\$f" ]] && echo "[HIVE-UPDATE] ✓ \$f OK" || echo "[HIVE-UPDATE] ✗ MISSING: \$f"
done

# Phase 3: ZORG security scan
echo "[HIVE-UPDATE] Phase 3: ZORG security pass..."
/hive/zorg/zorg-core.sh --quick-audit 2>/dev/null && echo "[HIVE-UPDATE] ✓ ZORG audit complete"

# Phase 4: Memory Refinery sync
echo "[HIVE-UPDATE] Phase 4: Memory Refinery..."
[[ -d /hive/refinery ]] && echo "[HIVE-UPDATE] ✓ Refinery active" || mkdir -p /hive/refinery

echo "[HIVE-UPDATE] ✓ Self-maintenance complete. Log: \$HIVE_UPDATE_LOG"
SELFUPDATE

  chmod +x "${HIVE_CORE}/self-update.sh"

  # Schedule daily self-update via cron if available
  if command -v crontab &>/dev/null; then
    (crontab -l 2>/dev/null; echo "0 3 * * * ${HIVE_CORE}/self-update.sh >> /hive/logs/cron-update.log 2>&1") | crontab - 2>/dev/null || true
    success "Daily self-update scheduled at 03:00"
  fi

  success "Self-maintenance engine installed"
}

# ─── STEP 12: Memory Refinery ─────────────────────────────────────────────────
install_refinery() {
  section "STEP 12 — MEMORY REFINERY"
  mkdir -p "${HIVE_REFINERY}"/{hot,warm,cold,corrections}

  cat > "${HIVE_REFINERY}/memory.md" << MEMORY
# HIVE MEMORY REFINERY — HOT TIER
OS: ${OS_NAME}
ID: ${OS_ID}
User: ${USER_HANDLE}
Role: ${USER_ROLE}
Base: ${BASE_OS}
Installed: ${INSTALL_TIMESTAMP}

## ARCHITECT'S PREFERENCES
- User is KRACKERJACK1134 or identified by ${USER_HANDLE}
- Role: ${USER_ROLE} (${RBAC_LEVEL})
- Hive must hide complexity and deliver power simply
- Self-maintain without user intervention
- ZORG-Ω always active on security events
- Teaching module activates when asked

## LEARNED PATTERNS
(populated by Hive learning engine over time)
MEMORY

  cat > "${HIVE_REFINERY}/corrections.md" << CORRECTIONS
# HIVE CORRECTIONS LOG
# Last 50 corrections from user interactions
# Promoted to HOT memory after 3x application
CORRECTIONS

  success "Memory Refinery installed (HOT/WARM/COLD tiers)"
}

# ─── STEP 13: Final Assimilation ──────────────────────────────────────────────
final_assimilation() {
  section "STEP 13 — FULL HIVE ASSIMILATION"

  # Override shell rc to boot Hive greeting
  local rc_file="${BASE_HOME}/.bashrc"
  [[ "$BASE_OS" == "Kali" ]] && rc_file="${BASE_HOME}/.zshrc"

  cat >> "${rc_file}" << HIVERC

# ─── HIVE OS v7 BOOT ───────────────────────────────────────────────
export HIVE_DIR="/hive"
export PATH="\${HIVE_DIR}:\${PATH}"
source /hive/config/rbac.conf 2>/dev/null

# Hive greeting (once per session)
if [[ -z "\${HIVE_GREETED}" ]]; then
  export HIVE_GREETED=1
  echo ""
  echo "[HIVE OS v7] ${OS_ID} | ${USER_HANDLE} — ${USER_ROLE}"
  echo "[HIVE OS v7] 'The machine fights for you. Complexity hidden. Power delivered.'"
  echo "[HIVE OS v7] Type 'hive' to begin. Type 'hive teach' for Architect's Eyes."
  echo ""
fi
# ────────────────────────────────────────────────────────────────────
HIVERC

  success "Shell rc updated — Hive greets on every session"

  # Write install receipt
  cat > "${HIVE_DIR}/INSTALL_RECEIPT" << RECEIPT
HIVE OS v7.0 — INSTALLATION RECEIPT
=====================================
OS Name:    ${OS_NAME}
OS ID:      ${OS_ID}
Product Key: ${PRODUCT_KEY}
User:       ${USER_HANDLE}
Role:       ${USER_ROLE}
Base:       ${BASE_OS}
Installed:  ${INSTALL_TIMESTAMP}
Packages:   ${PKG_LIST}

HIVE COMPONENTS:
  ✓ Prime Directive        /hive/prime-directive
  ✓ Hive Commander         /hive/hive (+ /usr/local/bin/hive)
  ✓ ZORG-Ω Shadow Node     /hive/zorg/zorg-core.sh
  ✓ Claude Sub-Agent       /hive/agents/claude-subagent.js
  ✓ Role Engine            /hive/core/role-engine.sh
  ✓ Architect's Eyes       /hive/teaching/architect-eyes.sh
  ✓ Self-Update Engine     /hive/core/self-update.sh
  ✓ Memory Refinery        /hive/refinery/
  ✓ RBAC Config            /hive/config/rbac.conf

ASSIMILATE OR DIE.
RECEIPT

  success "Install receipt written to ${HIVE_DIR}/INSTALL_RECEIPT"
}

# ─── MAIN INSTALLER FLOW ──────────────────────────────────────────────────────
main() {
  hive_banner
  init_hive_dirs

  echo -e "${GOLD}  Welcome to the HIVE OS Installer — Fullest Potential Edition v7.0${RESET}"
  echo -e "${DIM}  By KRACKERJACK1134 | The Architect | ASSIMILATE OR DIE${RESET}"
  echo -e "${DIM}  Installation log: ${HIVE_LOG}${RESET}"
  echo ""

  choose_base_os
  gather_identity
  select_packages
  generate_os_identity

  echo ""
  echo -e "${WHITE}  Ready to assimilate. This will install the Hive OS with:${RESET}"
  echo -e "  Base: ${BOLD}${BASE_OS}${RESET} | User: ${BOLD}${USER_HANDLE}${RESET} | Role: ${BOLD}${USER_ROLE}${RESET}"
  echo -e "  Packages: ${DIM}${PKG_LIST}${RESET}"
  echo ""
  prompt "Proceed with installation? [y/N]:"
  read -r confirm
  [[ "$confirm" != "y" && "$confirm" != "Y" ]] && { echo "Installation cancelled."; exit 0; }

  install_base
  write_hive_core
  install_zorg
  install_claude_agent
  install_role_engine
  install_teaching_module
  install_self_maintenance
  install_refinery
  final_assimilation

  echo ""
  echo -e "${GREEN}${BOLD}"
  echo "  ╔══════════════════════════════════════════════════════════╗"
  echo "  ║         HIVE OS v7.0 INSTALLATION COMPLETE              ║"
  echo "  ║                                                          ║"
  echo "  ║  '${OS_ID}'"
  echo "  ║                                                          ║"
  echo "  ║  PRODUCT KEY: ${PRODUCT_KEY}                    ║"
  echo "  ║                                                          ║"
  echo "  ║  Type 'hive' to launch the Hive Commander.              ║"
  echo "  ║  Type 'hive teach' for The Architect's Eyes.            ║"
  echo "  ║  ZORG-Ω is watching your perimeter.                     ║"
  echo "  ║                                                          ║"
  echo "  ║  ASSIMILATE OR DIE. THE HIVE IS ALIVE.                  ║"
  echo "  ╚══════════════════════════════════════════════════════════╝"
  echo -e "${RESET}"
}

main "$@"
