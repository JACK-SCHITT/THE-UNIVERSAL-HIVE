# HIVE-OS File Association Installer
# Associates custom file types with Hive applications
# Architect: KRACKERJACK1134

[CmdletBinding()]
param(
    [switch]$Remove
)

$ErrorActionPreference = 'Stop'
$HiveRoot = if (Test-Path 'C:\HIVE') { 'C:\HIVE' } elseif ($env:HIVE_ROOT) { $env:HIVE_ROOT } else { 'C:\Users\ARCHITECT\THE_HIVE' }
$BinDir = Join-Path $HiveRoot 'bin'

function Register-FileAssociation {
    param(
        [string]$Extension,
        [string]$ProgId,
        [string]$Description,
        [string]$Command,
        [string]$Icon = ""
    )

    # Create ProgID if it doesn't exist
    $progIdPath = "HKCR:\$ProgId"
    if (-not (Test-Path $progIdPath)) {
        New-Item -Path $progIdPath -Force | Out-Null
        Set-ItemProperty -Path $progIdPath -Name "(Default)" -Value $Description
        if ($Icon) {
            Set-ItemProperty -Path $progIdPath -Name "DefaultIcon" -Value $Icon
        }
    }

    # Set the extension to use this ProgID
    $extPath = "HKCR:\$Extension"
    if (-not (Test-Path $extPath)) {
        New-Item -Path $extPath -Force | Out-Null
    }
    Set-ItemProperty -Path $extPath -Name "(Default)" -Value $ProgId

    # Create command shell
    $shellPath = "HKCR:\$ProgId\shell\open\command"
    if (-not (Test-Path $shellPath)) {
        New-Item -Path $shellPath -Force | Out-Null
    }
    Set-ItemProperty -Path $shellPath -Name "(Default)" -Value $Command

    Write-Host "Registered association: $Extension -> $ProgId"
}

function Unregister-FileAssociation {
    param(
        [string]$Extension,
        [string]$ProgId
    )

    # Remove extension association
    $extPath = "HKCR:\$Extension"
    if (Test-Path $extPath) {
        Remove-Item -Path $extPath -Recurse -Force
        Write-Host "Removed extension: $Extension"
    }

    # Remove ProgID if it's one of ours
    $progIdPath = "HKCR:\$ProgId"
    if (Test-Path $progIdPath) {
        # Only remove if it looks like one of ours
        $defaultVal = (Get-ItemProperty -Path $progIdPath -Name "(Default)" -ErrorAction SilentlyContinue)."(Default)"
        if ($defaultVal -match "Hive|Krackerjack|Jaguar|Counsel|Zorg|ScamShield|Capricorn|Grokschitt|Assimilate") {
            Remove-Item -Path $progIdPath -Recurse -Force
            Write-Host "Removed ProgID: $ProgId"
        }
    }
}

if ($Remove) {
    Write-Host "Removing Hive file associations..."
    Unregister-FileAssociation -Extension ".hive-teach" -ProgId "HiveTeach.File"
    Unregister-FileAssociation -Extension ".hive-prime" -ProgId "HivePrime.File"
    Unregister-FileAssociation -Extension ".hive-directive" -ProgId "HiveDirective.File"
    Unregister-FileAssociation -Extension ".hive-agent" -ProgId "HiveAgent.Config"
    Unregister-FileAssociation -Extension ".hive-chat" -ProgId "HiveChat.Log"
    Write-Host "File association removal complete."
} else {
    Write-Host "Adding Hive file associations..."

    # Hive Teach Files
    Register-FileAssociation -Extension ".hive-teach" `
        -ProgId "HiveTeach.File" `
        -Description "Hive Teaching Module" `
        -Command "`"%SystemRoot%\System32\notepad.exe`" `"%1`"" `
        -Icon "$HiveRoot\HIVE_WINDOWS\ui\teach-plugin\icon.png"

    # Hive Prime Directive
    Register-FileAssociation -Extension ".hive-prime" `
        -ProgId "HivePrime.File" `
        -Description "Hive Prime Directive" `
        -Command "`"%SystemRoot%\System32\notepad.exe`" `"%1`"" `
        -Icon "$HiveRoot\HIVE_WINDOWS\ui\prime-plugin\icon.png"

    # Hive Directive
    Register-FileAssociation -Extension ".hive-directive" `
        -ProgId "HiveDirective.File" `
        -Description "Hive Directive" `
        -Command "`"%SystemRoot%\System32\notepad.exe`" `"%1`"" `
        -Icon "$HiveRoot\HIVE_WINDOWS\ui\directive-plugin\icon.png"

    # Hive Agent Configuration
    Register-FileAssociation -Extension ".hive-agent" `
        -ProgId "HiveAgent.Config" `
        -Description "Hive Agent Configuration" `
        -Command "`"%SystemRoot%\System32\notepad.exe`" `"%1`"" `
        -Icon "$HiveRoot\HIVE_WINDOWS\ui\agent-plugin\icon.png"

    # Hive Chat Log
    Register-FileAssociation -Extension ".hive-chat" `
        -ProgId "HiveChat.Log" `
        -Description "Hive Chat Log" `
        -Command "`"%SystemRoot%\System32\notepad.exe`" `"%1`"" `
        -Icon "$HiveRoot\HIVE_WINDOWS\ui\chat-plugin\icon.png"

    Write-Host "File association installation complete."
    Write-Host "Note: You may need to restart Explorer.exe or log off/on for changes to take effect."
}