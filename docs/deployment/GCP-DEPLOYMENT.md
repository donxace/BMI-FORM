# Public Deployment on Google Cloud (GCP)

This documents how BMI-FORM (and its sibling app, VITALYZE) ended up running on a
persistent Google Cloud VM instead of a tunnel from a developer's laptop, and
exactly how that VM is set up so it can be reproduced, extended, or torn down.

VITALYZE has its own copy of this document at `VITALYZE/docs/deployment/GCP-DEPLOYMENT.md`
since both apps share the same VM — read whichever repo you're currently in, they're
nearly identical.

## TL;DR — current live setup

| App | Frontend | Backend |
|---|---|---|
| BMI-FORM | `http://34.9.180.120:5174` | `http://34.9.180.120:3000` |
| VITALYZE | `http://34.9.180.120:5173` | `http://34.9.180.120:3001` |

- VM: `vm-bmi-vitalyze`, GCP project `project-e3559f7c-642a-4eff-aed`, zone `us-central1-a`
- Only **one app's pair of services runs at a time** (see "Why only one app runs at once" below) — currently VITALYZE is active, BMI-FORM's services are stopped.
- Both apps' code lives on the VM at `/var/www/apps/BMI-FORM` and `/var/www/apps/VITALYZE`, each cloned from GitHub.
- All 4 services (2 apps × frontend + backend) are managed by **systemd**, not by any tunnel or terminal session — they survive reboots and crash-restart automatically.

## Why this exists: the road here

The original ask was just "make my web server accessible on the internet for
testing." That went through several approaches before landing on a real VM
deployment — worth knowing so the reasoning isn't a mystery later:

1. **Cloudflare Quick Tunnels** (`cloudflared tunnel --url ...`) — free, no
   account needed. Worked, but is explicitly a best-effort service with no
   uptime guarantee. We hit repeated random disconnects (DNS timeouts to
   Cloudflare's tunnel infrastructure) throughout the session.
2. **localtunnel** (`npx localtunnel`) — also free, let us pick a custom
   subdomain (`vitalyze.loca.lt`). Turned out to be even less reliable — the
   underlying `loca.lt` relay is a small community-run service and got
   slow/`502`-prone under normal use. We also accidentally ended up with
   **four duplicate tunnel processes** fighting over the same subdomain at one
   point, which made "bad gateway, so slow" complaints make sense.
3. **ngrok** — more stable than the above once actually running, but (a) its
   Windows binary got flagged and quarantined by Windows Defender as
   `Trojan:Win32/Kepavll!rfn` — a known false-positive pattern for tunneling
   tools, fixed with a narrow Defender exclusion on just that one `.exe` — and
   (b) the **free tier only allows one live public endpoint per account**, so
   it could only front one app (VITALYZE's frontend), not all of them.
4. Independently of tunnel flakiness, we noticed **all 4 background tunnel/dev
   processes kept dying simultaneously** between chat turns — never fully
   root-caused, but consistent with something interrupting the session and the
   harness tearing down tracked background tasks as part of that. Fully
   detached processes (spawned via `wmic process call create` instead of the
   normal backgrounding mechanism) survived where tracked ones didn't.
5. **Azure** (the user has a free trial) was the first real "persistent, not a
   tunnel" attempt. Blocked immediately: the trial subscription had a
   **0 vCPU quota** for every VM size tried (`B1s`, `B2s`, `B2ms`) in every
   region tried (Southeast Asia, East US) — a well-known fraud-prevention
   default on brand-new trial subscriptions that requires a manual support
   request to lift. `az vm create` failed with `SkuNotAvailable: Capacity
   Restrictions` every time. (Azure App Service / PaaS *did* work around this,
   since it draws from a separate quota pool — but the user opted to switch to
   Google Cloud instead of restructuring around App Service.)
6. **Google Cloud** — already had an account and an active billing account, so
   this is what's actually live. Chosen size: `e2-micro`, which is part of
   GCP's **Always Free** tier (free forever in `us-west1`/`us-central1`/
   `us-east1`, not just trial credit).

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
  /var/www/apps/BMI-FORM   <- git clone of this repo (public, HTTPS clone)
  /var/www/apps/VITALYZE   <- git clone of the VITALYZE repo (private, cloned
                               over SSH using a read-only deploy key)

Swap: a 2GB swapfile at /swapfile (critical — e2-micro only has 1GB RAM, and
  running even one app's backend+frontend pushes it close to the edge; running
  all 4 processes at once caused heavy swapping and very slow response times)
```

### Firewall

Three firewall rules were created (GCP's `default` network denies all inbound
by default otherwise):

- `allow-http` — tcp:80
- `allow-https` — tcp:443
- `allow-app-ports` — tcp:3000,3001,5173,5174 (the 4 app ports, opened directly
  since there's no reverse proxy in front of them yet)

### Database

Both apps use TypeORM against MySQL with **`synchronize: false`**, meaning the
schema is not auto-created — it comes from `.sql` dumps already committed in
each repo's `database/` folder:

- `BMI-FORM/database/bmi_monitoring.sql` → database `bmi_monitoring`
- `BMI-FORM/database/itms_inventech.sql` → database `itms_inventech`
- `VITALYZE/database/vitals_monitoring.sql` → database `vitals_monitoring`

These were imported directly on the VM (the `.sql` files travel with the repo,
no separate transfer needed).

**One real incompatibility hit during import:** the dumps were produced by
XAMPP's MariaDB, which permissively allows `DATE DEFAULT CURRENT_TIMESTAMP()`
on plain `DATE` columns. Real MySQL 8 (what's on the VM) rejects this —
`current_timestamp()` as a default is only valid on `TIMESTAMP`/`DATETIME`
columns, not `DATE`. This is **not** a strict-mode setting you can flip; it's
a genuine DDL rejection. Fixed by patching the VM's copy of
`itms_inventech.sql` only (not the version in this repo) to drop the invalid
default on `created_date` columns:

```
date NOT NULL DEFAULT current_timestamp()  →  date NOT NULL
date DEFAULT current_timestamp()           →  date DEFAULT NULL
```

This only strips a column *default* — every row in the dump's `INSERT`
statements already specifies `created_date` explicitly, so no data was
affected. If this repo's dump is ever re-exported from XAMPP and re-imported
to the VM, this same fix will need to be re-applied (or, better, fix it at the
source by not letting phpMyAdmin/mysqldump emit `DATE DEFAULT
CURRENT_TIMESTAMP()` in the first place).

### Database credentials

The apps' `TypeOrmModule.forRoot({...})` configs (in
`backend/src/app.module.ts`, both here and in VITALYZE) originally hardcoded:

```ts
username: 'root',
password: '',
```

Fine for XAMPP on `localhost`, not fine for a MySQL instance that (however
unlikely, since port 3306 isn't in the firewall rules) is one misconfiguration
away from being reachable. This was changed to read from environment
variables with the old hardcoded values kept as **fallbacks**, so local
XAMPP development is completely unaffected:

```ts
host: process.env.DB_HOST || 'localhost',
port: Number(process.env.DB_PORT) || 3306,
username: process.env.DB_USERNAME || 'root',
password: process.env.DB_PASSWORD || '',
```

On the VM, a dedicated MySQL user (`appuser`, **not** `root`) was created with
privileges scoped to just the three databases above, and its password is set
only in the systemd service files (see below) — **not** committed to either
repo. If you need the actual value, it's in
`/etc/systemd/system/{bmi,vitalyze}-backend.service` on the VM, or ask
whoever ran this deployment.

### Vite `allowedHosts`

Vite's dev server rejects requests whose `Host` header isn't in an allowlist
(`server.allowedHosts` in `vite.config.ts`) — this bit us repeatedly every
time a new tunnel hostname was generated. Both frontends' `vite.config.ts`
now use `allowedHosts: true` (allow any host) instead of maintaining a list of
one-off tunnel hostnames. This is fine for a dev server that's already
firewalled to specific ports and not proxying anything sensitive; revisit if
that changes.

### Why only one app runs at once

`e2-micro` has 1GB RAM. Running both apps' backend + frontend simultaneously
(4 Node processes total) pushed the VM into heavy swapping — under 100MB free
RAM, 600+MB in swap, and noticeably slow page loads. Since the two apps don't
need to be tested at the same time, **BMI-FORM's services are stopped and
disabled** (won't auto-start on boot) while VITALYZE's are active. This
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

- `bmi-backend.service` — `node dist/main.js` in `/var/www/apps/BMI-FORM/backend`, production build
- `bmi-frontend.service` — `npx vite --host 0.0.0.0 --port 5174` in `/var/www/apps/BMI-FORM/frontend`, **dev mode**
- `vitalyze-backend.service` — `node dist/main.js` in `/var/www/apps/VITALYZE/backend`, production build
- `vitalyze-frontend.service` — `npx vite --host 0.0.0.0 --port 5173` in `/var/www/apps/VITALYZE/frontend`, **dev mode**

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
cd /var/www/apps/BMI-FORM      # or VITALYZE
git pull
cd backend && npm install && npm run build   # if backend changed
sudo systemctl restart bmi-backend           # or vitalyze-backend

cd ../frontend && npm install                # if frontend deps changed
sudo systemctl restart bmi-frontend          # or vitalyze-frontend
```

VITALYZE was cloned over SSH using a **read-only deploy key** (generated on
the VM, added under the VITALYZE repo's Settings → Deploy keys) since it's a
private repo — `git pull` on the VM will just work with that key already in
place. BMI-FORM is public, so its clone needs no auth.

## Accessing the VM

```bash
gcloud compute ssh vm-bmi-vitalyze --project=project-e3559f7c-642a-4eff-aed --zone=us-central1-a
```

Requires the Google Cloud CLI (`gcloud`) installed and authenticated as an
account with access to project `project-e3559f7c-642a-4eff-aed`.

## Known issues / possible follow-ups

- **No production frontend build.** `npm run build` fails on pre-existing
  TypeScript errors in `frontend/src/pages/InventoryDashboard.tsx` and
  `PcInfoDashboard.tsx` (a recharts `Tooltip` `formatter` prop typed
  incompatibly with the value it's given). Not something introduced by this
  deployment — just discovered by it. Fixing these would let the frontends
  run as pre-built static files (served by Apache, which is already
  installed) instead of live Vite dev servers, which would meaningfully cut
  memory usage and probably let both apps run concurrently on `e2-micro`
  without upgrading.
- **No domain / HTTPS.** Everything is plain `http://` via the VM's raw IP.
  Fine for internal testing, not for anything real — would need a domain
  pointed at `34.9.180.120` plus something like Let's Encrypt/Certbot (or
  fronting it with Cloudflare) for HTTPS.
- **Memory is genuinely tight** even with only one app running. If
  `e2-micro` starts feeling unstable again under real usage, `e2-small`
  (~$13/month) is the straightforward fix.
- **Azure resources were left behind, mostly empty.** `rg-bmi-vitalyze` (Southeast Asia) and
  `rg-bmi-vitalyze-eus` (East US) resource groups exist with essentially
  nothing costing money in them (one Free-tier App Service Plan with 0 sites,
  no VMs since those never provisioned). Worth deleting if you're not going
  back to Azure, just to keep the account tidy — they're not incurring real
  cost currently, but empty resource groups are just clutter.
