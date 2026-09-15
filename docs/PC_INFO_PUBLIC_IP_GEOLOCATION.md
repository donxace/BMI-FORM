# PC Info: Public IP / ISP capture + geolocation map

Added 2026-09-15, local dev only — not deployed to the live VM (see
`docs/deployment/GCP-DEPLOYMENT.md`). Extends the PC Information System's
FOREN CSV import to capture a machine's public IP/ISP and show its
approximate location on the assessment detail page.

## What the new CSV rows look like

The FOREN export already puts host identity under a
`COMPUTER / NETWORK INFORMATION` section (see `foren-csv.util.ts`'s header
comment for the full format). This adds one more component under that same
section:

```
SECTION,CATEGORY,COMPONENT,PROPERTY,VALUE
COMPUTER / NETWORK INFORMATION,Network,WAN / Int,Public IP,122.112.125.234
COMPUTER / NETWORK INFORMATION,Network,WAN / Int,ISP,PLDT
```

## 1. Raw storage — no schema change needed

`security_assessment_findings` is a generic EAV-style table
(`section`/`category`/`component`/`property`/`value`, all plain
varchar/text columns — see `entities/security-assessment-finding.entity.ts`).
`parseForenCsv`/`toFindingRows` already pass every row through verbatim
regardless of what `CATEGORY`/`COMPONENT`/`PROPERTY` say. Confirmed by
importing a real "WAN / Int" / "Public IP" / "ISP" row and finding it
stored correctly with zero code changes — this part of the ask was already
true going in.

## 2. Summary columns + geolocation — what was actually added

The **summary** row (`security_assessments`, one per machine) is a fixed set
of typed columns pulled out of the raw findings via
`buildHostIdentity`/`buildAssessmentSummary` — that's where `hostname`,
`ip_address`, `mac_address`, etc. already live, and where "Public IP" and
"ISP" belong too, since the Identity card on the assessment detail page
reads from these summary columns, not the raw findings table.

Added via `database/migrations/2026-09-15_add_public_ip_geolocation.sql`
(applied to the local dev DB directly, and folded into
`database/itms_inventech.sql` so a fresh reseed reproduces it):

| Column | Purpose |
|---|---|
| `public_ip` | From the CSV's WAN/Int "Public IP" row. |
| `isp` | From the CSV's WAN/Int "ISP" row — overwritten by the geolocation lookup's ISP field when that lookup succeeds (usually more reliable than what the OS reports); kept as-is otherwise. |
| `public_ip_lat` / `public_ip_lon` | Geolocation result, decimal(9,6). |
| `public_ip_city` / `public_ip_region` / `public_ip_country` | Geolocation result. |
| `public_ip_geo_looked_up_at` | Stamped whenever a lookup is *attempted* (success or not) — there's no refresh/retry path, so this just records when, not a cache-invalidation key. |

## 3. Geolocation provider: ip-api.com

Chosen over the other two options named in the ask:
- **ipinfo.io** — free tier needs an account token for anything beyond a
  very small daily quota.
- **MaxMind GeoLite2** — needs a license key plus a local `.mmdb` file kept
  updated on a schedule; too much operational weight for one field on one
  page of an internal tool.

**ip-api.com**: no signup, no key, JSON response, 45 requests/minute on the
free tier — comfortably enough for one lookup per CSV import (this isn't a
bulk/high-volume endpoint). The one real tradeoff: the free tier is HTTP
only (HTTPS needs a paid plan). Since this is a server-to-server lookup of
a non-secret value (a public IP, not a credential), not a browser request,
that's an acceptable tradeoff for a small internal tool — noted here so
it's a documented choice, not an oversight.

Implementation: `backend/src/pc-info/ip-geolocation.util.ts` (and a
mirrored copy in `backend/scripts/import-security-assessment.js`, matching
that script's existing "keep in sync with foren-csv.util.ts" convention).
Validates the IP looks like a plausible public IPv4 (rejects
private/loopback/link-local ranges) before spending an API call on it,
5-second timeout via `AbortController`, and **never throws** — a failed or
slow lookup returns `null` and the import proceeds without geo data, same
"informational only" convention already used for the CSV import's
device-serial soft-match in `PcInfoService.importAssessmentCsv`.

## 4. Import-time, not display-time

Chosen as instructed: the lookup runs once, inside
`PcInfoService.importAssessmentCsv` (and the CLI script's `main()`),
right before the `security_assessments` row is saved, and the result is
stored alongside it. The assessment detail page just reads the cached
columns — no API call, no rate-limit exposure, no added latency, on every
page view.

## 5. Map rendering: OpenStreetMap embed iframe (not Leaflet)

Used the official `https://www.openstreetmap.org/export/embed.html` embed
endpoint (an `<iframe>`, `PcInfoAssessmentDetail.tsx`'s new "Public IP
Location" card) instead of Leaflet + react-leaflet:

- No new npm dependency, no Leaflet CSS import, no default-marker-icon
  asset-path workaround (a well-known Leaflet-in-a-bundler gotcha).
- It's OSM's own first-party embed, not a third-party static-tile service,
  so no separate API key or usage policy to track beyond OSM's own.
- A "Open larger map ↗" link to the full openstreetmap.org site (same
  coordinates) covers the interactivity Leaflet would have added — panning
  a tiny embedded frame on a detail page isn't a real requirement here.

The card only renders when `public_ip_lat`/`public_ip_lon` are non-null,
same "hide, don't dead-end" convention as the rest of this page (e.g. tab
counts, the "no data recorded" empty states). Its caption also flags the
data as approximate — IP geolocation is typically city-level at best.

**Note:** `public_ip_lat`/`public_ip_lon` come back from the API as
strings (TypeORM's mysql driver returns `decimal` columns as strings by
default — no `decimalNumbers` flag set on this connection, same as
`duration_seconds` elsewhere on this page). The frontend coerces with
`Number(...)` before using them in the embed URL's bbox arithmetic —
string concatenation via `+` would have silently produced a broken URL
otherwise.

## Verified

- Imported a test CSV (`Public IP: 8.8.8.8`, `ISP: Google LLC`) through
  both the in-app `POST /pc-info/import` endpoint and the CLI script —
  both correctly resolved to Ashburn, Virginia, United States and cached
  it on the row.
- `backend`: `tsc --noEmit` clean.
- `frontend`: `tsc -b --noEmit` — no new errors (3 pre-existing, unrelated
  recharts `Tooltip` typing errors remain in `InventoryDashboard.tsx` /
  `PcInfoDashboard.tsx`, already documented in
  `docs/deployment/GCP-DEPLOYMENT.md`'s "Known issues").
- Test rows deleted after verification.

## Not done (scope)

- **Not deployed to the live VM** (`bmi.34-9-180-120.sslip.io`) — local
  dev only, per explicit instruction. The live VM's `itms_inventech`
  schema does not have these columns yet.
- No backfill for existing assessment rows imported before this change —
  their `public_ip`/`isp`/geo columns are simply `NULL` until re-imported.
