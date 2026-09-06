# Running the Inventory Agent on a Remote Machine

How to get hardware/software inventory data flowing from a PNP office
PC into the Hardware Inventory system. Two scripts, two use cases — pick
one:

| Script | Use it when... |
|---|---|
| `Get-InventoryAgent.ps1` | You just want one machine reported once, right now — a manual check, testing, a single problem PC. |
| `Install-InventoryAgentTask.ps1` | You want a machine to keep reporting itself automatically, forever, with no one having to remember to re-run anything. **Use this for real fleet deployment.** |
| `Install-InventoryAgent.bat` | Same as above, but double-click instead of typing a PowerShell command — see "One-click install" below. Best for handing off to someone who isn't comfortable with PowerShell. |

All three live in `backend/scripts/`. All talk to the same endpoint
(`POST /inventory/devices/agent-report`) and require the same shared
secret — see step 2 below before doing anything else.

## 1. Get the script(s) onto the remote machine

They're plain `.ps1` files with no dependencies beyond Windows itself —
no install, no PowerShell modules to pull in. Any of these work:

- Copy over a network share (`\\your-server\share\Get-InventoryAgent.ps1`).
- Email/USB/whatever transfer method your office already uses.
- If you can already reach the remote machine with PowerShell remoting:
  ```powershell
  Copy-Item Get-InventoryAgent.ps1 -Destination "\\REMOTE-PC\C$\Temp\" 
  Copy-Item Install-InventoryAgentTask.ps1 -Destination "\\REMOTE-PC\C$\Temp\"
  ```
  (needs admin rights on the remote machine and file sharing enabled).

For `Install-InventoryAgentTask.ps1` specifically: keep both scripts in
the **same folder** when you copy them — it looks for
`Get-InventoryAgent.ps1` next to itself by default (`-SourceScript` can
override this if needed).

## 2. Get the shared secret

Every request to `/inventory/devices/agent-report` must include the
backend's `AGENT_SHARED_SECRET` (see `backend/.env`) as an `x-agent-key`
header — this is what stops anyone on the network from spoofing device
reports. Get the current value from whoever manages the backend:
```
grep AGENT_SHARED_SECRET backend/.env
```
Treat this the same as a password — don't paste it into a chat that gets
logged publicly, a public wiki page, or a script committed to a public
repo. It's fine in a private repo (see `docs/DOCKER_MIGRATION_GUIDE.md`'s
note on this project's own repo being private) or a password manager.

## 3. Option A — run it once, manually

On the remote machine, elevated PowerShell (admin not strictly required
for this one, but some of the data it reads — like installed hotfixes —
is more complete when run elevated):

```powershell
powershell -ExecutionPolicy Bypass -File Get-InventoryAgent.ps1 -Server http://<backend-host>:3000 -AgentKey <the secret from step 2>
```

Replace `<backend-host>` with whatever IP/hostname reaches the ITMS
backend from this machine — e.g. `192.168.1.11` if that's the server's
LAN address. `-ExecutionPolicy Bypass` is just for this one invocation;
it doesn't change the machine's execution policy permanently.

Optional: add `-SkipUpdateCheck` to skip the missing-Windows-updates
scan (can take a few minutes on some machines) if you only care about
software/USB/network data right now.

**What happens:** it reads this machine's serial number, hardware specs,
installed software, USB history, network adapters, printers, and missing
updates, then reports it. If a device with this serial number already
exists in Inventory Personnel, that row gets updated. If not, a new
device is auto-created (named after the hostname) showing up on the
Inventory Dashboard as unassigned until an admin sets its real
owner/division — no manual pre-registration needed either way.

You'll see `Updated "..." (desktops, serial ...)` on success, or a clear
error message if something rejected it (see Troubleshooting below).

## 4. Option B — install as a permanent scheduled task (recommended)

This is the "set it up once, never touch it again" path. Run this
**once**, elevated, on the remote machine:

```powershell
powershell -ExecutionPolicy Bypass -File Install-InventoryAgentTask.ps1 -Server http://<backend-host>:3000 -AgentKey <the secret from step 2>
```

