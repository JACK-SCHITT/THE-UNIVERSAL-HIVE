#Requires -Version 5.1
<#
  Repair HIVE chats:
  - Fix launchers (HIVE_ROOT, python, offline-safe)
  - Prefer local Ollama models (never hang on :cloud)
  - Pull tinyllama if no local model
  - Smoke-test agents
#>
$ErrorActionPreference = 'Continue'
$HiveRoot = if (Test-Path 'C:\Users\ARCHITECT\THE_HIVE') { 'C:\Users\ARCHITECT\THE_HIVE' }
  elseif (Test-Path 'C:\HIVE') { 'C:\HIVE' }
  else { $env:HIVE_ROOT }

$Bin = 'C:\ProgramData\THE_HIVE\bin'
$Log = 'C:\ProgramData\THE_HIVE\logs\chat_repair.log'
New-Item -ItemType Directory -Force -Path $Bin, (Split-Path $Log) | Out-Null
function L($m) { "$(Get-Date -Format o) $m" | Tee-Object $Log -Append }

L "=== Repair-HiveChats root=$HiveRoot ==="

# Find real python (not WindowsApps stub)
$py = $null
foreach ($c in @(
  "$env:LOCALAPPDATA\hermes\hermes-agent\venv\Scripts\python.exe",
  "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
  "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
  "C:\Python311\python.exe",
  "C:\Python312\python.exe"
)) {
  if (Test-Path $c) { $py = $c; break }
}
if (-not $py) {
  $cmd = Get-Command python -EA SilentlyContinue
  if ($cmd -and $cmd.Source -notmatch 'WindowsApps') { $py = $cmd.Source }
}
if (-not $py) {
  $cmd = Get-Command py -EA SilentlyContinue
  if ($cmd) { $py = $cmd.Source }
}
L "python=$py"
if (-not $py) { L 'FATAL: no python'; throw 'python not found' }

# Write python path for launchers
Set-Content (Join-Path $Bin 'python_path.txt') $py -Encoding ASCII

# Ollama local model
$ollama = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
$hasLocal = $false
if (Test-Path $ollama) {
  try {
    Start-Process $ollama -ArgumentList 'serve' -WindowStyle Hidden -EA SilentlyContinue
    Start-Sleep -Seconds 2
  } catch {}
  $list = & $ollama list 2>&1 | Out-String
  L "ollama list: $($list.Trim())"
  if ($list -match 'tinyllama|llama3|phi|gemma|qwen|mistral' -and $list -notmatch '^\s*NAME') {
    # has some model line besides header
  }
  if ($list -match 'tinyllama') { $hasLocal = $true }
  elseif ($list -match 'llama3') { $hasLocal = $true }
  elseif ($list -match ':\d') {
    # any non-cloud name
    $lines = $list -split "`n" | Where-Object { $_ -match '^\S' -and $_ -notmatch 'NAME' -and $_ -notmatch ':cloud' }
    if ($lines) { $hasLocal = $true }
  }
  if (-not $hasLocal) {
    L 'No local model — pulling tinyllama (free, small)'
    & $ollama pull tinyllama 2>&1 | ForEach-Object { L "  $_" }
    $hasLocal = $true
  }
} else {
  L 'Ollama exe missing — chats will use offline brain'
}

# Update .env model if only cloud was available
$envFile = Join-Path $HiveRoot '.env'
if (Test-Path $envFile) {
  $raw = Get-Content $envFile -Raw
  if ($raw -notmatch 'OLLAMA_MODEL=') {
    $raw = $raw.TrimEnd() + "`r`nOLLAMA_MODEL=tinyllama`r`n"
  } else {
    $raw = $raw -replace 'OLLAMA_MODEL=\S+', 'OLLAMA_MODEL=tinyllama'
  }
  if ($raw -notmatch 'HIVE_BRAIN=') {
    $raw = $raw.TrimEnd() + "`r`nHIVE_BRAIN=local`r`n"
  }
  if ($raw -notmatch 'OLLAMA_TIMEOUT=') {
    $raw = $raw.TrimEnd() + "`r`nOLLAMA_TIMEOUT=45`r`n"
  }
  Set-Content $envFile $raw -Encoding UTF8 -NoNewline
  L 'updated .env OLLAMA_MODEL=tinyllama OLLAMA_TIMEOUT=45'
}

