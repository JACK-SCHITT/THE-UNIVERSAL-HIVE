#Requires -Version 5.1
$ErrorActionPreference = 'Continue'
$HiveRoot = if (Test-Path 'C:\HIVE') { 'C:\HIVE' } else { 'C:\ProgramData\THE_HIVE\war-room' }
$Chambers = "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\THE HIVE\AI Chambers"
$Dna = 'C:\ProgramData\THE_HIVE\DNA'
New-Item -ItemType Directory -Force -Path $Chambers, $Dna | Out-Null

# Copy DNA
foreach ($rel in @('HIVE_WINDOWS\DNA\AGENTS.json', 'HIVE_WINDOWS\DNA\REBRAND.json', 'HIVE_CORE\ui\SKIN_REGISTRY.json', 'HIVE_CORE\ui\LAYOUT.json')) {
  $src = Join-Path $HiveRoot $rel
  if (Test-Path $src) {
    $destDir = Join-Path $Dna (Split-Path $rel -Parent | Split-Path -Leaf)
    if ($rel -like 'HIVE_CORE*') { $destDir = Join-Path $Dna 'ui' }
    else { $destDir = $Dna }
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
    Copy-Item $src $destDir -Force
  }
}

$agentsFile = Join-Path $HiveRoot 'HIVE_WINDOWS\DNA\AGENTS.json'
if (-not (Test-Path $agentsFile)) { Write-Host '[!] AGENTS.json missing'; return }
$agents = (Get-Content $agentsFile -Raw | ConvertFrom-Json).agents
$w = New-Object -ComObject WScript.Shell

foreach ($a in $agents) {
  $id = $a.id
  $label = $a.label
  $launcher = "C:\ProgramData\THE_HIVE\bin\agent_$id.cmd"
  $body = @"
@echo off
title $label — THE HIVE
set HIVE_ROOT=$HiveRoot
set HIVE_BRAIN=local
echo $label — 100%% individual · 100%% combined force
echo If I don't know it, I learn it and continue.
python "%HIVE_ROOT%\NEURAL\brain\agents.py" $id %*
if errorlevel 1 python "%HIVE_ROOT%\NEURAL\krackerjack\first_contact.py" %*
pause
"@
  Set-Content -Path $launcher -Value $body -Encoding ASCII
  $lnk = Join-Path $Chambers "$label.lnk"
  $s = $w.CreateShortcut($lnk)
  $s.TargetPath = $launcher
  $s.Description = "$label — Hive chamber"
  $s.WorkingDirectory = $HiveRoot
  $s.Save()
}

# Chamber HTML (skin-aware multi-AI face)
$uiDir = Join-Path $HiveRoot 'HIVE_WINDOWS\ui'
New-Item -ItemType Directory -Force -Path $uiDir | Out-Null
Write-Host '[+] AI chambers installed'
