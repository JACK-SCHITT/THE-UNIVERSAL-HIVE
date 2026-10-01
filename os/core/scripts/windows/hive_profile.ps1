# HIVE-OS PowerShell profile snippet
# Sourced by install_hive_windows.ps1 into the user profile
# Architect: KRACKERJACK1134

$env:HIVE_ROOT = if ($env:HIVE_ROOT) { $env:HIVE_ROOT } else { 'C:\Users\ARCHITECT\THE_HIVE' }
if (-not $env:HIVE_BRAIN) { $env:HIVE_BRAIN = 'local' }

function Enter-Hive {
  Set-Location $env:HIVE_ROOT
}
Set-Alias -Name hive-cd -Value Enter-Hive -Scope Global -Force -ErrorAction SilentlyContinue

function Invoke-Hive {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
  $hiveCmd = Join-Path $env:HIVE_ROOT 'bin\hive.cmd'
  if ($Args.Count -eq 0) {
    & $hiveCmd help
  } else {
    & $hiveCmd @Args
  }
}
# Prefer cmd hive on PATH; this is a PowerShell-native helper when bin is missing
if (-not (Get-Command hive -ErrorAction SilentlyContinue)) {
  Set-Alias -Name hive -Value Invoke-Hive -Scope Global -Force -ErrorAction SilentlyContinue
}

function Invoke-Krackerjack {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
  Push-Location $env:HIVE_ROOT
  try {
    if ($Args.Count -eq 0) {
      python NEURAL\krackerjack\first_contact.py
    } else {
      python NEURAL\krackerjack\first_contact.py @Args
    }
  } finally {
    Pop-Location
  }
}
if (-not (Get-Command krackerjack -ErrorAction SilentlyContinue)) {
  Set-Alias -Name krackerjack -Value Invoke-Krackerjack -Scope Global -Force -ErrorAction SilentlyContinue
}

function Get-HiveStatus {
  Push-Location $env:HIVE_ROOT
  try { python NEURAL\brain\hive_link.py status } finally { Pop-Location }
}
Set-Alias -Name hive-status -Value Get-HiveStatus -Scope Global -Force -ErrorAction SilentlyContinue
