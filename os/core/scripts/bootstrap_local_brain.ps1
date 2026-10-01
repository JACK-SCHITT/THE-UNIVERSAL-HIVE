# Bootstrap free local brain - no API keys
# Architect: KRACKERJACK1134
$ErrorActionPreference = "Continue"
$HIVE = "C:\Users\ARCHITECT\THE_HIVE"
Set-Location $HIVE

Write-Host "=========================================="
Write-Host "  HIVE LOCAL BRAIN BOOTSTRAP (FREE)"
Write-Host "=========================================="

$envFile = Join-Path $HIVE ".env"
if (Test-Path $envFile) {
  $raw = Get-Content $envFile -Raw
  if ($raw -match "HIVE_BRAIN=") {
    $raw = $raw -replace "HIVE_BRAIN=\S+", "HIVE_BRAIN=local"
  } else {
    $raw = $raw.TrimEnd() + "`r`nHIVE_BRAIN=local`r`n"
  }
  if ($raw -notmatch "OLLAMA_MODEL=") {
    $raw = $raw.TrimEnd() + "`r`nOLLAMA_MODEL=llama3.2:3b`r`n"
  } else {
    $raw = $raw -replace "OLLAMA_MODEL=\S+", "OLLAMA_MODEL=llama3.2:3b"
  }
  if ($raw -notmatch "OLLAMA_HOST=") {
    $raw = $raw.TrimEnd() + "`r`nOLLAMA_HOST=http://127.0.0.1:11434`r`n"
  }
  Set-Content -Path $envFile -Value $raw -Encoding UTF8
  Write-Host "[+] .env -> HIVE_BRAIN=local"
}

$ollamaCmd = $null
if (Get-Command ollama -ErrorAction SilentlyContinue) {
  $ollamaCmd = "ollama"
} elseif (Test-Path "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe") {
  $ollamaCmd = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
}

try {
  $null = Invoke-RestMethod http://127.0.0.1:11434/api/tags -TimeoutSec 2
} catch {
  $app = "$env:LOCALAPPDATA\Programs\Ollama\Ollama.exe"
  if (Test-Path $app) {
    Start-Process $app
    Start-Sleep 4
  }
}

if (-not $ollamaCmd) {
  Write-Host "[!] ollama not found. Install from https://ollama.com (free) then re-run."
  Write-Host "    Offline brain still works: python NEURAL\brain\hive_link.py offline hi"
} else {
  Write-Host "[*] Pulling free local model llama3.2:3b (may take a while)..."
  & $ollamaCmd pull llama3.2:3b
  if ($LASTEXITCODE -ne 0) {
    Write-Host "[*] llama3.2:3b failed - trying tinyllama fallback"
    & $ollamaCmd pull tinyllama
  }
  & $ollamaCmd list
}

Write-Host "[*] Self-upgrade offline pass + digest"
python (Join-Path $HIVE "NEURAL\brain\self_upgrade.py") --offline
Write-Host "[*] Status"
python (Join-Path $HIVE "NEURAL\brain\hive_link.py") status
Write-Host "[*] Smoke test (must work with zero cloud)"
python (Join-Path $HIVE "NEURAL\brain\hive_link.py") ask "Confirm you work without API keys. Two sentences."
Write-Host "[+] Bootstrap complete."
