# Assimilate Gentoo SPARC stage3 + handbook into HIVE-OS
# Architect: KRACKERJACK1134 | Safe: no disk wipe
$ErrorActionPreference = "Stop"
$HIVE = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not (Test-Path (Join-Path $HIVE "HIVE_CORE\manifest.json"))) {
  $HIVE = "C:\Users\ARCHITECT\THE_HIVE"
}

Write-Host "=========================================="
Write-Host "  HIVE ASSIMILATION RITUAL - GENTOO SPARC"
Write-Host "  Root: $HIVE"
Write-Host "=========================================="

$stageDir = Join-Path $HIVE "GENESIS\gentoo-sparc"
$manifestDir = Join-Path $HIVE "GENESIS\manifests"
$handbook = Join-Path $HIVE "docs\handbook\gentoo-sparc"
$hiveHb = Join-Path $HIVE "docs\HIVE_HANDBOOK"
$knowledge = Join-Path $HIVE "NEURAL\krackerjack\knowledge"
$coreManifest = Join-Path $HIVE "HIVE_CORE\manifest.json"

New-Item -ItemType Directory -Force -Path $stageDir, $manifestDir, $knowledge | Out-Null

$stages = @(Get-ChildItem -Path $stageDir -Filter "stage3-*.tar.xz" -ErrorAction SilentlyContinue | Sort-Object Length -Descending)
if ($stages.Count -eq 0) {
  Write-Host "[!] No stage3 in $stageDir"
  Write-Host "    Download first (sparc64-openrc from distfiles.gentoo.org)."
  exit 1
}
$stage = $stages[0]
$mb = [math]::Round($stage.Length / 1MB, 1)
Write-Host "[+] Stage3: $($stage.Name) ($mb MB)"

$digestFile = Get-ChildItem -Path $manifestDir -Filter "*DIGESTS*" -ErrorAction SilentlyContinue | Select-Object -First 1
$shaOk = $null
$stageSha = $null
if ($digestFile) {
  Write-Host "[*] DIGESTS present: $($digestFile.Name)"
  try {
    $stageSha = (Get-FileHash -Path $stage.FullName -Algorithm SHA512).Hash.ToLower()
    $digText = Get-Content $digestFile.FullName -Raw
    if ($digText.ToLower().Contains($stageSha)) {
      $shaOk = $true
      Write-Host "[+] SHA512 matches DIGESTS"
    } else {
      $shaOk = $false
      Write-Host "[!] SHA512 not found in DIGESTS (recorded anyway)"
    }
  } catch {
    Write-Host "[!] Hash check skipped: $_"
  }
}

$hbCount = 0
if (Test-Path $handbook) {
  $hbCount = @(Get-ChildItem $handbook -Filter "*.md" -ErrorAction SilentlyContinue).Count
}
Write-Host "[*] Gentoo handbook chapters mirrored: $hbCount"
$hiveHbCount = 0
if (Test-Path $hiveHb) {
  $hiveHbCount = @(Get-ChildItem $hiveHb -Filter "*.md").Count
}
Write-Host "[*] Hive handbook chapters: $hiveHbCount"

if (-not $stageSha) {
  try { $stageSha = (Get-FileHash -Path $stage.FullName -Algorithm SHA512).Hash.ToLower() } catch { $stageSha = $null }
}

$assimPath = Join-Path $HIVE "GENESIS\ASSIMILATED.json"
$record = [ordered]@{
  status            = "ASSIMILATED"
  protocol          = "ASSIMILATE OR DIE"
  arch              = "sparc64"
  init              = "openrc"
  stage3            = $stage.Name
  stage3_path       = $stage.FullName.Replace('\', '/')
  stage3_bytes      = $stage.Length
  stage3_sha512     = $stageSha
  sha512_in_digest  = $shaOk
  handbook_chapters = $hbCount
  hive_handbook     = $hiveHbCount
  first_ai          = "KRACKERJACK AI"
  assimilated_at    = (Get-Date).ToString("o")
  architect         = "KRACKERJACK1134"
  source            = "https://distfiles.gentoo.org/releases/sparc/autobuilds/"
}
$record | ConvertTo-Json -Depth 5 | Set-Content -Path $assimPath -Encoding UTF8
Set-Content -Path (Join-Path $HIVE "GENESIS\STATUS") -Value "ASSIMILATED" -Encoding UTF8
Write-Host "[+] Wrote $assimPath"

$pointer = Join-Path $stageDir "CURRENT_STAGE3.txt"
Set-Content -Path $pointer -Value $stage.Name -Encoding UTF8

$digestMd = Join-Path $knowledge "HANDBOOK_DIGEST.md"
$lines = @(
  "# KRACKERJACK Handbook Digest",
  "",
  "Generated: $($record.assimilated_at)",
  "Stage3: $($stage.Name)",
  "Status: ASSIMILATED",
  "",
  "## Hive chapters",
  ""
)
if (Test-Path $hiveHb) {
  Get-ChildItem $hiveHb -Filter "*.md" | Sort-Object Name | ForEach-Object {
    $lines += "### $($_.Name)"
    $lines += ""
    $head = Get-Content $_.FullName -TotalCount 40
    $lines += ($head -join "`n")
    $lines += ""
  }
}
$lines += "## Gentoo SPARC index"
$lines += ""
$idx = Join-Path $handbook "00_INDEX.md"
if (Test-Path $idx) {
  $lines += Get-Content $idx -Raw
} else {
  $lines += "(index missing - handbook download incomplete)"
}
Set-Content -Path $digestMd -Value ($lines -join "`n") -Encoding UTF8
Write-Host "[+] Knowledge digest -> $digestMd"

if (Test-Path $coreManifest) {
  $m = Get-Content $coreManifest -Raw | ConvertFrom-Json
  $m | Add-Member -NotePropertyName first_ai -NotePropertyValue "KRACKERJACK AI" -Force
  $m | Add-Member -NotePropertyName gentoo_seed -NotePropertyValue @{
    arch   = "sparc64"
    init   = "openrc"
    stage3 = $stage.Name
    status = "ASSIMILATED"
    path   = "GENESIS/gentoo-sparc/$($stage.Name)"
  } -Force
  $m | Add-Member -NotePropertyName handbook -NotePropertyValue @{
    official_mirror = "docs/handbook/gentoo-sparc"
    hive_augmented  = "docs/HIVE_HANDBOOK"
    first_contact   = "NEURAL/krackerjack/first_contact.py"
  } -Force
  if ($m.hive_stats) {
    $m.hive_stats | Add-Member -NotePropertyName gentoo_assimilated -NotePropertyValue 1 -Force
  }
  $m | ConvertTo-Json -Depth 8 | Set-Content $coreManifest -Encoding UTF8
  Write-Host "[+] Updated HIVE_CORE/manifest.json"
}

Write-Host ""
Write-Host "[+] ASSIMILATION COMPLETE."
Write-Host "    First AI: python NEURAL\krackerjack\first_contact.py"
Write-Host "    Status:   python NEURAL\krackerjack\first_contact.py status"
Write-Host "=========================================="
