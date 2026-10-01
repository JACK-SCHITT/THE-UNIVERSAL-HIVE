@echo off
title HIVE AI OS — Control Center
color 0A
setlocal
set HIVE=C:\Users\ARCHITECT\THE_HIVE
set ISO=D:\HIVE_BOOTLAB\Linux\ISO_amd64
set RUFUS=D:\HIVE_BOOTLAB\Tools\rufus-4.15.exe

:menu
cls
echo ============================================================
echo   HIVE AI OS  ^|  KRACKERJACK  ^|  LOCAL FIRST  ^|  FEDERATION
echo ============================================================
echo.
echo   [1] Open HIVE AI OS DESKTOP  (apps = the OS UI)
echo   [2] Start KRACKERJACK AI local install assistant
echo   [3] Run Windows Hive auto-install (local Ollama)
echo   [4] Open WSL Kali (Metasploit lives here)
echo   [5] Open ISO folder (Kali/Gentoo/Sparky/Metasploit)
echo   [6] Launch Rufus (make bootable USB)
echo   [7] Open THE_HIVE DNA
echo   [8] Open GENESIS
echo   [9] Show media inventory
echo   [0] Exit
echo.
set /p c=Select: 

if "%c%"=="1" goto desktop
if "%c%"=="2" goto assist
if "%c%"=="3" goto install
if "%c%"=="4" goto kali
if "%c%"=="5" goto isos
if "%c%"=="6" goto rufus
if "%c%"=="7" goto hive
if "%c%"=="8" goto genesis
if "%c%"=="9" goto inv
if "%c%"=="0" exit /b 0
goto menu

:desktop
start "" "%HIVE%\OS_SHELL\Start-HiveDesktop.cmd"
goto menu

:assist
start "" "%HIVE%\LOCAL_OS\autoinstall\Start-KrackerjackLocal.cmd"
goto menu

:install
powershell -NoProfile -ExecutionPolicy Bypass -File "%HIVE%\LOCAL_OS\autoinstall\Install-HiveLocal.ps1" -PullModel
pause
goto menu

:kali
wsl -d kali-linux
goto menu

:isos
explorer "%ISO%"
goto menu

:rufus
if exist "%RUFUS%" (start "" "%RUFUS%") else (echo Rufus missing at %RUFUS% & pause)
goto menu

:hive
explorer "%HIVE%"
goto menu

:genesis
explorer "%HIVE%\GENESIS"
goto menu

:inv
echo.
dir /s "%ISO%"
echo.
pause
goto menu
