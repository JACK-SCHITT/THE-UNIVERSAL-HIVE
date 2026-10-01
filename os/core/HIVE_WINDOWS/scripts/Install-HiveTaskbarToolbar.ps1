#Requires -Version 5.1
# Thermal-light taskbar: fewer pins, consolidated agents only
$ErrorActionPreference = 'Continue'
$HiveRoot = if (Test-Path 'C:\Users\ARCHITECT\THE_HIVE') { 'C:\Users\ARCHITECT\THE_HIVE' } else { 'C:\HIVE' }
$Bin = 'C:\ProgramData\THE_HIVE\bin'
$ToolbarChats = 'C:\ProgramData\THE_HIVE\TaskbarToolbar\HIVE AI CHATS'
$PinnedTB = Join-Path $env:APPDATA 'Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar'
New-Item -ItemType Directory -Force -Path $Bin, $ToolbarChats, $PinnedTB | Out-Null

function New-Lnk($Path, $Target, $Args, $Desc) {
  $w = New-Object -ComObject WScript.Shell
  $s = $w.CreateShortcut($Path)
  $s.TargetPath = $Target
  if ($Args) { $s.Arguments = $Args }
  $s.Description = $Desc
  $s.WorkingDirectory = $HiveRoot
  $s.Save()
}
function New-Chat($Id, $Title) {
  $cmd = Join-Path $Bin "chat_$Id.cmd"
  $py = if (Test-Path (Join-Path $Bin 'python_path.txt')) { Get-Content (Join-Path $Bin 'python_path.txt') -Raw } else { 'python' }
  $py = $py.Trim()
@"
@echo off
title $Title
set HIVE_ROOT=$HiveRoot
set HIVE_BRAIN=local
set OLLAMA_MODEL=tinyllama
set OLLAMA_TIMEOUT=30
set PYTHONUTF8=1
cd /d "%HIVE_ROOT%"
if "%~1"=="" (set /p MSG=You: ) else (set MSG=%*)
if "%MSG%"=="" set MSG=status
"$py" "%HIVE_ROOT%\NEURAL\brain\agents.py" $Id "%MSG%"
if errorlevel 1 "$py" "%HIVE_ROOT%\NEURAL\brain\hive_link.py" offline "%MSG%"
pause
"@ | Set-Content $cmd -Encoding ASCII
  New-Lnk (Join-Path $ToolbarChats "$Title.lnk") $cmd $null $Title
  New-Lnk (Join-Path $PinnedTB "$Title.lnk") $cmd $null $Title
  return $cmd
}

# Consolidated roster only (thermal-light)
New-Chat 'krackerjack' '01 KRACKERJACK AI'
New-Chat 'jaguar' '02 JAGUAR AI'
New-Chat 'counsel' '03 COUNSEL'
New-Chat 'zorg' '04 ZORG SECURITY'
New-Chat 'scamshield' '05 NEURAL SCAM SHIELD AI'
New-Chat 'capricorn' '06 CAPRICORN AI'
New-Chat 'grokschitt' '07 GROKSCHITT'
New-Chat 'assimilate' '08 AssimilateOrDie'
New-Chat 'hive' '09 HIVE ORCHESTRATOR'

New-Lnk (Join-Path $ToolbarChats '00 HIVE AI DOCK.lnk') 'powershell.exe' "-NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File `"$Bin\Start-HiveAiDock.ps1`"" 'Dock'
New-Lnk (Join-Path $ToolbarChats '00 HIVE COCKPIT.lnk') 'powershell.exe' "-NoProfile -ExecutionPolicy Bypass -File `"$Bin\Start-HiveCockpit.ps1`" -Mode offline" 'Cockpit'

# Single dock autostart only (reduce thermal load — no extra ollama/cockpit/api)
$startup = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Startup'
New-Item -ItemType Directory -Force -Path $startup | Out-Null
# Remove heavy autostarts if present
Remove-Item (Join-Path $startup 'HIVE OLLAMA.lnk') -Force -EA SilentlyContinue
Remove-Item (Join-Path $startup 'HIVE COCKPIT.lnk') -Force -EA SilentlyContinue
New-Lnk (Join-Path $startup 'HIVE AI DOCK.lnk') 'powershell.exe' "-NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File `"$Bin\Start-HiveAiDock.ps1`"" 'Dock'

$run = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
New-Item $run -Force -EA SilentlyContinue | Out-Null
Set-ItemProperty $run -Name 'HIVE_AI_DOCK' -Value "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File `"$Bin\Start-HiveAiDock.ps1`"" -Force -EA SilentlyContinue
Remove-ItemProperty $run -Name 'HIVE_COCKPIT' -EA SilentlyContinue
Remove-ItemProperty $run -Name 'HIVE_COCKPIT_API' -EA SilentlyContinue

# Copy dock script
$dock = Join-Path $HiveRoot 'HIVE_WINDOWS\scripts\Start-HiveAiDock.ps1'
if (Test-Path $dock) { Copy-Item $dock (Join-Path $Bin 'Start-HiveAiDock.ps1') -Force }
$cock = Join-Path $HiveRoot 'HIVE_WINDOWS\scripts\Start-HiveCockpit.ps1'
if (Test-Path $cock) { Copy-Item $cock (Join-Path $Bin 'Start-HiveCockpit.ps1') -Force }

Write-Host '[+] Consolidated chat toolbar + thermal-light autostart (dock only)' -ForegroundColor Green
