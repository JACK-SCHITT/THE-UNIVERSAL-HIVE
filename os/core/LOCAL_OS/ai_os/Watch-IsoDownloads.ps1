# Monitor HIVE AI OS media downloads and finalize .part files
$base = 'D:\HIVE_BOOTLAB\Linux\ISO_amd64'
Write-Host "Monitoring $base (Ctrl+C to stop)"
while ($true) {
  Clear-Host
  Write-Host "=== HIVE AI OS media download status $(Get-Date -Format t) ==="
  Get-ChildItem $base -Recurse -File -EA SilentlyContinue |
    Where-Object { $_.Name -match '\.(iso|zip|part|partial)$' } |
    Select-Object @{N='File';E={$_.FullName.Replace($base+'\','')}}, @{N='MB';E={[math]::Round($_.Length/1MB,1)}} |
    Format-Table -AutoSize
  Write-Host "curl processes:" (Get-Process curl -EA SilentlyContinue).Count
  # Promote finished parts if curl gone and size stable? manual finalize:
  Get-ChildItem $base -Recurse -Filter '*.part' -EA SilentlyContinue | ForEach-Object {
    $final = $_.FullName -replace '\.part$',''
    if (-not (Get-Process curl -EA SilentlyContinue)) {
      # only auto-rename if large enough heuristics
      if ($_.Length -gt 100MB) {
        Move-Item -Force $_.FullName $final
        Write-Host "FINALIZED $final"
      }
    }
  }
  Start-Sleep -Seconds 15
}
