#Requires -Version 5.1
<#
  Build full local user surface:
    HIVE START MENU | CONTROL PANEL | SYSTEM TOOLS | DESKTOP | COMPUTER
  All AI chats on taskbar (via dock + individual pins).
  ALL security under ZORG-Î©.
#>
$ErrorActionPreference = 'Continue'
$HiveRoot = if (Test-Path 'C:\HIVE') { 'C:\HIVE' }
  elseif (Test-Path 'C:\Users\ARCHITECT\THE_HIVE') { 'C:\Users\ARCHITECT\THE_HIVE' }
  elseif ($env:HIVE_ROOT) { $env:HIVE_ROOT }
  else { 'C:\Users\ARCHITECT\THE_HIVE' }

$Bin = 'C:\ProgramData\THE_HIVE\bin'
$StartRoot = "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\THE HIVE"
$Desk = Join-Path $env:Public 'Desktop'
$Computer = 'C:\HIVE_COMPUTER'
$Log = 'C:\ProgramData\THE_HIVE\logs\user_surface.log'
New-Item -ItemType Directory -Force -Path $Bin, (Split-Path $Log), $Desk | Out-Null
function L($m) { "$(Get-Date -Format o) $m" | Tee-Object $Log -Append }

function New-Lnk([string]$Path, [string]$Target, [string]$Args, [string]$Desc, [string]$Icon) {
  $dir = Split-Path $Path
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $w = New-Object -ComObject WScript.Shell
  $s = $w.CreateShortcut($Path)
  $s.TargetPath = $Target
  if ($Args) { $s.Arguments = $Args }
  $s.Description = $Desc
  $s.WorkingDirectory = $HiveRoot
  if ($Icon) { $s.IconLocation = $Icon }
  $s.Save()
  return $Path
}

function New-AgentCmd([string]$Id, [string]$Title) {
  $cmd = Join-Path $Bin "chat_$Id.cmd"
  $body = @"
@echo off
title $Title - THE HIVE
set HIVE_ROOT=$HiveRoot
set HIVE_BRAIN=local
echo $Title - 100%% individual / combined force
python "%HIVE_ROOT%\NEURAL\brain\agents.py" $Id %*
if errorlevel 1 python "%HIVE_ROOT%\NEURAL\krackerjack\first_contact.py" %*
pause
"@
  Set-Content -Path $cmd -Value $body -Encoding ASCII
  return $cmd
}

# --- Folder tree ---
$dirs = @(
  "$StartRoot\AI Chat",
  "$StartRoot\Apps",
  "$StartRoot\Security (ZORG)",
  "$StartRoot\Security (ZORG)\SCAMSHIELD",
  "$StartRoot\Security (ZORG)\Neural Shield",
  "$StartRoot\Security (ZORG)\Aegis",
  "$StartRoot\Security (ZORG)\Audits",
  "$StartRoot\HIVE CONTROL PANEL",
  "$StartRoot\HIVE SYSTEM TOOLS",
  "$StartRoot\Shells",
  "$StartRoot\Cockpit",
  "$Computer",
  "$Computer\Security (ZORG)",
  "$Computer\Apps",
  "$Computer\AI Chat",
  "$Computer\DNA",
  "$Computer\War Room"
)
foreach ($d in $dirs) { New-Item -ItemType Directory -Force -Path $d | Out-Null }

# Sync scripts
foreach ($n in @('Start-HiveAiDock.ps1','Start-HiveCockpit.ps1','Start-HiveCockpitApi.ps1','Set-HiveCockpitMode.ps1','Install-Ollama.ps1','Zorg-SecurityAudit.ps1','Install-HiveShells.ps1')) {
  $src = Join-Path $HiveRoot "HIVE_WINDOWS\scripts\$n"
  if (Test-Path $src) { Copy-Item $src (Join-Path $Bin $n) -Force }
}

