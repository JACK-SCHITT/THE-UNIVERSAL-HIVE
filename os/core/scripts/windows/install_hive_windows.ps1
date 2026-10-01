# HIVE-OS full Windows war-room integration
# Safe: no disk wipe, no remote UI bind, no secrets in git
# Architect: KRACKERJACK1134

[CmdletBinding()]
param(
  [switch]$SkipBrain,
  [switch]$SkipShortcuts,
  [switch]$SkipScheduledTask,
  [switch]$SkipAssimilate,
  [switch]$SkipWsl,
  [switch]$SkipContextMenu,
  [switch]$SkipSystemTray,
  [switch]$SkipFileAssociations,
  [string]$UpgradeTime = "03:30"
)

$ErrorActionPreference = "Stop"
$HIVE = if ($env:HIVE_ROOT) { $env:HIVE_ROOT } else { "C:\Users\ARCHITECT\THE_HIVE" }
if (-not (Test-Path (Join-Path $HIVE "HIVE_CORE\manifest.json"))) {
  throw "Hive root not found: $HIVE"
}

function Write-Step { param([string]$Message) Write-Host "`n=== $Message ===" -ForegroundColor Cyan }
function Write-Ok { param([string]$Message) Write-Host "[+] $Message" -ForegroundColor Green }
function Write-Warn { param([string]$Message) Write-Host "[!] $Message" -ForegroundColor Yellow }

Write-Host "=============================================="
Write-Host "  HIVE WINDOWS FULL WIRE-UP"
Write-Host "  Root: $HIVE"
Write-Host "  Protocol: ASSIMILATE OR DIE (no auto-wipe)"
Write-Host "=============================================="

# --- 1) Environment ---
Write-Step "1/8 User environment"
[Environment]::SetEnvironmentVariable("HIVE_ROOT", $HIVE, "User")
[Environment]::SetEnvironmentVariable("HIVE_BRAIN", "local", "User")
$env:HIVE_ROOT = $HIVE
$env:HIVE_BRAIN = "local"

$bin = Join-Path $HIVE "bin"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if (-not $userPath) { $userPath = "" }
$pathParts = $userPath -split ";" | Where-Object { $_ -and $_.Trim() }
if ($pathParts -notcontains $bin) {
  $newPath = if ($userPath.TrimEnd(";")) { "$userPath;$bin" } else { $bin }
  [Environment]::SetEnvironmentVariable("Path", "$newPath;$env:Path", 'User')
  $env:Path = "$env:Path;$bin"
  Write-Ok "PATH += $bin"
} else {
  Write-Ok "PATH already has bin"
  if ($env:Path -notlike "*$bin*") { $env:Path = "$env:Path;$bin" }
}
Write-Ok "HIVE_ROOT=$HIVE"
Write-Ok "HIVE_BRAIN=local"

# --- Beachheads ---
Write-Step "2/8 Beachheads"
$beachList = @(
  "C:\Hive",
  "C:\ProgramData\THE_HIVE\war-room"
)
foreach ($beach in $beachList) {
  $parent = Split-Path $beach -Parent
  if ($parent -and -not (Test-Path $parent)) {
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
  }
  if (Test-Path $beach) {
    $item = Get-Item $beach -Force
    if ($item.LinkType -eq "Junction") {
      $tgt = @($item.Target) -join "; "
      Write-Host "[+] $beach junction OK -> $tgt" -ForegroundColor Green
    } else {
      Write-Host "[!] $beach exists but is not a junction - left untouched" -ForegroundColor Yellow
    }
  } else {
    cmd /c mklink /J "$beach" "$HIVE" | Out-Null
    Write-Host "[+] Created junction $beach -> $HIVE" -ForegroundColor Green
  }
}
$progTrap = "C:\Program"
if (Test-Path $progTrap) {
  $p = Get-Item $progTrap -Force
  if (-not $p.PSIsContainer) {
    Write-Host "[!] TRAP confirmed: C:\Program is an empty FILE (do not use as a path base)" -ForegroundColor Yellow
  }
}

# --- .env local brain ---
Write-Step "3/8 .env local defaults"
$envFile = Join-Path $HIVE ".env"
if (Test-Path $envFile) {
  $raw = Get-Content $envFile -Raw
  if ($raw -match "HIVE_BRAIN=") {
    $raw = $raw -replace "HIVE_BRAIN=\S+", "HIVE_BRAIN=local"
  } else {
    $raw = $raw.TrimEnd() + "`r`nHIVE_BRAIN=local`r`n"
  }
  if ($raw -notmatch "HIVE_ROOT=") {
    $raw = $raw.TrimEnd() + "`r`nHIVE_ROOT=$HIVE`r`n"
  }
  if ($raw -notmatch "OLLAMA_HOST=") {
    $raw = $raw.TrimEnd() + "`r`nOLLAMA_HOST=http://127.0.0.1:11434`r`n"
  }
  if ($raw -notmatch "OLLAMA_MODEL=") {
    $raw = $raw.TrimEnd() + "`r`nOLLAMA_MODEL=llama3.2:3b`r`n"
  }
  Set-Content -Path $envFile -Value $raw -Encoding UTF8
  Write-Ok -Message ".env set HIVE_BRAIN=local"
} else {
  Write-Warn -Message ".env missing - copy from .env.example if needed"
}

