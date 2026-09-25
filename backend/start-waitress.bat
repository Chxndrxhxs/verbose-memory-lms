@echo off
cd /d C:\Users\RS\verbose-memory-lms\backend
C:\Users\RS\verbose-memory-lms\backend\.venv\Scripts\waitress-serve.exe --listen=0.0.0.0:8000 config.wsgi:application >> server.log 2>&1