This:
1. Copies `Get-InventoryAgent.ps1` to `C:\ProgramData\ITMS-Agent\` (a
   stable local copy — the machine no longer depends on the network
   share/USB drive/folder you originally ran this from).
2. Registers a Scheduled Task, running as `SYSTEM`, that re-runs the
   agent **daily** (default 08:00, override with `-DailyTime 09:30`) and
   **at every startup** (with a small random delay, so a mass reboot of
   many office PCs doesn't hit the backend all at the exact same second).
3. Runs it once immediately, so you get instant confirmation instead of
   waiting for the next scheduled trigger.

Optional flags: `-SkipUpdateCheck` (skip the updates scan on every
scheduled run — off by default, since a background run has no one
waiting on it), `-TaskName "..."` (defaults to `"ITMS Inventory Agent"`
— re-running the installer with the same name safely replaces the
existing task instead of duplicating it).

**One trade-off worth knowing:** because the task runs as `SYSTEM`
rather than a logged-in user, per-user installed software and per-user
mapped printers may be under-reported compared to running
`Get-InventoryAgent.ps1` interactively. Machine-wide software, hotfixes,
USB history, and network adapters aren't affected — this is the standard
trade-off for any no-login-required agent.

### One-click install — `Install-InventoryAgent.bat`

A wrapper around the exact same `Install-InventoryAgentTask.ps1` above,
for handing off to someone who shouldn't need to type a PowerShell
command at all. Double-clicking it:
1. Self-elevates — triggers the UAC prompt itself, no need to manually
   open PowerShell as admin.
2. Runs the installer with the server URL and agent key already filled
   in (edited into the file ahead of time).
3. Pauses at the end so the result is visible before the window closes.

**Before copying this file to another machine**, open it in a text
editor and update these two lines to match your environment:
```bat
set "SERVER=http://192.168.1.11:3000"
set "AGENT_KEY=<current AGENT_SHARED_SECRET>"
```
Because the secret is baked into the file in plain text, treat
distributing this `.bat` the same as distributing the secret itself —
fine to copy to machines you control over a trusted channel, not
something to email around or drop in a public share. If the backend's
`AGENT_SHARED_SECRET` is ever rotated, every copy of this file that's
already been distributed needs its `AGENT_KEY` line updated to match, or
it'll start failing with the "Invalid agent key" error below.

`Install-InventoryAgentTask.ps1` and `Get-InventoryAgent.ps1` must be in
the same folder as the `.bat` file — it calls the installer script by a
path relative to its own location, so all three need to travel together.

### Deploying to many machines at once

Since `Install-InventoryAgentTask.ps1` needs to run elevated on each
target machine, the practical options for a whole office/fleet are the
same as any other admin script push:
- A **Group Policy startup script** (one-time GPO, applies to every
  machine in the OU going forward).
- **PowerShell remoting**, if WinRM is already enabled fleet-wide:
  ```powershell
  Invoke-Command -ComputerName PC1,PC2,PC3 -FilePath .\Install-InventoryAgentTask.ps1 -ArgumentList "http://192.168.1.11:3000","<secret>"
  ```
- Whatever existing remote-management tool your office already uses
  (PDQ Deploy, ConnectWise, etc.) — it's just an elevated `.ps1` run
  with two arguments, same as pushing any other script.

## 5. Verify it worked

On the ITMS Hardware Inventory dashboard, the machine's serial number
should now show up (as an update to an existing device, or a new
unassigned one). From the command line, on the backend machine:
```
curl http://localhost:3000/inventory/devices -H "Authorization: Bearer <an inventory admin token>"
```
and look for the serial number / hostname you just reported.

## Troubleshooting

- **`Invalid agent key.` / 401 Unauthorized** — the `-AgentKey` value
  doesn't match `backend/.env`'s current `AGENT_SHARED_SECRET`. Re-check
  step 2 — the secret may have been rotated since you last used it.
- **`Agent reporting is not configured.`** — the backend itself has no
  `AGENT_SHARED_SECRET` set in its `.env`. That's a backend-side problem,
  not the remote machine — fix it there, not here.
- **Connection refused / timeout** — the `-Server` URL isn't reachable
  from this machine. Check the backend is actually running, the IP/port
  is right, and nothing (Windows Firewall, a VLAN, a VPN split-tunnel)
  is blocking port 3000 between this machine and the backend.
- **Script won't run at all / "running scripts is disabled"** — that's
  PowerShell's execution policy blocking unsigned scripts. The commands
  above already include `-ExecutionPolicy Bypass` for exactly this
  reason; if you're invoking it a different way (e.g. double-clicking
  the `.ps1` file), that bypass isn't applied and it'll be blocked.

## Removing the scheduled task later

If a machine is being retired/reimaged and should stop reporting:
```powershell
Unregister-ScheduledTask -TaskName "ITMS Inventory Agent" -Confirm:$false
Remove-Item "C:\ProgramData\ITMS-Agent" -Recurse -Force
```
This only stops future reports — it doesn't remove the device's existing
row from Inventory Personnel (that's a separate, deliberate admin action
in the UI, since a decommissioned machine's history is often still worth
keeping).
