#Requires -Version 5.1
<#
  Switch cockpit modes:
    offline           - file UI only (works without Python API)
    api               - use API when opened; do not autostart API
    offline-autostart - autostart offline cockpit at logon
    api-autostart     - autostart Python API + browser to localhost
#>
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('offline', 'api', 'offline-autostart', 'api-autostart')]
  [string]$Mode
)

$ErrorActionPreference = 'Stop'
$OptDir = 'C:\ProgramData\THE_HIVE'
$OptFile = Join-Path $OptDir 'HIVE_OPTIONS.json'
$Bin = Join-Path $OptDir 'bin'
$Run = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
$Startup = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
New-Item -ItemType Directory -Force -Path $OptDir, $Bin, $Startup | Out-Null

$opts = @{
  version            = '1.1.0'
  cockpit_mode       = 'offline'
  autostart_cockpit  = $true
  autostart_api      = $false
  autostart_ollama   = $true
  autostart_dock     = $true
  ollama_models      = @('llama3.2:3b', 'tinyllama')
  default_model      = 'llama3.2:3b'
}
if (Test-Path $OptFile) {
  try {
    $j = Get-Content $OptFile -Raw | ConvertFrom-Json
    foreach ($p in $j.PSObject.Properties) { $opts[$p.Name] = $p.Value }
  } catch {}
}

switch ($Mode) {
  'offline' {
    $opts.cockpit_mode = 'offline'
    $opts.autostart_cockpit = $true
    $opts.autostart_api = $false
  }
  'api' {
    $opts.cockpit_mode = 'api'
    $opts.autostart_cockpit = $true
    $opts.autostart_api = $false
  }
  'offline-autostart' {
    $opts.cockpit_mode = 'offline'
    $opts.autostart_cockpit = $true
    $opts.autostart_api = $false
  }
  'api-autostart' {
    $opts.cockpit_mode = 'api'
    $opts.autostart_cockpit = $true
    $opts.autostart_api = $true
  }
}

$opts | ConvertTo-Json -Depth 6 | Set-Content $OptFile -Encoding UTF8

# Clear prior run keys for cockpit/api
Remove-ItemProperty -Path $Run -Name 'HIVE_COCKPIT' -ErrorAction SilentlyContinue
Remove-ItemProperty -Path $Run -Name 'HIVE_COCKPIT_API' -ErrorAction SilentlyContinue
Remove-Item -Path "$Startup\HIVE COCKPIT.lnk" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$Startup\HIVE COCKPIT API.lnk" -Force -ErrorAction SilentlyContinue

$startCockpit = Join-Path $Bin 'Start-HiveCockpit.ps1'
# Prefer ProgramData copy; fall back to C:\HIVE
if (-not (Test-Path $startCockpit)) {
  $cands = @(
    'C:\HIVE\HIVE_WINDOWS\scripts\Start-HiveCockpit.ps1',
    'C:\ProgramData\THE_HIVE\war-room\HIVE_WINDOWS\scripts\Start-HiveCockpit.ps1',
    'C:\Users\ARCHITECT\THE_HIVE\HIVE_WINDOWS\scripts\Start-HiveCockpit.ps1'
  )
  foreach ($c in $cands) {
    if (Test-Path $c) { Copy-Item $c $startCockpit -Force; break }
  }
}

$w = New-Object -ComObject WScript.Shell
if ($opts.autostart_cockpit) {
  $sc = $w.CreateShortcut("$Startup\HIVE COCKPIT.lnk")
  $sc.TargetPath = 'powershell.exe'
  $sc.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$startCockpit`""
  $sc.Description = 'HIVE Cockpit autostart'
  $sc.Save()
  Set-ItemProperty $Run -Name 'HIVE_COCKPIT' -Value "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$startCockpit`"" -Force
}

if ($opts.autostart_api) {
  $apiScript = Join-Path $Bin 'Start-HiveCockpitApi.ps1'
  Set-ItemProperty $Run -Name 'HIVE_COCKPIT_API' -Value "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$apiScript`"" -Force
}

Write-Host "[+] Cockpit mode => $Mode"
Write-Host "    cockpit_mode=$($opts.cockpit_mode) autostart_api=$($opts.autostart_api)"
Write-Host "    options: $OptFile"
