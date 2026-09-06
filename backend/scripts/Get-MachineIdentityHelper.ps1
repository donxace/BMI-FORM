<#
.SYNOPSIS
    Persistent local identity helper for the ITMS machine-lock login
    feature. Unlike Get-InventoryAgent.ps1 (which runs once and exits),
    this stays running and answers GET /identity requests from the
    browser-based login page (frontend/src/utils/machineId.ts) with this
    machine's real hardware serial, hostname, and interactively-logged-on
    Windows user -- replacing the old browser-localStorage random UUID
    that used to stand in for a "machine ID".

.DESCRIPTION
    Started via Install-MachineIdentityHelperTask.ps1 as a SYSTEM-context
    Scheduled Task at every startup, so it's already running by the time
    anyone reaches the login page. Binds only to 127.0.0.1 (loopback) on
    a fixed port -- nothing outside this machine can ever reach it.

    CORS is enforced by hand-porting the exact same private-LAN/localhost
    regex backend/src/common/cors-origin.ts uses server-side, so only a
    page loaded from localhost or a private LAN address gets a usable
    Access-Control-Allow-Origin response -- anything else gets no CORS
    header at all, so the browser's fetch fails closed. Keep
    $PrivateLanHostPattern below in sync with cors-origin.ts by hand if
    that file's regex ever changes -- PowerShell can't import the TS
    module directly.

.PARAMETER Port
    TCP port to listen on (loopback only). Defaults to 47850. Must match
    frontend/src/utils/machineId.ts's HELPER_URL.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File Get-MachineIdentityHelper.ps1
    (normally you don't run this directly -- Install-MachineIdentityHelperTask.ps1
    registers it as an always-on Scheduled Task instead.)
#>

[CmdletBinding()]
param(
    [int]$Port = 47850
)

$ErrorActionPreference = "Stop"

# Same placeholder filter as Get-InventoryAgent.ps1's Get-SerialNumber --
# kept in sync with that file deliberately, the same way this project
# already keeps Get-InventoryAgent.ps1 in sync with collect-agent.js.
$PlaceholderSerialPattern = '^(default|to be filled|o\.e\.m|none|not specified|system serial)'

# Same private-LAN/localhost allowlist as backend/src/common/cors-origin.ts.
$PrivateLanHostPattern = '^(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})$'

function Get-HardwareId {
    # BIOS -> BaseBoard -> SystemEnclosure, same fallback order and
    # placeholder filtering as Get-InventoryAgent.ps1's Get-SerialNumber.
    $candidates = @(
        (Get-CimInstance -ClassName Win32_BIOS -ErrorAction SilentlyContinue).SerialNumber,
        (Get-CimInstance -ClassName Win32_BaseBoard -ErrorAction SilentlyContinue).SerialNumber,
        (Get-CimInstance -ClassName Win32_SystemEnclosure -ErrorAction SilentlyContinue).SerialNumber
    )

    foreach ($candidate in $candidates) {
        $serial = "$candidate".Trim()
        if (-not [string]::IsNullOrWhiteSpace($serial) -and $serial -notmatch $PlaceholderSerialPattern) {
            return $serial
        }
    }

    return $null
}

function Get-InteractiveWindowsUser {
    # Win32_ComputerSystem.UserName reports whoever is interactively
    # logged on, regardless of which account this helper process itself
    # runs as -- unlike $env:USERNAME, which would just say "SYSTEM"
    # since the Scheduled Task runs under that account.
    try {
        $name = (Get-CimInstance -ClassName Win32_ComputerSystem -ErrorAction Stop).UserName
        if ([string]::IsNullOrWhiteSpace($name)) { return $null }
        return $name
    } catch {
        return $null
    }
}

function Get-AllowedOrigin {
    param([string]$RequestOrigin)

    if ([string]::IsNullOrWhiteSpace($RequestOrigin)) {
        return $null
    }

    try {
        $hostname = ([Uri]$RequestOrigin).Host
    } catch {
        return $null
    }

    if ($hostname -match $PrivateLanHostPattern) {
        return $RequestOrigin
    }

    return $null
}

function Write-JsonResponse {
    param($Context, [int]$StatusCode, $Body, [string]$AllowedOrigin)

    $response = $Context.Response
    $response.StatusCode = $StatusCode

    if ($AllowedOrigin) {
        # Echo back the literal requesting Origin (never "*") -- required
        # anyway for a request sent with credentials, and keeps this
        # matching the same never-reflect-wildcard posture as
        # cors-origin.ts.
        $response.Headers.Add("Access-Control-Allow-Origin", $AllowedOrigin)
        $response.Headers.Add("Vary", "Origin")
    }

    if ($null -ne $Body) {
        $response.ContentType = "application/json; charset=utf-8"
        $json = $Body | ConvertTo-Json -Compress
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
    }

    $response.OutputStream.Close()
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Start()

Write-Host "ITMS Machine Identity Helper listening on http://127.0.0.1:$Port/ (Ctrl+C to stop)" -ForegroundColor Cyan

try {
    while ($listener.IsListening) {
        $context = $null
        try {
            $context = $listener.GetContext()
            $request = $context.Request
            $allowedOrigin = Get-AllowedOrigin -RequestOrigin $request.Headers["Origin"]

            if ($request.HttpMethod -eq "OPTIONS") {
                $context.Response.Headers.Add("Access-Control-Allow-Methods", "GET, OPTIONS")
                $context.Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
                Write-JsonResponse -Context $context -StatusCode 204 -Body $null -AllowedOrigin $allowedOrigin
                continue
            }

            if ($request.HttpMethod -eq "GET" -and $request.Url.AbsolutePath -eq "/identity") {
                $body = [ordered]@{
                    ok            = $true
                    hardware_id   = Get-HardwareId
                    computer_name = $env:COMPUTERNAME
                    windows_user  = Get-InteractiveWindowsUser
                    version       = "1"
                }
                Write-JsonResponse -Context $context -StatusCode 200 -Body $body -AllowedOrigin $allowedOrigin
                continue
            }

            Write-JsonResponse -Context $context -StatusCode 404 -Body ([ordered]@{ ok = $false; error = "Not found." }) -AllowedOrigin $allowedOrigin
        } catch {
            # A single bad/aborted request must never take the whole
            # listener down -- log and keep serving.
            Write-Warning "Request handling failed: $($_.Exception.Message)"
            if ($context) {
                try { $context.Response.StatusCode = 500; $context.Response.OutputStream.Close() } catch {}
            }
        }
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
