# Admin Account Security — License Expiry, Lockout, Activity Tracking

Added 2026-09-06. Extends `bmi_monitoring.users` (the shared admin/login
table behind all 5 domain logins — BMI, Hardware Inventory, PC Information
System, Intrusion Detection, Environment Monitoring) with four independent
account controls. All of it is enforced in one place:
`AuthService.validateAndLogin` (`backend/src/auth/auth.service.ts`), which
is what `POST /auth/login` calls.

This does **not** touch personnel (RFID/PIN) login — that's a separate
table (`personnel`) and a separate service method (`personnelLogin`),
unaffected by any of this.

## Why `role` wasn't touched

The schema this was built from originally specified `role
ENUM('ADMIN','USER')`. That was deliberately **not** applied — this
project's `role` column already holds ~16 free-text, per-domain RBAC
values (`admin`, `bmi_admin`, `bmi_viewer`, `inventory_editor`, ...),
enforced in `AdminAuthGuard` (`backend/src/auth/guards/admin-auth.guard.ts`).
Collapsing that to two values would have broken every domain-scoped role
check. `role` stays `VARCHAR(50)`, unchanged.

## What was added

Four new columns on `users`, added by
`database/migrations/2026-09-06_add_user_security_columns.sql`:

| Column | Type | Meaning |
|---|---|---|
| `machine_id` | `varchar(255) NULL` | **Unused.** Was a single-machine lock; removed 2026-09-06 in favor of logging-only machine identity — see section 4 below. Left in the schema but never written to or checked. |
| `license_expires_at` | `date NULL` | Account stops being able to log in after this date. `NULL` = never expires. |
| `failed_attempts` | `tinyint unsigned` | Consecutive bad-password count. Resets to 0 on a successful login. |
| `is_active` | `tinyint(1)`, default `1` | Hard on/off switch for the account. |
| `last_login_at` | `datetime NULL` | Stamped on every successful login. |
| `last_activity_at` | `datetime NULL` | Stamped alongside `last_login_at` (login-time only — there is no per-request activity tracking yet). |
| `created_at` / `updated_at` | `datetime` | Standard audit timestamps, auto-managed by MySQL (`created_at` defaults on insert, `updated_at` refreshes `ON UPDATE`). |

Reflected in `backend/src/auth/user.entity.ts` (the TypeORM entity) and in
`database/bmi_monitoring.sql` (the seed dump — kept in sync so
`docker compose down -v && up` reproduces the same schema; see
`docs/LOCAL_DEV_DATABASE.md`).

## How each control works

### 1. Account disable (`is_active`)

Checked first, before the password is even verified. `is_active = 0` →
login always fails with *"This account has been disabled."*, regardless of
password correctness.

```sql
UPDATE bmi_monitoring.users SET is_active = 0 WHERE username = 'someone';
```

### 2. License expiry (`license_expires_at`)

Checked right after `is_active`, also before password verification. If set
and in the past, login fails with *"This account's license has expired."*
`NULL` (the default) means the account never expires.

```sql
UPDATE bmi_monitoring.users SET license_expires_at = '2026-12-31' WHERE username = 'someone';
```

### 3. Failed-attempt lockout (`failed_attempts`)

Every wrong password increments `failed_attempts` by 1. Once it reaches
**5** (`MAX_FAILED_ATTEMPTS` in `auth.service.ts`), the account is locked —
login is rejected with *"...locked due to too many failed login attempts."*
even if the **correct** password is used next. There is no self-service
unlock or automatic time-based reset; an admin has to clear it manually:

```sql
UPDATE bmi_monitoring.users SET failed_attempts = 0 WHERE username = 'someone';
```

A successful login resets `failed_attempts` to 0 automatically.

Note: `POST /auth/login` also has its own, separate rate limit (5
requests/minute per IP, via `@nestjs/throttler`) — that's a different
mechanism protecting against brute force at the network level, independent
of per-account `failed_attempts`. Hitting the rate limit returns a `429`
(`ThrottlerException`), not the lockout message.

### 4. Machine identity — logging only, not a lock

**History:** this started as a per-browser lock (a random `localStorage`
UUID), was upgraded to a real hardware-backed lock (a local helper reading
the BIOS/motherboard serial, fail-closed once bound), and was then
**deliberately turned into logging-only tracking** on 2026-09-06 — an
account is never rejected based on which machine it's used from. Only the
last version is currently live; the middle one is dead history now,
mentioned here only so old references to "machine lock" or "fail-closed"
elsewhere aren't confusing.

