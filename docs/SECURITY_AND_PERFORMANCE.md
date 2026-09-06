# Security & Performance Audit — Backend

Audit date: 2026-09-06. Scope: the shared NestJS backend (`backend/`), which
serves BMI, Hardware Inventory, PC Information System, Intrusion Detection,
and Environment Monitoring — all 5 domains share the same auth
infrastructure (`AdminAuthGuard`, JWT), so a weakness in one place affects
every domain, not just the one it was found in.

Findings are ranked by actual exploitability today, not just theoretical
risk. Each item lists its status after the fix pass that followed this
audit.

## Critical

### 1. Hardcoded JWT secret
**Where:** `backend/src/auth/auth.module.ts`
**Problem:** `secret: 'your_secret_key'` was a literal string checked into
source, with a comment admitting it was never replaced. Anyone who reads
the repo can mint a JWT for any role — including the literal `admin`
super-role — for any of the 5 domains. This undermines every RBAC check in
the app, since they all trust a token signed with this secret. There was
also no `.env` file at all, so DB credentials fell back to hardcoded
`root`/empty-password in `app.module.ts`.
**Status:** ✅ Fixed — secret and DB credentials now come from `.env`
(gitignored), loaded via `dotenv/config` at the top of `main.ts`. The app
throws at boot if `JWT_SECRET` is missing, instead of silently falling back
to a literal.

### 2. No rate limiting anywhere
**Where:** `POST /auth/login`, `POST /auth/personnel-login`
**Problem:** Unlimited login attempts, no lockout, no delay. Personnel
login authenticates by a 4-6 digit PIN (`bcrypt.compare(pin, ...)`) — a
~10,000-value space, trivially brute-forceable with nothing throttling
requests.
**Status:** ✅ Fixed — `@nestjs/throttler` installed, global default limit,
with a stricter explicit limit on both login endpoints.

## High

### 3. Mass-assignment in Inventory Devices create/update
**Where:** `backend/src/inventory-devices/inventory-devices.controller.ts`,
`inventory-devices.service.ts`
**Problem:** `create`/`update` took `Record<string, any>` instead of a
validated DTO, so the global `ValidationPipe({ whitelist: true })` had
nothing to strip against — any property in the request body merged
directly onto the entity via `Object.assign`. An `inventory_editor` (a role
explicitly barred from delete) could overwrite `id`, agent-report-only
telemetry fields, or timestamps that should never be client-settable.
`inventory-personnel` already did this correctly with real DTOs — the
pattern existed, it just wasn't applied here.
**Status:** ✅ Fixed — a service-level `stripProtectedFields()` denylist
now strips `id`, all timestamp/audit columns, and the 6 agent-report-only
JSON fields (`installed_software`, `missing_updates`, `usb_history`,
`network_adapters`, `printers_detected`, `hotfixes`) before every
create/update, regardless of what the client sends. A full per-device-type
DTO was considered but rejected — the 12 device tables span 3 incompatible
column shapes with ~15-38 fields each, and guessing the wrong "legitimate"
field set would risk silently breaking real device forms.

### 4. Unauthenticated, serial-number-trusted agent-report endpoint
**Where:** `POST /inventory/devices/agent-report`
**Problem:** No guard at all (by design — the LAN collector script has no
admin session), and matches/patches a device purely by serial number, a
value often printed on the physical device. Combined with CORS reflecting
any origin and the server bound to `0.0.0.0:3000`, anyone on the same LAN
segment could spoof a hardware-facts payload for any device whose serial
they can read off a label.
**Status:** ✅ Fixed — the endpoint now requires an `x-agent-key` header
matching a new `AGENT_SHARED_SECRET` env var, checked before touching the
database. The collector script (`backend/scripts/collect-agent.js`) sends
this header now.