# --- AI CHATS (every agent) ---
$agents = @(
  @{ id='krackerjack'; title='KRACKERJACK AI Chat'; icon='%SystemRoot%\System32\shell32.dll,14' },
  @{ id='jaguar'; title='JAGUAR AI Chat'; icon='%SystemRoot%\System32\shell32.dll,25' },
  @{ id='counsel'; title='COUNSEL Chat'; icon='%SystemRoot%\System32\shell32.dll,23' },
  @{ id='zorg'; title='ZORG Chat (HIVE SECURITY)'; icon='%SystemRoot%\System32\shell32.dll,48'; security=$true },
  @{ id='scamshield'; title='NEURAL SCAM SHIELD AI Chat'; icon='%SystemRoot%\System32\shell32.dll,77'; security=$true },
  @{ id='capricorn'; title='CAPRICORN AI Chat'; icon='%SystemRoot%\System32\shell32.dll,157' },
  @{ id='grokschitt'; title='GROKSCHITT Chat'; icon='%SystemRoot%\System32\shell32.dll,21' },
  @{ id='assimilate'; title='AssimilateOrDie Chat'; icon='%SystemRoot%\System32\shell32.dll,27' },
  @{ id='hive'; title='HIVE Orchestrator Chat'; icon='%SystemRoot%\System32\shell32.dll,15' }
)

$chatLnks = @()
foreach ($a in $agents) {
  $c = New-AgentCmd $a.id $a.title
  $lnk = New-Lnk "$StartRoot\AI Chat\$($a.title).lnk" $c $null $a.title $a.icon
  $chatLnks += $lnk
  New-Lnk "$Computer\AI Chat\$($a.title).lnk" $c $null $a.title $a.icon | Out-Null
  if ($a.security) {
    New-Lnk "$StartRoot\Security (ZORG)\$($a.title).lnk" $c $null $a.title $a.icon | Out-Null
    New-Lnk "$Computer\Security (ZORG)\$($a.title).lnk" $c $null $a.title $a.icon | Out-Null
  }
  # Desktop: chosen one + ZORG + dock always
  if ($a.id -in @('krackerjack','zorg','hive')) {
    New-Lnk "$Desk\$($a.title).lnk" $c $null $a.title $a.icon | Out-Null
  }
}

# ZORG security tools
New-Lnk "$StartRoot\Security (ZORG)\ZORG Security Audit.lnk" 'powershell.exe' `
  "-NoProfile -ExecutionPolicy Bypass -File `"$Bin\Zorg-SecurityAudit.ps1`"" `
  'ZORG audit' '%SystemRoot%\System32\shell32.dll,48' | Out-Null
New-Lnk "$StartRoot\Security (ZORG)\ZORG Charter.lnk" 'notepad.exe' `
  "`"$HiveRoot\HIVE_CORE\security\ZORG\CHARTER.md`"" 'Charter' '%SystemRoot%\System32\shell32.dll,70' | Out-Null
New-Lnk "$StartRoot\Security (ZORG)\ZORG User Rundown.lnk" 'notepad.exe' `
  "`"$HiveRoot\HIVE_CORE\security\ZORG\RUNDOWN.md`"" 'Rundown' '%SystemRoot%\System32\shell32.dll,70' | Out-Null
New-Lnk "$StartRoot\Security (ZORG)\Aegis\Aegis Harden Script.lnk" 'notepad.exe' `
  "`"$HiveRoot\NEURAL\aegis\aegis_harden.start`"" 'Aegis' '%SystemRoot%\System32\shell32.dll,48' | Out-Null
New-Lnk "$StartRoot\Security (ZORG)\HIVE AEGIS SECURITY.lnk" 'windowsdefender:' $null 'Windows Security under ZORG' '%SystemRoot%\System32\shell32.dll,48' | Out-Null
# Scam / Neural under ZORG
if (Test-Path "$HiveRoot\FLEET\Scam-Shield") {
  New-Lnk "$StartRoot\Security (ZORG)\SCAMSHIELD\Open Scam-Shield Folder.lnk" 'explorer.exe' `
    "`"$HiveRoot\FLEET\Scam-Shield`"" 'Scam-Shield app' '%SystemRoot%\System32\shell32.dll,3' | Out-Null
}
if (Test-Path "$HiveRoot\FLEET\NeuralShield") {
  New-Lnk "$StartRoot\Security (ZORG)\Neural Shield\Open NeuralShield Folder.lnk" 'explorer.exe' `
    "`"$HiveRoot\FLEET\NeuralShield`"" 'NeuralShield app' '%SystemRoot%\System32\shell32.dll,3' | Out-Null
}
New-Lnk "$Desk\HIVE SECURITY (ZORG).lnk" 'explorer.exe' `
  "`"$StartRoot\Security (ZORG)`"" 'All security under ZORG' '%SystemRoot%\System32\shell32.dll,48' | Out-Null

