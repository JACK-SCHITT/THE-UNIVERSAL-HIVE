#Requires -Version 5.1
<#
  Interactive HIVE preview (DEFAULT for all runs).
  -Choice Ask (default): console or MessageBox prompts
  -UseConsole: never MessageBox (safe for agent/SSH)
  -Choice Keep|Rework|ApplyOnly: explicit non-ask paths
#>
param(
  [ValidateSet('Ask', 'Keep', 'Rework', 'ApplyOnly', 'Undecided')]
  [string]$Choice = 'Ask',
  [switch]$SkipOllama,
  [switch]$UseConsole,
  [switch]$NonInteractive
)

$ErrorActionPreference = 'Continue'
$HiveRoot = if (Test-Path 'C:\Users\ARCHITECT\THE_HIVE') { 'C:\Users\ARCHITECT\THE_HIVE' }
  elseif (Test-Path 'D:\HIVE') { 'D:\HIVE' }
  elseif (Test-Path 'C:\HIVE') { 'C:\HIVE' }
  else { throw 'HIVE root not found' }

$scripts = Join-Path $HiveRoot 'HIVE_WINDOWS\scripts'
$env:HIVE_ROOT = $HiveRoot
$env:HIVE_BRAIN = 'local'
$stateDir = 'C:\ProgramData\THE_HIVE'
$stateFile = Join-Path $stateDir 'PREVIEW_STATE.json'
New-Item -ItemType Directory -Force -Path $stateDir | Out-Null

function Write-Banner {
  Write-Host '==========================================' -ForegroundColor Yellow
  Write-Host '  HIVE INTERACTIVE PREVIEW' -ForegroundColor Yellow
  Write-Host "  Root: $HiveRoot" -ForegroundColor Cyan
  Write-Host '  Mode: INTERACTIVE (default for all projects)' -ForegroundColor Green
  Write-Host '==========================================' -ForegroundColor Yellow
}

function Read-Choice([string]$Prompt, [string[]]$Valid) {
  while ($true) {
    Write-Host $Prompt -ForegroundColor Cyan
    Write-Host ("  Options: " + ($Valid -join ' | ')) -ForegroundColor DarkGray
    $r = Read-Host 'Architect'
    $r = ($r + '').Trim().ToLowerInvariant()
    foreach ($v in $Valid) {
      if ($r -eq $v.ToLowerInvariant() -or $r -eq $v.Substring(0,1).ToLowerInvariant()) {
        return $v
      }
    }
    # accept yes/no aliases
    if ($r -in @('y', 'yes') -and ($Valid -contains 'Keep' -or $Valid -contains 'Yes')) {
      if ($Valid -contains 'Keep') { return 'Keep' }
      return 'Yes'
    }
    if ($r -in @('n', 'no') -and ($Valid -contains 'Rework' -or $Valid -contains 'No')) {
      if ($Valid -contains 'Rework') { return 'Rework' }
      return 'No'
    }
    Write-Host 'Invalid — try again.' -ForegroundColor Yellow
  }
}

function Save-State([string]$Status, [string]$Note) {
  $state = @{
    status        = $Status.ToLowerInvariant()
    root          = $HiveRoot
    ts            = (Get-Date).ToString('o')
    cockpit       = 'offline-autostart'
    api_default   = $false
    ollama        = (-not $SkipOllama)
    interactive   = $true
    note          = $Note
  }
  $state | ConvertTo-Json | Set-Content $stateFile -Encoding UTF8
  Write-Host "[+] PREVIEW_STATE: $Status -> $stateFile" -ForegroundColor Green
}

Write-Banner

# Guard: NonInteractive only when explicit
if ($NonInteractive -and $Choice -eq 'Ask') {
  $Choice = 'ApplyOnly'
}

