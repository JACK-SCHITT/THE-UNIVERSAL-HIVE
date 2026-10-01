#Requires -Version 5.1
<#
  Fleet consolidation per Architect order.
  Thermal-light: no node_modules copy, no .git, scrap unused.
#>
$ErrorActionPreference = 'Stop'
$Fleet = 'C:\Users\ARCHITECT\THE_HIVE\FLEET'
$ScrapRoot = Join-Path $Fleet ('_SCRAP_' + (Get-Date -Format 'yyyyMMdd_HHmmss'))
$HiveRoot = 'C:\Users\ARCHITECT\THE_HIVE'

function Write-Step($m) { Write-Host "[*] $m" -ForegroundColor Cyan }
function Write-Ok($m) { Write-Host "[+] $m" -ForegroundColor Green }

function Copy-Best([string]$Src, [string]$Dst, [string[]]$ExtraExclude = @()) {
  if (-not (Test-Path $Src)) { Write-Host "  skip missing $Src"; return }
  New-Item -ItemType Directory -Force -Path $Dst | Out-Null
  $xd = @('.git', 'node_modules', '.expo', 'dist', 'build', '.next', '__pycache__', '.venv', 'venv') + $ExtraExclude
  $xf = @('*.pyc', '.env', '.env.local', 'bun.lock', 'package-lock.json', 'pnpm-lock.yaml')
  $args = @($Src, $Dst, '/E', '/NFL', '/NDL', '/NJH', '/NJS', '/nc', '/ns', '/np')
  foreach ($d in $xd) { $args += '/XD'; $args += $d }
  foreach ($f in $xf) { $args += '/XF'; $args += $f }
  & robocopy @args | Out-Null
}

function Move-ToScrap([string]$Name) {
  $src = Join-Path $Fleet $Name
  if (-not (Test-Path $src)) { return }
  New-Item -ItemType Directory -Force -Path $ScrapRoot | Out-Null
  $dest = Join-Path $ScrapRoot $Name
  Write-Step "SCRAP <- $Name"
  Move-Item -LiteralPath $src -Destination $dest -Force
}

function Write-Identity($Path, $obj) {
  New-Item -ItemType Directory -Force -Path $Path | Out-Null
  $obj | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $Path 'HIVE_IDENTITY.json') -Encoding UTF8
}

Write-Step "Scrap root: $ScrapRoot"

# ========== 1) NEURAL SCAM SHIELD AI ==========
$nssa = Join-Path $Fleet 'NEURAL SCAM SHIELD AI'
Write-Step 'Build NEURAL SCAM SHIELD AI'
if (Test-Path $nssa) { Remove-Item -LiteralPath $nssa -Recurse -Force }
New-Item -ItemType Directory -Force -Path $nssa, "$nssa\sources", "$nssa\scrap_notes" | Out-Null
# Best app base: combined SCAM SHIELD (next) + NeuralShield (vite full UI)
Copy-Best (Join-Path $Fleet 'SCAM-SHIELD-AND-SCAM-SHIELD-AI-COMBINED-UPDATE-FIX-FUKUP') "$nssa\app-scam-ai"
Copy-Best (Join-Path $Fleet 'NeuralShield') "$nssa\app-neural"
Copy-Best (Join-Path $Fleet 'Scam-Shield') "$nssa\app-scam-legacy"
@"
# NEURAL SCAM SHIELD AI

**Merged from:** NeuralShield + Scam-Shield + SCAM-SHIELD-AND-SCAM-SHIELD-AI-COMBINED-UPDATE-FIX-FUKUP  
**Role:** Unified scam / predator / neural defense under **ZORG** security umbrella  
**Protocol:** ASSIMILATE OR DIE · Keep the best · Scrap the rest

## Layout
- ``app-scam-ai/`` — primary combined Next/scam stack (best product surface)
- ``app-neural/`` — NeuralShield Vite UI (best neural chamber)
- ``app-scam-legacy/`` — original Scam-Shield thin app (kept for reference APIs)

## Chat agent
``scamshield`` / ``neuralshield`` route into this product; ZORG remains chief of security.
"@ | Set-Content "$nssa\README.md" -Encoding UTF8
Write-Identity $nssa @{
  id = 'neural-scam-shield-ai'
  label = 'NEURAL SCAM SHIELD AI'
  merged_from = @('NeuralShield','Scam-Shield','SCAM-SHIELD-AND-SCAM-SHIELD-AI-COMBINED-UPDATE-FIX-FUKUP')
  zorg_partner = $true
  chat_agents = @('scamshield','neuralshield')
}

