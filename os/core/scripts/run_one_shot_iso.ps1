# Launch KRACKERJACK one-shot ISO build inside WSL Kali (will ask for sudo password)
$ErrorActionPreference = "Stop"
$Script = "/mnt/c/Users/ARCHITECT/THE_HIVE/scripts/krackerjack_one_shot_iso.sh"
Write-Host "=========================================="
Write-Host "  KRACKERJACK ONE-SHOT ISO (via WSL Kali)"
Write-Host "=========================================="
Write-Host "This will prompt for your Kali/WSL sudo password."
Write-Host "Build can take 30–90+ minutes and needs network."
Write-Host ""

# Ensure LF line endings for bash (Windows CRLF breaks shebangs)
wsl -d kali-linux -e bash -lc "sed -i 's/\r$//' '$Script' ; chmod +x '$Script'"

# Interactive sudo
wsl -d kali-linux -e bash -lc "sudo bash '$Script'"
Write-Host ""
Write-Host "If build succeeded, ISO should be under:"
Write-Host "  C:\Users\ARCHITECT\THE_HIVE\GENESIS\iso\HIVE-OS-KRACKERJACK-LIVE.iso"
Write-Host "  and/or  \\wsl$\kali-linux\home\ARCHITECT\hive-iso-work\"
