# Sync JACK-SCHITT core fleet into THE_HIVE/FLEET (gitignored)
# Uses GH_PAT_UNCHAINED from .env — never stores token in remotes.
$ErrorActionPreference = "Continue"
$HiveRoot = if ($env:HIVE_ROOT) { $env:HIVE_ROOT } else { Split-Path -Parent $PSScriptRoot }
$Fleet = Join-Path $HiveRoot "FLEET"
$EnvFile = Join-Path $HiveRoot ".env"
New-Item -ItemType Directory -Path $Fleet -Force | Out-Null

$pat = $env:GH_PAT_UNCHAINED
if (-not $pat -and (Test-Path $EnvFile)) {
  $line = Get-Content $EnvFile | Where-Object { $_ -match '^\s*GH_PAT_UNCHAINED=' } | Select-Object -First 1
  if ($line) { $pat = ($line -split '=', 2)[1].Trim().Trim('"').Trim("'") }
}
if (-not $pat) {
  Write-Host "[!] Set GH_PAT_UNCHAINED in .env"
  exit 1
}

$repos = @(
  "THE-HIVE-OS",
  "KRACKERJACK-AI-HIVE",
  "KrackerjackAI",
  "AssimilateOrDie",
  "AssimilateOrDie-9bhyln",
  "Scam-Shield",
  "SCAM-SHIELD-AND-SCAM-SHIELD-AI-COMBINED-UPDATE-FIX-FUKUP",
  "NeuralShield",
  "LunaCompanion",
  "GROKSCHITT",
  "HunterPrime",
  "OpenClawPrime",
  "MCGILLICUDDY"
)

$env:GIT_TERMINAL_PROMPT = "0"
foreach ($name in $repos) {
  $dest = Join-Path $Fleet $name
  $auth = "https://x-access-token:${pat}@github.com/JACK-SCHITT/${name}.git"
  $clean = "https://github.com/JACK-SCHITT/${name}.git"
  Write-Host "=== $name ==="
  try {
    if (Test-Path (Join-Path $dest ".git")) {
      git -C $dest remote set-url origin $clean 2>$null
      git -C $dest pull --ff-only $auth main 2>&1 | Select-Object -Last 2
    } else {
      git clone --depth 1 --branch main $auth $dest 2>&1 | Select-Object -Last 3
    }
    if (Test-Path (Join-Path $dest ".git")) {
      git -C $dest remote set-url origin $clean
      Write-Host "[+] $(git -C $dest rev-parse --short HEAD)"
    } else {
      Write-Host "[!] failed"
    }
  } catch {
    Write-Host "[!] $_"
  }
}

# scrub any leaked tokens in fleet git configs
Get-ChildItem $Fleet -Directory -ErrorAction SilentlyContinue | ForEach-Object {
  $cfg = Join-Path $_.FullName ".git\config"
  if (Test-Path $cfg) {
    $raw = Get-Content $cfg -Raw
    if ($raw -match 'x-access-token:|github_pat_') {
      ($raw -replace 'https://x-access-token:[^@]+@github.com/', 'https://github.com/') |
        Set-Content $cfg -NoNewline -Encoding utf8
      Write-Host "scrubbed $($_.Name)"
    }
  }
}
Write-Host "[+] Fleet sync complete → $Fleet"
