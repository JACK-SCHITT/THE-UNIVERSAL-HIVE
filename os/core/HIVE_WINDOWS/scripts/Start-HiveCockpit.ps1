#Requires -Version 5.1
<#
  Open HIVE cockpit according to HIVE_OPTIONS.json
  offline = self-contained HTML (no server required)
  api     = ensure API up then open http://127.0.0.1:8787/
#>
param(
  [ValidateSet('auto', 'offline', 'api')]
  [string]$Mode = 'auto'
)

$ErrorActionPreference = 'Continue'
$HiveRoot = if (Test-Path 'C:\HIVE') { 'C:\HIVE' }
  elseif (Test-Path 'C:\ProgramData\THE_HIVE\war-room') { 'C:\ProgramData\THE_HIVE\war-room' }
  elseif ($env:HIVE_ROOT) { $env:HIVE_ROOT }
  else { 'C:\Users\ARCHITECT\THE_HIVE' }

$OptFile = 'C:\ProgramData\THE_HIVE\HIVE_OPTIONS.json'
$mode = $Mode
if ($Mode -eq 'auto' -and (Test-Path $OptFile)) {
  try {
    $o = Get-Content $OptFile -Raw | ConvertFrom-Json
    if ($o.cockpit_mode) { $mode = [string]$o.cockpit_mode }
  } catch {}
}
if ($mode -eq 'auto') { $mode = 'offline' }

$offlineHtml = @(
  (Join-Path $HiveRoot 'HIVE_WINDOWS\ui\hive-cockpit-offline.html'),
  (Join-Path $HiveRoot 'cold-storage\hive-cockpit.html'),
  'C:\ProgramData\THE_HIVE\ui\hive-cockpit-offline.html'
) | Where-Object { Test-Path $_ } | Select-Object -First 1

$apiHtml = Join-Path $HiveRoot 'cold-storage\hive-cockpit.html'
$startApi = 'C:\ProgramData\THE_HIVE\bin\Start-HiveCockpitApi.ps1'
if (-not (Test-Path $startApi)) {
  $startApi = Join-Path $HiveRoot 'HIVE_WINDOWS\scripts\Start-HiveCockpitApi.ps1'
}

if ($mode -eq 'api') {
  if (Test-Path $startApi) {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $startApi
  }
  Start-Process 'http://127.0.0.1:8787/'
  # fallback offline if API dead after 3s
  Start-Sleep -Seconds 3
  try {
    $null = Invoke-WebRequest 'http://127.0.0.1:8787/api/health' -UseBasicParsing -TimeoutSec 2
  } catch {
    if ($offlineHtml) {
      Start-Process $offlineHtml
    } elseif (Test-Path $apiHtml) {
      Start-Process $apiHtml
    }
  }
} else {
  # OFFLINE — pure file UI, zero Python server required
  if ($offlineHtml) {
    Start-Process $offlineHtml
  } elseif (Test-Path $apiHtml) {
    Start-Process $apiHtml
  }
}
