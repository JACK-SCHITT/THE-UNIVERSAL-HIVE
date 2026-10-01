#Requires -Version 5.1
<#
.SYNOPSIS
  HIVE OS branding: renames, widgets off, OEM identity, Start labels.
#>
$ErrorActionPreference = 'Continue'
$HiveRoot = if ($env:HIVE_ROOT) { $env:HIVE_ROOT } else {
  if (Test-Path 'C:\HIVE') { 'C:\HIVE' }
  elseif (Test-Path 'C:\ProgramData\THE_HIVE\war-room') { 'C:\ProgramData\THE_HIVE\war-room' }
  else { 'C:\Users\ARCHITECT\THE_HIVE' }
}
$Log = Join-Path $env:ProgramData 'THE_HIVE\logs\branding.log'
New-Item -ItemType Directory -Force -Path (Split-Path $Log) | Out-Null
function L($m) { $t = Get-Date -Format o; "$t $m" | Tee-Object -FilePath $Log -Append }

L '=== Apply-HiveBranding ==='

# OEM identity
$oem = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\OEMInformation'
New-Item -Path $oem -Force | Out-Null
Set-ItemProperty $oem -Name Manufacturer -Value 'THE HIVE — KRACKERJACK1134' -Force
Set-ItemProperty $oem -Name Model -Value 'HIVE OS (Assimilated Windows Core)' -Force
Set-ItemProperty $oem -Name SupportURL -Value 'file:///C:/HIVE/docs/HIVE_HANDBOOK/00_PRIME_DIRECTIVE.md' -Force
Set-ItemProperty $oem -Name SupportHours -Value 'Always — dual control with KRACKERJACK AI' -Force

# Registered owner
$nt = 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion'
Set-ItemProperty $nt -Name RegisteredOwner -Value 'Architect KRACKERJACK1134' -Force -ErrorAction SilentlyContinue
Set-ItemProperty $nt -Name RegisteredOrganization -Value 'THE HIVE' -Force -ErrorAction SilentlyContinue

# Kill Widgets / Meet / Chat / Copilot taskbar junk (keep normal tray)
$explorer = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced'
New-Item -Path $explorer -Force | Out-Null
# TaskbarDa = Widgets
Set-ItemProperty $explorer -Name TaskbarDa -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue
# TaskbarMn = Chat
Set-ItemProperty $explorer -Name TaskbarMn -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue
# ShowTaskViewButton keep 1 (normal)
Set-ItemProperty $explorer -Name ShowTaskViewButton -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue

$policy = 'HKCU:\Software\Policies\Microsoft\Windows\Windows Feeds'
New-Item -Path $policy -Force | Out-Null
Set-ItemProperty $policy -Name EnableFeeds -Value 0 -Type DWord -Force

$copilot = 'HKCU:\Software\Policies\Microsoft\Windows\WindowsCopilot'
New-Item -Path $copilot -Force | Out-Null
Set-ItemProperty $copilot -Name TurnOffWindowsCopilot -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue

$chat = 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\Windows Chat'
New-Item -Path $chat -Force | Out-Null
Set-ItemProperty $chat -Name ChatIcon -Value 3 -Type DWord -Force -ErrorAction SilentlyContinue

# News and interests off
$feeds = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Feeds'
New-Item -Path $feeds -Force | Out-Null
Set-ItemProperty $feeds -Name ShellFeedsTaskbarViewMode -Value 2 -Type DWord -Force -ErrorAction SilentlyContinue

# Desktop wallpaper color (black/gold hive)
$desktop = 'HKCU:\Control Panel\Desktop'
Set-ItemProperty $desktop -Name Wallpaper -Value '' -Force -ErrorAction SilentlyContinue
Add-Type -TypeDefinition @'
using System; using System.Runtime.InteropServices;
public class HiveWall {
  [DllImport("user32.dll")] public static extern bool SetSysColors(int c, int[] e, int[] v);
}
'@ -ErrorAction SilentlyContinue
try {
  # COLOR_DESKTOP = 1
  [HiveWall]::SetSysColors(1, @(1), @(0x000000)) | Out-Null
} catch {}

# Rename Start Menu shortcuts (all users + current)
function Rename-HiveShortcuts {
  $roots = @(
    "$env:ProgramData\Microsoft\Windows\Start Menu\Programs",
    "$env:APPDATA\Microsoft\Windows\Start Menu\Programs"
  )
  $map = @{
    'Windows PowerShell.lnk'              = 'KRACKERJACK AI SHELL.lnk'
    'Windows PowerShell (x86).lnk'        = 'KRACKERJACK AI SHELL (x86).lnk'
    'PowerShell.lnk'                      = 'KRACKERJACK AI SHELL.lnk'
    'Command Prompt.lnk'                  = 'KRACKERJACK AI COMMAND LINE.lnk'
    'Control Panel.lnk'                   = 'HIVE CONTROL PANEL.lnk'
    'Windows Terminal.lnk'                = 'HIVE TERMINAL.lnk'
    'Terminal.lnk'                        = 'HIVE TERMINAL.lnk'
    'File Explorer.lnk'                   = 'HIVE FILE NEXUS.lnk'
    'Task Manager.lnk'                    = 'HIVE PROCESS SWARM.lnk'
    'Notepad.lnk'                         = 'HIVE SCROLL.lnk'
    'Calculator.lnk'                      = 'HIVE CALCULUS.lnk'
    'Windows Security.lnk'                = 'HIVE AEGIS SECURITY.lnk'
    'Settings.lnk'                        = 'HIVE SETTINGS.lnk'
  }
  foreach ($root in $roots) {
    if (-not (Test-Path $root)) { continue }
    Get-ChildItem $root -Recurse -Filter '*.lnk' -ErrorAction SilentlyContinue | ForEach-Object {
      $name = $_.Name
      if ($map.ContainsKey($name)) {
        $dest = Join-Path $_.DirectoryName $map[$name]
        if (-not (Test-Path $dest)) {
          try {
            Rename-Item -LiteralPath $_.FullName -NewName $map[$name] -Force
            L "Renamed shortcut: $name -> $($map[$name])"
          } catch {
            Copy-Item $_.FullName $dest -Force -ErrorAction SilentlyContinue
            L "Copied shortcut as: $($map[$name])"
          }
        }
      }
    }
  }
}
Rename-HiveShortcuts

# Register App Paths display names via Start Menu folders
$hiveStart = "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\THE HIVE"
New-Item -ItemType Directory -Force -Path $hiveStart | Out-Null
New-Item -ItemType Directory -Force -Path "$hiveStart\AI Chambers" | Out-Null
New-Item -ItemType Directory -Force -Path "$hiveStart\Shells" | Out-Null
New-Item -ItemType Directory -Force -Path "$hiveStart\Control" | Out-Null

L "HiveRoot=$HiveRoot"
L '=== Branding complete ==='
