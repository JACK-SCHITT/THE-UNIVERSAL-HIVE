#Requires -Version 5.1
<#
  Sequential official minimal media downloads for HIVE AI OS (amd64).
  Resumable. Writes to D:\HIVE_BOOTLAB\Linux\ISO_amd64\
  Run overnight if link is slow:
    powershell -ExecutionPolicy Bypass -File ...\Download-HiveMedia.ps1
#>
$ErrorActionPreference = 'Continue'
$base = 'D:\HIVE_BOOTLAB\Linux\ISO_amd64'
New-Item -ItemType Directory -Force -Path "$base\kali","$base\gentoo","$base\sparky","$base\metasploit","$base\checksums" | Out-Null

$items = @(
  @{
    Name = 'Kali netinst 2026.2 amd64 (minimal installer; Metasploit via apt after install)'
    Url  = 'https://cdimage.kali.org/current/kali-linux-2026.2-installer-netinst-amd64.iso'
    Out  = "$base\kali\kali-linux-2026.2-installer-netinst-amd64.iso"
    MinMB = 200
  },
  @{
    Name = 'Gentoo install-amd64-minimal'
    Url  = 'https://distfiles.gentoo.org/releases/amd64/autobuilds/20260712T170110Z/install-amd64-minimal-20260712T170110Z.iso'
    Out  = "$base\gentoo\install-amd64-minimal-20260712T170110Z.iso"
    MinMB = 200
  },
  @{
    Name = 'SparkyLinux 8.3 minimalcli x86_64 (correct arch for this PC)'
    Url  = 'https://archive.org/download/sparkylinux/sparkylinux-8.3-x86_64-minimalcli.iso'
    Out  = "$base\sparky\sparkylinux-8.3-x86_64-minimalcli.iso"
    MinMB = 200
  },
  @{
    Name = 'Metasploitable2 (lab target VM — NOT daily OS)'
    Url  = 'https://downloads.sourceforge.net/project/metasploitable/Metasploitable2/metasploitable-linux-2.0.0.zip'
    Out  = "$base\metasploit\metasploitable-linux-2.0.0.zip"
    MinMB = 50
  }
)

curl.exe -L --fail --retry 3 -o "$base\checksums\kali-SHA256SUMS" 'https://cdimage.kali.org/current/SHA256SUMS' 2>$null

foreach ($i in $items) {
  Write-Host "`n==== $($i.Name) ===="
  Write-Host $i.Url
  if ((Test-Path $i.Out) -and ((Get-Item $i.Out).Length -gt ($i.MinMB * 1MB))) {
    Write-Host "OK already present $([math]::Round((Get-Item $i.Out).Length/1MB,1)) MB"
    continue
  }
  # prefer resume of partial
  $part = $i.Out + '.partial'
  if ((Test-Path ($i.Out + '.part')) -and -not (Test-Path $part)) {
    Move-Item -Force ($i.Out + '.part') $part
  }
  $target = $part
  Write-Host "Downloading to $target ..."
  & curl.exe -L --http1.1 --retry 20 --retry-delay 10 -C - --connect-timeout 60 -o $target $i.Url
  if ($LASTEXITCODE -eq 0 -and (Test-Path $target) -and ((Get-Item $target).Length -gt ($i.MinMB * 1MB))) {
    Move-Item -Force $target $i.Out
    Write-Host "DONE $([math]::Round((Get-Item $i.Out).Length/1MB,1)) MB"
  } else {
    Write-Host "INCOMPLETE exit=$LASTEXITCODE size=$((Get-Item $target -EA SilentlyContinue).Length) — re-run script to resume"
  }
}

Write-Host "`n==== INVENTORY ===="
Get-ChildItem $base -Recurse -File | Select-Object FullName, @{N='MB';E={[math]::Round($_.Length/1MB,1)}} | Format-Table -AutoSize
Write-Host "Next: Ventoy multi-boot OR Rufus single ISO"
Write-Host "Control center: C:\Users\ARCHITECT\THE_HIVE\LOCAL_OS\ai_os\Start-HiveAIOS.cmd"
