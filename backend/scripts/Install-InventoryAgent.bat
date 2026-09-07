@echo off
REM ============================================================
REM  ITMS Inventory Agent - one-click installer
REM
REM  Double-click this file on the machine you want reporting to
REM  the Hardware Inventory system. It self-elevates (UAC prompt)
REM  and installs the permanent scheduled task for you - no need
REM  to open PowerShell or type any command yourself.
REM
REM  Edit SERVER and AGENT_KEY below before distributing this file
REM  to other machines. AGENT_KEY must match the backend's
REM  AGENT_SHARED_SECRET (backend\.env) - if that secret is ever
REM  rotated, this file needs updating too, everywhere it's been
REM  copied.
REM ============================================================

set "SERVER=http://192.168.1.32:3000"
set "AGENT_KEY=9f1e14243971a1f80ff0888366ea182de5c57f977d861627d8f0a61cb101eecf"

REM ---- self-elevate if not already running as admin ----
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting administrator rights...
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

echo ============================================================
echo  Installing ITMS Inventory Agent
echo  Server: %SERVER%
echo ============================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install-InventoryAgentTask.ps1" -Server "%SERVER%" -AgentKey "%AGENT_KEY%"

echo.
echo ============================================================
echo  Done. Review the output above for any errors.
echo ============================================================
pause
