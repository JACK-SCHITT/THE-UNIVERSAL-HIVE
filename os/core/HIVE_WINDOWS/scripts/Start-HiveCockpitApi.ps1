#Requires -Version 5.1
# Start hive_api.py on 127.0.0.1:8787 if not already listening
$ErrorActionPreference = 'Continue'
$HiveRoot = if (Test-Path 'C:\HIVE') { 'C:\HIVE' }
  elseif (Test-Path 'C:\ProgramData\THE_HIVE\war-room') { 'C:\ProgramData\THE_HIVE\war-room' }
  elseif ($env:HIVE_ROOT) { $env:HIVE_ROOT }
  else { 'C:\Users\ARCHITECT\THE_HIVE' }

function Test-Port8787 {
  try {
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8787/api/health' -UseBasicParsing -TimeoutSec 2
    return ($r.StatusCode -ge 200)
  } catch { return $false }
}

if (Test-Port8787) { exit 0 }

$api = Join-Path $HiveRoot 'NEURAL\brain\hive_api.py'
if (-not (Test-Path $api)) { exit 1 }

$py = $null
foreach ($c in @('python', 'py')) {
  $cmd = Get-Command $c -ErrorAction SilentlyContinue
  if ($cmd) { $py = $cmd.Source; break }
}
if (-not $py) { exit 2 }

Start-Process -FilePath $py -ArgumentList "`"$api`"" -WorkingDirectory $HiveRoot -WindowStyle Hidden
# wait briefly
for ($i = 0; $i -lt 15; $i++) {
  if (Test-Port8787) { exit 0 }
  Start-Sleep -Seconds 1
}
exit 0
