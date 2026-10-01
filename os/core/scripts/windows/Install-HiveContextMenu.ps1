# HIVE-OS File Explorer Context Menu Integration
# Adds right-click menu options for files, folders, and desktop background
# Architect: KRACKERJACK1134

[CmdletBinding()]
param(
    [switch]$Remove
)

$ErrorActionPreference = 'Stop'
$HiveRoot = if (Test-Path 'C:\HIVE') { 'C:\HIVE' } elseif ($env:HIVE_ROOT) { $env:HIVE_ROOT } else { 'C:\Users\ARCHITECT\THE_HIVE' }

function Add-ContextMenuItem {
    param(
        [string]$RegistryPath,
        [string]$DisplayName,
        [string]$Command,
        [string]$Icon = "",
        [string[]]$AppliesTo = @("*")  # *, Directory, Directory.Background
    )

    foreach($target in $AppliesTo) {
        $fullPath = "HKCR:\$target\shell\$RegistryPath"
        if (-not (Test-Path $fullPath)) {
            New-Item -Path $fullPath -Force | Out-Null
        }

        Set-ItemProperty -Path $fullPath -Name "(Default)" -Value $DisplayName
        if ($Icon) {
            Set-ItemProperty -Path $fullPath -Name "Icon" -Value $Icon
        }

        $commandPath = Join-Path $fullPath "command"
        if (-not (Test-Path $commandPath)) {
            New-Item -Path $commandPath -Force | Out-Null
        }

        Set-ItemProperty -Path $commandPath -Name "(Default)" -Value $Command
        Write-Host "Added context menu: $DisplayName for $target"
    }
}

function Remove-ContextMenuItem {
    param(
        [string]$RegistryPath,
        [string[]]$AppliesTo = @("*")
    )

    foreach($target in $AppliesTo) {
        $fullPath = "HKCR:\$target\shell\$RegistryPath"
        if (Test-Path $fullPath) {
            Remove-Item -Path $fullPath -Recurse -Force
            Write-Host "Removed context menu: $RegistryPath for $target"
        }
    }
}

if ($Remove) {
    Write-Host "Removing Hive context menu items..."
    Remove-ContextMenuItem -RegistryPath "Hive.AskKrackerjack" -AppliesTo @("*", "Directory")
    Remove-ContextMenuItem -RegistryPath "Hive.ScanWithZorg" -AppliesTo @("*", "Directory")
    Remove-ContextMenuItem -RegistryPath "Hive.GetCounsel" -AppliesTo @("*", "Directory")
    Remove-ContextMenuItem -RegistryPath "Hive.JaguarRun" -AppliesTo @("*", "Directory")
    Remove-ContextMenuItem -RegistryPath "Hive.OpenCockpit" -AppliesTo @("Directory", "Directory.Background")
    Remove-ContextMenuItem -RegistryPath "Hive.ShowStatus" -AppliesTo @("Directory", "Directory.Background")
    Write-Host "Context menu removal complete."
} else {
    Write-Host "Adding Hive context menu items..."

    # Ask KRACKERJACK about file/folder
    Add-ContextMenuItem -RegistryPath "Hive.AskKrackerjack" `
        -DisplayName "Ask KRACKERJACK about this item" `
        -Command "cmd /c \"cd /d '%HIVE_ROOT%' & python NEURAL\krackerjack\first_contact.py ask \"What is this file and what should I do with it? Path: '%1'\"`" `
        -Icon "$HiveRoot\HIVE_WINDOWS\ui\krackerjack-ai-plugin\icon.png" `
        -AppliesTo @("*", "Directory")

    # Scan with ZORG
    Add-ContextMenuItem -RegistryPath "Hive.ScanWithZorg" `
        -DisplayName "Scan with ZORG Security" `
        -Command "cmd /c \"cd /d '%HIVE_ROOT%' & python NEURAL\brain\agents.py zorg scan path '%1'\"`" `
        -Icon "$HiveRoot\HIVE_WINDOWS\ui\zorg-plugin\icon.png" `
        -AppliesTo @("*", "Directory")

    # Get COUNSEL opinion
    Add-ContextMenuItem -RegistryPath "Hive.GetCounsel" `
        -DisplayName "Get COUNSEL opinion" `
        -Command "cmd /c \"cd /d '%HIVE_ROOT%' & python NEURAL\brain\agents.py counsel give advice on this item: '%1'\"`" `
        -Icon "$HiveRoot\HIVE_WINDOWS\ui\counsel-plugin\icon.png" `
        -AppliesTo @("*", "Directory")

    # JAGUAR: Execute command
    Add-ContextMenuItem -RegistryPath "Hive.JaguarRun" `
        -DisplayName "JAGUAR: Run command on this" `
        -Command "cmd /c \"cd /d '%HIVE_ROOT%' & python NEURAL\brain\agents.py jaguar execute in directory '%1'\"`" `
        -Icon "$HiveRoot\HIVE_WINDOWS\ui\jaguar-plugin\icon.png" `
        -AppliesTo @("Directory")

    # Open Cockpit
    Add-ContextMenuItem -RegistryPath "Hive.OpenCockpit" `
        -DisplayName "Open Hive Cockpit" `
        -Command "cmd /c \"start http://127.0.0.1:8787/\"`" `
        -Icon "$HiveRoot\cold-storage\hive-cockpit.ico" `
        -AppliesTo @("Directory", "Directory.Background")

    # Show Status
    Add-ContextMenuItem -RegistryPath "Hive.ShowStatus" `
        -DisplayName "Show Hive Status" `
        -Command "cmd /c \"cd /d '%HIVE_ROOT%' & start python NEURAL\brain\hive_link.py status\"`" `
        -Icon "$HiveRoot\HIVE_WINDOWS\ui\hive-status.ico" `
        -AppliesTo @("Directory", "Directory.Background")

    Write-Host "Context menu installation complete."
    Write-Host "Note: You may need to restart Explorer.exe or log off/on for changes to take effect."
}