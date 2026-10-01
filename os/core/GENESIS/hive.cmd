@echo off
REM hive.cmd  -  Windows entry point for the HIVE OS CLI
REM This wraps the bash shim when Git-Bash is available; otherwise falls back to direct node.
setlocal EnableExtensions EnableDelayedExpansion
set "HIVE_HOME=%USERPROFILE%\.hive"
set "HIVE_CORE=%HIVE_HOME%\core"
set "GENESIS=%~dp0"

if not exist "%HIVE_CORE%" goto :bootstrap
goto :run

:bootstrap
echo [hive] HIVE core not found at %HIVE_CORE%  -  bootstrapping...
where bash >nul 2>&1
if errorlevel 1 (
  echo [hive] bash not available. Cannot bootstrap from .cmd.
  exit /b 1
)
bash "%GENESIS%hive-installer.sh"
if errorlevel 1 (
  echo [hive] bootstrap failed
  exit /b 1
)

:run
where bash >nul 2>&1
if not errorlevel 1 (
  bash "%HIVE_HOME%\bin\hive" %*
  exit /b %ERRORLEVEL%
)
echo [hive] bash not available, falling back to direct node
node "%HIVE_CORE%\hive-init.js" boot
