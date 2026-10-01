# Build bootable SparkyLinux + Hive ISO via WSL (no sudo required for map remaster)
$ErrorActionPreference = "Continue"
$Script = "/mnt/c/Users/ARCHITECT/THE_HIVE/scripts/sparky_hive_bootable_iso.sh"
Write-Host "=========================================="
Write-Host "  SPARKY + HIVE BOOTABLE ISO BUILD"
Write-Host "=========================================="

# Ensure squashfs-tools if possible (passwordless may fail — ok)
wsl -d kali-linux -e bash -lc "sed -i 's/\r$//' '$Script'; chmod +x '$Script'; command -v unsquashfs || (sudo -n apt-get install -y squashfs-tools 2>/dev/null) || true; command -v unsquashfs; command -v xorriso"

Write-Host "[*] Building (download Sparky + inject Hive + remaster)..."
wsl -d kali-linux -e bash -lc "bash '$Script'"
$code = $LASTEXITCODE
Write-Host "Exit: $code"
Get-ChildItem "C:\Users\ARCHITECT\THE_HIVE\GENESIS\iso" -ErrorAction SilentlyContinue | Format-Table Name, Length, LastWriteTime
if (Test-Path "C:\Users\ARCHITECT\THE_HIVE\GENESIS\LIVE_ISO.json") {
  Get-Content "C:\Users\ARCHITECT\THE_HIVE\GENESIS\LIVE_ISO.json"
}
exit $code
