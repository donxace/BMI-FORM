# Local Database Setup — XAMPP MySQL problems → Docker migration

Written 2026-09-06 while diagnosing recurring "MySQL won't start" problems
in XAMPP and migrating BMI-FORM's databases to Docker instead.

## Root cause of the XAMPP MySQL failures (found and fixed)

Two independent bugs, both confirmed directly from `xampp/mysql/data/mysql_error.log`
and a live connection test, not guessed at:

1. **An orphaned `mysqld` process held port 3306.** The error log showed
   the running process had started the previous day and never shut down
   cleanly; a later attempt to start MySQL failed with
   `Can't start server: Bind on TCP/IP port ... Got error: 10013` because
   the stale process was still bound to it. This is almost certainly the
   "always having a problem when starting MySQL" symptom.
2. **`root`'s auth plugin was broken.** XAMPP's bundled server is actually
   **MariaDB 10.4.32**, not MySQL — but the `root` account had been
   configured to authenticate via `caching_sha2_password`, a MySQL-8-only
   plugin. This MariaDB build doesn't ship that plugin at all (its
   `lib/plugin/` folder has no `caching_sha2_password.dll`), so every
   login attempt as root failed instantly with
   `Plugin caching_sha2_password could not be loaded`, regardless of
   password.

**Fix applied:** a full Stop → Start of MySQL via the XAMPP Control Panel
cleared the orphaned process, and root's login started working normally
again afterward (its effective auth plugin reset to something this
MariaDB build actually has). Confirmed with `SHOW DATABASES;` and a
`netstat` check showing exactly one process on port 3306 afterward.

## Why migrate to Docker instead of continuing to troubleshoot XAMPP

The user's call, given how often this XAMPP MySQL install has broken —
Docker gives an isolated, disposable instance (`docker compose down -v`
+ `docker compose up` = a guaranteed-clean instance) instead of a shared
system service that can accumulate stale processes/config over time.

**Scope, by explicit choice:** only BMI-FORM's two databases
(`bmi_monitoring`, `itms_inventech`) move to Docker. VITALS-FORM and
VITALYZE-DEMO keep using XAMPP's MySQL on port 3306 — they weren't part
of this migration, so Docker's MySQL is deliberately mapped to a
**different** host port (3307) to avoid taking over 3306 out from under
them. There was also a separate, unrelated `vitalyze_db` database
(belonging to the old standalone PHP prototype in `htdocs/vitalyze`, not
anything worked on this session) — explicitly excluded from the
migration at the user's request.

## What's been done

- Exported both databases with real data (not empty seed schemas) via
  `mysqldump --routines --triggers --single-transaction` into
  `database/bmi_monitoring.sql` and `database/itms_inventech.sql`.
  Each file was given its own `CREATE DATABASE IF NOT EXISTS ...; USE ...;`
  header so it's self-contained regardless of container defaults.
- Created `docker-compose.yml` (repo root): a single `mysql:8.0` service,
  `MYSQL_ALLOW_EMPTY_PASSWORD: "yes"` (matches the empty-root-password
  convention `backend/.env` already used — no more exposed than XAMPP's
  MySQL was, since the port only binds to the host machine), host port
  **3307** → container 3306, a named volume for data persistence, and
  `./database` mounted read-only at `/docker-entrypoint-initdb.d` so both
  `.sql` files auto-import the first time the container creates its data
  volume.

## Blockers hit along the way (both resolved)

1. **WSL2 wasn't installed.** Docker Desktop requires it as its backend
   on Windows — without it, Docker Desktop's processes ran but its engine
   never actually started, so the `docker` CLI didn't exist on the
   system at all. Fixed by `wsl --install` (elevated PowerShell) +
   restart.
2. **Hardware virtualization was disabled in BIOS/UEFI**, not just
   missing a Windows feature — `systeminfo` showed
   `Virtualization Enabled In Firmware: No` even though the CPU itself
   supports it (`VM Monitor Mode Extensions: Yes`). This machine's board
   is an ASUS PRIME A320M-K; fixed by enabling AMD-V (SVM Mode) in the
   BIOS setup, then rebooting into Windows.

## MariaDB → MySQL 8 dump incompatibility (found and fixed)

The first `docker compose up` seeded `bmi_monitoring` fine but failed on
`itms_inventech.sql` with:
```
ERROR 1067 (42000) at line 125: Invalid default value for 'created_date'
```
Cause: 11 columns across the device tables were defined as
`` `created_date` date DEFAULT current_timestamp() `` (or
`NOT NULL DEFAULT current_timestamp()`) — MariaDB (XAMPP's actual
server, despite being branded "MySQL") permits a plain `DATE` column to
default to `current_timestamp()`, silently truncating the time portion.
MySQL 8 does not; it only allows that expression as a default for
`TIMESTAMP`/`DATETIME` columns. Fixed by rewriting those 11 defaults to
`` DEFAULT (CURRENT_DATE) `` — MySQL 8.0.13+'s parenthesized-expression
default syntax, which gives the same effective behavior (today's date
when the column is omitted on insert). Only `itms_inventech.sql` needed
this; `bmi_monitoring.sql` had no columns of this shape.

## Status: done, verified end-to-end

- `docker compose up -d` — both databases seeded correctly (confirmed
  via `SHOW DATABASES` and row-count spot checks matching the XAMPP
  source exactly: `personnel` 39, `bmi_assessments` 277, `users` 16,
  `auth_logs` 77, `itms_inventech.personnels` 40, `desktops` 16).
- `backend/.env`: `DB_PORT` changed from `3306` to `3307`.
- Backend restarted, boots clean against the Docker database.
- Full request cycle verified live: `POST /auth/login` succeeds,
  `GET /personnel` returns exactly 39 records through the new connection,
  and `GET /inventory-personnel` (the separate `itms_inventech`
  connection) returns `200`.

XAMPP's MySQL keeps running on port 3306, untouched, for
VITALS-FORM/VITALYZE-DEMO — BMI-FORM no longer depends on it at all. To
reset BMI-FORM's database to a clean state at any point:
`docker compose down -v && docker compose up -d` (re-seeds from the same
`database/*.sql` exports).

## Checking status day-to-day

**GUI — Docker Desktop:** Containers tab in the left sidebar lists
`bmi-form-mysql` with its status, port mapping, and CPU/memory; click
into it for a Logs tab. Easiest for a quick glance.

**CLI — from `BMI-FORM/`:**
```
docker compose ps
```
Healthy output looks like:
```
NAME             STATUS                   PORTS
bmi-form-mysql   Up 3 minutes (healthy)   0.0.0.0:3307->3306/tcp
```
The `(healthy)` comes from the `healthcheck` block in `docker-compose.yml`
(a `mysqladmin ping` every 5s) — that's the real signal MySQL is actually
accepting connections, not just that the container process exists.

Other useful commands:
- `docker logs bmi-form-mysql` — startup/error log (this is what caught
  the `itms_inventech.sql` seeding error above).
- `docker logs -f bmi-form-mysql` — follow it live.
- `docker stats bmi-form-mysql` — live CPU/memory usage.
