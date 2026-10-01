@echo off
title HIVE AI OS DESKTOP — Apps Are The OS
start "" "C:\Users\ARCHITECT\THE_HIVE\OS_SHELL\hive-desktop.html"
rem also try edge/chrome app mode if available
where msedge >nul 2>&1 && start msedge --app="file:///C:/Users/ARCHITECT/THE_HIVE/OS_SHELL/hive-desktop.html"
exit /b 0
