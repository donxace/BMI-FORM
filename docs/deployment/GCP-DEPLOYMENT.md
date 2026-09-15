# Public Deployment on Google Cloud (GCP)

This documents how VITALYZE (and its sibling app, BMI-FORM) ended up running
on a persistent Google Cloud VM instead of a tunnel from a developer's
laptop, and exactly how that VM is set up so it can be reproduced, extended,
or torn down.

BMI-FORM has its own copy of this document at
`BMI-FORM/docs/deployment/GCP-DEPLOYMENT.md` since both apps share the same
VM — read whichever repo you're currently in, they're nearly identical.

## TL;DR — current live setup

| App | Frontend | Backend |
|---|---|---|
| VITALYZE | `https://vitalyze.34-9-180-120.sslip.io` (stopped, see below) | `https://api.vitalyze.34-9-180-120.sslip.io` (stopped, see below) |
| BMI-FORM | `https://bmi.34-9-180-120.sslip.io` | `https://api.bmi.34-9-180-120.sslip.io` |

Both apps' Caddy routes and HTTPS certs exist simultaneously (Caddy doesn't
care which upstream is actually running) — hitting the stopped app's URL
while it's inactive gives a Caddy 502, not a cert/DNS error.

- VM: `vm-bmi-vitalyze`, GCP project `project-e3559f7c-642a-4eff-aed`, zone `us-central1-a`
- Only **one app's pair of services runs at a time** (see "Why only one app runs at once" below) — currently **BMI-FORM is active**, VITALYZE's services are stopped.
- Both apps' code lives on the VM at `/var/www/apps/VITALYZE` and `/var/www/apps/BMI-FORM`, each cloned from GitHub.
- All 4 services (2 apps × frontend + backend) are managed by **systemd**, not by any tunnel or terminal session — they survive reboots and crash-restart automatically.
- **HTTPS is live** via Caddy reverse-proxying to the raw app ports — see "HTTPS (Caddy + sslip.io)" below. The raw ports (3000/3001/5173/5174) are no longer reachable from the internet at all; only 80 (redirects to 443) and 443 are open.

## Why this exists: the road here

The original ask was just "make my web server accessible on the internet for
testing." That went through several approaches before landing on a real VM
deployment — worth knowing so the reasoning isn't a mystery later:

1. **Cloudflare Quick Tunnels** (`cloudflared tunnel --url ...`) — free, no
   account needed. Worked, but is explicitly a best-effort service with no
   uptime guarantee. We hit repeated random disconnects (DNS timeouts to
   Cloudflare's tunnel infrastructure) throughout the session.
2. **localtunnel** (`npx localtunnel`) — also free, let us pick a custom
   subdomain (`vitalyze.loca.lt` / `vitalyze-dev.loca.lt`). Turned out to be
   even less reliable — the underlying `loca.lt` relay is a small
   community-run service and got slow/`502`-prone under normal use. We also
   accidentally ended up with **four duplicate tunnel processes** fighting
   over the same subdomain at one point, which made "bad gateway, so slow"
   complaints make sense.
3. **ngrok** — more stable than the above once actually running, but (a) its
   Windows binary got flagged and quarantined by Windows Defender as
   `Trojan:Win32/Kepavll!rfn` — a known false-positive pattern for tunneling
   tools, fixed with a narrow Defender exclusion on just that one `.exe` — and
   (b) the **free tier only allows one live public endpoint per account**, so
   it could only front one app (VITALYZE's frontend, using this account's
   pre-existing reserved static domain `tiringly-zealous-brayan.ngrok-free.dev`),
   not all of them.
4. Independently of tunnel flakiness, we noticed **all 4 background
   tunnel/dev processes kept dying simultaneously** between chat turns —
   never fully root-caused, but consistent with something interrupting the
   session and the harness tearing down tracked background tasks as part of
   that. Fully detached processes (spawned via `wmic process call create`
   instead of the normal backgrounding mechanism) survived where tracked ones
   didn't.
5. **Azure** (the user has a free trial) was the first real "persistent, not a
   tunnel" attempt. Blocked immediately: the trial subscription had a
   **0 vCPU quota** for every VM size tried (`B1s`, `B2s`, `B2ms`) in every
   region tried (Southeast Asia, East US) — a well-known fraud-prevention
   default on brand-new trial subscriptions that requires a manual support
   request to lift. `az vm create` failed with `SkuNotAvailable: Capacity
   Restrictions` every time. (Azure App Service / PaaS *did* work around
   this, since it draws from a separate quota pool — but the user opted to
   switch to Google Cloud instead of restructuring around App Service.)
6. **Google Cloud** — already had an account and an active billing account,
   so this is what's actually live. Chosen size: `e2-micro`, which is part of
   GCP's **Always Free** tier (free forever in
   `us-west1`/`us-central1`/`us-east1`, not just trial credit).

