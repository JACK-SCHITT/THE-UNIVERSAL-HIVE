@echo off
title HIVE AI OS — FULL LIVE RUNTIME
cd /d C:\Users\ARCHITECT\THE_HIVE\OS_SHELL
set OLLAMA_MODELS=D:\HIVE_LOCAL_AI\ollama\models
set HIVE_LOCAL_MODEL=phi3:mini
set PATH=C:\Users\ARCHITECT\AppData\Local\hermes\node;%PATH%

echo [*] Ensuring Ollama...
if not exist "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" (
  echo Ollama missing — install from https://ollama.com
) else (
  start "" "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" serve
)

echo [*] Starting HIVE OS Runtime on :8790 ...
"C:\Users\ARCHITECT\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe" hive-os-runtime.py
pause
