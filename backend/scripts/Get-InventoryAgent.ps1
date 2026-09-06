<#
.SYNOPSIS
    Belarc-style hardware/software inventory collector for the ITMS
    Hardware Inventory system. Reads deep system info from the local
    machine and reports it to POST /inventory/devices/agent-report,
    which patches the matching desktops/laptops row in itms_inventech
    (matched by serial number).

.DESCRIPTION
    Unlike scripts/collect-agent.js (Node.js, ~7 summary fields), this
    is a native-PowerShell agent meant to be pushed to many managed
    Windows devices via Group Policy / Task Scheduler / a login script
    with zero extra runtime to install. It collects the same summary
    fields PLUS a full Belarc-style breakdown:

      - Installed software (from the registry Uninstall keys)
      - Missing Windows security updates (via the Windows Update Agent)
      - USB storage device history (from the registry)
      - All network adapters (not just the primary one)
      - Installed printers
      - Installed hotfixes/KBs

    Zero-touch registration: if this machine's serial number is already
    registered in Inventory Personnel, its row is updated in place. If
    it's never been seen before, a brand-new device is auto-created
    (named after this machine's hostname) with no owner/division set —
    it shows up on the Inventory Dashboard flagged as unassigned until
    an admin assigns the real owner/division. Either way, no manual
    pre-registration step is required before running this script.

.PARAMETER Server
    Base URL of the backend, e.g. http://192.168.1.15:3000
    Defaults to http://localhost:3000.

.PARAMETER SkipUpdateCheck
    Skip the missing-Windows-updates scan. That scan can take anywhere
    from a few seconds to a few minutes depending on the machine and
    network, since it calls the real Windows Update Agent. Useful for
    a quick re-run when you only care about software/USB/network.

.PARAMETER AgentKey
    Must match the backend's AGENT_SHARED_SECRET (backend/.env) — sent as
    the x-agent-key header. Falls back to the AGENT_SHARED_SECRET
    environment variable if not passed. The server rejects the report
    without a matching key.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File Get-InventoryAgent.ps1 -AgentKey <secret>

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File Get-InventoryAgent.ps1 -Server http://192.168.1.15:3000 -AgentKey <secret> -SkipUpdateCheck
#>

[CmdletBinding()]
param(
    [string]$Server = "http://localhost:3000",
    [switch]$SkipUpdateCheck,
    [string]$AgentKey = $env:AGENT_SHARED_SECRET
)

$ErrorActionPreference = "Stop"
$Server = $Server.TrimEnd("/")

if ([string]::IsNullOrWhiteSpace($AgentKey)) {
    throw "No agent key provided - pass -AgentKey <value> or set the AGENT_SHARED_SECRET environment variable (must match the backend's .env)."
}

function Write-Step {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Cyan
}

# .NET's Microsoft.Win32.RegistryKey doesn't expose a key's last-write
# time (unlike the filesystem provider) — only the native Win32 API does.
# This P/Invoke wrapper around RegQueryInfoKey is what makes the USB
# history's "last connected" approximation possible below.
Add-Type -Name RegistryLastWrite -Namespace InventoryAgent -MemberDefinition @"
[DllImport("advapi32.dll", SetLastError = true)]
public static extern int RegQueryInfoKey(
    Microsoft.Win32.SafeHandles.SafeRegistryHandle hKey,
    System.Text.StringBuilder lpClass, ref uint lpcchClass, IntPtr lpReserved,
    out uint lpcSubKeys, out uint lpcchMaxSubKeyLen, out uint lpcchMaxClassLen,
    out uint lpcValues, out uint lpcchMaxValueNameLen, out uint lpcchMaxValueLen,
    out uint lpSecurityDescriptor, out long lpftLastWriteTime);
"@

function Get-RegistryKeyLastWriteTime {
    param([Parameter(Mandatory)][Microsoft.Win32.RegistryKey]$Key)

    try {
        [uint32]$subKeys = 0; [uint32]$maxSubKeyLen = 0; [uint32]$maxClassLen = 0
        [uint32]$values = 0; [uint32]$maxValueNameLen = 0; [uint32]$maxValueLen = 0
        [uint32]$securityDescriptor = 0
        [long]$fileTime = 0
        $classNameBuilder = New-Object System.Text.StringBuilder 256
        [uint32]$classLen = 256

        $status = [InventoryAgent.RegistryLastWrite]::RegQueryInfoKey(
            $Key.Handle, $classNameBuilder, [ref]$classLen, [IntPtr]::Zero,
            [ref]$subKeys, [ref]$maxSubKeyLen, [ref]$maxClassLen,
            [ref]$values, [ref]$maxValueNameLen, [ref]$maxValueLen,
            [ref]$securityDescriptor, [ref]$fileTime)

        if ($status -eq 0 -and $fileTime -gt 0) {
            return [datetime]::FromFileTimeUtc($fileTime).ToString("s") + "Z"
        }
    } catch { }

    return $null
}

# System/BIOS serials on unprovisioned or virtualized hardware often come
# back as one of these placeholder strings instead of a real value — same
# filter used by scripts/collect-agent.js, kept in sync deliberately.
$PlaceholderSerialPattern = '^(default|to be filled|o\.e\.m|none|not specified|system serial)'

# ==============================================================
# CORE SYSTEM IDENTITY
# ==============================================================

function Get-SerialNumber {
    # BIOS/chassis serials are frequently left at a placeholder on desktops
    # built from generic or off-brand motherboards. Fall through to the
    # motherboard's own serial, then the chassis, before giving up — same
    # order Belarc-style tools use.
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

    $tried = ($candidates | ForEach-Object { "'$_'" }) -join ", "
    throw "Could not read a usable system serial number (BIOS/motherboard/chassis all placeholders: $tried). This machine's ""Serial No."" in Inventory must match its real system serial for matching to work."
}

function Get-DeviceType {
    $enclosure = Get-CimInstance -ClassName Win32_SystemEnclosure -ErrorAction SilentlyContinue
    # Chassis type codes: 8=Portable, 9=Laptop, 10=Notebook, 14=Sub-Notebook,
    # 30=Tablet, 31=Convertible, 32=Detachable.
    $laptopTypes = @(8, 9, 10, 14, 30, 31, 32)

    if ($enclosure -and $enclosure.ChassisTypes) {
        foreach ($type in $enclosure.ChassisTypes) {
            if ($laptopTypes -contains [int]$type) {
                return "laptops"
            }
        }
    }

    return "desktops"
}

function Get-OperatingSystemSummary {
    $os = Get-CimInstance -ClassName Win32_OperatingSystem -ErrorAction Stop
    $arch = $os.OSArchitecture
    return "$($os.Caption) $($os.Version) ($arch)".Trim()
}

function Get-ProcessorSummary {
    $cpu = Get-CimInstance -ClassName Win32_Processor -ErrorAction Stop | Select-Object -First 1
    [pscustomobject]@{
        Brand = $cpu.Name.Trim()
        Cores = [int]$cpu.NumberOfCores
    }
}

function Get-TotalMemoryGb {
    $cs = Get-CimInstance -ClassName Win32_ComputerSystem -ErrorAction Stop
    [math]::Round($cs.TotalPhysicalMemory / 1GB)
}

# ==============================================================
# NETWORK ADAPTERS (all of them, plus a "primary" pick for the
# summary serial/mac/ip fields)
# ==============================================================

function Get-NetworkAdapterList {
    $adapters = Get-CimInstance -ClassName Win32_NetworkAdapterConfiguration -Filter "IPEnabled=True" -ErrorAction SilentlyContinue

    $result = @()
    foreach ($adapter in $adapters) {
        # Explicit null-checks rather than piping through Select-Object —
        # a $null/empty array property piped through Select-Object can
        # come back as an empty object instead of $null once serialized
        # to JSON, which the frontend can't render as text.
        $ipv4 = $null
        if ($adapter.IPAddress) {
            $ipv4 = @($adapter.IPAddress | Where-Object { $_ -match '^\d+\.\d+\.\d+\.\d+$' })[0]
        }

        $gateway = $null
        if ($adapter.DefaultIPGateway -and @($adapter.DefaultIPGateway).Count -gt 0) {
            $gateway = @($adapter.DefaultIPGateway)[0]
        }

        $result += [pscustomobject]@{
            description  = $adapter.Description
            mac_address  = $adapter.MACAddress
            ip_address   = $ipv4
            dhcp_enabled = [bool]$adapter.DHCPEnabled
            gateway      = $gateway
        }
    }

    return $result
}

function Get-PrimaryAdapter($adapterList) {
    return $adapterList |
        Where-Object {
            $_.mac_address -and
            $_.ip_address -and
            -not $_.ip_address.StartsWith("169.254.") -and
            $_.description -notmatch "virtual|vmware|hyper-v|loopback|tunnel"
        } |
        Select-Object -First 1
}

# ==============================================================
# INSTALLED SOFTWARE (registry Uninstall keys — 64-bit, 32-bit
# WOW6432Node, and per-user)
# ==============================================================

function Get-InstalledSoftwareList {
    $paths = @(
        "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*",
        "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*",
        "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*"
    )

    $seen = @{}
    $result = @()

    foreach ($path in $paths) {
        Get-ItemProperty -Path $path -ErrorAction SilentlyContinue |
            Where-Object { $_.DisplayName -and -not $_.SystemComponent -and -not $_.ParentKeyName } |
            ForEach-Object {
                $key = "$($_.DisplayName)|$($_.DisplayVersion)"
                if (-not $seen.ContainsKey($key)) {
                    $seen[$key] = $true

                    $installDate = $null
                    if ($_.InstallDate -match '^\d{8}$') {
                        try {
                            $installDate = [datetime]::ParseExact($_.InstallDate, 'yyyyMMdd', $null).ToString('yyyy-MM-dd')
                        } catch {
                            # A handful of installers write a bogus/out-of-range
                            # InstallDate — skip the date rather than fail the run.
                            $installDate = $null
                        }
                    }

                    $result += [pscustomobject]@{
                        name         = $_.DisplayName
                        version      = $_.DisplayVersion
                        publisher    = $_.Publisher
                        install_date = $installDate
                    }
                }
            }
    }

    return $result | Sort-Object name
}

# ==============================================================
# MISSING WINDOWS UPDATES (native Windows Update Agent COM API —
# no extra module required)
# ==============================================================

function Get-MissingUpdatesList {
    try {
        $session = New-Object -ComObject Microsoft.Update.Session
        $searcher = $session.CreateUpdateSearcher()
        $result = $searcher.Search("IsInstalled=0 and Type='Software' and IsHidden=0")

        $updates = @()
        foreach ($update in $result.Updates) {
            $kbIds = @()
            foreach ($kb in $update.KBArticleIDs) { $kbIds += "KB$kb" }

            $updates += [pscustomobject]@{
                title    = $update.Title
                kb       = ($kbIds -join ", ")
                severity = $update.MsrcSeverity
            }
        }

        return $updates
    } catch {
        Write-Warning "Missing-updates scan failed (Windows Update service unavailable?): $($_.Exception.Message)"
        return @()
    }
}

# ==============================================================
# USB STORAGE HISTORY
#
# The registry doesn't store a real "last connected" timestamp for
# USBSTOR entries, so the device subkey's LastWriteTime is used as
# an approximation — good enough to see "roughly when," not a
# precise audit trail.
# ==============================================================

function Get-UsbHistoryList {
    $usbStorPath = "HKLM:\SYSTEM\CurrentControlSet\Enum\USBSTOR"

    if (-not (Test-Path $usbStorPath)) {
        return @()
    }

    $result = @()

    Get-ChildItem $usbStorPath -ErrorAction SilentlyContinue | ForEach-Object {
        $deviceKey = $_
        $friendlyName = (Get-ItemProperty $deviceKey.PSPath -ErrorAction SilentlyContinue).FriendlyName

        Get-ChildItem $deviceKey.PSPath -ErrorAction SilentlyContinue | ForEach-Object {
            $instanceKey = $_
            $props = Get-ItemProperty $instanceKey.PSPath -ErrorAction SilentlyContinue
            $lastSeen = $null

            try {
                $regKey = Get-Item -LiteralPath $instanceKey.PSPath
                $lastSeen = Get-RegistryKeyLastWriteTime -Key $regKey
            } catch { }

            $result += [pscustomobject]@{
                name          = if ($props.FriendlyName) { $props.FriendlyName } else { $friendlyName }
                serial        = $instanceKey.PSChildName
                last_seen_utc = $lastSeen
            }
        }
    }

    return $result
}

# ==============================================================
# PRINTERS
# ==============================================================

function Get-PrinterList {
    try {
        Get-Printer -ErrorAction Stop | ForEach-Object {
            [pscustomobject]@{
                name        = $_.Name
                driver_name = $_.DriverName
                port_name   = $_.PortName
            }
        }
    } catch {
        # Get-Printer isn't available on older PowerShell editions —
        # fall back to WMI, which is universal.
        Get-CimInstance -ClassName Win32_Printer -ErrorAction SilentlyContinue | ForEach-Object {
            [pscustomobject]@{
                name        = $_.Name
                driver_name = $_.DriverName
                port_name   = $_.PortName
            }
        }
    }
}

# ==============================================================
# INSTALLED HOTFIXES
# ==============================================================

function Get-HotfixList {
    Get-HotFix -ErrorAction SilentlyContinue | ForEach-Object {
        [pscustomobject]@{
            id           = $_.HotFixID
            description  = $_.Description
            installed_on = if ($_.InstalledOn) { $_.InstalledOn.ToString("yyyy-MM-dd") } else { $null }
        }
    }
}

# ==============================================================
# ANTIVIRUS COUNT
# ==============================================================

function Get-AntivirusCount {
    try {
        $products = Get-CimInstance -Namespace "root/SecurityCenter2" -ClassName AntiVirusProduct -ErrorAction Stop
        return @($products).Count
    } catch {
        Write-Warning "Antivirus detection failed: $($_.Exception.Message)"
        return $null
    }
}

# ==============================================================
# COLLECT
# ==============================================================

Write-Step "Collecting system info from $env:COMPUTERNAME ..."

$serialNo = Get-SerialNumber
$deviceType = Get-DeviceType
$os = Get-OperatingSystemSummary
$cpu = Get-ProcessorSummary
$gbRam = Get-TotalMemoryGb
$adapters = @(Get-NetworkAdapterList)
$primaryAdapter = Get-PrimaryAdapter $adapters
$antivirusCount = Get-AntivirusCount

Write-Step "Reading installed software (registry)..."
$installedSoftware = @(Get-InstalledSoftwareList)
Write-Host "  Found $($installedSoftware.Count) installed programs." -ForegroundColor DarkGray

$missingUpdates = @()
if (-not $SkipUpdateCheck) {
    Write-Step "Checking for missing Windows updates (this can take a while)..."
    $missingUpdates = @(Get-MissingUpdatesList)
    Write-Host "  Found $($missingUpdates.Count) missing updates." -ForegroundColor DarkGray
} else {
    Write-Host "Skipping missing-updates scan (-SkipUpdateCheck)." -ForegroundColor DarkGray
}

Write-Step "Reading USB storage history (registry)..."
$usbHistory = @(Get-UsbHistoryList)
Write-Host "  Found $($usbHistory.Count) USB storage devices." -ForegroundColor DarkGray

Write-Step "Reading printers and hotfixes..."
$printers = @(Get-PrinterList)
$hotfixes = @(Get-HotfixList)

# ==============================================================
# BUILD PAYLOAD — field names must match AgentReportDto exactly
# ==============================================================

$payload = [ordered]@{
    serial_no                  = $serialNo
    hostname                   = $env:COMPUTERNAME
    device_type                = $deviceType
    os                          = $os
    cpu_brand                  = $cpu.Brand
    cpu_cores                  = $cpu.Cores
    gb_ram                      = $gbRam
    mac_address                = if ($primaryAdapter) { $primaryAdapter.mac_address } else { $null }
    ip_address                  = if ($primaryAdapter) { $primaryAdapter.ip_address } else { $null }
    no_of_installed_anti_virus = $antivirusCount
    installed_software          = $installedSoftware
    missing_updates             = $missingUpdates
    usb_history                 = $usbHistory
    network_adapters            = $adapters
    printers_detected           = $printers
    hotfixes                    = $hotfixes
}

# Drop null/empty fields rather than send them — the backend DTO only
# patches the fields actually present in the request body.
$cleanPayload = [ordered]@{}
foreach ($key in $payload.Keys) {
    $value = $payload[$key]
    $isEmptyArray = ($value -is [array]) -and ($value.Count -eq 0)
    if ($null -ne $value -and $value -ne "" -and -not $isEmptyArray) {
        $cleanPayload[$key] = $value
    }
}

$json = $cleanPayload | ConvertTo-Json -Depth 6 -Compress

Write-Step "Reporting to $Server/inventory/devices/agent-report ..."

try {
    $response = Invoke-RestMethod `
        -Uri "$Server/inventory/devices/agent-report" `
        -Method Post `
        -ContentType "application/json; charset=utf-8" `
        -Headers @{ "x-agent-key" = $AgentKey } `
        -Body ([System.Text.Encoding]::UTF8.GetBytes($json))

    Write-Host "Updated `"$($response.label)`" ($($response.deviceType), serial $serialNo)." -ForegroundColor Green
} catch {
    $errorBody = $null
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
        try { $errorBody = ($_.ErrorDetails.Message | ConvertFrom-Json).message } catch { }
    }

    if ($errorBody) {
        $message = if ($errorBody -is [array]) { $errorBody -join "; " } else { $errorBody }
        Write-Error "Server rejected the report: $message"
    } else {
        Write-Error "Agent failed: $($_.Exception.Message)"
    }

    exit 1
}
