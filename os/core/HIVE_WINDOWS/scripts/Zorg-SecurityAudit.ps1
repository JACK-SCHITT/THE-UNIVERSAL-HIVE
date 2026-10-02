#Requires -Version 5.1
# ZORG-Ω security audit (local, no secret values printed)
$ErrorActionPreference = 'Continue'
Write-Host '=== ZORG-Ω SECURITY AUDIT ===' -ForegroundColor Yellow
Write-Host 'Department: HIVE SECURITY | Chief: ZORG-Ω' -ForegroundColor Cyan

function Flag([string]$name, [bool]$ok, [string]$detail) {
  $s = if ($ok) { 'OK' } else { 'ATTN' }
  $c = if ($ok) { 'Green' } else { 'Yellow' }
  Write-Host "[$s] $name — $detail" -ForegroundColor $c
}

$HiveRoot = if (Test-Path 'C:\HIVE') { 'C:\HIVE' } elseif (Test-Path 'C:\Users\ARCHITECT\THE_HIVE') { 'C:\Users\ARCHITECT\THE_HIVE' } else { $env:HIVE_ROOT }
Flag 'Hive root' (Test-Path $HiveRoot) $HiveRoot
Flag 'ZORG charter' (Test-Path "$HiveRoot\HIVE_CORE\security\ZORG\CHARTER.md") 'CHARTER.md'
Flag 'Soul' (Test-Path "$HiveRoot\NEURAL\soul\CONSTITUTION.md") 'CONSTITUTION'
Flag 'Aegis script' (Test-Path "$HiveRoot\NEURAL\aegis\aegis_harden.start") 'aegis_harden.start'

# Keys presence only. Never print values.
$envPath = Join-Path $HiveRoot '.env'
if (Test-Path $envPath) {
  $raw = Get-Content $envPath -Raw
  Flag 'XAI_API_KEY in .env' ($raw -match 'XAI_API_KEY=.+') 'SET or EMPTY (not shown)'
  Flag 'GH_PAT in .env' ($raw -match 'GH_PAT_UNCHAINED=.+') 'SET or EMPTY (not shown)'
  Flag 'BLACKBIT_API_KEY in .env' ($raw -match 'BLACKBIT_API_KEY=sk-blackbit-.+') 'SET or EMPTY (not shown)'
  Flag 'OLLAMA_HOST in .env' ($raw -match 'OLLAMA_HOST=') 'present'
} else { Flag '.env' $false 'missing' }

Flag 'Ollama local identity' (Test-Path "$env:USERPROFILE\.ollama\id_ed25519") 'machine key (local ollama)'
Flag 'Ollama API' $false 'probe...'
try {
  $null = Invoke-WebRequest 'http://127.0.0.1:11434/api/tags' -UseBasicParsing -TimeoutSec 3
  Flag 'Ollama API' $true '127.0.0.1:11434 up'
} catch { Flag 'Ollama API' $false $_.Exception.Message }

$run = Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -EA SilentlyContinue
Flag 'HIVE_AI_DOCK Run key' ($null -ne $run.HIVE_AI_DOCK) 'autostart dock'
Flag 'HIVE_COCKPIT Run key' ($null -ne $run.HIVE_COCKPIT) 'autostart cockpit'

$secMenu = "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\THE HIVE\Security (ZORG-Ω)"
Flag 'ZORG Start Menu root' (Test-Path $secMenu) $secMenu

Write-Host '=== End audit (ZORG owns next design pass) ===' -ForegroundColor Yellow
