# HIVE-OS Integration Status Checker
# Shows what Windows-HIVE integration features are installed
# Architect: KRACKERJACK1134

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$HiveRoot = if (Test-Path 'C:\HIVE') { 'C:\HIVE' } elseif ($env:HIVE_ROOT) { $env:HIVE_ROOT } else { 'C:\Users\ARCHITECT\THE_HIVE' }

Write-Host "=== HIVE-OS Windows Integration Status ==="
Write-Host "Hive Root: $HiveRoot"
Write-Host ""

# Check Context Menu
Write-Host "--- Context Menu Integration ---"
$contextKeys = @(
    "HKCR:\*\shell\Hive.AskKrackerjack",
    "HKCR:\Directory\shell\Hive.ScanWithZorg",
    "HKCR:\Directory\Background\shell\Hive.OpenCockpit"
)
$contextInstalled = $true
foreach ($key in $contextKeys) {
    if (-not (Test-Path $key)) {
        $contextInstalled = $false
        Write-Host "  [MISSING] $key" -ForegroundColor Yellow
    }
}
if ($contextInstalled) {
    Write-Host "  [INSTALLED] Context menu handlers present" -ForegroundColor Green
} else {
    Write-Host "  [PARTIAL/MISSING] Some context menu handlers missing" -ForegroundColor Yellow
}
Write-Host ""

# Check System Tray
Write-Host "--- System Tray Application ---"
$trayScript = Join-Path $HiveRoot "bin\HiveSystemTray.ps1"
$startupShortcut = [Environment]::GetFolderPath('Startup')
$startupShortcut = Join-Path $startupShortcut "Hive System Tray.lnk"

$trayInstalled = $false
if (Test-Path $trayScript) {
    $trayInstalled = $true
    Write-Host "  [FOUND] Tray application script: $trayScript" -ForegroundColor Green
} else {
    Write-Host "  [MISSING] Tray application script" -ForegroundColor Yellow
}

if (Test-Path $startupShortcut) {
    Write-Host "  [ENABLED] Auto-start shortcut: $startupShortcut" -ForegroundColor Green
} else {
    Write-Host "  [DISABLED] No auto-start shortcut" -ForegroundColor Yellow
}

if (-not $trayInstalled) {
    Write-Host "  [NOT INSTALLED] System tray components missing" -ForegroundColor Yellow
} elseif ($trayInstalled -and (Test-Path $startupShortcut)) {
    Write-Host "  [FULLY CONFIGURED] System tray with auto-start" -ForegroundColor Green
} elseif ($trayInstalled) {
    Write-Host "  [PARTIAL] Script present but no auto-start" -ForegroundColor Yellow
}
Write-Host ""

# Check File Associations
Write-Host "--- File Associations ---"
$associations = @(
    @{ext=".hive-teach"; progid="HiveTeach.File"; desc="Hive Teaching Module"},
    @{ext=".hive-prime"; progid="HivePrime.File"; desc="Hive Prime Directive"},
    @{ext=".hive-directive"; progid="HiveDirective.File"; desc="Hive Directive"},
    @{ext=".hive-agent"; progid="HiveAgent.Config"; desc="Hive Agent Configuration"},
    @{ext=".hive-chat"; progid="HiveChat.Log"; desc="Hive Chat Log"}
)

$assocMissing = $false
foreach ($assoc in $associations) {
    $extPath = "HKCR:\$($assoc.ext)"
    $progidPath = "HKCR:\$($assoc.progid)"

    $extExists = Test-Path $extPath
    $progidExists = Test-Path $progidPath

    if ($extExists -and $progidExists) {
        Write-Host "  [OK] $($assoc.ext) -> $($assoc.desc)" -ForegroundColor Green
    } else {
        $assocMissing = $true
        if (-not $extExists) {
            Write-Host "  [MISSING] Extension $($assoc.ext)" -ForegroundColor Yellow
        }
        if (-not $progidExists) {
            Write-Host "  [MISSING] ProgID $($assoc.progid)" -ForegroundColor Yellow
        }
    }
}

