#Requires -Version 5.1
<#
  Normal Windows taskbar kept (Start/Search/Task View/tray).
  Strip weather/meet/chat/widgets.
  Pin everything important + "just because".
  Permanent HIVE AI DOCK + cockpit autostart per HIVE_OPTIONS.
#>
$ErrorActionPreference = 'Continue'
$Bin = 'C:\ProgramData\THE_HIVE\bin'
$Log = Join-Path $env:ProgramData 'THE_HIVE\logs\taskbar.log'
$HiveRoot = if (Test-Path 'C:\HIVE') { 'C:\HIVE' }
  elseif (Test-Path 'C:\ProgramData\THE_HIVE\war-room') { 'C:\ProgramData\THE_HIVE\war-room' }
  else { 'C:\Users\ARCHITECT\THE_HIVE' }

New-Item -ItemType Directory -Force -Path (Split-Path $Log), $Bin | Out-Null
function L($m) { "$(Get-Date -Format o) $m" | Tee-Object $Log -Append }

# Sync scripts into bin
$scriptNames = @(
  'Start-HiveAiDock.ps1', 'Start-HiveCockpit.ps1', 'Start-HiveCockpitApi.ps1',
  'Set-HiveCockpitMode.ps1', 'Install-Ollama.ps1', 'Apply-HiveBranding.ps1',
  'Install-HiveShells.ps1', 'Install-HiveAgents.ps1', 'Hive-FirstLogon.ps1'
)
foreach ($n in $scriptNames) {
  foreach ($base in @(
    (Join-Path $HiveRoot 'HIVE_WINDOWS\scripts'),
    'C:\ProgramData\THE_HIVE\scripts',
    'C:\Users\ARCHITECT\THE_HIVE\HIVE_WINDOWS\scripts'
  )) {
    $src = Join-Path $base $n
    if (Test-Path $src) { Copy-Item $src (Join-Path $Bin $n) -Force; break }
  }
}

# UI offline copy
$uiDir = 'C:\ProgramData\THE_HIVE\ui'
New-Item -ItemType Directory -Force -Path $uiDir | Out-Null
foreach ($u in @('hive-cockpit-offline.html', 'chamber.html')) {
  $src = Join-Path $HiveRoot "HIVE_WINDOWS\ui\$u"
  if (Test-Path $src) { Copy-Item $src (Join-Path $uiDir $u) -Force }
}

# Options default
$optSrc = Join-Path $HiveRoot 'HIVE_WINDOWS\DNA\HIVE_OPTIONS.json'
if (Test-Path $optSrc -and -not (Test-Path 'C:\ProgramData\THE_HIVE\HIVE_OPTIONS.json')) {
  Copy-Item $optSrc 'C:\ProgramData\THE_HIVE\HIVE_OPTIONS.json' -Force
}

