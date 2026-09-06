# Setting Up BMI-FORM's Docker Database on a New Machine

Companion to `docs/LOCAL_DEV_DATABASE.md` (which covers *why* this
project moved off XAMPP's MySQL and how that migration was done on the
original machine). This doc is the checklist for getting the same Docker
MySQL setup running on a **different** computer — a new dev machine, a
teammate's laptop, a fresh VM.

This repo is private, so `database/*.sql` (real personnel data — names,
RFID UIDs, assessment records) is committed directly rather than
transferred separately. If this repo is ever made public, those files
must be removed from git history first (`git filter-repo` or similar) —
don't just delete them going forward, since the data would still exist
in old commits.

## 1. Prerequisites on the new machine

- **Docker Desktop**, installed and actually running (whale icon settled
  in the system tray, not just launching).
- **On Windows**, Docker Desktop needs two things under it that aren't
  always on by default — both bit this project during the original setup:
  1. **WSL2.** If `docker --version` doesn't work even after installing
     Docker Desktop, open an elevated PowerShell and run
     `wsl --install`, then restart.
  2. **Hardware virtualization enabled in BIOS/UEFI**, not just a Windows
     feature — check with `systeminfo` and look for
     `Virtualization Enabled In Firmware`. If it says `No`, it has to be
     enabled in the BIOS setup itself (varies by motherboard — look for
     "Intel VT-x" / "AMD-V" / "SVM Mode" under a CPU or Advanced/Security
     menu) before Docker Desktop can start at all.
- **On macOS/Linux**, just Docker Desktop (macOS) or Docker Engine
  (Linux) — no WSL2/BIOS step.
- Node.js (for running the backend/frontend themselves — unrelated to
  Docker, but needed either way).

## 2. Get the repo and the database files

```
git clone https://github.com/donxace/BMI-FORM.git
cd BMI-FORM
```

`docker-compose.yml` and `database/bmi_monitoring.sql` /
`database/itms_inventech.sql` come with the clone — nothing to copy
separately for the database itself.

## 3. Set up `backend/.env`

This file is gitignored on purpose (it holds secrets) — it does **not**
come with `git clone`. Two ways to get one:

**Migrating your own work to a new machine (e.g. old laptop → new one):**
copy your actual `backend/.env` over by hand (USB drive, a private
transfer — never through git or chat) so both machines share the same
`JWT_SECRET`/`AGENT_SHARED_SECRET` and any existing tokens/sessions
still validate.

**Setting up a fresh/separate environment (a teammate, a new deployment):**
start from the template and generate new secrets — nobody else should
reuse this project's actual JWT secret.
```
cp backend/.env.example backend/.env
```
Then fill in:
```
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # → JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # → AGENT_SHARED_SECRET
```

Either way, set (or confirm) in `backend/.env`:
```
DB_HOST=localhost
DB_PORT=3307
DB_USERNAME=root
DB_PASSWORD=
```
`3307`, not `3306` — deliberately not XAMPP's default port, in case this
machine also runs XAMPP's own MySQL for something else.

## 4. Bring up the database

```
docker compose up -d
```
First run pulls the `mysql:8.0` image and auto-seeds both databases from
`database/*.sql` — takes a minute or two depending on connection speed.

Check it came up healthy:
```
docker compose ps
```
Expect:
```
NAME             STATUS                   PORTS
bmi-form-mysql   Up ... (healthy)         0.0.0.0:3307->3306/tcp
```

Verify the data actually seeded (not just empty schemas):
```
docker exec bmi-form-mysql mysql -uroot -e "SELECT COUNT(*) FROM bmi_monitoring.personnel;"
docker exec bmi-form-mysql mysql -uroot -e "SELECT COUNT(*) FROM itms_inventech.personnels;"
```
These should return non-zero counts matching whatever the `.sql` exports
held at the time they were last updated (not necessarily the exact
numbers from the original migration — see "Keeping data in sync" below).

If `itms_inventech` fails to seed with an `Invalid default value` error,
that's the MariaDB→MySQL8 `DATE DEFAULT current_timestamp()`
incompatibility already fixed once in this project — see
`docs/LOCAL_DEV_DATABASE.md`'s "MariaDB → MySQL 8 dump incompatibility"
section. It shouldn't recur since the fix is already baked into the
committed `.sql` file, but if the file gets re-exported from a fresh
`mysqldump` later without carrying the fix forward, it can come back.

## 5. Start the backend and confirm end-to-end

```
cd backend
npm install
npm run start:dev
```
Should boot with no connection errors. Confirm with a real request:
```
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"<your admin password>\",\"system\":\"bmi\"}"
```
A successful login response means the backend is talking to the new
machine's Docker database correctly.

## Keeping data in sync across machines

`database/*.sql` is a **snapshot from whenever it was last exported** —
Docker doesn't magically stay in sync with a different machine's live
database. If machine A has accumulated new personnel/assessments since
the last export and machine B needs that same data:

On machine A:
```
docker exec bmi-form-mysql mysqldump -uroot --routines --triggers --single-transaction bmi_monitoring > database/bmi_monitoring.sql
docker exec bmi-form-mysql mysqldump -uroot --routines --triggers --single-transaction itms_inventech > database/itms_inventech.sql
```
Then re-add each file's `CREATE DATABASE IF NOT EXISTS ...; USE ...;`
header (mysqldump doesn't include it without `--databases`) — see the
existing files for the exact two lines to prepend to each. Commit and
push.

On machine B:
```
git pull
docker compose down -v   # wipes the old seeded volume
docker compose up -d     # re-seeds from the updated .sql files
```
`down -v` is destructive to whatever's currently in machine B's
container — only do this when machine B doesn't have its own newer data
worth keeping.
