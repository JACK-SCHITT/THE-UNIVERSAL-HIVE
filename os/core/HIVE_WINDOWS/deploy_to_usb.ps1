#Requires -Version 5.1
param(
  [ValidatePattern('^[A-Za-z]$')]
  [string]$Drive = 'D',
  [switch]$SkipGenesisStage3,
  [switch]$WhatIf
)

$ErrorActionPreference = 'Stop'
$Root = 'C:\Users\ARCHITECT\THE_HIVE'
$Hw = Join-Path $Root 'HIVE_WINDOWS'
$Target = "${Drive}:"
$UsbHive = Join-Path $Target 'HIVE'
$Oem = Join-Path $Target 'sources\$OEM$'

function Write-Step([string]$m) { Write-Host "[*] $m" -ForegroundColor Cyan }
function Write-Ok([string]$m) { Write-Host "[+] $m" -ForegroundColor Green }
function Write-Warn([string]$m) { Write-Host "[!] $m" -ForegroundColor Yellow }

if (-not (Test-Path $Target)) { throw "Drive $Target not found" }
$vol = Get-Volume -DriveLetter $Drive -ErrorAction Stop
if ($vol.DriveType -ne 'Removable') {
  Write-Warn "Drive $Drive DriveType=$($vol.DriveType) - continuing"
}
$wimInstall = Join-Path $Target 'sources\install.wim'
$wimBoot = Join-Path $Target 'sources\boot.wim'
if (-not (Test-Path $wimInstall) -and -not (Test-Path $wimBoot)) {
  throw "Not a Windows installer USB (missing sources\*.wim)"
}

$freeGB = [math]::Round($vol.SizeRemaining / 1GB, 2)
Write-Step "Target $Target free=${freeGB}GB fs=$($vol.FileSystem)"
if ($freeGB -lt 0.5) { throw "Not enough free space on $Target" }

if ($WhatIf) {
  Write-Host "WhatIf: would deploy HIVE to $UsbHive and $Oem"
  exit 0
}

Write-Step "Staging DNA to $UsbHive"
New-Item -ItemType Directory -Force -Path $UsbHive | Out-Null

$dirs = @('NEURAL', 'HIVE_CORE', 'docs', 'cold-storage', 'scripts', 'HIVE_WINDOWS')
foreach ($d in $dirs) {
  $src = Join-Path $Root $d
  if (Test-Path $src) {
    Write-Step "  robocopy $d"
    & robocopy $src (Join-Path $UsbHive $d) /E /XD .git __pycache__ node_modules .venv /XF *.pyc .env /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
  }
}

$fleetSrc = Join-Path $Root 'FLEET'
if (Test-Path $fleetSrc) {
  Write-Step '  robocopy FLEET'
  & robocopy $fleetSrc (Join-Path $UsbHive 'FLEET') /E /XD .git node_modules .venv dist build /XF *.pyc .env /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
}

$genSrc = Join-Path $Root 'GENESIS'
$genDst = Join-Path $UsbHive 'GENESIS'
if (Test-Path $genSrc) {
  New-Item -ItemType Directory -Force -Path $genDst | Out-Null
  Get-ChildItem $genSrc -File -ErrorAction SilentlyContinue | ForEach-Object {
    Copy-Item $_.FullName $genDst -Force
  }
  foreach ($sub in @('manifests', 'iso')) {
    $s = Join-Path $genSrc $sub
    if (Test-Path $s) {
      & robocopy $s (Join-Path $genDst $sub) /E /XF *.tar.xz /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
    }
  }
  if (-not $SkipGenesisStage3) {
    $sparc = Join-Path $genSrc 'gentoo-sparc'
    if (Test-Path $sparc) {
      Write-Step '  GENESIS gentoo-sparc'
      & robocopy $sparc (Join-Path $genDst 'gentoo-sparc') /E /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
    }
  } else {
    Write-Warn 'SkipGenesisStage3 set'
  }
}

Copy-Item (Join-Path $Root 'README.md') $UsbHive -Force -ErrorAction SilentlyContinue

Write-Step 'Building sources\$OEM$'
$setupScripts = Join-Path $Oem '$$\Setup\Scripts'
New-Item -ItemType Directory -Force -Path $setupScripts | Out-Null
Copy-Item (Join-Path $Hw 'OEM\$$\Setup\Scripts\SetupComplete.cmd') $setupScripts -Force

