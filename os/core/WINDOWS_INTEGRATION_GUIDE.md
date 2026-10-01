# HIVE-OS Windows Integration Guide

This guide explains how to make Windows truly the "home and office" for HIVE-OS, with deep integration between the Windows operating system and the Hive AI system.

## Overview

HIVE-OS already includes basic Windows integration through the `HIVE_WINDOWS/` directory and installer scripts. This guide covers the enhanced integration features that create a seamless experience where Windows becomes the primary interface for interacting with the Hive.

## Features

### 1. File Explorer Context Menu Integration
Right-click on files, folders, or desktop background to access Hive agents directly:

- **Ask KRACKERJACK about this item** - Get first-contact AI analysis of files/folders
- **Scan with ZORG Security** - Run security scans using the ZORG agent
- **Get COUNSEL opinion** - Receive truth-filtered advice on files/decisions
- **JAGUAR: Run command on this** - Execute actions via the action/foundry agent
- **Open Hive Cockpit** - Launch the web-based Hive interface
- **Show Hive Status** - Check Hive-Link and agent status

### 2. System Tray Application
A persistent system tray icon provides:

- **One-click access** to all Hive agents (KRACKERJACK, JAGUAR, COUNSEL, ZORG, etc.)
- **Automatic status monitoring** - icon changes based on Hive health (online/offline/limited)
- **Quick actions**: Status check, cockpit launch, manual upgrade
- **Auto-start** with Windows login
- **Architect confirmation** required to close (prevents accidental termination)

### 3. File Associations
Automatically associate Hive-specific file types with appropriate editors:

- `.hive-teach` - Teaching modules (opens in Notepad)
- `.hive-prime` - Prime directives (opens in Notepad)
- `.hive-directive` - Directives (opens in Notepad)
- `.hive-agent` - Agent configurations (opens in Notepad)
- `.hive-chat` - Chat logs (opens in Notepad)

### 4. Enhanced Installer Integration
The standard `install_hive_windows.ps1` script now includes options for:
- Context menu installation (`-SkipContextMenu` to skip)
- System tray installation (`-SkipSystemTray` to skip) 
- File associations (`-SkipFileAssociations` to skip)
- All existing features (beachheads, shells, shortcuts, scheduled tasks, etc.)

## Installation

### Option 1: Complete Installation (Recommended)
Run the all-in-one installer:
```powershell
cd C:\Users\ARCHITECT\THE_HIVE
powershell -ExecutionPolicy Bypass -File .\scripts\windows\Install-HiveWindowsIntegration.ps1
```

### Option 2: Selective Installation
Install specific components:
```powershell
# Context menu only
powershell -ExecutionPolicy Bypass -File .\scripts\windows\Install-HiveWindowsIntegration.ps1 -ContextMenu

# System tray only (includes auto-start)
powershell -ExecutionPolicy Bypass -File .\scripts\windows\Install-HiveWindowsIntegration.ps1 -SystemTray

# File associations only
powershell -ExecutionPolicy Bypass -File .\scripts\windows\Install-HiveWindowsIntegration.ps1 -FileAssociations
```

### Option 3: Through Existing Installer
The standard Windows installer now includes these features by default:
```powershell
# Standard installation (includes new features)
powershell -ExecutionPolicy Bypass -File .\scripts\windows\install_hive_windows.ps1

# To skip specific new features:
powershell -ExecutionPolicy Bypass -File .\scripts\windows\install_hive_windows.ps1 -SkipContextMenu -SkipSystemTray -SkipFileAssociations
```

## Verification

Check your installation status:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\Show-HiveIntegrationStatus.ps1
```

## Usage Examples

### Context Menu
1. Right-click any file → "Ask KRACKERJACK about this item"
2. Right-click a downloaded program → "Scan with ZORG Security" 
3. Right-click in a folder → "Get COUNSEL opinion" on whether to keep files
4. Right-click a project folder → "JAGUAR: Run command on this" to execute build scripts

### System Tray
- Left-click the Hive icon in system tray to see agent menu
- Right-click for full context menu with status, cockpit, upgrade options
- Double-tray-icon for quick status popup
- Hover over icon to see current Hive brain status (Ollama/offline/limited)

### File Associations
- Double-click any `.hive-teach` file to view/edit training material
- `.hive-prime` files open prime directives for review
- All Hive-specific formats open in appropriate editors

## Architecture Notes

### Safety Features
- **No disk wiping** - All additions are non-destructive
- **No remote UI binding** - All interfaces remain localhost-only
- **No secrets in git** - Configuration remains local/environment-based
- **Escape hatch** - System tray requires explicit confirmation to close
- **Fallback compatibility** - All standard Windows functions remain available

### Performance
- Context menu handlers are lightweight registry-based
- System tray uses minimal resources (runs only when needed)
- File associations use existing Windows mechanisms
- No background services unless explicitly enabled (like scheduled upgrades)

### Customization
All installation scripts support removal:
```powershell
# Remove specific features
powershell -ExecutionPolicy Bypass -File .\scripts\windows\Install-HiveWindowsIntegration.ps1 -ContextMenu -Remove
```

Or remove everything:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\Install-HiveWindowsIntegration.ps1 -Remove
```

## Integration with Existing Hive Features

These enhancements work alongside existing Hive Windows features:

- **Beachheads**: `C:\Hive` and `C:\ProgramData\THE_HIVE\war-room` junctions
- **Custom Shells**: KRACKERJACK AI SHELL, KRACKERJACK AI COMMAND LINE, HIVE CONTROL PANEL
- **AI Dock**: Persistent, resizable toolbar with agent buttons (still available via `Start-HiveAiDock.ps1`)
- **Scheduled Tasks**: Automatic offline self-upgrades
- **WSL Integration**: Kali Linux bridge for cross-platform operations
- **Environment Variables**: Automatic HIVE_ROOT and HIVE_BRAIN configuration

## Troubleshooting

### Context Menu Not Showing
1. Log off and log on, or restart Explorer.exe
2. Run `Show-HiveIntegrationStatus.ps1` to verify installation
3. Re-run the context menu installer if needed

### System Tray Not Starting
1. Check the startup folder: `shell:startup` should contain "HIVE System Tray.lnk"
2. Verify the script exists at `C:\Users\ARCHITECT\THE_HIVE\bin\HiveSystemTray.ps1`
3. Manual test: `& "C:\Users\ARCHITECT\THE_HIVE\bin\HiveSystemTray.ps1"`

### File Associations Not Working
1. Log off/on or restart Explorer.exe
2. Check default apps settings in Windows Settings
3. Re-run the file association installer

## Making Windows the Hive's True Home & Office

With these enhancements installed, your Windows system becomes:

1. **The Primary Interface** - Access Hive agents through familiar Windows paradigms (right-click, system tray, file double-click)
2. **The Operational Hub** - System tray provides constant access to Hive capabilities
3. **The Knowledge Repository** - File associations make Hive-specific documents first-class citizens
4. **The Secure Environment** - Beachheads and junctions keep Hive data accessible yet contained
5. **The Always-On Assistant** - Background services and scheduled tasks maintain Hive readiness
6. **The Architect's Command Center** - Custom shells and tools provide deep system access when needed

The Hive no longer runs *alongside* Windows—it becomes an integrated part of the Windows experience, accessible through the interfaces users already know and trust.