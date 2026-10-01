@echo off
setlocal
if defined HIVE_ROOT (set "HIVE=%HIVE_ROOT%") else (set "HIVE=%~dp0..")
cd /d "%HIVE%"
if not defined HIVE_BRAIN set "HIVE_BRAIN=local"
python NEURAL\brain\hive_link.py status
exit /b %ERRORLEVEL%