# --- PowerShell profile ---
Write-Step "4/8 PowerShell profile"
$profileDir = Split-Path $PROFILE -Parent
if (-not (Test-Path $profileDir)) {
  New-Item -ItemType Directory -Force -Path $profileDir | Out-Null
}
$markerStart = "# >>> HIVE-OS BEGIN"
$markerEnd = "# <<< HIVE-OS END"
$snippet = @"
$markerStart
# Auto-installed by scripts\windows\install_hive_windows.ps1
`$env:HIVE_ROOT = 'C:\Users\ARCHITECT\THE_HIVE'
if (-not `$env:HIVE_BRAIN) { `$env:HIVE_BRAIN = 'local' }
`$hiveBin = Join-Path `$env:HIVE_ROOT 'bin'
if (`$env:Path -notlike "*`$hiveBin*") { `$env:Path = "`$hiveBin;`$env:Path" }
. (Join-Path `$env:HIVE_ROOT 'scripts\windows\hive_profile.ps1')
$markerEnd
"@
$existing = ""
if (Test-Path $PROFILE) { $existing = Get-Content $PROFILE -Raw }
if ($existing -match [regex]::Escape($markerStart)) {
  $existing = [regex]::Replace(
    $existing,
    "(?s)" + [regex]::Escape($markerStart) + ".*?" + [regex]::Escape($markerEnd),
    $snippet.TrimEnd()
  )
  Set-Content -Path $PROFILE -Value ($existing.TrimEnd() + "`r`n") -Encoding UTF8
  Write-Ok "Updated HIVE block in $PROFILE"
} else {
  $out = if ($existing.Trim()) { $existing.TrimEnd() + "`r`n`r`n" + $snippet } else { $snippet }
  Set-Content -Path $PROFILE -Value ($out.TrimEnd() + "`r`n") -Encoding UTF8
  Write-Ok -Message "Installed HIVE block in $PROFILE"
}
# Load for this session
. (Join-Path $HIVE "scripts\windows\hive_profile.ps1")

