# HIVE-OS Windows Integration Installer
# One-click installer for all Windows-HIVE integration features
# Architect: KRACKERJACK1134

[CmdletBinding()]
param(
  [switch]$All,
  [switch]$ContextMenu,
  [switch]$SystemTray,
  [switch]$FileAssociations,
  [switch]$Remove
)

# If no specific flags are set, install everything
if (-not ($ContextMenu -or $SystemTray -or $FileAssociations)) {
  $All = $true
}

$ErrorActionPreference = 'Stop'
$HiveRoot = if (Test-Path 'C:\HIVE') { 'C:\HIVE' } elseif ($env:HIVE_ROOT) { $env:HIVE_ROOT } else { 'C:\Users\ARCHITECT\THE_HIVE' }

function Show-Help {
  Write-Host @"
HIVE-OS Windows Integration Installer

Usage:
  .\Install-HiveWindowsIntegration.ps1 [-All] [-ContextMenu] [-SystemTray] [-FileAssociations] [-Remove]

Options:
  -All                    Install all integration features (default if none specified)
  -ContextMenu            Install File Explorer context menu integration
  -SystemTray             Install system tray application with auto-start
  -FileAssociations       Install file associations for .hive-* files
  -Remove                 Remove installed features instead of installing

Examples:
  .\Install-HiveWindowsIntegration.ps1                  # Install everything
  .\Install-HiveWindowsIntegration.ps1 -ContextMenu -SystemTray   # Install context menu and tray only
  .\Install-HiveWindowsIntegration.ps1 -Remove          # Remove all installed features
"@
}

if ($args.Count -gt 0 -and $args[0] -eq '-h') {
  Show-Help
  exit 0
}

try {
  if ($Remove) {
    Write-Host "Removing Hive Windows integration features..." -ForegroundColor Yellow

    if ($All -or $ContextMenu) {
      Write-Host "Removing context menu integration..."
      & "$HiveRoot\scripts\windows\Install-HiveContextMenu.ps1" -Remove
    }

    if ($All -or $SystemTray) {
      Write-Host "Removing system tray application..."
      & "$HiveRoot\scripts\windows\Install-HiveSystemTray.ps1" -Remove
    }

    if ($All -or $FileAssociations) {
      Write-Host "Removing file associations..."
      & "$HiveRoot\scripts\windows\Install-HiveFileAssociations.ps1" -Remove
    }

    Write-Host "Removal complete." -ForegroundColor Green
  } else {
    Write-Host "Installing Hive Windows integration features..." -ForegroundColor Green

    if ($All -or $ContextMenu) {
      Write-Host "Installing context menu integration..."
      & "$HiveRoot\scripts\windows\Install-HiveContextMenu.ps1"
    }

    if ($All -or $SystemTray) {
      Write-Host "Installing system tray application..."
      & "$HiveRoot\scripts\windows\Install-HiveSystemTray.ps1" -StartNow
    }

    if ($All -or $FileAssociations) {
      Write-Host "Installing file associations..."
      & "$HiveRoot\scripts\windows\Install-HiveFileAssociations.ps1"
    }

    Write-Host "Installation complete." -ForegroundColor Green
    Write-Host ""
    Write-Host "Some features may require logging off/on or restarting Explorer.exe to take effect."
    Write-Host "The system tray application will start automatically at your next login."
  }
} catch {
  Write-Error "Failed: $_"
  exit 1
}