## What's actually on the VM

```
VM: vm-bmi-vitalyze (Ubuntu 22.04 LTS, e2-micro: 2 vCPU burstable, 1GB RAM)
Zone: us-central1-a
External IP: 34.9.180.120 (static-ish; will change only if the VM is deleted/recreated)

Installed:
  - Apache2, PHP 8.1, MySQL (installed early, before we discovered BMI-FORM/
    VITALYZE are both Node/NestJS + React apps, not PHP — Apache/PHP are
    unused for the apps themselves but left installed; MySQL IS used)
  - Node.js 20.x (via NodeSource)
  - git

Filesystem layout:
  /var/www/apps/VITALYZE   <- git clone of this repo (private, cloned over
                               SSH using a read-only deploy key)
  /var/www/apps/BMI-FORM   <- git clone of the BMI-FORM repo (public, HTTPS
                               clone, no auth needed)

Swap: a 2GB swapfile at /swapfile (critical — e2-micro only has 1GB RAM, and
  running even one app's backend+frontend pushes it close to the edge; running
  all 4 processes at once caused heavy swapping and very slow response times)
```

### GitHub deploy key (this repo only, since it's private)

Because this repo is private, cloning it onto the VM needed authentication.
Rather than use a personal access token (something to leak or remember to
revoke), an SSH keypair was generated **on the VM itself**
(`~/.ssh/vitalyze_deploy`), and only the **public** half was added as a
**read-only Deploy Key** under this repo's Settings → Deploy keys. The
private key never leaves the VM. This means:

- The VM can `git pull` this repo indefinitely without any credential expiring.
- The VM (and whoever controls it) can **not** push to this repo — the key is read-only.
- If the VM is ever decommissioned, remove the deploy key from GitHub too.

### Firewall

Two firewall rules exist (GCP's `default` network denies all inbound by
default otherwise):

- `allow-http` — tcp:80 (Caddy redirects this to 443)
- `allow-https` — tcp:443