# --- Shortcuts ---
if (-not $SkipShortcuts) {
  Write-Step "5/8 Start Menu + Desktop shortcuts"
  $startDir = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\HIVE-OS"
  New-Item -ItemType Directory -Force -Path $startDir | Out-Null
  $desktop = [Environment]::GetFolderPath("Desktop")
  $wsh = New-Object -ComObject WScript.Shell

  $shortcuts = @(
    @{
      Name = "Hive Cockpit"
      Target = "powershell.exe"
      Args = "-NoProfile -ExecutionPolicy Bypass -File `"$HIVE\scripts\start_hive_ui.ps1`""
      Work = $HIVE
      Desc = "Hive cockpit UI (localhost:8787)"
    },
    @{
      Name = "KRACKERJACK First Contact"
      Target = "powershell.exe"
      Args = "-NoExit -NoProfile -Command `"cd '$HIVE'; `$env:HIVE_BRAIN='local'; python NEURAL\krackerjack\first_contact.py`""
      Work = $HIVE
      Desc = "KRACKERJACK AI first contact"
    },
    @{
      Name = "Hive Status"
      Target = "powershell.exe"
      Args = "-NoExit -NoProfile -Command `"cd '$HIVE'; `$env:HIVE_BRAIN='local'; python NEURAL\brain\hive_link.py status`""
      Work = $HIVE
      Desc = "Hive-Link status"
    },
    @{
      Name = "Hive Shell"
      Target = "powershell.exe"
      Args = "-NoExit -NoProfile -Command `"cd '$HIVE'; `$env:HIVE_ROOT='$HIVE'; `$env:HIVE_BRAIN='local'; `$env:Path = '$HIVE\bin;' + `$env:Path; Write-Host 'HIVE war room ready. Try: hive status'`""
      Work = $HIVE
      Desc = "PowerShell in war room with hive on PATH"
    }
  )

  foreach ($s in $shortcuts) {
    foreach ($dir in @($startDir, $desktop)) {
      $lnkPath = Join-Path $dir ($s.Name + ".lnk")
      $sc = $wsh.CreateShortcut($lnkPath)
      $sc.TargetPath = $s.Target
      $sc.Arguments = $s.Args
      $sc.WorkingDirectory = $s.Work
      $sc.Description = $s.Desc
      $sc.Save()
    }
    Write-Ok "Shortcut: $($s.Name)"
  }
} else {
  Write-Warn "Skipping shortcuts"
}

# --- Enhanced Integrations ---
if (-not $SkipContextMenu) {
  Write-Step "6a/8 Context Menu Integration"
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $HIVE "scripts\windows\Install-HiveContextMenu.ps1")
} else {
  Write-Warn "Skipping context menu integration"
}

if (-not $SkipSystemTray) {
  Write-Step "6b/8 System Tray Application"
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $HIVE "scripts\windows\Install-HiveSystemTray.ps1") -StartNow
} else {
  Write-Warn "Skipping system tray application"
}

if (-not $SkipFileAssociations) {
  Write-Step "6c/8 File Associations"
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $HIVE "scripts\windows\Install-HiveFileAssociations.ps1")
} else {
  Write-Warn "Skipping file associations"
}

# --- Scheduled self-upgrade ---
if (-not $SkipScheduledTask) {
  Write-Step "7/8 Scheduled self-upgrade (offline)"
  $taskName = "HIVE-OS-SelfUpgrade"
  $ps = "Set-Location '$HIVE'; `$env:HIVE_BRAIN='local'; python NEURAL\brain\self_upgrade.py --offline"
  $action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -Command `"$ps`""
  $trigger = New-ScheduledTaskTrigger -Daily -At $UpgradeTime
  $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
    -StartWhenAvailable -MultipleInstances IgnoreNew
  $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
  try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger `
      -Settings $settings -Principal $principal -Force | Out-Null
    Write-Ok -Message "Scheduled task $taskName daily at $UpgradeTime (user-level offline)"
  } catch {
    Write-Warn -Message "Could not register scheduled task: $_"
    Write-Warn -Message "You can re-run later as the same user or create manually."
  }
} else {
  Write-Warn "Skipping scheduled task"
}

# --- Brain bootstrap ---
if (-not $SkipBrain) {
  Write-Step "8/8 Local brain bootstrap"
  try {
    & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $HIVE "scripts\bootstrap_local_brain.ps1")
  } catch {
    Write-Warn "Brain bootstrap issue: $_"
  }
} else {
  Write-Warn "Skipping brain bootstrap"
}

# --- Assimilate ---
if (-not $SkipAssimilate) {
  Write-Step "9/9 Assimilate Gentoo seed"
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $HIVE "scripts\assimilate\assimilate_gentoo.ps1")
} else {
  Write-Warn "Skipping assimilate"
}

# --- WSL ---
if (-not $SkipWsl) {
  Write-Step "10/10 WSL kali bridge"
  try {
    # wsl -l emits UTF-16; strip nulls so -match works under PS 5.1
    $wslRaw = & wsl -l -v 2>&1 | Out-String
    $wslList = ($wslRaw -replace "`0", "")
    if ($wslList -match "kali-linux") {
      Write-Ok -Message "WSL distro kali-linux present - staging (may take a few minutes)..."
      & wsl -d kali-linux -e bash -lc "bash /mnt/c/Users/ARCHITECT/THE_HIVE/scripts/wsl_stage_hive.sh"
      if ($LASTEXITCODE -eq 0) {
        Write-Ok -Message "WSL staging complete"
      } else {
        Write-Warn -Message "WSL stage exited $LASTEXITCODE"
      }
    } else {
      Write-Warn -Message "kali-linux not found in wsl -l"
      Write-Host $wslList
    }
  } catch {
    Write-Warn -Message "WSL stage failed: $_"
  }
} else {
  Write-Warn "Skipping WSL"
}

# --- Verify ---
Write-Step "Verification"
Set-Location $HIVE
Write-Host "--- hive_link status ---"
python NEURAL\brain\hive_link.py status
Write-Host "--- first_contact status ---"
python NEURAL\krackerjack\first_contact.py status
Write-Host "--- beachheads ---"
Get-Item C:\Hive, C:\ProgramData\THE_HIVE\war-room -ErrorAction SilentlyContinue |
  Format-Table FullName, LinkType -AutoSize
$statusFile = Join-Path $HIVE "GENESIS\STATUS"
if (Test-Path $statusFile) {
  $st = (Get-Content $statusFile -Raw).Trim()
  Write-Ok -Message "GENESIS STATUS: $st"
}
$task = Get-ScheduledTask -TaskName "HIVE-OS-SelfUpgrade" -ErrorAction SilentlyContinue
if ($task) { Write-Ok -Message ("Task: {0} [{1}]" -f $task.TaskName, $task.State) }

Write-Host ""
Write-Host "=============================================="
Write-Host "  WIRE-UP COMPLETE"
Write-Host "  Open a NEW terminal for PATH/env to stick."
Write-Host "  hive status | hive ui | krackerjack"
Write-Host "  Cockpit: http://127.0.0.1:8787/"
Write-Host ""
Write-Host "  NEW FEATURES:"
Write-Host "  * Right-click context menu: Ask KRACKERJACK, Scan with ZORG, etc."
Write-Host "  * System tray application with quick access to all agents"
Write-Host "  * File associations for .hive-* files"
Write-Host "=============================================="