# Shortcut helper
function New-HiveLnk($Path, $Target, $Args, $Desc, $Icon) {
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

$StartHive = "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\THE HIVE"
$Shells = Join-Path $StartHive 'Shells'
$Ctrl = Join-Path $StartHive 'Control'
$Ai = Join-Path $StartHive 'AI Chambers'
$Desk = $env:Public + '\Desktop'
New-Item -ItemType Directory -Force -Path $StartHive, $Shells, $Ctrl, $Ai, $Desk | Out-Null

# Core launchers
$lnkCockpitOff = New-HiveLnk "$StartHive\HIVE COCKPIT (OFFLINE).lnk" 'powershell.exe' `
  "-NoProfile -ExecutionPolicy Bypass -File `"$Bin\Start-HiveCockpit.ps1`" -Mode offline" `
  'Offline cockpit — no API required' '%SystemRoot%\System32\shell32.dll,13'

$lnkCockpitApi = New-HiveLnk "$StartHive\HIVE COCKPIT (API).lnk" 'powershell.exe' `
  "-NoProfile -ExecutionPolicy Bypass -File `"$Bin\Start-HiveCockpit.ps1`" -Mode api" `
  'API cockpit — 127.0.0.1:8787' '%SystemRoot%\System32\shell32.dll,14'

$lnkDock = New-HiveLnk "$StartHive\HIVE AI DOCK.lnk" 'powershell.exe' `
  "-NoProfile -ExecutionPolicy Bypass -File `"$Bin\Start-HiveAiDock.ps1`"" `
  'Permanent AI chat buttons' '%SystemRoot%\System32\shell32.dll,24'

$lnkModeOff = New-HiveLnk "$Ctrl\MODE Offline Autostart.lnk" 'powershell.exe' `
  "-NoProfile -ExecutionPolicy Bypass -File `"$Bin\Set-HiveCockpitMode.ps1`" -Mode offline-autostart" `
  'Autostart offline cockpit' '%SystemRoot%\System32\shell32.dll,1'

$lnkModeApi = New-HiveLnk "$Ctrl\MODE API Autostart.lnk" 'powershell.exe' `
  "-NoProfile -ExecutionPolicy Bypass -File `"$Bin\Set-HiveCockpitMode.ps1`" -Mode api-autostart" `
  'Autostart API cockpit' '%SystemRoot%\System32\shell32.dll,1'

$lnkOllama = New-HiveLnk "$Ctrl\Repair Install Ollama.lnk" 'powershell.exe' `
  "-NoProfile -ExecutionPolicy Bypass -File `"$Bin\Install-Ollama.ps1`"" `
  'Install/repair Ollama models' '%SystemRoot%\System32\shell32.dll,21'

# Ensure shell lnks exist
$lnkShell = "$Shells\KRACKERJACK AI SHELL.lnk"
$lnkCmd = "$Shells\KRACKERJACK AI COMMAND LINE.lnk"
$lnkHcp = "$Ctrl\HIVE CONTROL PANEL.lnk"
if (-not (Test-Path $lnkShell)) {
  New-HiveLnk $lnkShell "$Bin\KRACKERJACK_AI_SHELL.cmd" $null 'KRACKERJACK AI SHELL' '%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe,0' | Out-Null
}
if (-not (Test-Path $lnkCmd)) {
  New-HiveLnk $lnkCmd "$Bin\KRACKERJACK_AI_COMMAND_LINE.cmd" $null 'KRACKERJACK AI COMMAND LINE' '%SystemRoot%\System32\cmd.exe,0' | Out-Null
}
if (-not (Test-Path $lnkHcp)) {
  New-HiveLnk $lnkHcp "$Bin\HIVE_CONTROL_PANEL.cmd" $null 'HIVE CONTROL PANEL' '%SystemRoot%\System32\control.exe,0' | Out-Null
}

# "Just because" system pins
$extra = @(
  @{ Path = "$StartHive\HIVE FILE NEXUS.lnk"; Target = 'explorer.exe'; Args = $null; Icon = '%SystemRoot%\System32\explorer.exe,0'; Desc = 'File Explorer' },
  @{ Path = "$StartHive\HIVE SETTINGS.lnk"; Target = 'ms-settings:'; Args = $null; Icon = '%SystemRoot%\System32\shell32.dll,21'; Desc = 'Settings' },
  @{ Path = "$StartHive\HIVE PROCESS SWARM.lnk"; Target = 'taskmgr.exe'; Args = $null; Icon = '%SystemRoot%\System32\taskmgr.exe,0'; Desc = 'Task Manager' },
  @{ Path = "$StartHive\HIVE SCROLL.lnk"; Target = 'notepad.exe'; Args = $null; Icon = '%SystemRoot%\System32\notepad.exe,0'; Desc = 'Notepad' },
  @{ Path = "$Desk\HIVE COCKPIT.lnk"; Target = 'powershell.exe'; Args = "-NoProfile -ExecutionPolicy Bypass -File `"$Bin\Start-HiveCockpit.ps1`""; Icon = '%SystemRoot%\System32\shell32.dll,13'; Desc = 'Cockpit' },
  @{ Path = "$Desk\HIVE AI DOCK.lnk"; Target = 'powershell.exe'; Args = "-NoProfile -ExecutionPolicy Bypass -File `"$Bin\Start-HiveAiDock.ps1`""; Icon = '%SystemRoot%\System32\shell32.dll,24'; Desc = 'Dock' }
)
foreach ($e in $extra) {
  New-HiveLnk $e.Path $e.Target $e.Args $e.Desc $e.Icon | Out-Null
}

function Invoke-Pin([string]$lnk) {
  if (-not (Test-Path $lnk)) { L "skip pin missing $lnk"; return }
  try {
    $shell = New-Object -ComObject Shell.Application
    $folder = $shell.Namespace((Split-Path $lnk))
    $item = $folder.ParseName((Split-Path $lnk -Leaf))
    foreach ($v in $item.Verbs()) {
      $name = ($v.Name -replace '&', '')
      if ($name -match 'Pin to taskbar' -or $name -match 'Pin to Tas') {
        $v.DoIt(); L "Pinned $lnk"; return
      }
    }
    L "No pin verb: $lnk"
  } catch { L "pin fail $lnk : $_" }
}

# Important + just because
$pinList = @(
  $lnkCockpitOff,
  $lnkCockpitApi,
  $lnkDock,
  $lnkShell,
  $lnkCmd,
  $lnkHcp,
  "$StartHive\HIVE FILE NEXUS.lnk",
  "$StartHive\HIVE SETTINGS.lnk",
  "$StartHive\HIVE PROCESS SWARM.lnk",
  "$Desk\HIVE COCKPIT.lnk"
)
# Agent chamber pins
Get-ChildItem $Ai -Filter '*.lnk' -ErrorAction SilentlyContinue | ForEach-Object { $pinList += $_.FullName }

foreach ($p in $pinList) { Invoke-Pin $p }

# Startup: dock always
$startup = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
New-Item -ItemType Directory -Force -Path $startup | Out-Null
New-HiveLnk "$startup\HIVE AI DOCK.lnk" 'powershell.exe' `
  "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$Bin\Start-HiveAiDock.ps1`"" `
  'HIVE AI DOCK' $null | Out-Null

# Ollama serve at logon
New-HiveLnk "$startup\HIVE OLLAMA.lnk" 'powershell.exe' `
  "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command `"Start-Process -WindowStyle Hidden -FilePath (Join-Path `$env:LOCALAPPDATA 'Programs\Ollama\ollama.exe') -ArgumentList 'serve' -ErrorAction SilentlyContinue`"" `
  'Ollama serve' $null | Out-Null

# Apply cockpit mode autostart from options
$modeScript = Join-Path $Bin 'Set-HiveCockpitMode.ps1'
$opt = 'C:\ProgramData\THE_HIVE\HIVE_OPTIONS.json'
$mode = 'offline-autostart'
if (Test-Path $opt) {
  try {
    $j = Get-Content $opt -Raw | ConvertFrom-Json
    if ($j.autostart_api -eq $true) { $mode = 'api-autostart' }
    elseif ($j.cockpit_mode -eq 'api') { $mode = 'api' }
    else { $mode = 'offline-autostart' }
  } catch {}
}
if (Test-Path $modeScript) {
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $modeScript -Mode $mode
  L "Cockpit mode applied: $mode"
}

# Run keys
$run = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
New-Item -Path $run -Force | Out-Null
Set-ItemProperty $run -Name 'HIVE_AI_DOCK' -Value "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$Bin\Start-HiveAiDock.ps1`"" -Force

# Junk off
$adv = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced'
Set-ItemProperty $adv -Name TaskbarDa -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue
Set-ItemProperty $adv -Name TaskbarMn -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue

L 'Taskbar/pins/autostart complete'
Write-Host '[+] Hive taskbar + pins + cockpit modes installed'
