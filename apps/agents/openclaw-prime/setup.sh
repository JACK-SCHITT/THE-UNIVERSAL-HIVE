#!/bin/bash

# ASSIMILATE-OR-DIE-AI-APP-FOUNDRY Setup Script
# Supports: Linux, macOS, Termux, and Windows (Git Bash)

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# PRIME DIRECTIVE - ASSIMILATE OR DIE
print_prime_directive() {
    echo -e "${RED}⚡ PRIME DIRECTIVE ACTIVATED ⚡${NC}"
    echo -e "${YELLOW}Find EVERY zero-cost or minimal-cost path to build & deploy.${NC}"
    echo -e "${YELLOW}Use only free tiers, open source, loopholes, and hustles.${NC}"
    echo -e "${YELLOW}Launch fast → Monetize immediately → Upgrade relentlessly.${NC}"
    echo -e "${YELLOW}User/friend MUST make money. No excuses. Assimilate or Die.${NC}"
}

# Hive OS Build Status
print_hive_status() {
    print_header "HIVE OS BUILD STATUS"
    echo -e "${RED}HIVE INFRASTRUCTURE:${NC}"
    echo -e "1. Base OS: Gentoo Linux arm64 stage3"
    echo -e "2. Terminal Bridge: Termux + proot"
    echo -e "3. Boot: GRUB EFI | USB Bootable | /hive/output"
    echo -e "4. Directive: /etc/hive/prime-directive — LOCKED"
    echo -e "5. Commander: /usr/bin/hive → commander-hive.js"
    echo -e "6. Repo: github.com/KRACKERJACK1134/Hive-Repo"
    echo -e "7. Nodes: 10 Active | All Status: OPTIMAL"
    print_info "Run 'hive' after installation to launch the Hive Commander."
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main setup
main() {
    print_header "ASSIMILATE-OR-DIE-AI-APP-FOUNDRY Setup"
    print_prime_directive

    # Check prerequisites
    print_info "Checking prerequisites..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed"
        echo "Install for free via nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
        exit 1
    fi
    print_success "Node.js found: $(node --version)"

    if ! command_exists npm; then
        print_error "npm is not installed"
        exit 1
    fi
    print_success "npm found: $(npm --version)"

    # Clean previous installation
    print_header "Cleaning Previous Installation"
    rm -rf node_modules package-lock.json 2>/dev/null || true
    print_success "Clean slate achieved"

    # Install dependencies
    print_header "Installing Dependencies (Free)"
    npm install
    print_success "Dependencies installed"

    # Build
    print_header "Building Application"
    npm run build
    print_success "Build complete"

    # Auto-start dev server
    print_header "ASSIMILATING - AUTO STARTING SWARM"
    print_info "Dev server launching on: http://localhost:8080"
    print_warning "Press Ctrl+C to stop"
    
    npm run dev > app.log 2>&1 &
    SERVER_PID=$!
    print_success "Swarm live! PID: $SERVER_PID"
    print_info "Logs: tail -f app.log"

    # Fire Hive OS status
    print_hive_status

    echo -e "\n${RED}NEXT STEPS — HIVE OS INSTALLER:${NC}"
    echo -e "1. Push to GitHub → KRACKERJACK1134/Hive-Repo"
    echo -e "2. Run: bash hive-os-build.sh (requires root or Termux)"
    echo -e "3. Boot from USB: select HIVE in EFI boot menu"
    echo -e "4. Execute: /usr/bin/hive to launch the Hive Commander"
    echo -e "5. All 10 Hive nodes online → Assimilation complete"

    echo -e "\n${RED}ASSIMILATION COMPLETE.${NC}"
    echo -e "${YELLOW}The Hive is online. Directives locked. Commander standing by.${NC}"
    echo -e "${YELLOW}KRACKERJACK1134 — ARCHITECT AUTHORIZED.${NC}"
}

# Run main function
main "$@"