if (-not $assocMissing) {
    Write-Host "  [COMPLETE] All file associations present" -ForegroundColor Green
} else {
    Write-Host "  [INCOMPLETE] Some file associations missing" -ForegroundColor Yellow
}
Write-Host ""

# Check Beachheads
Write-Host "--- Beachheads (Existing Hive Feature) ---"
$beaches = @("C:\Hive", "C:\ProgramData\THE_HIVE\war-room")
$beachStatus = @()
foreach ($beach in $beaches) {
    if (Test-Path $beach) {
        $item = Get-Item $beach -Force
        if ($item.LinkType -eq "Junction") {
            $target = if ($(cmd /c "dir $beach") -match "\[(.*)\]") { $matches[1] } else { "unknown" }
            $beachStatus += "[JUNCTION] $beach -> $target"
        } else {
            $beachStatus += "[REGULAR FOLDER] $beach (not a junction)"
        }
    } else {
        $beachStatus += "[MISSING] $beach"
    }
}
$beachStatus | ForEach-Object { Write-Host "  $_" -ForegroundColor Green }
Write-Host ""

# Check Custom Shells
Write-Host "--- Custom Shells (Existing Hive Feature) ---"
$shells = @(
    "C:\ProgramData\THE_HIVE\bin\KRACKERJACK_AI_SHELL.cmd",
    "C:\ProgramData\THE_HIVE\bin\KRACKERJACK_AI_COMMAND_LINE.cmd",
    "C:\ProgramData\THE_HIVE\bin\HIVE_CONTROL_PANEL.cmd"
)
foreach ($shell in $shells) {
    if (Test-Path $shell) {
        Write-Host "  [INSTALLED] $(Split-Path $shell -Leaf)" -ForegroundColor Green
    } else {
        Write-Host "  [MISSING] $(Split-Path $shell -Leaf)" -ForegroundColor Yellow
    }
}
Write-Host ""

# Check Environment Variables
Write-Host "--- Environment Variables ---"
$hiveRoot = [Environment]::GetEnvironmentVariable("HIVE_ROOT", "User")
$hiveBrain = [Environment]::GetEnvironmentVariable("HIVE_BRAIN", "User")
if ($hiveRoot) {
    Write-Host "  [SET] HIVE_ROOT=$hiveRoot" -ForegroundColor Green
} else {
    Write-Host "  [NOT SET] HIVE_ROOT" -ForegroundColor Yellow
}
if ($hiveBrain) {
    Write-Host "  [SET] HIVE_BRAIN=$hiveBrain" -ForegroundColor Green
} else {
    Write-Host "  [NOT SET] HIVE_BRAIN" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "=== Summary ==="
$features = @()
if ($contextInstalled) { $features += "Context Menu" }
if (Test-Path $trayScript) { $features += "System Tray" }
if (-not ($assocMissing | Where-Object { $_ })) { $features += "File Associations" }
if ($hiveRoot) { $features += "Environment" }

if ($features.Count -eq 4) {
    Write-Host "🎉 FULL INTEGRATION: All major features detected!" -ForegroundColor Green
} elseif ($features.Count -ge 2) {
    Write-Host "✅ PARTIAL INTEGRATION: $($features.Count) features active: $($features -join ', ')" -ForegroundColor Yellow
} elseif ($features.Count -eq 1) {
    Write-Host "⚠️  MINIMAL INTEGRATION: Only $($features[0]) detected" -ForegroundColor Yellow
} else {
    Write-Host "❌ NO INTEGRATION DETECTED: Run installer to add Windows-HIVE features" -ForegroundColor Red
}
Write-Host ""
Write-Host "To install missing features:"
Write-Host "  powershell -ExecutionPolicy Bypass -File .\scripts\windows\Install-HiveWindowsIntegration.ps1"
Write-Host ""