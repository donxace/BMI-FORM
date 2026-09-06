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

// The literal super-admin sees every domain's logs; each domain's own
// "_admin" role sees just its own. Checked across all 5 session pairs,
// since whichever domain the user actually signed into is the one
// carrying the valid token.
export function findAuthLogsSession(): AuthLogsSession | null {
  for (const { tokenKey, roleKey, system, domainAdminRole } of DOMAIN_SESSION_KEYS) {
    const token = localStorage.getItem(tokenKey);
    const role = localStorage.getItem(roleKey);
    if (token && (role === "admin" || role === domainAdminRole)) {
      return { token, tokenKey, roleKey, role, system };
    }
  }
  return null;
}
