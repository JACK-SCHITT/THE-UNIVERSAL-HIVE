@echo off
REM HIVE-OS war-room launcher (Windows)
REM Architect: KRACKERJACK1134
setlocal EnableExtensions

if defined HIVE_ROOT (
  set "HIVE=%HIVE_ROOT%"
) else (
  set "HIVE=%~dp0.."
)
cd /d "%HIVE%" 2>nul
if errorlevel 1 (
  echo [!] Cannot cd to HIVE root: %HIVE%
  exit /b 1
)

if not defined HIVE_BRAIN set "HIVE_BRAIN=local"

if "%~1"=="" goto :usage
if /i "%~1"=="help" goto :usage
if /i "%~1"=="-h" goto :usage
if /i "%~1"=="--help" goto :usage

if /i "%~1"=="status" (
  python NEURAL\brain\hive_link.py status
  exit /b %ERRORLEVEL%
)
if /i "%~1"=="offline" (
  shift
  if "%~1"=="" (
    python NEURAL\brain\hive_link.py offline "Hive offline check"
  ) else (
    python NEURAL\brain\hive_link.py offline %*
  )
  exit /b %ERRORLEVEL%
)
if /i "%~1"=="ask" (
  shift
  python NEURAL\brain\hive_link.py ask %*
  exit /b %ERRORLEVEL%
)
if /i "%~1"=="first" (
  shift
  if "%~1"=="" (
    python NEURAL\krackerjack\first_contact.py
  ) else (
    python NEURAL\krackerjack\first_contact.py %*
  )
  exit /b %ERRORLEVEL%
)
if /i "%~1"=="krackerjack" (
  shift
  python NEURAL\brain\agents.py krackerjack %*
  exit /b %ERRORLEVEL%
)
if /i "%~1"=="hunterprime" (
  shift
  python NEURAL\brain\agents.py hunterprime %*
  exit /b %ERRORLEVEL%
)
if /i "%~1"=="counsel" (
  shift
  python NEURAL\brain\agents.py counsel %*
  exit /b %ERRORLEVEL%
)
if /i "%~1"=="zorg" (
  shift
  python NEURAL\brain\agents.py zorg %*
  exit /b %ERRORLEVEL%
)
if /i "%~1"=="agent" (
  shift
  python NEURAL\brain\agents.py %*
  exit /b %ERRORLEVEL%
)
if /i "%~1"=="ui" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%HIVE%\scripts\start_hive_ui.ps1"
  exit /b %ERRORLEVEL%
)
if /i "%~1"=="upgrade" (
  shift
  if "%~1"=="" (
    python NEURAL\brain\self_upgrade.py --offline
  ) else (
    python NEURAL\brain\self_upgrade.py %*
  )
  exit /b %ERRORLEVEL%
)
if /i "%~1"=="bootstrap" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%HIVE%\scripts\bootstrap_local_brain.ps1"
  exit /b %ERRORLEVEL%
)
if /i "%~1"=="assimilate" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%HIVE%\scripts\assimilate\assimilate_gentoo.ps1"
  exit /b %ERRORLEVEL%
)
if /i "%~1"=="wsl" (
  wsl -d kali-linux -e bash -lc "bash /mnt/c/Users/ARCHITECT/THE_HIVE/scripts/wsl_stage_hive.sh"
  exit /b %ERRORLEVEL%
)
if /i "%~1"=="cd" (
  echo %HIVE%
  exit /b 0
)
if /i "%~1"=="root" (
  echo %HIVE%
  exit /b 0
)

echo [!] Unknown hive command: %~1
goto :usage

:usage
echo.
echo  HIVE-OS war room CLI
echo  Root: %HIVE%
echo.
echo  hive status              Brain / soul / ollama health
echo  hive offline [msg]       Offline sovereign brain
echo  hive ask "..."           Local brain chain
echo  hive first [args]        KRACKERJACK first contact
echo  hive krackerjack "..."   Chosen one
echo  hive hunterprime "..."   Action tester
echo  hive counsel "..."       Truth filter
echo  hive zorg "..."          Security tester
echo  hive agent NAME "..."    Any agent
echo  hive ui                  Cockpit http://127.0.0.1:8787/
echo  hive upgrade             Self-upgrade --offline
echo  hive bootstrap           Free local Ollama models
echo  hive assimilate          Gentoo seed ritual (no wipe)
echo  hive wsl                 Stage + validate in kali-linux
echo  hive root                Print HIVE_ROOT
echo.
exit /b 0
