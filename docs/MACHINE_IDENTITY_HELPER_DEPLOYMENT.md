# Running the Machine Identity Helper on a Login Machine

How to get real machine/Windows-user identity showing up in the
Authentication Logs for a PC that logs into the ITMS admin system (any of
the 5 domain logins, or the main admin login) — see
`docs/USER_ACCOUNT_SECURITY.md` section 4 and
`docs/AUTHENTICATION_AUDIT_LOG.md` for what this actually records and why.

**This is logging only — it never blocks a login.** Installing or removing
this helper, or it crashing, has zero effect on whether anyone can sign
in; it only changes whether `computer_name`/`windows_user` show up as
blank or populated on that attempt's row in Auth Logs.

Two scripts, same pattern as `docs/INVENTORY_AGENT_DEPLOYMENT.md`:

| Script | Use it when... |
|---|---|
| `Get-MachineIdentityHelper.ps1` | You want to manually confirm the helper reads the right hardware ID on this PC, or you're debugging it directly. |
| `Install-MachineIdentityHelperTask.ps1` | You want the helper running permanently on this machine, starting at every boot with no one having to remember to launch it. **Use this for a real login machine.** |

Both live in `backend/scripts/`, alongside the inventory agent scripts —
these are a different helper for a different purpose (this one answers
`GET /identity` locally for the *browser* to read; the inventory agent
POSTs hardware/software inventory to the *backend*), but they share the
same install directory (`C:\ProgramData\ITMS-Agent\`) and BIOS-serial
detection logic.

## 1. Get the script(s) onto the machine

Same options as the inventory agent — network share, USB, PowerShell
remoting (`Copy-Item ... -Destination "\\PC\C$\Temp\"`). Keep both scripts
in the same folder — the installer looks for `Get-MachineIdentityHelper.ps1`
next to itself by default (`-SourceScript` overrides this).

## 2. Install it as a permanent Scheduled Task (recommended)

From an elevated PowerShell prompt, once per machine:

```powershell
powershell -ExecutionPolicy Bypass -File Install-MachineIdentityHelperTask.ps1
```

This:
1. Copies `Get-MachineIdentityHelper.ps1` to `C:\ProgramData\ITMS-Agent\`.
2. Registers a Scheduled Task (`"ITMS Machine Identity Helper"`), running
   as `SYSTEM`, triggered at every startup — with a small random delay so
   a mass reboot of many office PCs doesn't matter (there's nothing to
   hit on the network anyway; this only talks to `127.0.0.1`).
3. Configures it to **restart automatically** if the listener process
   ever dies — unlike the inventory agent's task (which reports once and
   exits on purpose), this one is meant to run forever, so a crash
   doesn't silently leave every subsequent login on this machine logged
   with blank computer/user fields.
4. Starts it immediately and confirms it responds.

Optional: `-Port <n>` to use something other than the default `47850` —
if you do, also update `HELPER_URL` in
`frontend/src/utils/machineId.ts` to match, or the login page will never
find it.

## 3. Manual run (testing/debugging only)

```powershell
powershell -ExecutionPolicy Bypass -File Get-MachineIdentityHelper.ps1
```

Runs in the foreground (Ctrl+C to stop) — useful to watch its output
directly, or to test on a machine before committing to the permanent
Scheduled Task. Not how a real deployment should run long-term (it stops
the moment the PowerShell window closes, and doesn't restart itself).

## 4. Verify it worked

From the same machine:
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:47850/identity"
```
Expect `{ ok: true, hardware_id: "...", computer_name: "...", windows_user: "..." }`.
If `hardware_id` comes back `null`, every BIOS/motherboard/chassis serial
on this machine was a placeholder value — the same failure mode
`Get-InventoryAgent.ps1` documents (usually only an issue on generic/
off-brand or heavily virtualized hardware). Harmless here either way,
since nothing depends on `hardware_id` any more — `computer_name`/
`windows_user` are what actually matter and don't depend on it.

Then, from a browser on that machine, open any of the 5 login pages and
sign in — the Network tab's `POST /auth/login` request body should show
non-null `computer_name`/`windows_user`, and the resulting row in that
domain's Auth Logs page should show them too.

## Troubleshooting

- **Auth Logs still show blank Computer Name/Windows User for logins from
  this machine** — confirm the task is actually running
  (`Get-ScheduledTask -TaskName "ITMS Machine Identity Helper"`, State
  should be `Running`), and that `Invoke-RestMethod` above works from that
  same machine. `frontend/src/utils/machineId.ts` uses an 800ms timeout —
  if the machine is under heavy load, a slow response could look the same
  as "unreachable," though this should be rare for a loopback call. This
  is purely cosmetic in Auth Logs — it never affects whether login itself
  succeeds.
- **CORS-related failures in the browser console when fetching
  `127.0.0.1:47850`** — the helper only answers `Access-Control-Allow-Origin`
  for a localhost or private-LAN origin (mirroring
  `backend/src/common/cors-origin.ts`). If the frontend is somehow being
  reached from a public origin (e.g. through an ngrok tunnel, per
  `docs/DOCKER_MIGRATION_GUIDE.md`), the helper will correctly refuse it,
  and that login's audit row just won't have computer/user info — by
  design, not a bug to chase.
- **Port 47850 already in use** — pick a different `-Port` on both
  `Install-MachineIdentityHelperTask.ps1` and `frontend/src/utils/machineId.ts`'s
  `HELPER_URL`, then reinstall the task.

## Removing it later

If a machine is being retired/reimaged:
```powershell
Unregister-ScheduledTask -TaskName "ITMS Machine Identity Helper" -Confirm:$false
Remove-Item "C:\ProgramData\ITMS-Agent\Get-MachineIdentityHelper.ps1" -Force
```
(Leave `C:\ProgramData\ITMS-Agent\` itself alone if the inventory agent is
also installed on this machine — the two share that directory.) Nothing
else to clean up — no account is tied to this machine in any way that
removing the helper would need to undo.
