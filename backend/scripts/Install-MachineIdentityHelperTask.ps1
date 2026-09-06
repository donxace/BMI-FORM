<#
.SYNOPSIS
    One-time, per-machine setup that installs Get-MachineIdentityHelper.ps1
    as an always-running Scheduled Task, so this machine's login page can
    read a real hardware ID instead of the old browser-localStorage UUID.

.DESCRIPTION
    Run this ONCE (elevated) on any machine that logs into the ITMS admin
    system, and never touch it again:

      1. Copies Get-MachineIdentityHelper.ps1 to C:\ProgramData\ITMS-Agent\
         (the same install directory Install-InventoryAgentTask.ps1 uses --
         both are part of the same "ITMS agent" family on this machine).
      2. Registers a Scheduled Task ("ITMS Machine Identity Helper"),
         running as SYSTEM, triggered at every startup.
      3. Starts it immediately, so it's already listening without a
         reboot.

    Unlike Install-InventoryAgentTask.ps1's task (which runs once, reports,
    and exits), this task must stay running forever -- it's a live HTTP
    listener the login page queries on every login attempt. If the
    listener process ever dies (crash, GetContext() throwing repeatedly),
    the Scheduled Task's restart-on-failure settings relaunch it
    automatically rather than leaving the machine silently unable to pass
    its machine-lock check.

.PARAMETER Port
    Port the helper listens on (loopback only). Defaults to 47850 --
    must match frontend/src/utils/machineId.ts's HELPER_URL if changed.

.PARAMETER SourceScript
    Path to Get-MachineIdentityHelper.ps1 to install from. Defaults to the
    copy sitting next to this installer script.

.PARAMETER TaskName
    Scheduled Task name. Defaults to "ITMS Machine Identity Helper".
    Re-running this installer with the same name safely replaces the
    existing task.

.EXAMPLE
    From an elevated PowerShell prompt, once per machine:
    powershell -ExecutionPolicy Bypass -File Install-MachineIdentityHelperTask.ps1
#>

[CmdletBinding()]
param(
    [int]$Port = 47850,

    [string]$SourceScript,

    [string]$TaskName = "ITMS Machine Identity Helper"
)

if (-not $SourceScript) {
    $scriptDir = $PSScriptRoot
    if (-not $scriptDir) {
        $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    }
    $SourceScript = Join-Path $scriptDir "Get-MachineIdentityHelper.ps1"
}

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Cyan
}

$currentPrincipal = New-Object Security.Principal.WindowsPrincipal(
    [Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run this from an elevated (Administrator) PowerShell prompt."
}

if (-not (Test-Path $SourceScript)) {
    throw "Could not find Get-MachineIdentityHelper.ps1 at '$SourceScript'. Pass -SourceScript to point at it explicitly."
}

# ==============================================================
# INSTALL A STABLE LOCAL COPY
# ==============================================================

$installDir = "C:\ProgramData\ITMS-Agent"
$installedScript = Join-Path $installDir "Get-MachineIdentityHelper.ps1"

Write-Step "Installing helper to $installedScript ..."
New-Item -ItemType Directory -Path $installDir -Force | Out-Null
Copy-Item -Path $SourceScript -Destination $installedScript -Force

# ==============================================================
# REGISTER THE SCHEDULED TASK -- always-on, restarts on failure
# ==============================================================

$argumentList = "-NoProfile -ExecutionPolicy Bypass -File `"$installedScript`" -Port $Port -WindowStyle Hidden"
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $argumentList

$startupTrigger = New-ScheduledTaskTrigger -AtStartup
$startupTrigger.Delay = "PT$(Get-Random -Minimum 1 -Maximum 10)M"

$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

# ExecutionTimeLimit 0 = unlimited -- this task is meant to run forever,
# not time out like a report-and-exit job. RestartCount/RestartInterval
# is what makes it self-heal if the listener process ever dies.
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 999 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit (New-TimeSpan -Seconds 0)

if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Write-Host "Task '$TaskName' already exists - replacing it." -ForegroundColor DarkGray
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

Write-Step "Registering scheduled task '$TaskName' (starts at boot, stays running)..."
Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $startupTrigger `
    -Principal $principal `
    -Settings $settings `
    -Description "Persistent local helper reporting this machine's hardware ID to the ITMS login page at http://127.0.0.1:$Port/identity." `
    | Out-Null

Write-Host "Task installed." -ForegroundColor Green

# ==============================================================
# START IT NOW, FOR IMMEDIATE CONFIRMATION
# ==============================================================

Write-Step "Starting it now to confirm it works..."
Start-ScheduledTask -TaskName $TaskName
Start-Sleep -Seconds 2

try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/identity" -Method Get -TimeoutSec 5
    if ($response.hardware_id) {
        Write-Host "Success - hardware_id: $($response.hardware_id), computer_name: $($response.computer_name), windows_user: $($response.windows_user)" -ForegroundColor Green
    } else {
        Write-Warning "Helper responded but found no usable hardware serial (BIOS/motherboard/chassis all placeholders). Machine-lock binding will not work on this machine until that's resolved."
    }
} catch {
    Write-Warning "Could not reach the helper at http://127.0.0.1:$Port/identity - $($_.Exception.Message). Check Task Scheduler > '$TaskName' > History for details."
}

Write-Host ""
Write-Host "From now on, this machine's identity helper starts automatically at boot. No further manual steps needed." -ForegroundColor Cyan
