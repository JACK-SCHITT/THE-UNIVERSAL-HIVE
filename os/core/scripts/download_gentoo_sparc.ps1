# Download latest Gentoo SPARC64 OpenRC stage3 + DIGESTS into GENESIS/
$ErrorActionPreference = "Stop"
$HIVE = if (Test-Path "C:\Users\ARCHITECT\THE_HIVE\HIVE_CORE") { "C:\Users\ARCHITECT\THE_HIVE" } else { Split-Path $PSScriptRoot -Parent }
$stageDir = Join-Path $HIVE "GENESIS\gentoo-sparc"
$manDir = Join-Path $HIVE "GENESIS\manifests"
New-Item -ItemType Directory -Force -Path $stageDir, $manDir | Out-Null

$ProgressPreference = "SilentlyContinue"
$latestUrl = "https://distfiles.gentoo.org/releases/sparc/autobuilds/latest-stage3.txt"
$latestPath = Join-Path $manDir "latest-stage3.txt"
Write-Host "[*] Fetching latest-stage3.txt"
Invoke-WebRequest -Uri $latestUrl -OutFile $latestPath -UseBasicParsing

# Prefer sparc64-openrc line
$line = Get-Content $latestPath | Where-Object { $_ -match "stage3-sparc64-openrc-.*\.tar\.xz" -and $_ -notmatch "^#" } | Select-Object -First 1
if (-not $line) {
  $line = Get-Content $latestPath | Where-Object { $_ -match "stage3-sparc64-.*openrc.*\.tar\.xz" -and $_ -notmatch "^#" } | Select-Object -First 1
}
if (-not $line) { throw "No sparc64-openrc stage3 in latest-stage3.txt" }

$rel = ($line -split "\s+")[0]
$base = "https://distfiles.gentoo.org/releases/sparc/autobuilds"
$url = "$base/$rel"
$name = Split-Path $rel -Leaf
$out = Join-Path $stageDir $name
$dig = Join-Path $manDir "stage3-sparc64-openrc.DIGESTS"

Write-Host "[*] Downloading $url"
Write-Host "    → $out"
Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing
Write-Host "[*] DIGESTS"
try {
  Invoke-WebRequest -Uri "$url.DIGESTS" -OutFile $dig -UseBasicParsing
} catch {
  Write-Host "[!] DIGESTS download failed: $_"
}

Get-Item $out | Format-List FullName, Length, LastWriteTime
Write-Host "[+] Done. Run: .\scripts\assimilate\assimilate_gentoo.ps1"