# ========== 2) AssimilateOrDie (merged) ==========
$aod = Join-Path $Fleet 'AssimilateOrDie'
$aodNew = Join-Path $Fleet 'AssimilateOrDie_MERGED_BUILD'
Write-Step 'Build AssimilateOrDie merged'
if (Test-Path $aodNew) { Remove-Item -LiteralPath $aodNew -Recurse -Force }
New-Item -ItemType Directory -Force -Path $aodNew | Out-Null
# 9bhyln has services+components — primary; base AssimilateOrDie fills gaps
Copy-Best (Join-Path $Fleet 'AssimilateOrDie-9bhyln') $aodNew
Copy-Best (Join-Path $Fleet 'AssimilateOrDie') "$aodNew\_from_classic"
@"
# AssimilateOrDie

**Merged from:** AssimilateOrDie + AssimilateOrDie-9bhyln  
**Primary tree:** 9bhyln (services, components, richer foundry)  
**Classic retained in:** ``_from_classic/`` (SECURITY.md, theme DNA)

Protocol product — Assimilate or Die foundry.
"@ | Set-Content "$aodNew\README.md" -Encoding UTF8
if (Test-Path "$aodNew\_from_classic\SECURITY.md") {
  Copy-Item "$aodNew\_from_classic\SECURITY.md" "$aodNew\SECURITY.md" -Force
}
Write-Identity $aodNew @{
  id = 'assimilate-or-die'
  label = 'AssimilateOrDie'
  merged_from = @('AssimilateOrDie','AssimilateOrDie-9bhyln')
  chat_agents = @('assimilate')
}

# ========== 3) JAGUAR AI ==========
$jag = Join-Path $Fleet 'JAGUAR AI'
Write-Step 'Build JAGUAR AI'
if (Test-Path $jag) { Remove-Item -LiteralPath $jag -Recurse -Force }
New-Item -ItemType Directory -Force -Path $jag | Out-Null
Copy-Best (Join-Path $Fleet 'OpenClawPrime') $jag
Copy-Best (Join-Path $Fleet 'HunterPrime') "$jag\_from_hunterprime"
@"
# JAGUAR AI

**Merged from:** HunterPrime (action) + OpenClawPrime (foundry/bridge)  
**Codename:** JAGUAR — strike + build  
**Chat agent:** ``jaguar`` (also accepts hunterprime / openclaw aliases)

Action layer + foundry in one chamber. Thermal-light: no heavy build by default.
"@ | Set-Content "$jag\README.md" -Encoding UTF8
Write-Identity $jag @{
  id = 'jaguar-ai'
  label = 'JAGUAR AI'
  merged_from = @('HunterPrime','OpenClawPrime')
  chat_agents = @('jaguar','hunterprime','openclaw')
}

# ========== 4) KRACKERJACK AI HIVE CORE OS ==========
$core = Join-Path $Fleet 'KRACKERJACK AI HIVE CORE OS'
Write-Step 'Build KRACKERJACK AI HIVE CORE OS'
if (Test-Path $core) { Remove-Item -LiteralPath $core -Recurse -Force }
New-Item -ItemType Directory -Force -Path $core | Out-Null
Copy-Best (Join-Path $Fleet 'HIVE-OS-CORE') $core
Copy-Best (Join-Path $Fleet 'THE-HIVE-OS') "$core\_from_the_hive_os"
Copy-Best (Join-Path $Fleet 'KRACKERJACK-AI-HIVE') "$core\_from_kj_hive"
@"
# KRACKERJACK AI HIVE CORE OS

**Merged from:** HIVE-OS-CORE + THE-HIVE-OS + KRACKERJACK-AI-HIVE  
**Primary DNA:** HIVE-OS-CORE tree (NEURAL/docs/scripts)  
**Note:** Live war-room remains ``C:\Users\ARCHITECT\THE_HIVE`` — this is the productized cold/core package mirror.
"@ | Set-Content "$core\README.md" -Encoding UTF8
Write-Identity $core @{
  id = 'krackerjack-ai-hive-core-os'
  label = 'KRACKERJACK AI HIVE CORE OS'
  merged_from = @('HIVE-OS-CORE','THE-HIVE-OS','KRACKERJACK-AI-HIVE')
  chat_agents = @('hive','krackerjack')
}

# ========== 5) KRACKERJACK AI (rename KrackerjackAI + companion) ==========
$kj = Join-Path $Fleet 'KRACKERJACK AI'
Write-Step 'Build KRACKERJACK AI (+ Capricorn companion concept)'
if (Test-Path $kj) { Remove-Item -LiteralPath $kj -Recurse -Force }
New-Item -ItemType Directory -Force -Path $kj | Out-Null
Copy-Best (Join-Path $Fleet 'KrackerjackAI') $kj
New-Item -ItemType Directory -Force -Path "$kj\companion" | Out-Null
# Companion concept from Luna (services/contexts only — light)
if (Test-Path (Join-Path $Fleet 'LunaCompanion\services')) {
  Copy-Best (Join-Path $Fleet 'LunaCompanion\services') "$kj\companion\services"
}
if (Test-Path (Join-Path $Fleet 'LunaCompanion\contexts')) {
  Copy-Best (Join-Path $Fleet 'LunaCompanion\contexts') "$kj\companion\contexts"
}
@"
# KRACKERJACK AI

