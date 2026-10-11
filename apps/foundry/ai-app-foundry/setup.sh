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

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main setup
main() {
    print_header "ASSIMILATE-OR-DIE-AI-APP-FOUNDRY Setup"

    # Check prerequisites
    print_info "Checking prerequisites..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed"
        echo "Please install Node.js from: https://nodejs.org/ or https://github.com/nvm-sh/nvm#installing-and-updating"
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
    
    if [ -d "node_modules" ]; then
        print_info "Removing old node_modules..."
        rm -rf node_modules
        print_success "node_modules removed"
    fi

    if [ -f "package-lock.json" ]; then
        print_info "Removing old package-lock.json..."
        rm -f package-lock.json
        print_success "package-lock.json removed"
    fi

    # Install dependencies
    print_header "Installing Dependencies"
    print_info "Running: npm install"
    npm install
    print_success "Dependencies installed"

    # Build the app (optional)
    read -p "Do you want to build the app now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_header "Building Application"
        print_info "Running: npm run build"
        npm run build
        print_success "Build complete"
    fi

    # Run dev server
    read -p "Do you want to start the dev server now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_header "Starting Development Server"
        print_info "The app will run on: http://localhost:8080"
        print_info "Press Ctrl+C to stop the server"
        npm run dev
    else
        print_header "Setup Complete!"
        print_info "To start the dev server, run:"
        echo -e "${YELLOW}npm run dev${NC}"
    fi
}

# Run main function
main "$@"