if ($Choice -eq 'Ask') {
  $intro = @'
HIVE interactive preview on THIS Windows session:

  - Ollama (if needed) + free models
  - Offline cockpit (no API required)
  - API cockpit available / switchable / optional autostart
  - AI Dock + taskbar pins
  - KRACKERJACK AI SHELL / COMMAND LINE
  - HIVE CONTROL PANEL renames

Proceed with preview apply?
'@
  Write-Host $intro -ForegroundColor White

  $go = $null
  if (-not $UseConsole) {
    try {
      Add-Type -AssemblyName PresentationFramework -ErrorAction Stop
      $r = [System.Windows.MessageBox]::Show(
        $intro + "`n`nYES = Apply preview`nNO = Cancel",
        'HIVE INTERACTIVE PREVIEW',
        'YesNo',
        'Question'
      )
      $go = ($r -eq 'Yes')
    } catch {
      $UseConsole = $true
    }
  }
  if ($UseConsole -or $null -eq $go) {
    $c = Read-Choice 'Proceed with preview apply? [Yes/No]' @('Yes', 'No')
    $go = ($c -eq 'Yes')
  }
  if (-not $go) {
    Write-Host 'Cancelled by Architect.' -ForegroundColor Yellow
    Save-State 'cancelled' 'Interactive preview cancelled before apply'
    exit 0
  }
}

# --- Apply stack ---
if (-not $SkipOllama) {
  Write-Host '[*] Ollama OUT OF THE BOX...' -ForegroundColor Cyan
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $scripts 'Install-Ollama.ps1')
}
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $scripts 'Apply-HiveBranding.ps1')
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $scripts 'Install-HiveShells.ps1')
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $scripts 'Install-HiveAgents.ps1')
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $scripts 'Install-HiveTaskbar.ps1')
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $scripts 'Set-HiveCockpitMode.ps1') -Mode offline-autostart

Write-Host '[*] Launching offline cockpit + AI dock...' -ForegroundColor Cyan
Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$(Join-Path $scripts 'Start-HiveCockpit.ps1')`" -Mode offline"
Start-Sleep -Seconds 1
Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$(Join-Path $scripts 'Start-HiveAiDock.ps1')`""

if ($Choice -eq 'ApplyOnly') {
  Save-State 'applied' 'Applied via ApplyOnly (explicit non-interactive)'
  Write-Host '[+] Preview applied (ApplyOnly).' -ForegroundColor Green
  exit 0
}

if ($Choice -eq 'Ask') {
  $keepPrompt = @'
Preview is running.

KEEP   = leave HIVE setup on this machine
REWORK = flag for changes (does not uninstall)
UNDECIDED = decide later
'@
  Write-Host $keepPrompt -ForegroundColor White
  $decision = $null
  if (-not $UseConsole) {
    try {
      Add-Type -AssemblyName PresentationFramework -ErrorAction Stop
      $r2 = [System.Windows.MessageBox]::Show(
        "Preview running.`n`nYES = KEEP`nNO = REWORK`nCANCEL = UNDECIDED",
        'HIVE — KEEP OR REWORK',
        'YesNoCancel',
        'Question'
      )
      if ($r2 -eq 'Yes') { $decision = 'Keep' }
      elseif ($r2 -eq 'No') { $decision = 'Rework' }
      else { $decision = 'Undecided' }
    } catch { $UseConsole = $true }
  }
  if ($UseConsole -or -not $decision) {
    $decision = Read-Choice 'Decision? [Keep / Rework / Undecided]' @('Keep', 'Rework', 'Undecided')
  }
  $Choice = $decision
}

$note = switch ($Choice) {
  'Keep' { 'Architect KEEP — HIVE setup retained on this machine' }
  'Rework' { 'Architect REWORK — edit HIVE_WINDOWS / DNA then re-run interactive preview' }
  'Undecided' { 'Applied; decision deferred' }
  default { "Status $Choice" }
}
Save-State $Choice $note

Write-Host ''
Write-Host 'Cockpit switch:' -ForegroundColor Cyan
Write-Host '  Set-HiveCockpitMode.ps1 -Mode offline-autostart'
Write-Host '  Set-HiveCockpitMode.ps1 -Mode api-autostart'
Write-Host '  Start-HiveCockpit.ps1 -Mode offline|api'
Write-Host 'Re-run interactive preview:' -ForegroundColor Cyan
Write-Host '  Run-HivePreview.ps1 -Choice Ask -UseConsole'
Write-Host '==========================================' -ForegroundColor Yellow
