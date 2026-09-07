// The literal 'admin' super-role can sign in through ANY of the 5
// domain logins (it bypasses every domain-specific role check on the
// backend), and each domain stores its session under its own
// token/role key pair. Auth Logs is a cross-domain, super-admin-only
// feature, so it can't just check one hardcoded pair (e.g. BMI's) —
// it has to look across all 5 for whichever one is actually carrying
// the admin session right now.
export const DOMAIN_SESSION_KEYS = [
  { tokenKey: "authToken", roleKey: "userRole", system: "bmi", domainAdminRole: "bmi_admin" },
  { tokenKey: "inventoryAuthToken", roleKey: "inventoryUserRole", system: "inventory", domainAdminRole: "inventory_admin" },
  { tokenKey: "pcInfoAuthToken", roleKey: "pcInfoUserRole", system: "pcinfo", domainAdminRole: "pcinfo_admin" },
  { tokenKey: "intrusionAuthToken", roleKey: "intrusionUserRole", system: "intrusion", domainAdminRole: "intrusion_admin" },
  { tokenKey: "environmentAuthToken", roleKey: "environmentUserRole", system: "environment", domainAdminRole: "environment_admin" },
];

export type AuthLogsSession = {
  token: string;
  tokenKey: string;
  roleKey: string;
  role: string;
  /** 'bmi' | 'inventory' | 'pcinfo' | 'intrusion' | 'environment' */
  system: string;
};

// Which domain(s)' Auth Logs page a given path belongs to — shared by
// AuthLogs.tsx (to scope the data it requests) and findAuthLogsSession
// below (to pick the matching session first, see its own comment for why
// that matters). Kept in one place so the two can never drift apart.
export function getPageSystems(pathname: string): string[] {
  if (pathname.startsWith("/inventory")) return ["inventory"];
  if (pathname.startsWith("/pc-info")) return ["pcinfo"];
  if (pathname.startsWith("/security")) return ["intrusion", "environment"];
  return ["bmi"];
}

// The literal super-admin sees every domain's logs; each domain's own
// "_admin" role sees just its own. A browser can easily be carrying more
// than one domain's session at once (nothing forces logging out of one
// domain before signing into another), so scanning all 5 in a fixed
// order would silently return the wrong one whenever an unrelated
// domain's token happens to rank first - e.g. still being signed into
// Inventory would hijack a visit to PC Info's Auth Logs page. Passing
// the current page's own system(s) makes it check those pairs first;
// only falls through to the other domains if none of the preferred ones
// have a valid session (e.g. the bare /auth-logs route has no single
// preferred domain).
export function findAuthLogsSession(preferredSystems?: string[]): AuthLogsSession | null {
  const orderedKeys = preferredSystems?.length
    ? [
        ...DOMAIN_SESSION_KEYS.filter((k) => preferredSystems.includes(k.system)),
        ...DOMAIN_SESSION_KEYS.filter((k) => !preferredSystems.includes(k.system)),
      ]
    : DOMAIN_SESSION_KEYS;

  for (const { tokenKey, roleKey, system, domainAdminRole } of orderedKeys) {
    const token = localStorage.getItem(tokenKey);
    const role = localStorage.getItem(roleKey);
    if (token && (role === "admin" || role === domainAdminRole)) {
      return { token, tokenKey, roleKey, role, system };
    }
  }
  return null;
}