$oemHive = Join-Path $Oem '$1\HIVE'
$oemPd = Join-Path $Oem '$1\ProgramData\THE_HIVE'
New-Item -ItemType Directory -Force -Path $oemHive | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $oemPd 'bin') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $oemPd 'logs') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $oemPd 'DNA') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $oemPd 'scripts') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $oemPd 'war-room') | Out-Null

Write-Step '  OEM `$1\HIVE mirror'
& robocopy $UsbHive $oemHive /E /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
& robocopy $UsbHive (Join-Path $oemPd 'war-room') /E /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
& robocopy (Join-Path $Hw 'scripts') (Join-Path $oemPd 'scripts') /E /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
& robocopy (Join-Path $Hw 'DNA') (Join-Path $oemPd 'DNA') /E /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
Copy-Item (Join-Path $Hw 'scripts\Start-HiveAiDock.ps1') (Join-Path $oemPd 'bin\Start-HiveAiDock.ps1') -Force

Write-Step 'Autounattend.xml'
Copy-Item (Join-Path $Hw 'Autounattend.xml') (Join-Path $Target 'Autounattend.xml') -Force

$bootLines = @(
  '============================================',
  '  HIVE OS on WINDOWS INSTALLER USB',
  '============================================',
  'This stick still runs Microsoft Windows Setup.',
  'After install, it becomes HIVE OS:',
  '',
  '  - KRACKERJACK AI SHELL (PowerShell)',
  '  - KRACKERJACK AI COMMAND LINE (cmd)',
  '  - HIVE CONTROL PANEL',
  '  - HIVE AI DOCK (all AI chat buttons)',
  '    resizable, not casually removable',
  '  - Each AI/app chamber keeps its own face',
  '  - 100% individual + 100% combined force',
  '  - Learn when unknown, then continue and complete',
  '',
  "DNA on this USB:  ${Drive}:\HIVE",
  "OEM inject:       ${Drive}:\sources\`$OEM`$",
  "Unattend:         ${Drive}:\Autounattend.xml",
  '',
  'Boot PC from this USB -> install Windows -> first logon applies THE HIVE.',
  '',
  'Architect: KRACKERJACK1134',
  'Protocol: ASSIMILATE OR DIE',
  '============================================'
)
$bootTxt = $bootLines -join "`r`n"
Set-Content -Path (Join-Path $Target 'HIVE_BOOT.txt') -Value $bootTxt -Encoding ASCII
Set-Content -Path (Join-Path $UsbHive 'HIVE_OS_ON_WINDOWS.txt') -Value $bootTxt -Encoding ASCII

$usbLaunch = @(
  '@echo off',
  'title HIVE OS - INTERACTIVE PREVIEW',
  'set HIVE_ROOT=%~d0\HIVE',
  'set HIVE_BRAIN=local',
  'echo HIVE DNA: %HIVE_ROOT%',
  'echo INTERACTIVE preview (default for all projects) — keep/rework prompts...',
  'powershell -NoProfile -ExecutionPolicy Bypass -File "%HIVE_ROOT%\HIVE_WINDOWS\scripts\Run-HivePreview.ps1" -Choice Ask -UseConsole',
  'pause'
) -join "`r`n"
Set-Content -Path (Join-Path $Target 'LAUNCH_HIVE_PREVIEW.cmd') -Value $usbLaunch -Encoding ASCII

Copy-Item (Join-Path $Hw 'README.md') (Join-Path $Target 'HIVE_OS_README.md') -Force

function Get-DirMB([string]$p) {
  if (-not (Test-Path $p)) { return 0 }
  $sum = (Get-ChildItem $p -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
  if (-not $sum) { return 0 }
  return [math]::Round(($sum / 1MB), 1)
}

Write-Ok ("HIVE folder: {0} MB" -f (Get-DirMB $UsbHive))
Write-Ok ("OEM folder:  {0} MB" -f (Get-DirMB $Oem))
$freeNow = [math]::Round((Get-Volume -DriveLetter $Drive).SizeRemaining / 1GB, 2)
Write-Ok "USB free now: $freeNow GB"
Write-Host ''
Write-Host '==========================================' -ForegroundColor Yellow
Write-Host '  HIVE OS USB READY' -ForegroundColor Yellow
Write-Host "  Install: boot $Target then Windows Setup" -ForegroundColor Green
Write-Host "  Preview: $Target\LAUNCH_HIVE_PREVIEW.cmd" -ForegroundColor Green
Write-Host '  AI dock: all agents, resizable, persistent' -ForegroundColor Green
Write-Host '  Renames: SHELL / COMMAND LINE / CONTROL PANEL' -ForegroundColor Green
Write-Host '==========================================' -ForegroundColor Yellow