### 5. Fully open CORS
**Where:** `backend/src/main.ts`
**Problem:** `origin: true` reflects whatever `Origin` header the caller
sends, combined with `credentials: true` — broader than needed for a LAN
app with a known, bounded set of client machines.
**Status:** ✅ Fixed — replaced with an origin-check function that allows
`localhost`/`127.0.0.1` on any port and private LAN ranges
(`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) on any port — matching
how this app is actually deployed and accessed (multiple LAN machines by
IP, per the original code comment) — while rejecting public-internet
origins. Extra origins can be added via `CORS_EXTRA_ORIGINS` (comma-
separated) if ever needed.

## Medium

### 6. No pagination — unbounded result sets
**Where:** `InventoryDevicesService.findAll()` (all 12 device tables),
`InventoryPersonnelService.findAll()`, `PcInfoService.findFindingsByCategory
/findConnectionStatus/findComponentStatus`.
**Problem:** Every list endpoint loads its entire table into memory on
every call. Not hypothetical: `security_assessment_findings` already had
1,068 rows at audit time and is fetched in full on every PC Info category
view.
**Status:** ⚠️ Partially addressed — a hard safety cap was added to the
worst offenders to prevent unbounded growth from becoming an outage, but a
full switch to server-side paging (`page`/`limit` query params + a
matching frontend rework of every list view that currently filters/sorts
client-side across the full dataset) is a larger, separate UI project and
was intentionally not forced through in this pass. See "Follow-ups" below.

### 7. Missing indexes on the actual hot-path filter column
**Where:** all 12 `itms_inventech` device tables
**Problem:** `InventoryDevicesService.findByPersonnel()` runs
`WHERE personnel_id = :id` against all 12 tables every time someone views
a person's assigned equipment. None of them had an index on `personnel_id`
— confirmed directly via `information_schema.statistics` — only the
primary key on `id`. Invisible at today's row counts (8-16 rows/table),
becomes a full table scan × 12 as inventory grows.
**Status:** ✅ Fixed — `idx_personnel_id` added to all 12 tables.

### 8. CSV import with no size/type limit
**Where:** `POST /pc-info/import`
**Problem:** No Multer `limits`, no MIME/extension check. An authenticated
`pcinfo_editor` could upload an arbitrarily large file straight into memory
before the CSV parser gets a chance to reject it.
**Status:** ✅ Fixed — added a 5 MB Multer file-size limit and a `.csv`
extension / `text/csv`-family MIME check, rejecting anything else with a
clear 400.

### 9. No global exception filter
**Problem:** Nothing normalized uncaught, non-`HttpException` errors (e.g.
a raw MySQL driver error), risking leaking internal detail back to the
client and producing inconsistent error shapes.
**Status:** ✅ Fixed — a global `AllExceptionsFilter` now catches
everything, logs the real error server-side, and returns a sanitized
`{statusCode, message}` — the actual message for known `HttpException`s,
a generic "Internal server error" for anything unexpected.

## Low

### 10. `qs` transitive dependency
Moderate advisory (array-limit bypass / ReDoS-adjacent).
**Status:** ✅ Fixed via `npm audit fix`.

### 11. No connection-pool sizing on either MySQL connection
Fine at current scale; worth revisiting if concurrent load grows.
**Status:** Not changed — noted for future revisit, not an active problem
today.

## Follow-ups deliberately not done in this pass

- **Server-side pagination end-to-end.** The backend fixes above cap the
  worst-case query size, but several frontend pages (Personnel, Assessment,
  PC Info categories) currently load a full dataset once and do
  client-side search/sort/stat-counting against it. Switching to real
  paged fetching means reworking those pages' data-loading and filtering
  logic too, not just the API — a deliberate, separate task rather than a
  silent side effect of a security audit.
- **Per-device-type strict DTOs** for Inventory Devices, if stronger
  field-level type-checking (not just protected-field stripping) is wanted
  later.

## Addendum (2026-09-06, later same day) — found while auditing VITALS-FORM

VITALS-FORM was cloned from an earlier copy of this backend. While
auditing its auth system against it directly, the same bug turned out to
still exist here too — it predates the audit above, which was scoped to
Hardware Inventory and didn't cover `health-reports`.

### 12. `GET /health-reports/bmi/:id/pdf` had no guard at all — Critical
**Problem:** Generated and served a full BMI health report PDF for
**any assessment ID**, to anyone, no token required. Verified live
against the actual running backend before fixing: `curl` with zero
auth headers returned `200` and a real PDF. This is the single worst
finding across both audits of this codebase — it required no
JWT-forging, no exploit technique, just incrementing a number in a URL.
**Status:** ✅ Fixed — new `HealthReportAccessGuard`
(`auth/guards/health-report-access.guard.ts`): a BMI-domain
admin/editor/viewer (or the literal super-admin) may view any report;
personnel may only view the report for an assessment that actually
belongs to them (checked against `bmi_assessments.personnel_id`, not
just "is this a valid personnel token"). Re-verified live after the fix:
the identical unauthenticated request now returns `401`; a real token
(via header or query param) returns `200`.

**Why a query param too, not just the Authorization header:** this
endpoint is used both via normal `fetch()` calls *and* as an
`<iframe src>` / `window.open()` target for in-page PDF previews
(`Assessment.tsx`, `Measurement.tsx`, `MyMeasurement.tsx`,
`MyRecords.tsx`) — a browser navigation like that can't attach a custom
header. The guard accepts the token via a `?token=` query parameter as a
fallback, and all 7 frontend call sites were updated to send it that
way. This is a deliberate trade-off (a token can end up in browser
history / server access logs) versus reworking every preview into a
fetch-blob-object-URL, which is a larger frontend change than this fix
covers — not done here, same as the identical decision made for
VITALS-FORM's copy of this same endpoint.
