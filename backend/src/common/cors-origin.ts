// This app is deployed as a LAN tool — real usage means multiple physical
// machines (admin PCs, kiosks) reaching the API by their own local IP,
// not a single known domain, so a fixed origin string isn't enough.
// This still rejects public-internet origins instead of the previous
// `origin: true`, which reflected literally anything.
const PRIVATE_LAN_HOST = /^(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})$/;

function isAllowedOrigin(origin: string, extra: string[]): boolean {
  if (extra.includes(origin)) {
    return true;
  }

  try {
    const { hostname } = new URL(origin);
    return PRIVATE_LAN_HOST.test(hostname);
  } catch {
    return false;
  }
}

export function corsOriginCallback(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) {
  // No Origin header at all — same-origin requests, curl, the LAN agent
  // scripts, server-to-server calls. Nothing to check against.
  if (!origin) {
    callback(null, true);
    return;
  }

  const extra = (process.env.CORS_EXTRA_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (isAllowedOrigin(origin, extra)) {
    callback(null, true);
    return;
  }

  callback(new Error(`Origin "${origin}" is not allowed by CORS.`));
}