What actually happens today:
- `backend/scripts/Get-MachineIdentityHelper.ps1` runs as a local HTTP
  listener on `http://127.0.0.1:47850/identity` (see
  `docs/MACHINE_IDENTITY_HELPER_DEPLOYMENT.md` for install steps). It
  reads the BIOS/motherboard/chassis serial, the computer's hostname, and
  the interactively logged-on Windows username.
- `frontend/src/utils/machineId.ts`'s `getHardwareIdentity()` queries it
  (800ms timeout) before every login and sends `computer_name` and
  `windows_user` in the `POST /auth/login` body.
- `AuthService.validateAndLogin` writes those two fields onto the
  resulting `authentication_audit_logs` row (see
  `docs/AUTHENTICATION_AUDIT_LOG.md`) and **never reads or writes
  `users.machine_id`, and never rejects a login because of them.** If the
  helper isn't installed/running, those two columns are just blank on that
  attempt's log row — login proceeds exactly the same either way.

In short: you can see which machine and Windows user a given login came
from, but nothing stops any account from logging in from any machine.
`users.machine_id` remains in the schema (harmless, unused) in case a real
lock is wanted again later — see the git history / this doc's earlier
revisions for how that worked when it was live.

## Order of checks in `validateAndLogin`

1. Username/password present.
2. User exists (generic *"Invalid credentials."* if not — doesn't reveal
   whether the username exists).
3. `is_active` check.
4. `license_expires_at` check.
5. `failed_attempts` lockout check.
6. Password verified (bcrypt). Wrong → increment `failed_attempts`, generic
   *"Invalid credentials."*
7. Success: `failed_attempts` reset to 0, `last_login_at` /
   `last_activity_at` stamped to now, JWT issued.

Steps 3-5 happen before password verification (an account can be locked
out of *ever* attempting a password once disabled/expired/lockout-tripped).
There is no machine check — see section 4.

## Verifying it works

Query the account's state directly, before/after a login attempt:

```
docker exec bmi-form-mysql mysql -uroot -e "
SELECT username, is_active, failed_attempts, license_expires_at, last_login_at, last_activity_at
FROM bmi_monitoring.users WHERE username = 'someone';"
```

Or exercise it end-to-end with `curl` against `POST /auth/login` — see the
throwaway-account approach used in this project's own verification pass
(create a temp user, run through each scenario, delete it — never test
lockout against a real account you still need to use).

## Files touched

- `database/migrations/2026-09-06_add_user_security_columns.sql` — the migration (already applied to the running dev DB).
- `database/bmi_monitoring.sql` — reseed dump, kept in sync.
- `backend/src/auth/user.entity.ts` — TypeORM entity.
- `backend/src/auth/dto/login.dto.ts` — `computer_name`, `windows_user` (both optional, logging-only).
- `backend/src/auth/auth.service.ts` — all the enforcement logic, in `validateAndLogin`.
- `backend/scripts/Get-MachineIdentityHelper.ps1`, `Install-MachineIdentityHelperTask.ps1` — the local machine-identity helper and its installer; see `docs/MACHINE_IDENTITY_HELPER_DEPLOYMENT.md`.
- `frontend/src/utils/machineId.ts` — `getHardwareIdentity()`, queries the local helper.
- `frontend/src/pages/Login.tsx`, `frontend/src/pages/DomainLogin.tsx` — both send the helper's response on login.

Every login/registration attempt is also recorded to
`authentication_audit_logs` — see `docs/AUTHENTICATION_AUDIT_LOG.md`.

## Not implemented (by design, for now)

- **No admin UI** for any of this yet — every action above (disable an
  account, set/clear a license date, unlock) is a direct SQL `UPDATE`. If
  this becomes a regular admin task, it belongs on whichever page manages
  `users` accounts, not left as raw SQL.
- **No per-request activity tracking** — `last_activity_at` is only
  updated at login time, not on every authenticated request. True
  "last seen 3 minutes ago" tracking would need a hook in `AdminAuthGuard`
  instead, and wasn't part of what was asked for here.
- **No automatic unlock** after a lockout — it's a hard stop until an
  admin clears `failed_attempts`, not a cooldown timer.
- **No machine lock** — see section 4. `computer_name`/`windows_user` are
  recorded for visibility only, admin-login-flow only (the personnel
  RFID/PIN kiosk flow doesn't query the identity helper, so those columns
  are always null on personnel-type audit log rows).
