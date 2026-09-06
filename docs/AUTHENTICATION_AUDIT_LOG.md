# Authentication Audit Log

Added 2026-09-06. `authentication_audit_logs` replaces the old `auth_logs`
table entirely — same purpose (one row per login/registration attempt,
success and failure alike, across all 5 domain logins plus personnel
self-service), richer shape. Populated by `AuthService.logAttempt()`
(`backend/src/auth/auth.service.ts`), read via `GET /auth/logs`
(`backend/src/auth/auth.controller.ts`), displayed by
`frontend/src/pages/AuthLogs.tsx` (same one shared page, mounted at 4
routes — unchanged).

## Schema

```sql
CREATE TABLE authentication_audit_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT NULL,                 -- matches users.id's actual type; FK ON DELETE SET NULL
    username VARCHAR(100) NULL,
    `system` VARCHAR(30) NULL,
    event VARCHAR(100) NOT NULL,
    result VARCHAR(255) NULL,
    computer_name VARCHAR(255) NULL,
    windows_user VARCHAR(255) NULL,
    ip_address VARCHAR(45) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ...
);
```

`system` is the one column added beyond what was originally specified —
required because `AuthController.getLogs`'s per-domain scoping
(`DOMAIN_ADMIN_SYSTEMS`: a domain's own `_admin` role, e.g. `bmi_admin`,
is hard-locked server-side to its own domain's logs) filters on exactly
this column. Without it, every domain admin would see every other
domain's logs.

## Event taxonomy

There's no boolean `success` column any more — a row is a success **iff
its `event` ends with `_success`** (see `formatEvent`/`isSuccessEvent` in
`AuthLogs.tsx`, and the `EVENT` constant in `auth.service.ts`):

| event | when |
|---|---|
| `admin_login_success` | password + machine checks all pass |
| `admin_login_failed` | bad password / unknown username / missing fields |
| `admin_account_disabled` | `is_active = 0` |
| `admin_license_expired` | `license_expires_at` past |
| `admin_account_locked` | `failed_attempts >= 5` |
| `personnel_login_success` | RFID+PIN ok |
| `personnel_login_failed` | bad RFID/PIN/unclaimed card / missing fields |
| `personnel_register_success` | claim succeeds |
| `personnel_register_failed` | already claimed / not provisioned / missing fields |

This is strictly more granular than the old table — previously every
disabled/expired/locked rejection all collapsed into one generic "failed"
row with only `failure_reason`'s free text to tell them apart. Now each
has its own machine-readable `event`, so filtering/counting by rejection
*type* (not just success/failure) is a plain query instead of a
`failure_reason LIKE '%...%'` guess.

Note there's no `admin_machine_mismatch` event — machine identity
(`computer_name`/`windows_user`) is recorded for visibility only and never
gates login; see `docs/USER_ACCOUNT_SECURITY.md` section 4.

`result` holds the human-readable detail — what `failure_reason` held
before. Usually `NULL` on `*_success` rows (nothing to explain).

## What changed from the old `auth_logs` columns

| Old column | New equivalent |
|---|---|
| `login_type` ('admin'/'personnel') | Folded into the `event` prefix (`admin_...` / `personnel_...`) |
| `success` (boolean) | Derive from `event.endsWith('_success')` |
| `failure_reason` | `result` |
| `identifier` | `username` |
| `role` | **Dropped as a stored column** — recovered live via a join, see below |
| `user_agent` | **Dropped entirely** — wasn't worth carrying into the redesign |
| *(none)* | `user_id` — new, resolves to the matching `users` row when the username matched one |
| *(none)* | `computer_name`, `windows_user` — new, from the local Machine Identity Helper, admin-login-flow only (see `docs/MACHINE_IDENTITY_HELPER_DEPLOYMENT.md`) |

### `role` is now a live join, not a frozen snapshot — a real behavior change

`AuthService.getLogs()` no longer stores role on the row; it does
`relations: { user: true }` and reads `log.user?.role` at query time,
exposed to the frontend as `granted_role`. This is a genuine semantic
shift worth knowing about: the **old** column only had a value on a
*successful* row (null on every failure), frozen to whatever the role was
at that moment. The **new** `granted_role` shows up on *any* row where
`user_id` resolved — including failed attempts — and always reflects the
account's *current* role, not its role at the time of that historical
event. If an account's role is changed later, every one of its past log
rows will show the new role, not what it actually had back then. This was
accepted as a reasonable trade-off (simpler, one less place to keep in
sync) rather than flagged as a defect — but if exact point-in-time role
auditing ever matters, this is the place that would need to change.

## Migration & history

`database/migrations/2026-09-06_add_authentication_audit_logs.sql`
backfilled all pre-existing `auth_logs` rows before dropping that table —
nothing was discarded. Backfilled rows collapse to just
`admin_login_success` / `admin_login_failed` / `personnel_login_success` /
`personnel_login_failed` (the finer-grained events like
`admin_account_locked` didn't exist as distinguishable data in the old
table, so historical lockout/disable/expiry rejections are
indistinguishable from a plain bad password in the backfilled rows — only
logins recorded *after* this migration get the full granularity).
`user_id` was opportunistically resolved for backfilled admin-type rows by
joining on `username = identifier`; `computer_name`/`windows_user` stay
`NULL` throughout the backfill (never captured historically).

`users.machine_id` was also cleared (`UPDATE users SET machine_id = NULL`)
during this work — first as a defensive reset when the hardware-backed
lock replaced an earlier per-browser one, then made permanently moot when
the lock itself was removed in favor of logging-only tracking (see
`docs/USER_ACCOUNT_SECURITY.md` section 4). The column stays in the
schema, unused.

## Scope note

`computer_name`/`windows_user` are populated for the **admin login flow
only** (`POST /auth/login`). Personnel RFID/PIN kiosk logins
(`personnelLogin`/`personnelRegister`) don't query the identity helper, so
those two columns are always `NULL` on personnel-type rows — this isn't a
regression, personnel logs never had this data before either.