**Renamed from:** KrackerjackAI  
**Companion:** Capricorn-protocol companion module under ``companion/``  
**Law:** Companions default to **user zodiac** for output tone; Capricorn is the base template.
If Capricorn base conflicts with user sign traits, **user zodiac wins permanently** for that profile.
"@ | Set-Content "$kj\README.md" -Encoding UTF8
Write-Identity $kj @{
  id = 'krackerjack-ai'
  label = 'KRACKERJACK AI'
  renamed_from = 'KrackerjackAI'
  companion = 'capricorn-base-user-zodiac'
  chat_agents = @('krackerjack')
}

# ========== 6) GROKSCHITT (+ companion) ==========
$gs = Join-Path $Fleet 'GROKSCHITT'
Write-Step 'Enhance GROKSCHITT with companion concept'
New-Item -ItemType Directory -Force -Path "$gs\companion" | Out-Null
if (Test-Path (Join-Path $Fleet 'LunaCompanion\services')) {
  Copy-Best (Join-Path $Fleet 'LunaCompanion\services') "$gs\companion\services"
}
if (Test-Path (Join-Path $Fleet 'LunaCompanion\hooks')) {
  Copy-Best (Join-Path $Fleet 'LunaCompanion\hooks') "$gs\companion\hooks"
}
@"
# GROKSCHITT

**Kept separate** per Architect.  
**Added:** Capricorn-based companion concept under ``companion/``.  
User zodiac drives companion output; Capricorn is the construction template.
Conflict rule: user zodiac permanent default.
"@ | Set-Content "$gs\README.md" -Encoding UTF8
Write-Identity $gs @{
  id = 'grokschitt'
  label = 'GROKSCHITT'
  companion = 'capricorn-base-user-zodiac'
  chat_agents = @('grokschitt')
}

# ========== 7) CAPRICORN AI (from LunaCompanion) ==========
$cap = Join-Path $Fleet 'CAPRICORN AI'
Write-Step 'Build CAPRICORN AI'
if (Test-Path $cap) { Remove-Item -LiteralPath $cap -Recurse -Force }
New-Item -ItemType Directory -Force -Path $cap | Out-Null
Copy-Best (Join-Path $Fleet 'LunaCompanion') $cap
@"
# CAPRICORN AI

**Renamed from:** LunaCompanion  
**Nature:** Companion AI factory based on **Capricorn** traits (discipline, loyalty, long game, practical care).  
**Zodiac law:**
1. Capricorn = base construction template for all companions spun from this line.
2. Runtime companion **functions as the user's zodiac** (tone, pacing, advice style).
3. If Capricorn base and user-sign traits conflict, **user zodiac wins permanently** for that profile.
4. Stored in ``profiles/<user>/zodiac.json`` once chosen.

## Capricorn core (always in DNA)
- Steady · loyal · ambitious · practical · no fluff  
- Protects the long-term path (least-traveled, real results)  
- Calm under pressure · dual control with Architect  
"@ | Set-Content "$cap\README.md" -Encoding UTF8
Write-Identity $cap @{
  id = 'capricorn-ai'
  label = 'CAPRICORN AI'
  renamed_from = 'LunaCompanion'
  zodiac_base = 'capricorn'
  zodiac_runtime = 'user'
  conflict_rule = 'user_zodiac_permanent'
  chat_agents = @('capricorn','luna')
}

# ========== SWAP AssimilateOrDie ==========
Write-Step 'Replace AssimilateOrDie with merged build'
if (Test-Path $aod) { Move-ToScrap 'AssimilateOrDie' }
Rename-Item -LiteralPath $aodNew -NewName 'AssimilateOrDie'

# ========== SCRAP OLD SOURCES ==========
$toScrap = @(
  'NeuralShield',
  'Scam-Shield',
  'SCAM-SHIELD-AND-SCAM-SHIELD-AI-COMBINED-UPDATE-FIX-FUKUP',
  'AssimilateOrDie-9bhyln',
  'HunterPrime',
  'OpenClawPrime',
  'HIVE-OS-CORE',
  'THE-HIVE-OS',
  'KRACKERJACK-AI-HIVE',
  'KrackerjackAI',
  'LunaCompanion'
)
foreach ($n in $toScrap) { Move-ToScrap $n }

# Keep MCGILLICUDDY as-is
Write-Ok 'Fleet consolidation complete'
Write-Host "Active fleet:" -ForegroundColor Yellow
Get-ChildItem $Fleet -Directory | Where-Object { $_.Name -notlike '_SCRAP*' } | ForEach-Object { "  - $($_.Name)" }
Write-Host "Scrap: $ScrapRoot" -ForegroundColor DarkYellow