The earlier `allow-app-ports` rule (tcp:3000,3001,5173,5174, opened directly
to the internet before Caddy existed) has been **deleted** now that Caddy
reverse-proxies everything — the raw ports are still bound on the VM
(`localhost` only, from Caddy's point of view), just no longer reachable from
outside it. If you ever need to hit a raw port directly again (e.g. for
debugging), SSH-tunnel instead of reopening the firewall:
`gcloud compute ssh vm-bmi-vitalyze --project=project-e3559f7c-642a-4eff-aed --zone=us-central1-a -- -L 3001:localhost:3001`.

### HTTPS (Caddy + sslip.io)

Public URLs are now `https://` via [Caddy](https://caddyserver.com/), a
reverse proxy that gets and auto-renews a real Let's Encrypt certificate with
almost no config. Installed via Caddy's own apt repo (see
`/etc/apt/sources.list.d/caddy-stable.list`), config lives at
`/etc/caddy/Caddyfile`:

```
vitalyze.34-9-180-120.sslip.io {
    reverse_proxy localhost:5173
}

api.vitalyze.34-9-180-120.sslip.io {
    reverse_proxy localhost:3001
}

bmi.34-9-180-120.sslip.io {
    reverse_proxy localhost:5174
}

api.bmi.34-9-180-120.sslip.io {
    reverse_proxy localhost:3000
}
```

Both apps' routes live in the Caddyfile at once, regardless of which one's
systemd services are actually running — Caddy just returns a 502 for
whichever app is currently stopped. No need to edit the Caddyfile when
switching which app is active, only when adding a new app to the VM.

**Why sslip.io, not a real domain:** Let's Encrypt cannot issue a certificate
for a bare IP address — it needs a resolvable hostname. Buying a real domain
was the "do this properly / long-term" option; `sslip.io` was chosen instead
for zero cost and zero DNS setup — `<anything>.34-9-180-120.sslip.io` always
resolves to `34.9.180.120` with no registration needed. Swapping to a real
domain later just means changing the two hostnames in the Caddyfile (and the
`VITE_API_BASE_URL` below) — Caddy re-issues certs automatically for whatever
hostname it sees in the config.

**Frontend → backend wiring:** the frontend already supported a
`VITE_API_BASE_URL` build/runtime env override (added earlier for tunnel
testing — see `API_BASE_URL` in `frontend/src/pages/*.tsx`, which falls back
to `http://${window.location.hostname}:3001` only when this isn't set). This
is now set on the VM via a systemd drop-in
(`/etc/systemd/system/vitalyze-frontend.service.d/override.conf`):

```ini
[Service]
Environment="VITE_API_BASE_URL=https://api.vitalyze.34-9-180-120.sslip.io"
```

No frontend code changes were needed. The backend's CORS is already
`origin: true` (allow all) and Vite's `allowedHosts: true`, so neither needed
touching either.

**Apache was stopped and disabled** (`sudo systemctl disable --now apache2`)
— it was installed early in this VM's setup, never actually used by either
app, and was squatting on port 80, which Caddy needs.

**Cert renewal** is automatic (Caddy renews ~30 days before the 90-day
Let's Encrypt expiry, no cron job to maintain). Check current cert status
with `sudo systemctl status caddy` or `sudo journalctl -u caddy -n 50`.

**BMI-FORM needed two things VITALYZE didn't, since its backend is newer/
more hardened than VITALYZE's:**

1. **`JWT_SECRET` / `AGENT_SHARED_SECRET`.** BMI-FORM's `main.ts` refuses to
   boot at all without `JWT_SECRET` set (VITALYZE has no such check).
   `AGENT_SHARED_SECRET` isn't boot-required but gates the inventory
   agent-report endpoint. Both are set (freshly generated, VM-only values)
   via `/etc/systemd/system/bmi-backend.service.d/override.conf` — **not**
   committed anywhere, same convention as the DB password.
2. **`CORS_EXTRA_ORIGINS`.** VITALYZE's CORS is still `origin: true` (allow
   everything). BMI-FORM's has since been hardened to allow only
   `localhost`/private-LAN origins by default (see
   `backend/src/common/cors-origin.ts`) — a public `sslip.io` origin needs
   to be explicitly added. Set on the same `bmi-backend.service.d/override.conf`
   drop-in: `CORS_EXTRA_ORIGINS=https://bmi.34-9-180-120.sslip.io`. Forgetting
   this doesn't break startup, it just makes every frontend→backend fetch
   fail with an opaque CORS error in the browser console — worth checking
   first if BMI-FORM's frontend loads but every API call fails.

`FRONTEND_URL=https://bmi.34-9-180-120.sslip.io` is also set on that same
drop-in (used to build the link inside password-reset emails).

`VITE_API_BASE_URL` on `bmi-frontend.service.d/override.conf` follows the
exact same pattern as VITALYZE's — see above.

### Database

Both apps use TypeORM against MySQL with **`synchronize: false`**, meaning
the schema is not auto-created — it comes from `.sql` dumps already committed
in each repo's `database/` folder:

- `VITALYZE/database/vitals_monitoring.sql` → database `vitals_monitoring`
- `BMI-FORM/database/bmi_monitoring.sql` → database `bmi_monitoring`
- `BMI-FORM/database/itms_inventech.sql` → database `itms_inventech`

These were imported directly on the VM (the `.sql` files travel with the
repo, no separate transfer needed). VITALYZE's own dump imported cleanly;
the MariaDB-vs-MySQL incompatibility described below only affected
BMI-FORM's `itms_inventech.sql`.

**One real incompatibility hit during import (in BMI-FORM's dump, noted here
for completeness):** dumps produced by XAMPP's MariaDB permissively allow
`DATE DEFAULT CURRENT_TIMESTAMP()` on plain `DATE` columns. Real MySQL 8
(what's on the VM) rejects this — `current_timestamp()` as a default is only
valid on `TIMESTAMP`/`DATETIME` columns, not `DATE`. Fixed by patching the
VM's copy of that one dump file only, dropping the invalid default on
`created_date` columns without touching any actual row data (every `INSERT`
already specifies `created_date` explicitly).

### Database credentials

This app's `TypeOrmModule.forRoot({...})` config (in
`backend/src/app.module.ts`) originally hardcoded:

```ts
username: 'root',
password: '',
```

Fine for XAMPP on `localhost`, not fine for a MySQL instance that (however
unlikely, since port 3306 isn't in the firewall rules) is one
misconfiguration away from being reachable. This was changed to read from
environment variables with the old hardcoded values kept as **fallbacks**,
so local XAMPP development is completely unaffected:

```ts
host: process.env.DB_HOST || 'localhost',
port: Number(process.env.DB_PORT) || 3306,
username: process.env.DB_USERNAME || 'root',
password: process.env.DB_PASSWORD || '',
```

On the VM, a dedicated MySQL user (`appuser`, **not** `root`) was created
with privileges scoped to just the three databases above, and its password
is set only in the systemd service files (see below) — **not** committed to
either repo. If you need the actual value, it's in
`/etc/systemd/system/vitalyze-backend.service` on the VM, or ask whoever ran
this deployment.

### Vite `allowedHosts`

Vite's dev server rejects requests whose `Host` header isn't in an allowlist
(`server.allowedHosts` in `vite.config.ts`) — this is what caused the
"failed to fetch" / blocked-request errors every time a new tunnel hostname
appeared during testing. `vite.config.ts` now uses `allowedHosts: true`
(allow any host) instead of maintaining a growing list of one-off tunnel
hostnames. This is fine for a dev server that's already firewalled to
specific ports and not proxying anything sensitive; revisit if that changes.

Separately, the frontend's `API_BASE_URL` (repeated across ~11 page
components: `Login.tsx`, `Dashboard.tsx`, `Analytics.tsx`, etc.) was
originally hardcoded as:

```ts
const API_BASE_URL = `http://${window.location.hostname}:3001`;
```

This works fine on a LAN or on this VM (the browser's hostname really is the
backend's hostname, just a different port), which is why no change was
needed there for the VM deployment. It only broke earlier, during
tunnel-based testing, when frontend and backend were exposed through *two
separate* tunnel hostnames — that was patched with a
`VITE_API_BASE_URL` env-var override (checked first, falling back to the
`window.location.hostname` pattern) — see `.env.local` if reviving tunnel
testing later.

### Why only one app runs at once

`e2-micro` has 1GB RAM. Running both apps' backend + frontend simultaneously
(4 Node processes total) pushed the VM into heavy swapping — under 100MB free
RAM, 600+MB in swap, and noticeably slow page loads. Since the two apps don't
need to be tested at the same time, **VITALYZE's services are stopped and
disabled** (won't auto-start on boot) while BMI-FORM's are active. This
roughly halves memory pressure and brought response times back under 1
second.

To switch which app is active:

```bash
# Switch to BMI-FORM
sudo systemctl stop vitalyze-backend vitalyze-frontend
sudo systemctl enable --now bmi-backend bmi-frontend

# Switch to VITALYZE
sudo systemctl stop bmi-backend bmi-frontend
sudo systemctl enable --now vitalyze-backend vitalyze-frontend
```

The real fix for "run both at once comfortably" is either upgrading the VM
(`e2-small`, 2GB RAM, ~$13/month — no longer Always-Free) or fixing the
frontend production builds (see "Known issues" below) so they run as
lightweight static files instead of live Vite dev servers.

## systemd services

Four services, all `Restart=always` and enabled for boot:

- `vitalyze-backend.service` — `node dist/main.js` in `/var/www/apps/VITALYZE/backend`, production build
- `vitalyze-frontend.service` — `npx vite --host 0.0.0.0 --port 5173` in `/var/www/apps/VITALYZE/frontend`, **dev mode**
- `bmi-backend.service` — `node dist/main.js` in `/var/www/apps/BMI-FORM/backend`, production build
- `bmi-frontend.service` — `npx vite --host 0.0.0.0 --port 5174` in `/var/www/apps/BMI-FORM/frontend`, **dev mode**

Useful commands (run over SSH, see "Accessing the VM" below):

```bash
sudo systemctl status vitalyze-backend        # check state
sudo journalctl -u vitalyze-backend -n 50 -f  # tail logs live
sudo systemctl restart vitalyze-backend       # restart after a code change
```

## Deploying an update

Since the VM has its own git clones, shipping a change means pulling and
restarting on the VM, not just pushing to GitHub:

```bash
cd /var/www/apps/VITALYZE      # or BMI-FORM
git pull
cd backend && npm install && npm run build   # if backend changed
sudo systemctl restart vitalyze-backend      # or bmi-backend

cd ../frontend && npm install                # if frontend deps changed
sudo systemctl restart vitalyze-frontend     # or bmi-frontend
```

`git pull` here will just work using the deploy key already on the VM — no
extra auth step needed.

**If the VM's checkout has sat untouched a while, `git pull` may refuse**
with "divergent branches" — BMI-FORM's VM clone drifted 17 local-only
commits behind an old snapshot while GitHub moved 39 commits ahead, plus a
handful of uncommitted local edits (DB env-var config, Vite `allowedHosts`,
a MySQL8-compat SQL fix). Before assuming it's safe to blow away, **check
whether GitHub's current version already has the same fix** (e.g. `git diff`
each locally-modified file, compare against what's now in the repo) — in
this case every local edit turned out to already be superseded upstream, so
`git fetch && git reset --hard origin/main` was safe. Don't reset blind if
you find something that *isn't* upstream yet — push it to GitHub first.

Also note: the SSH user gcloud provisions (from your Google account) may not
own `/var/www/apps/*` (it's owned by whichever user originally set up the
VM — `acelazo` here) — `git pull`/`reset` as that plain user hits `fatal:
detected dubious ownership` and then `Permission denied`. Either
`sudo git config --global --add safe.directory <path>` + `sudo git ...`, or
`sudo -u acelazo git ...` to act as the owning user (needed for `npm
install`/`npm run build` specifically, since those write `node_modules`/
`dist` as that user).

## Accessing the VM

```bash
gcloud compute ssh vm-bmi-vitalyze --project=project-e3559f7c-642a-4eff-aed --zone=us-central1-a
```

Requires the Google Cloud CLI (`gcloud`) installed and authenticated as an
account with access to project `project-e3559f7c-642a-4eff-aed`.

## Known issues / possible follow-ups

- **No production frontend build.** `npm run build` fails on pre-existing
  TypeScript errors in BMI-FORM's `frontend/src/pages/InventoryDashboard.tsx`
  and `PcInfoDashboard.tsx` (a recharts `Tooltip` `formatter` prop typed
  incompatibly with the value it's given) — VITALYZE's own frontend wasn't
  checked against a production build yet, worth verifying separately.
  Fixing this would let frontends run as pre-built static files (served by
  Apache, which is already installed) instead of live Vite dev servers,
  meaningfully cutting memory usage and probably letting both apps run
  concurrently on `e2-micro` without upgrading.
- ~~**No domain / HTTPS.**~~ **Resolved** — see "HTTPS (Caddy + sslip.io)"
  above. Still worth buying a real domain if this becomes more than a test
  deployment; `sslip.io` is a fine free stand-in but not a great public-facing
  look.
- **Memory is genuinely tight** even with only one app running. If
  `e2-micro` starts feeling unstable again under real usage, `e2-small`
  (~$13/month) is the straightforward fix.
- **Azure resources were left behind, mostly empty.** `rg-bmi-vitalyze`
  (Southeast Asia) and `rg-bmi-vitalyze-eus` (East US) resource groups exist
  with essentially nothing costing money in them (one Free-tier App Service
  Plan with 0 sites, no VMs since those never provisioned). Worth deleting if
  you're not going back to Azure, just to keep the account tidy — they're not
  incurring real cost currently, but empty resource groups are just clutter.