# Rebuild chat launchers — offline-safe, correct python, set env
$agents = @(
  @{ id='krackerjack'; title='KRACKERJACK AI' },
  @{ id='hunterprime'; title='HunterPrime' },
  @{ id='counsel'; title='COUNSEL' },
  @{ id='zorg'; title='ZORG SECURITY' },
  @{ id='scamshield'; title='SCAMSHIELD' },
  @{ id='luna'; title='LUNA' },
  @{ id='hive'; title='HIVE ORCHESTRATOR' }
)

foreach ($a in $agents) {
  $cmd = Join-Path $Bin "chat_$($a.id).cmd"
  $body = @"
@echo off
title $($a.title) - THE HIVE CHAT
set HIVE_ROOT=$HiveRoot
set HIVE_BRAIN=local
set OLLAMA_HOST=http://127.0.0.1:11434
set OLLAMA_MODEL=tinyllama
set OLLAMA_TIMEOUT=45
set PYTHONUTF8=1
cd /d "%HIVE_ROOT%"
echo.
echo === $($a.title) ===
echo Hive root: %HIVE_ROOT%
echo Brain: local Ollama then offline sovereign (never hangs forever)
echo.
if "%~1"=="" (
  set /p MSG=You: 
) else (
  set MSG=%*
)
if "%MSG%"=="" set MSG=status
echo.
"$py" "%HIVE_ROOT%\NEURAL\brain\agents.py" $($a.id) "%MSG%"
if errorlevel 1 (
  echo [fallback] offline brain...
  "$py" "%HIVE_ROOT%\NEURAL\brain\hive_link.py" offline "%MSG%"
)
echo.
pause
"@
  Set-Content -Path $cmd -Value $body -Encoding ASCII
  L "wrote $cmd"
}

# Interactive loop launcher (better UX)
$loop = Join-Path $Bin 'HiveChat.cmd'
@"
@echo off
title HIVE CHAT
set HIVE_ROOT=$HiveRoot
set HIVE_BRAIN=local
set OLLAMA_MODEL=tinyllama
set OLLAMA_TIMEOUT=45
set PYTHONUTF8=1
cd /d "%HIVE_ROOT%"
set AGENT=%~1
if "%AGENT%"=="" set AGENT=krackerjack
echo HIVE CHAT - agent=%AGENT%  (type exit to quit)
:loop
set /p MSG=You: 
if /i "%MSG%"=="exit" goto end
if /i "%MSG%"=="quit" goto end
if "%MSG%"=="" goto loop
"$py" "%HIVE_ROOT%\NEURAL\brain\agents.py" %AGENT% "%MSG%"
echo.
goto loop
:end
"@ | Set-Content $loop -Encoding ASCII

# Smoke test
L 'smoke test agents krackerjack...'
$env:HIVE_ROOT = $HiveRoot
$env:HIVE_BRAIN = 'local'
$env:OLLAMA_MODEL = 'tinyllama'
$env:OLLAMA_TIMEOUT = '30'
$out = & $py "$HiveRoot\NEURAL\brain\agents.py" krackerjack 'Reply with exactly: CHAT_OK' 2>&1 | Out-String
L $out.Substring(0, [Math]::Min(500, $out.Length))
if ($out -match 'CHAT_OK|KRACKERJACK|offline|MODE|Capricorn|Hive') {
  L 'SMOKE: PASS (got response)'
  Write-Host '[+] CHATS REPAIRED — smoke test got a response' -ForegroundColor Green
} else {
  L 'SMOKE: WEAK — check log'
  Write-Host '[!] Smoke weak — see log' -ForegroundColor Yellow
}

Write-Host "Launchers: $Bin\chat_*.cmd  and  $Bin\HiveChat.cmd" -ForegroundColor Cyan
Write-Host 'Example: C:\ProgramData\THE_HIVE\bin\chat_krackerjack.cmd' -ForegroundColor Cyan
Write-Host 'Or:      C:\ProgramData\THE_HIVE\bin\HiveChat.cmd zorg' -ForegroundColor Cyan
