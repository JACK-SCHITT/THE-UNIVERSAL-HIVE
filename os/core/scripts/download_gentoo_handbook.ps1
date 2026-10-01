# Mirror full Gentoo SPARC handbook (MediaWiki API) into docs/handbook/gentoo-sparc
$ErrorActionPreference = "Stop"
$HIVE = if (Test-Path "C:\Users\ARCHITECT\THE_HIVE\HIVE_CORE") { "C:\Users\ARCHITECT\THE_HIVE" } else { Split-Path $PSScriptRoot -Parent }
$base = Join-Path $HIVE "docs\handbook\gentoo-sparc"
New-Item -ItemType Directory -Force -Path $base | Out-Null

$pages = @(
  "Handbook:SPARC",
  "Handbook:SPARC/Installation/About",
  "Handbook:SPARC/Installation/Media",
  "Handbook:SPARC/Installation/Networking",
  "Handbook:SPARC/Installation/Disks",
  "Handbook:SPARC/Installation/Stage",
  "Handbook:SPARC/Installation/Base",
  "Handbook:SPARC/Installation/Kernel",
  "Handbook:SPARC/Installation/System",
  "Handbook:SPARC/Installation/Tools",
  "Handbook:SPARC/Installation/Bootloader",
  "Handbook:SPARC/Installation/Finalizing",
  "Handbook:SPARC/Working/Portage",
  "Handbook:SPARC/Working/USE",
  "Handbook:SPARC/Working/Features",
  "Handbook:SPARC/Working/Initscripts",
  "Handbook:SPARC/Working/EnvVar",
  "Handbook:SPARC/Portage/Files",
  "Handbook:SPARC/Portage/Variables",
  "Handbook:SPARC/Portage/Branches",
  "Handbook:SPARC/Portage/Tools",
  "Handbook:SPARC/Portage/CustomTree",
  "Handbook:SPARC/Portage/Advanced",
  "Handbook:SPARC/Networking/Introduction",
  "Handbook:SPARC/Networking/Advanced",
  "Handbook:SPARC/Networking/Modular",
  "Handbook:SPARC/Networking/Wireless",
  "Handbook:SPARC/Networking/Extending",
  "Handbook:SPARC/Networking/Dynamic"
)

$index = @("# Gentoo SPARC Handbook — Offline Mirror", "", "Source: https://wiki.gentoo.org/wiki/Handbook:SPARC", "Fetched: $(Get-Date -Format o)", "", "## Chapters", "")
$ok = 0; $fail = 0
$ProgressPreference = "SilentlyContinue"

foreach ($page in $pages) {
  $safe = ($page -replace ":", "_" -replace "/", "__")
  $outFile = Join-Path $base "$safe.md"
  $api = "https://wiki.gentoo.org/api.php?action=parse&page=$([uri]::EscapeDataString($page))&prop=wikitext&format=json"
  try {
    $resp = Invoke-RestMethod -Uri $api -TimeoutSec 90
    $title = $resp.parse.title
    $wt = $resp.parse.wikitext."*"
    if (-not $wt) { throw "empty wikitext" }
    @"
# $title

> Official Gentoo Wiki mirror for HIVE-OS / KRACKERJACK AI knowledge base.
> Canonical: https://wiki.gentoo.org/wiki/$page

---

$wt
"@ | Set-Content -Path $outFile -Encoding UTF8
    $index += "- [$title]($safe.md)"
    $ok++
    Write-Host "OK  $page"
  } catch {
    $fail++
    Write-Host "FAIL $page : $_"
    $index += "- FAILED: $page"
  }
  Start-Sleep -Milliseconds 350
}

$index += ""
$index += "Downloaded: $ok / $($pages.Count)  Failed: $fail"
Set-Content -Path (Join-Path $base "00_INDEX.md") -Value ($index -join "`n") -Encoding UTF8
Write-Host "DONE ok=$ok fail=$fail → $base"
