@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0admin.ps1"
if errorlevel 1 pause
