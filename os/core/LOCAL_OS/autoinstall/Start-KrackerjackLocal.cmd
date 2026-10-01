@echo off
title KRACKERJACK AI — LOCAL ONLY
set OLLAMA_MODELS=D:\HIVE_LOCAL_AI\ollama\models
set HIVE_LOCAL_MODEL=phi3:mini
set HIVE_ASSIST_PORT=8788
cd /d C:\Users\ARCHITECT\THE_HIVE\LOCAL_OS\firstboot
start "" "C:\Users\ARCHITECT\AppData\Local\Programs\Ollama\ollama.exe" serve
timeout /t 2 /nobreak >nul
"C:\Users\ARCHITECT\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe" krackerjack_local_assistant.py
pause
