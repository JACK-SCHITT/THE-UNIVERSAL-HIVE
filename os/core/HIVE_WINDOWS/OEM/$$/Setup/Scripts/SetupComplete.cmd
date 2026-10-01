@echo off
REM HIVE OS — runs as SYSTEM after Windows install, before first logon polish
mkdir C:\ProgramData\THE_HIVE\logs 2>nul
echo %DATE% %TIME% SetupComplete start>> C:\ProgramData\THE_HIVE\logs\setupcomplete.log

if exist C:\HIVE\HIVE_WINDOWS\scripts\Hive-FirstLogon.ps1 (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\HIVE\HIVE_WINDOWS\scripts\Hive-FirstLogon.ps1 >> C:\ProgramData\THE_HIVE\logs\setupcomplete.log 2>&1
) else if exist C:\ProgramData\THE_HIVE\war-room\HIVE_WINDOWS\scripts\Hive-FirstLogon.ps1 (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\ProgramData\THE_HIVE\war-room\HIVE_WINDOWS\scripts\Hive-FirstLogon.ps1 >> C:\ProgramData\THE_HIVE\logs\setupcomplete.log 2>&1
)

REM Run key safety for AI dock (all users)
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v HIVE_AI_DOCK /t REG_SZ /d "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File C:\ProgramData\THE_HIVE\bin\Start-HiveAiDock.ps1" /f >> C:\ProgramData\THE_HIVE\logs\setupcomplete.log 2>&1

echo %DATE% %TIME% SetupComplete done>> C:\ProgramData\THE_HIVE\logs\setupcomplete.log
