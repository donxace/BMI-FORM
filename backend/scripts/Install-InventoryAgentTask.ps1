<#
.SYNOPSIS
    One-time, per-machine setup that turns Get-InventoryAgent.ps1 into a
    zero-touch agent: installs it as a recurring Scheduled Task, so this
    machine keeps reporting to the ITMS Hardware Inventory system forever
    after, with no further manual runs.

.DESCRIPTION
    Run this ONCE (elevated) on a machine and never touch it again:

      1. Copies Get-InventoryAgent.ps1 to C:\ProgramData\ITMS-Agent\, so the
         scheduled task has a stable local copy that doesn't depend on a
         network share, USB drive, or the folder you ran this from still
         existing.
      2. Registers a Scheduled Task (running as SYSTEM, "whether the user
         is logged on or not") that re-runs the agent:
           - Daily, at the time you choose (-DailyTime)
           - At every system startup, with a small random delay, so a
             mass reboot of many machines doesn't hit the backend at the
             exact same second
      3. Runs the task once immediately, so you get instant confirmation
         instead of waiting for the next trigger.

    Because it runs as SYSTEM rather than an interactive user, per-user
    installed software (HKCU) and per-user mapped printers may be
    under-reported compared to running Get-InventoryAgent.ps1 interactively
    — machine-wide (HKLM) software, hotfixes, USB history, and network
    adapters are unaffected. This is the standard trade-off for a
    no-login-required agent and matches how most lightweight inventory
    tools operate.

.PARAMETER Server
    Base URL of the ITMS backend, e.g. http://192.168.1.11:3000

.PARAMETER AgentKey
    Must match the backend's AGENT_SHARED_SECRET (backend/.env) — passed
    through to every scheduled run of Get-InventoryAgent.ps1. The server
    rejects agent reports without a matching key.

.PARAMETER DailyTime
    Time of day for the daily run, 24-hour HH:mm format. Defaults to 08:00.

.PARAMETER SkipUpdateCheck
    Passed through to Get-InventoryAgent.ps1 on every scheduled run. Off by
    default — a background daily run has no one waiting on it, so the
    slower Windows Update scan is worth keeping.

.PARAMETER SourceScript
    Path to Get-InventoryAgent.ps1 to install from. Defaults to the copy
    sitting next to this installer script.

.PARAMETER TaskName
    Scheduled Task name. Defaults to "ITMS Inventory Agent". Re-running this
    installer with the same name safely replaces the existing task.

.EXAMPLE
    From an elevated PowerShell prompt, once per machine:
    powershell -ExecutionPolicy Bypass -File Install-InventoryAgentTask.ps1 -Server http://192.168.1.11:3000 -AgentKey <secret>

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File Install-InventoryAgentTask.ps1 -Server http://192.168.1.11:3000 -AgentKey <secret> -DailyTime 09:30 -SkipUpdateCheck
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$Server,

    [Parameter(Mandatory)]
    [string]$AgentKey,

    [string]$DailyTime = "08:00",

    [switch]$SkipUpdateCheck,

    [string]$SourceScript,

    [string]$TaskName = "ITMS Inventory Agent"
)

# $PSScriptRoot can come back empty under some elevated/relaunch invocation
# paths (e.g. Start-Process -Verb RunAs with a combined argument string), so
# it can't be trusted as a param-block default expression. Resolve it here,
# with a fallback to $MyInvocation for those cases.
if (-not $SourceScript) {
    $scriptDir = $PSScriptRoot
    if (-not $scriptDir) {
        $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    }
    $SourceScript = Join-Path $scriptDir "Get-InventoryAgent.ps1"
}

$ErrorActionPreference = "Stop"
$Server = $Server.TrimEnd("/")

function Write-Step {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Cyan
}

# Register-ScheduledTask with a SYSTEM principal requires an elevated prompt.
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal(
    [Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run this from an elevated (Administrator) PowerShell prompt."
}

if (-not (Test-Path $SourceScript)) {
    throw "Could not find Get-InventoryAgent.ps1 at '$SourceScript'. Pass -SourceScript to point at it explicitly."
}

# ==============================================================
# INSTALL A STABLE LOCAL COPY
# ==============================================================

$installDir = "C:\ProgramData\ITMS-Agent"
$installedScript = Join-Path $installDir "Get-InventoryAgent.ps1"

Write-Step "Installing agent to $installedScript ..."
New-Item -ItemType Directory -Path $installDir -Force | Out-Null
Copy-Item -Path $SourceScript -Destination $installedScript -Force

# ==============================================================
# REGISTER THE SCHEDULED TASK
# ==============================================================

$argumentList = "-NoProfile -ExecutionPolicy Bypass -File `"$installedScript`" -Server `"$Server`" -AgentKey `"$AgentKey`""
if ($SkipUpdateCheck) {
    $argumentList += " -SkipUpdateCheck"
}

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $argumentList

$dailyTrigger = New-ScheduledTaskTrigger -Daily -At $DailyTime

$startupTrigger = New-ScheduledTaskTrigger -AtStartup
$startupTrigger.Delay = "PT$(Get-Random -Minimum 1 -Maximum 10)M"

$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1)

if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Write-Host "Task '$TaskName' already exists - replacing it." -ForegroundColor DarkGray
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

Write-Step "Registering scheduled task '$TaskName' (daily at $DailyTime, plus every startup)..."
Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger @($dailyTrigger, $startupTrigger) `
    -Principal $principal `
    -Settings $settings `
    -Description "Reports this machine's hardware/software inventory to the ITMS backend at $Server." `
    | Out-Null

Write-Host "Task installed." -ForegroundColor Green

# ==============================================================
# RUN IT ONCE NOW, FOR IMMEDIATE CONFIRMATION
# ==============================================================

Write-Step "Running it once now to confirm everything works..."
Start-ScheduledTask -TaskName $TaskName

$deadline = (Get-Date).AddSeconds(90)
do {
    Start-Sleep -Seconds 3
    $taskState = (Get-ScheduledTask -TaskName $TaskName).State
} while ($taskState -eq "Running" -and (Get-Date) -lt $deadline)

$info = Get-ScheduledTaskInfo -TaskName $TaskName
if ($info.LastTaskResult -eq 0) {
    Write-Host "Success (exit code 0). Check the ITMS Inventory Dashboard to confirm $env:COMPUTERNAME reported in." -ForegroundColor Green
} else {
    Write-Warning "Task finished with exit code $($info.LastTaskResult) - open Task Scheduler > '$TaskName' > History for details, or run Get-InventoryAgent.ps1 directly to see the error live."
}

Write-Host ""
Write-Host "From now on, $env:COMPUTERNAME will report to $Server automatically - daily at $DailyTime and at every startup. No further manual steps needed on this machine." -ForegroundColor Cyan
