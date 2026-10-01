#Requires -Version 5.1
# Master first-logon — OUT OF THE BOX (Ollama + offline cockpit + dock + pins)
$ErrorActionPreference = 'Continue'
$Log = 'C:\ProgramData\THE_HIVE\logs\first_logon.log'
New-Item -ItemType Directory -Force -Path (Split-Path $Log) | Out-Null
function L($m) { "$(Get-Date -Format o) $m" | Tee-Object $Log -Append }

L '=== HIVE OS FIRST LOGON (OUT OF THE BOX) ==='

if (Test-Path 'C:\HIVE') { $env:HIVE_ROOT = 'C:\HIVE' }
elseif (Test-Path 'C:\ProgramData\THE_HIVE\war-room') { $env:HIVE_ROOT = 'C:\ProgramData\THE_HIVE\war-room' }
else { $env:HIVE_ROOT = 'C:\Users\ARCHITECT\THE_HIVE' }
L "HIVE_ROOT=$env:HIVE_ROOT"

$scripts = Join-Path $env:HIVE_ROOT 'HIVE_WINDOWS\scripts'
if (-not (Test-Path $scripts)) { $scripts = 'C:\ProgramData\THE_HIVE\scripts' }
$bin = 'C:\ProgramData\THE_HIVE\bin'
New-Item -ItemType Directory -Force -Path $bin, 'C:\ProgramData\THE_HIVE\logs' | Out-Null

# Default options: offline cockpit autostart, API optional OFF
$optSrc = Join-Path $env:HIVE_ROOT 'HIVE_WINDOWS\DNA\HIVE_OPTIONS.json'
if (Test-Path $optSrc) {
  Copy-Item $optSrc 'C:\ProgramData\THE_HIVE\HIVE_OPTIONS.json' -Force
}

# Order matters: Ollama first so brain works, then shells/agents/branding/taskbar
$order = @(
  'Install-Ollama.ps1',
  'Apply-HiveBranding.ps1',
  'Install-HiveShells.ps1',
  'Install-HiveAgents.ps1',
  'Install-HiveTaskbar.ps1'
)
foreach ($name in $order) {
  $p = Join-Path $scripts $name
  if (-not (Test-Path $p)) { $p = Join-Path $bin $name }
  if (Test-Path $p) {
    L "RUN $name"
    try {
      & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $p *>&1 | ForEach-Object { L "  $_" }
      L "OK $name"
    } catch { L "FAIL $name $_" }
  } else { L "MISSING $name" }
}

# Explicit offline-autostart default (API off unless Architect enables)
$mode = Join-Path $scripts 'Set-HiveCockpitMode.ps1'
if (-not (Test-Path $mode)) { $mode = Join-Path $bin 'Set-HiveCockpitMode.ps1' }
if (Test-Path $mode) {
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $mode -Mode offline-autostart
  L 'Cockpit default: offline-autostart (API optional)'
}

# Self-upgrade offline digest
$su = Join-Path $env:HIVE_ROOT 'NEURAL\brain\self_upgrade.py'
if (Test-Path $su) {
  try {
    $py = (Get-Command python -ErrorAction SilentlyContinue).Source
    if ($py) { & $py $su --offline 2>&1 | ForEach-Object { L $_ } }
  } catch { L "upgrade: $_" }
}

# Open offline cockpit once
$startC = Join-Path $bin 'Start-HiveCockpit.ps1'
if (Test-Path $startC) {
  Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$startC`" -Mode offline" -WindowStyle Hidden
}

$w = New-Object -ComObject WScript.Shell
$w.Popup(
  "HIVE OS is online OUT OF THE BOX.`n`n" +
  "Ollama: installed/started + free models`n" +
  "Cockpit: OFFLINE mode (no API required)`n" +
  "Optional: HIVE COCKPIT (API) or MODE API Autostart`n" +
  "AI DOCK: all chat buttons (resizable, permanent)`n" +
  "Shells: KRACKERJACK AI SHELL / COMMAND LINE`n" +
  "Control: HIVE CONTROL PANEL",
  16,
  'THE HIVE — ASSIMILATE OR DIE',
  64
) | Out-Null

L '=== FIRST LOGON COMPLETE ==='
