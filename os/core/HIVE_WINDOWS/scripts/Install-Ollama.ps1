#Requires -Version 5.1
<#
  Install + start Ollama and pull free models so HIVE works OUT OF THE BOX.
  No API keys. Idempotent.
#>
param(
  # tinyllama first = OUT OF THE BOX fast; larger models optional background
  [string[]]$Models = @('tinyllama'),
  [string[]]$BackgroundModels = @('llama3.2:3b'),
  [switch]$SkipPull,
  [switch]$NoBackgroundPull
)

$ErrorActionPreference = 'Continue'
$Log = 'C:\ProgramData\THE_HIVE\logs\ollama_install.log'
New-Item -ItemType Directory -Force -Path (Split-Path $Log) | Out-Null
function L([string]$m) {
  $line = "$(Get-Date -Format o) $m"
  Add-Content -Path $Log -Value $line -ErrorAction SilentlyContinue
  Write-Host $line
}

L '=== Install-Ollama (OUT OF THE BOX) ==='

function Get-OllamaExe {
  $candidates = @(
    (Get-Command ollama -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source),
    "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe",
    "$env:ProgramFiles\Ollama\ollama.exe",
    "${env:ProgramFiles(x86)}\Ollama\ollama.exe"
  ) | Where-Object { $_ -and (Test-Path $_) }
  return $candidates | Select-Object -First 1
}

$ollama = Get-OllamaExe
if (-not $ollama) {
  L 'Ollama not found — downloading installer'
  $tmp = Join-Path $env:TEMP 'OllamaSetup.exe'
  $urls = @(
    'https://ollama.com/download/OllamaSetup.exe',
    'https://github.com/ollama/ollama/releases/latest/download/OllamaSetup.exe'
  )
  $ok = $false
  foreach ($u in $urls) {
    try {
      L "Download $u"
      [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
      Invoke-WebRequest -Uri $u -OutFile $tmp -UseBasicParsing -TimeoutSec 600
      if ((Get-Item $tmp).Length -gt 5MB) { $ok = $true; break }
    } catch { L "download fail: $_" }
  }
  if (-not $ok) {
    L 'FATAL: could not download Ollama — brain will use offline_brain only'
    return 1
  }
  L 'Running silent install'
  $p = Start-Process -FilePath $tmp -ArgumentList '/VERYSILENT', '/NORESTART', '/ALLUSERS=0' -Wait -PassThru
  L "Installer exit=$($p.ExitCode)"
  Start-Sleep -Seconds 5
  $ollama = Get-OllamaExe
  if (-not $ollama) {
    # wait for PATH registration
    Start-Sleep -Seconds 8
    $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
    $ollama = Get-OllamaExe
  }
}

if (-not $ollama) {
  L 'FATAL: Ollama still missing after install'
  return 2
}
L "Ollama exe: $ollama"

# Ensure app / service running
try {
  Start-Process $ollama -ArgumentList 'serve' -WindowStyle Hidden -ErrorAction SilentlyContinue
} catch {}
# Official installer often registers app; nudge start
$app = "$env:LOCALAPPDATA\Programs\Ollama\ollama app.exe"
if (Test-Path $app) {
  Start-Process $app -WindowStyle Hidden -ErrorAction SilentlyContinue
}

# Wait for API
$up = $false
for ($i = 0; $i -lt 30; $i++) {
  try {
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:11434/api/tags' -UseBasicParsing -TimeoutSec 2
    if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 300) { $up = $true; break }
  } catch {}
  Start-Sleep -Seconds 2
}
L "Ollama API up=$up"

if (-not $SkipPull -and $up) {
  foreach ($m in $Models) {
    if (-not $m) { continue }
    L "ollama pull $m (blocking — small OOTB model)"
    try {
      & $ollama pull $m 2>&1 | ForEach-Object { L "  $_" }
    } catch { L "pull error $m : $_" }
  }
  # Larger models in background so first login never stalls for hours
  if (-not $NoBackgroundPull -and $BackgroundModels -and $BackgroundModels.Count -gt 0) {
    foreach ($m in $BackgroundModels) {
      if (-not $m) { continue }
      L "ollama pull $m (background)"
      Start-Process -FilePath $ollama -ArgumentList @('pull', $m) -WindowStyle Hidden -ErrorAction SilentlyContinue
    }
  }
} elseif (-not $up) {
  L 'Skip pull - API not reachable yet (will retry on next logon/self_upgrade)'
}

# Machine env for Hive
[Environment]::SetEnvironmentVariable('HIVE_BRAIN', 'local', 'Machine')
[Environment]::SetEnvironmentVariable('OLLAMA_HOST', 'http://127.0.0.1:11434', 'Machine')
if ($Models -and $Models[0]) {
  [Environment]::SetEnvironmentVariable('OLLAMA_MODEL', $Models[0], 'Machine')
}

L '=== Install-Ollama complete ==='
return 0
