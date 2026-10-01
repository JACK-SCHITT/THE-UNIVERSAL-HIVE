# HIVE-OS System Tray Application Installer
# Creates a persistent system tray icon for quick Hive access
# Architect: KRACKERJACK1134

[CmdletBinding()]
param(
    [switch]$Remove,
    [switch]$StartNow
)

$ErrorActionPreference = 'Stop'
$HiveRoot = if (Test-Path 'C:\HIVE') { 'C:\HIVE' } elseif ($env:HIVE_ROOT) { $env:HIVE_ROOT } else { 'C:\Users\ARCHITECT\THE_HIVE' }
$BinDir = Join-Path $HiveRoot 'bin'

# Ensure bin directory exists
if (-not (Test-Path $BinDir)) {
    New-Item -ItemType Directory -Force -Path $BinDir | Out-Null
}

$trayAppPath = Join-Path $BinDir 'HiveSystemTray.ps1'
$shortcutPath = [Environment]::GetFolderPath('Startup')  # Startup folder for auto-launch
$shortcutPath = Join-Path $shortcutPath 'Hive System Tray.lnk'

function Create-TrayApplication {
    $trayScript = @"