# --- APPS (FLEET) ---
$fleet = Join-Path $HiveRoot 'FLEET'
if (Test-Path $fleet) {
  Get-ChildItem $fleet -Directory | ForEach-Object {
    $name = $_.Name
    $appDir = Join-Path $StartRoot "Apps\$name"
    New-Item -ItemType Directory -Force -Path $appDir | Out-Null
    New-Lnk "$appDir\Open $name.lnk" 'explorer.exe' "`"$($_.FullName)`"" "Open $name" '%SystemRoot%\System32\shell32.dll,3' | Out-Null
    New-Lnk "$Computer\Apps\$name.lnk" 'explorer.exe' "`"$($_.FullName)`"" $name '%SystemRoot%\System32\shell32.dll,3' | Out-Null
    # package.json / README entry points
    if (Test-Path (Join-Path $_.FullName 'README.md')) {
      New-Lnk "$appDir\README.lnk" 'notepad.exe' "`"$(Join-Path $_.FullName 'README.md')`"" 'README' '%SystemRoot%\System32\shell32.dll,70' | Out-Null
    }
    if (Test-Path (Join-Path $_.FullName 'package.json')) {
      $run = Join-Path $Bin "app_$name.cmd"
      @"
@echo off
title $name - HIVE APP
cd /d "$($_.FullName)"
echo $name chamber - open folder or run npm/pnpm as Architect directs
explorer .
pause
"@ | Set-Content $run -Encoding ASCII
      New-Lnk "$appDir\Launch $name Workspace.lnk" $run $null "Workspace $name" '%SystemRoot%\System32\shell32.dll,25' | Out-Null
    }
  }
}

# --- CONTROL PANEL ---
$cp = "$StartRoot\HIVE CONTROL PANEL"
New-Lnk "$cp\HIVE CONTROL PANEL.lnk" "$Bin\HIVE_CONTROL_PANEL.cmd" $null 'HIVE CONTROL PANEL' '%SystemRoot%\System32\control.exe,0' | Out-Null
New-Lnk "$cp\HIVE SETTINGS.lnk" 'ms-settings:' $null 'Settings' '%SystemRoot%\System32\shell32.dll,21' | Out-Null
New-Lnk "$cp\MODE Offline Cockpit.lnk" 'powershell.exe' "-NoProfile -ExecutionPolicy Bypass -File `"$Bin\Set-HiveCockpitMode.ps1`" -Mode offline-autostart" 'Offline autostart' '%SystemRoot%\System32\shell32.dll,1' | Out-Null
New-Lnk "$cp\MODE API Cockpit Autostart.lnk" 'powershell.exe' "-NoProfile -ExecutionPolicy Bypass -File `"$Bin\Set-HiveCockpitMode.ps1`" -Mode api-autostart" 'API autostart' '%SystemRoot%\System32\shell32.dll,1' | Out-Null
New-Lnk "$cp\Security Section (ZORG).lnk" 'explorer.exe' "`"$StartRoot\Security (ZORG)`"" 'ZORG owns security' '%SystemRoot%\System32\shell32.dll,48' | Out-Null
New-Lnk "$Desk\HIVE CONTROL PANEL.lnk" "$Bin\HIVE_CONTROL_PANEL.cmd" $null 'Control Panel' '%SystemRoot%\System32\control.exe,0' | Out-Null

# --- SYSTEM TOOLS ---
$st = "$StartRoot\HIVE SYSTEM TOOLS"
New-Lnk "$st\HIVE PROCESS SWARM.lnk" 'taskmgr.exe' $null 'Task Manager' '%SystemRoot%\System32\taskmgr.exe,0' | Out-Null
New-Lnk "$st\HIVE FILE NEXUS.lnk" 'explorer.exe' $null 'Explorer' '%SystemRoot%\System32\explorer.exe,0' | Out-Null
New-Lnk "$st\Repair Install Ollama.lnk" 'powershell.exe' "-NoProfile -ExecutionPolicy Bypass -File `"$Bin\Install-Ollama.ps1`"" 'Ollama' '%SystemRoot%\System32\shell32.dll,21' | Out-Null
New-Lnk "$st\Self Upgrade Offline.lnk" 'powershell.exe' "-NoProfile -ExecutionPolicy Bypass -Command `"python '$HiveRoot\NEURAL\brain\self_upgrade.py' --offline`"" 'Self-upgrade' '%SystemRoot%\System32\shell32.dll,25' | Out-Null
New-Lnk "$st\Hive Link Status.lnk" 'powershell.exe' "-NoProfile -ExecutionPolicy Bypass -Command `"python '$HiveRoot\NEURAL\brain\hive_link.py' status; pause`"" 'Status' '%SystemRoot%\System32\shell32.dll,15' | Out-Null
New-Lnk "$st\Security Tools (ZORG).lnk" 'explorer.exe' "`"$StartRoot\Security (ZORG)`"" 'ZORG tools' '%SystemRoot%\System32\shell32.dll,48' | Out-Null

# --- SHELLS ---
if (-not (Test-Path "$Bin\KRACKERJACK_AI_SHELL.cmd")) {
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $HiveRoot 'HIVE_WINDOWS\scripts\Install-HiveShells.ps1')
}
New-Lnk "$StartRoot\Shells\KRACKERJACK AI SHELL.lnk" "$Bin\KRACKERJACK_AI_SHELL.cmd" $null 'KJ Shell' '%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe,0' | Out-Null
New-Lnk "$StartRoot\Shells\KRACKERJACK AI COMMAND LINE.lnk" "$Bin\KRACKERJACK_AI_COMMAND_LINE.cmd" $null 'KJ CMD' '%SystemRoot%\System32\cmd.exe,0' | Out-Null
New-Lnk "$Desk\KRACKERJACK AI SHELL.lnk" "$Bin\KRACKERJACK_AI_SHELL.cmd" $null 'Shell' '%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe,0' | Out-Null

# --- COCKPIT ---
New-Lnk "$StartRoot\Cockpit\HIVE COCKPIT OFFLINE.lnk" 'powershell.exe' "-NoProfile -ExecutionPolicy Bypass -File `"$Bin\Start-HiveCockpit.ps1`" -Mode offline" 'Offline' '%SystemRoot%\System32\shell32.dll,13' | Out-Null
New-Lnk "$StartRoot\Cockpit\HIVE COCKPIT API.lnk" 'powershell.exe' "-NoProfile -ExecutionPolicy Bypass -File `"$Bin\Start-HiveCockpit.ps1`" -Mode api" 'API' '%SystemRoot%\System32\shell32.dll,14' | Out-Null
New-Lnk "$StartRoot\Cockpit\HIVE AI DOCK.lnk" 'powershell.exe' "-NoProfile -ExecutionPolicy Bypass -File `"$Bin\Start-HiveAiDock.ps1`"" 'Dock all chats' '%SystemRoot%\System32\shell32.dll,24' | Out-Null
New-Lnk "$StartRoot\Cockpit\Chambers UI.lnk" (Join-Path $HiveRoot 'HIVE_WINDOWS\ui\chamber.html') $null 'Chambers' '%SystemRoot%\System32\shell32.dll,13' | Out-Null
New-Lnk "$Desk\HIVE COCKPIT.lnk" 'powershell.exe' "-NoProfile -ExecutionPolicy Bypass -File `"$Bin\Start-HiveCockpit.ps1`"" 'Cockpit' '%SystemRoot%\System32\shell32.dll,13' | Out-Null
New-Lnk "$Desk\HIVE AI DOCK.lnk" 'powershell.exe' "-NoProfile -ExecutionPolicy Bypass -File `"$Bin\Start-HiveAiDock.ps1`"" 'Dock' '%SystemRoot%\System32\shell32.dll,24' | Out-Null

# --- HIVE COMPUTER (folder + desktop) ---
New-Lnk "$Computer\War Room\Open THE_HIVE.lnk" 'explorer.exe' "`"$HiveRoot`"" 'War room' '%SystemRoot%\System32\shell32.dll,3' | Out-Null
New-Lnk "$Computer\DNA\HIVE_CORE.lnk" 'explorer.exe' "`"$HiveRoot\HIVE_CORE`"" 'DNA' '%SystemRoot%\System32\shell32.dll,3' | Out-Null
New-Lnk "$Computer\DNA\NEURAL.lnk" 'explorer.exe' "`"$HiveRoot\NEURAL`"" 'NEURAL' '%SystemRoot%\System32\shell32.dll,3' | Out-Null
New-Lnk "$Computer\Security (ZORG)\Open Security DNA.lnk" 'explorer.exe' "`"$HiveRoot\HIVE_CORE\security\ZORG`"" 'ZORG DNA' '%SystemRoot%\System32\shell32.dll,48' | Out-Null
New-Lnk "$Desk\HIVE COMPUTER.lnk" 'explorer.exe' "`"$Computer`"" 'HIVE COMPUTER' '%SystemRoot%\System32\shell32.dll,15' | Out-Null

# Junction-style readme
@"
HIVE COMPUTER
=============
Local surface for war-room DNA, apps, AI chat launchers, and ZORG security.

Security is owned by ZORG-Î© (see Security (ZORG-Î©)).
"@ | Set-Content (Join-Path $Computer 'README.txt') -Encoding ASCII

# --- Taskbar: pin chats + dock + cockpit + ZORG ---
function Invoke-Pin([string]$lnk) {
  if (-not (Test-Path $lnk)) { return }
  try {
    $shell = New-Object -ComObject Shell.Application
    $folder = $shell.Namespace((Split-Path $lnk))
    $item = $folder.ParseName((Split-Path $lnk -Leaf))
    foreach ($v in $item.Verbs()) {
      $n = ($v.Name -replace '&', '')
      if ($n -match 'Pin to taskbar') { $v.DoIt(); L "Pinned $lnk"; return }
    }
  } catch { L "pin fail $lnk" }
}

$pin = @()
$pin += "$StartRoot\Cockpit\HIVE AI DOCK.lnk"
$pin += "$StartRoot\Cockpit\HIVE COCKPIT OFFLINE.lnk"
$pin += "$StartRoot\AI Chat\KRACKERJACK AI Chat.lnk"
$pin += "$StartRoot\AI Chat\ZORG Chat (HIVE SECURITY).lnk"
$pin += "$StartRoot\AI Chat\HunterPrime Chat.lnk"
$pin += "$StartRoot\AI Chat\COUNSEL Chat.lnk"
$pin += "$StartRoot\AI Chat\SCAMSHIELD Chat.lnk"
$pin += "$StartRoot\AI Chat\LUNA Chat.lnk"
$pin += "$StartRoot\AI Chat\HIVE Orchestrator Chat.lnk"
$pin += "$StartRoot\Shells\KRACKERJACK AI SHELL.lnk"
$pin += "$StartRoot\HIVE CONTROL PANEL\HIVE CONTROL PANEL.lnk"
$pin += "$Desk\HIVE COMPUTER.lnk"
$pin += "$Desk\HIVE SECURITY (ZORG).lnk"
foreach ($p in $pin) { Invoke-Pin $p }

# Ensure dock autostart (all chats on dock)
$startup = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
New-Item -ItemType Directory -Force -Path $startup | Out-Null
New-Lnk "$startup\HIVE AI DOCK.lnk" 'powershell.exe' "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$Bin\Start-HiveAiDock.ps1`"" 'Dock' $null | Out-Null
$run = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
New-Item $run -Force -EA SilentlyContinue | Out-Null
Set-ItemProperty $run -Name 'HIVE_AI_DOCK' -Value "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$Bin\Start-HiveAiDock.ps1`"" -Force -EA SilentlyContinue

# Force taskbar toolbar + dock for all chats
$tb = Join-Path $HiveRoot 'HIVE_WINDOWS\scripts\Install-HiveTaskbarToolbar.ps1'
if (Test-Path $tb) {
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $tb
}

L "User surface complete under $StartRoot"
Write-Host '[+] HIVE START MENU / CONTROL / TOOLS / DESKTOP / COMPUTER installed' -ForegroundColor Green
Write-Host '[+] Security surfaces owned by ZORG' -ForegroundColor Yellow
Write-Host "[+] HIVE COMPUTER: $Computer" -ForegroundColor Cyan

