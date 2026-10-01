@echo off
REM KRACKERJACK AI — first contact entry (Windows)
setlocal
if defined HIVE_ROOT (set "HIVE=%HIVE_ROOT%") else (set "HIVE=%~dp0..")
cd /d "%HIVE%"
if not defined HIVE_BRAIN set "HIVE_BRAIN=local"
if "%~1"=="" (
  python NEURAL\krackerjack\first_contact.py
) else (
  python NEURAL\krackerjack\first_contact.py %*
)
exit /b %ERRORLEVEL%
