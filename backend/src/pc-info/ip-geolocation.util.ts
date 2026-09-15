// Resolves a public IPv4 address to an approximate lat/lon (+ city/region/
// country) via ip-api.com — free, no API key, 45 req/min on the free tier
// (http only on that tier; https requires a paid plan, but this is a
// server-to-server lookup of a non-secret value, not a credential, so the
// tradeoff is acceptable for a small internal tool). Chosen over ipinfo.io
// (needs a token for anything beyond a very small daily quota) and MaxMind
// GeoLite2 (needs a license key + a local database file to keep updated —
// too much operational weight for one field on one page).
//
// Called once, at CSV import time (PcInfoService.importAssessmentCsv), and
// the result is cached on the security_assessments row — see
// database/migrations/2026-09-15_add_public_ip_geolocation.sql. Import-time
// (not display-time) means the assessment detail page never re-hits this
// API on every view and never blocks on it after the initial import.
export type IpGeolocation = {
  lat: number;
  lon: number;
  city: string | null;
  region: string | null;
  country: string | null;
};

const LOOKUP_TIMEOUT_MS = 5000;

// Skips the API call entirely for addresses that can never resolve to a
// real-world location (private/loopback/link-local ranges) — the CSV's
// regular "IP Address" field is usually a private LAN address, and a
// malformed "Public IP" value shouldn't cost an API call.
function isLikelyPublicIpv4(ip: string): boolean {
  const match = ip.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return false;
  const octets = match.slice(1, 5).map(Number);
  if (octets.some((n) => n > 255)) return false;
  const [a, b] = octets;
  if (a === 10) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 0) return false;
  return true;
}

// Returns null (never throws) on any failure — a bad/slow lookup is
// informational-only and must never fail the CSV import that triggered it,
// same convention as the device serial-number soft-match in
// PcInfoService.importAssessmentCsv.
export async function lookupIpGeolocation(ip: string | null): Promise<IpGeolocation | null> {
  if (!ip || !isLikelyPublicIpv4(ip)) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);

  try {
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,lat,lon,city,regionName,country`,
      { signal: controller.signal },
    );
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== 'success') return null;

    return {
      lat: data.lat,
      lon: data.lon,
      city: data.city || null,
      region: data.regionName || null,
      country: data.country || null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
