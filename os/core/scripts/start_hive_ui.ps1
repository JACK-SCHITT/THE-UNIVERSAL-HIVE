# HIVE UI launcher — localhost only, no remote bind by default
# Architect: KRACKERJACK1134
$ErrorActionPreference = "Stop"
$HiveRoot = if ($env:HIVE_ROOT) { $env:HIVE_ROOT } else { Split-Path -Parent $PSScriptRoot }
Set-Location $HiveRoot

$hostBind = if ($env:HIVE_UI_HOST) { $env:HIVE_UI_HOST } else { "127.0.0.1" }
$port = if ($env:HIVE_UI_PORT) { $env:HIVE_UI_PORT } else { "8787" }

if ($hostBind -notin @("127.0.0.1", "localhost", "::1")) {
  if ($env:HIVE_UI_ALLOW_REMOTE -ne "YES") {
    Write-Host "[!] Refusing non-localhost bind: $hostBind"
    Write-Host "    Set HIVE_UI_ALLOW_REMOTE=YES only if you accept the risk."
    exit 2
  }
}

Write-Host "=== HIVE COCKPIT LAUNCH ==="
Write-Host "Root: $HiveRoot"
Write-Host "URL:  http://${hostBind}:${port}/"
Write-Host "Hard: localhost · no shell-exec · multi-primary"

# Open browser shortly after server starts
Start-Job -ScriptBlock {
  param($u)
  Start-Sleep -Seconds 1
  Start-Process $u
} -ArgumentList "http://${hostBind}:${port}/" | Out-Null

$env:HIVE_UI_HOST = $hostBind
$env:HIVE_UI_PORT = "$port"
python "$HiveRoot\NEURAL\brain\hive_api.py"
