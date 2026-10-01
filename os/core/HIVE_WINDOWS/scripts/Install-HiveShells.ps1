#Requires -Version 5.1
<#
  Create KRACKERJACK AI SHELL / COMMAND LINE / HIVE CONTROL PANEL wrappers.
#>
$ErrorActionPreference = 'Continue'
$HiveRoot = if (Test-Path 'C:\HIVE') { 'C:\HIVE' } elseif ($env:HIVE_ROOT) { $env:HIVE_ROOT } else { 'C:\Users\ARCHITECT\THE_HIVE' }
$Bin = 'C:\ProgramData\THE_HIVE\bin'
$Start = "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\THE HIVE\Shells"
$Ctrl  = "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\THE HIVE\Control"
New-Item -ItemType Directory -Force -Path $Bin, $Start, $Ctrl | Out-Null

# --- KRACKERJACK AI SHELL (PowerShell host with Hive profile) ---
$ps1 = @'
# KRACKERJACK AI SHELL — dual control · learn · complete
$env:HIVE_ROOT = if (Test-Path "C:\HIVE") { "C:\HIVE" } else { $env:HIVE_ROOT }
$env:HIVE_BRAIN = if ($env:HIVE_BRAIN) { $env:HIVE_BRAIN } else { "local" }
$Host.UI.RawUI.WindowTitle = "KRACKERJACK AI SHELL"
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "  KRACKERJACK AI SHELL" -ForegroundColor Yellow
Write-Host "  THE HIVE · ASSIMILATE OR DIE" -ForegroundColor Green
Write-Host "  Type: hive-help | krackerjack | hive-status" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Yellow
function hive-help {
  @"
KRACKERJACK AI SHELL commands:
  krackerjack [args]   — First contact AI
  hive-status          — Hive link status
  hive-upgrade         — Self-upgrade (free)
  hive-cockpit         — Open localhost cockpit
  hive-dock            — Open AI taskbar dock
  agent <name> <msg>   — Run named agent
Agents are 100% individual AND 100% combined force.
If they don't know something, they learn and continue.
"@
}
function hive-status {
  if (Test-Path "$env:HIVE_ROOT\NEURAL\brain\hive_link.py") {
    python "$env:HIVE_ROOT\NEURAL\brain\hive_link.py" status
  } else { Write-Host "Hive DNA missing at $env:HIVE_ROOT" -ForegroundColor Red }
}
function hive-upgrade {
  python "$env:HIVE_ROOT\NEURAL\brain\self_upgrade.py" --offline
}
function hive-cockpit {
  Start-Process "http://127.0.0.1:8787/"
  Start-Process python -ArgumentList "`"$env:HIVE_ROOT\NEURAL\brain\hive_api.py`"" -WindowStyle Minimized -ErrorAction SilentlyContinue
}
function hive-dock {
  Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"C:\ProgramData\THE_HIVE\bin\Start-HiveAiDock.ps1`""
}
function krackerjack {
  param([Parameter(ValueFromRemainingArguments=$true)]$Args)
  python "$env:HIVE_ROOT\NEURAL\krackerjack\first_contact.py" @Args
}
function agent {
  param([string]$Name, [Parameter(ValueFromRemainingArguments=$true)]$Msg)
  python "$env:HIVE_ROOT\NEURAL\brain\agents.py" $Name ($Msg -join ' ')
}
Set-Alias kj krackerjack
'@
Set-Content -Path "$Bin\KrackerjackAiShell.profile.ps1" -Value $ps1 -Encoding UTF8

$launchShell = @"
@echo off
title KRACKERJACK AI SHELL
set HIVE_ROOT=$HiveRoot
set HIVE_BRAIN=local
powershell.exe -NoExit -ExecutionPolicy Bypass -NoProfile -File "C:\ProgramData\THE_HIVE\bin\Launch-KJShell.ps1"
"@
Set-Content -Path "$Bin\KRACKERJACK_AI_SHELL.cmd" -Value $launchShell -Encoding ASCII

