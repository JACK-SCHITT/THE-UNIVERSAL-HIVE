# Windows Hive — stays individual. Peers are recorded. unite stays empty.
# Does not download a Windows ISO. Does not start the WSL hive.
$ErrorActionPreference = "Stop"
$env:HIVE_FORCE_BASE = "windows"
$dest = Join-Path $env:USERPROFILE "THE-UNIVERSAL-HIVE"
if (-not (Test-Path (Join-Path $dest ".git"))) {
  git clone "https://github.com/JACK-SCHITT/THE-UNIVERSAL-HIVE.git" $dest
}
$hiveHome = Join-Path $env:USERPROFILE ".hive"
New-Item -ItemType Directory -Force -Path $hiveHome | Out-Null
@'
{
  "self": "windows",
  "name": "Windows Hive",
  "staysIndividual": true,
  "unite": [],
  "peers": [
    {
      "id": "gentoo",
      "name": "Gentoo Hive",
      "connect": "peer",
      "united": false
    },
    {
      "id": "kali",
      "name": "Kali Hive",
      "connect": "peer",
      "united": false
    },
    {
      "id": "nethunter",
      "name": "NetHunter Hive",
      "connect": "peer",
      "united": false
    },
    {
      "id": "termux",
      "name": "Termux Hive",
      "connect": "peer",
      "united": false
    },
    {
      "id": "ish",
      "name": "iSH Hive",
      "connect": "peer",
      "united": false
    },
    {
      "id": "debian",
      "name": "Debian Hive",
      "connect": "peer",
      "united": false
    },
    {
      "id": "arch",
      "name": "Arch Hive",
      "connect": "peer",
      "united": false
    },
    {
      "id": "alpine",
      "name": "Alpine Hive",
      "connect": "peer",
      "united": false
    },
    {
      "id": "macos",
      "name": "macOS Hive",
      "connect": "peer",
      "united": false
    },
    {
      "id": "wsl",
      "name": "WSL Hive",
      "connect": "peer",
      "united": false
    }
  ],
  "note": "Peers are known so these hives can work in unison later. Nothing is united until you add ids to unite."
}
'@ | Set-Content -Encoding utf8 (Join-Path $hiveHome "link.json")
Write-Host "Windows Hive files: $dest\os\core\HIVE_WINDOWS"
Write-Host "Peer link written. unite is empty. The Windows hive is not joined to WSL or any other hive."
Write-Host "Full war-room wire-up (only if C:\Users\ARCHITECT\THE_HIVE already exists, and only if you want it):"
Write-Host "  powershell -File `"$dest\os\core\scripts\windows\install_hive_windows.ps1`" -SkipWsl"
