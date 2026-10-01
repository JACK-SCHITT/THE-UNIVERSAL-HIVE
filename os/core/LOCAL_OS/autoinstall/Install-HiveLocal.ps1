#Requires -Version 5.1
<#
.SYNOPSIS
  HIVE OS Federation — local-first Windows auto-install / bring-up

.DESCRIPTION
  - Forces local AI policy (Ollama only)
  - Ensures model dir on D:
  - Verifies DNA paths
  - Starts KRACKERJACK local install assistant
  - Optionally brings up WSL Kali
  - Does NOT call cloud AI APIs

.NOTES
  Architect: KRACKERJACK1134
#>

param(
  [switch]$SkipAssistant,
  [switch]$SkipWsl,
  [switch]$PullModel,
  [string]$Model = "phi3:mini"
)

$ErrorActionPreference = "Continue"
$HiveRoot = "C:\Users\ARCHITECT\THE_HIVE"
$LocalOs = Join-Path $HiveRoot "LOCAL_OS"
$Models = "D:\HIVE_LOCAL_AI\ollama\models"
$LogDir = Join-Path $LocalOs "logs"
New-Item -ItemType Directory -Force -Path $LogDir, $Models | Out-Null
$Log = Join-Path $LogDir ("install-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".log")

function Log($msg) {
  $line = "[{0}] {1}" -f (Get-Date -Format o), $msg
  Add-Content -Path $Log -Value $line
  Write-Host $line
}

Log "=== HIVE LOCAL AUTO-INSTALL START ==="
Log "Policy: local_only=true cloud_forbidden=true"

# 1) Local model path
[System.Environment]::SetEnvironmentVariable("OLLAMA_MODELS", $Models, "User")
$env:OLLAMA_MODELS = $Models
$env:HIVE_LOCAL_MODEL = $Model
Log "OLLAMA_MODELS=$Models"
Log "HIVE_LOCAL_MODEL=$Model"

# 2) DNA presence
foreach ($p in @("C:\Hive", $HiveRoot, "C:\HIVE_COMPUTER", "$HiveRoot\GENESIS")) {
  if (Test-Path $p) { Log "DNA_OK $p" } else { Log "DNA_MISSING $p" }
}

# 3) Ollama
$ollama = "C:\Users\ARCHITECT\AppData\Local\Programs\Ollama\ollama.exe"
if (-not (Test-Path $ollama)) {
  Log "OLLAMA_MISSING — install from https://ollama.com (local runtime)"
} else {
  Log "OLLAMA_OK $ollama"
  try {
    & $ollama list 2>&1 | Tee-Object -FilePath $Log -Append | Out-Host
  } catch { Log "ollama list failed: $_" }
  if ($PullModel) {
    Log "Pulling local model $Model ..."
    & $ollama pull $Model 2>&1 | Tee-Object -FilePath $Log -Append | Out-Host
  }
}

# 4) Block cloud as default brain — write policy file
$policy = @{
  ai_mode = "local_only"
  cloud_forbidden = $true
  default_model = $Model
  ollama_host = "http://127.0.0.1:11434"
  updated = (Get-Date).ToString("o")
} | ConvertTo-Json
$policyPath = Join-Path $LocalOs "catalog\local_policy.json"
Set-Content -Path $policyPath -Value $policy -Encoding UTF8
Log "POLICY_WRITTEN $policyPath"

# 5) WSL Kali
if (-not $SkipWsl) {
  $wsl = wsl -l -v 2>&1 | Out-String
  Log "WSL:`n$wsl"
  if ($wsl -match "kali-linux") {
    Log "Starting kali-linux..."
    Start-Process wsl -ArgumentList "-d","kali-linux","--","echo","HIVE_KALI_NODE_ONLINE" -WindowStyle Minimized
  }
}

# 6) First-boot assistant
if (-not $SkipAssistant) {
  $py = "C:\Users\ARCHITECT\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe"
  if (-not (Test-Path $py)) { $py = (Get-Command python -EA SilentlyContinue).Source }
  $assist = Join-Path $LocalOs "firstboot\krackerjack_local_assistant.py"
  if ((Test-Path $py) -and (Test-Path $assist)) {
    Log "Starting KRACKERJACK local assistant on :8788"
    Start-Process -FilePath $py -ArgumentList $assist -WorkingDirectory (Split-Path $assist) -WindowStyle Normal
    Start-Sleep -Seconds 2
    Start-Process "http://127.0.0.1:8788/"
  } else {
    Log "ASSISTANT_SKIP py=$py assist=$assist"
  }
}

# 7) Payload checklist for ISO rebuild
$checklist = Join-Path $LocalOs "catalog\payload_checklist.txt"
@(
  "HIVE LOCAL PAYLOAD CHECKLIST",
  "DNA: C:\Hive , THE_HIVE , HIVE_COMPUTER , GENESIS",
  "Local AI: Ollama + $Model under $Models",
  "Assistant: LOCAL_OS\firstboot",
  "Autoinstall: this script",
  "Bulk media: D:\HIVE_BOOTLAB , D:\BULK_OFFLOAD",
  "WSL: kali-linux",
  "Cloud AI: FORBIDDEN for install brain"
) | Set-Content $checklist -Encoding UTF8
Log "CHECKLIST $checklist"
Log "=== HIVE LOCAL AUTO-INSTALL COMPLETE ==="
Log "Open http://127.0.0.1:8788/ for KRACKERJACK install assistance"