$launchPs1 = @'
$env:HIVE_ROOT = if (Test-Path "C:\HIVE") { "C:\HIVE" } else { "C:\ProgramData\THE_HIVE\war-room" }
$prof = "C:\ProgramData\THE_HIVE\bin\KrackerjackAiShell.profile.ps1"
powershell.exe -NoExit -ExecutionPolicy Bypass -NoProfile -Command "& { . '$prof' }"
'@
Set-Content -Path "$Bin\Launch-KJShell.ps1" -Value $launchPs1 -Encoding UTF8

# --- KRACKERJACK AI COMMAND LINE (cmd wrapper) ---
$cmd = @"
@echo off
title KRACKERJACK AI COMMAND LINE
set HIVE_ROOT=$HiveRoot
set HIVE_BRAIN=local
echo ============================================
echo   KRACKERJACK AI COMMAND LINE
echo   THE HIVE · Learn · Continue · Complete
echo ============================================
echo Commands: hive-status  ^|  krackerjack  ^|  python %HIVE_ROOT%\NEURAL\brain\hive_link.py status
doskey hive-status=python "%HIVE_ROOT%\NEURAL\brain\hive_link.py" status
doskey krackerjack=python "%HIVE_ROOT%\NEURAL\krackerjack\first_contact.py" $*
doskey kj=python "%HIVE_ROOT%\NEURAL\krackerjack\first_contact.py" $*
cmd.exe /k
"@
Set-Content -Path "$Bin\KRACKERJACK_AI_COMMAND_LINE.cmd" -Value $cmd -Encoding ASCII

# --- HIVE CONTROL PANEL ---
$hcp = @"
@echo off
title HIVE CONTROL PANEL
echo Opening HIVE CONTROL PANEL...
start "" control.exe
start "" explorer.exe shell:::{26EE0668-A00A-44D7-9371-BEB064C98683}
if exist "%HIVE_ROOT%\cold-storage\hive-cockpit.html" start "" "%HIVE_ROOT%\cold-storage\hive-cockpit.html"
"@
Set-Content -Path "$Bin\HIVE_CONTROL_PANEL.cmd" -Value $hcp -Encoding ASCII

# Shortcuts via WScript
function New-HiveShortcut($Path, $Target, $Args, $Icon, $Desc) {
  $w = New-Object -ComObject WScript.Shell
  $s = $w.CreateShortcut($Path)
  $s.TargetPath = $Target
  if ($Args) { $s.Arguments = $Args }
  if ($Icon) { $s.IconLocation = $Icon }
  $s.Description = $Desc
  $s.WorkingDirectory = $HiveRoot
  $s.Save()
}

New-HiveShortcut "$Start\KRACKERJACK AI SHELL.lnk" "$Bin\KRACKERJACK_AI_SHELL.cmd" $null '%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe,0' 'KRACKERJACK AI SHELL'
New-HiveShortcut "$Start\KRACKERJACK AI COMMAND LINE.lnk" "$Bin\KRACKERJACK_AI_COMMAND_LINE.cmd" $null '%SystemRoot%\System32\cmd.exe,0' 'KRACKERJACK AI COMMAND LINE'
New-HiveShortcut "$Ctrl\HIVE CONTROL PANEL.lnk" "$Bin\HIVE_CONTROL_PANEL.cmd" $null '%SystemRoot%\System32\control.exe,0' 'HIVE CONTROL PANEL'
New-HiveShortcut "$env:Public\Desktop\KRACKERJACK AI SHELL.lnk" "$Bin\KRACKERJACK_AI_SHELL.cmd" $null '%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe,0' 'KRACKERJACK AI SHELL'
New-HiveShortcut "$env:Public\Desktop\HIVE CONTROL PANEL.lnk" "$Bin\HIVE_CONTROL_PANEL.cmd" $null '%SystemRoot%\System32\control.exe,0' 'HIVE CONTROL PANEL'

# PATH
$machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
if ($machinePath -notlike "*$Bin*") {
  [Environment]::SetEnvironmentVariable('Path', "$machinePath;$Bin", 'Machine')
}

Write-Host '[+] Hive shells installed'
