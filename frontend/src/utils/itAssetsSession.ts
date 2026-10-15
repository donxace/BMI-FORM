// IT Asset Management = Hardware Inventory + PC Information System behind
// one sign-in (backend: auth/it-assets.ts). The combined token is stored
// under BOTH parts' existing session keys, so every Inventory and PC Info
// page keeps reading the keys it always has. Each part gets the account's
// own role for that part (or nothing, if it has no access there), so the
// existing per-page role checks still apply unchanged.

export const IT_ASSETS_SYSTEM = "itam";
export const IT_ASSETS_LOGIN_PATH = "/it-assets/login";

export const IT_ASSETS_PARTS = {
  inventory: { tokenKey: "inventoryAuthToken", roleKey: "inventoryUserRole" },
  pcinfo: { tokenKey: "pcInfoAuthToken", roleKey: "pcInfoUserRole" },
} as const;

export type ItAssetsPart = keyof typeof IT_ASSETS_PARTS;

export const INVENTORY_ROLES = ["inventory_admin", "inventory_editor", "inventory_viewer"];
export const PCINFO_ROLES = ["pcinfo_admin", "pcinfo_editor", "pcinfo_viewer"];

type LoginResponse = {
  token?: string;
  user?: { role?: string; roles?: Partial<Record<ItAssetsPart, string | null>> };
};

export function storeItAssetsSession(data: LoginResponse) {
  if (!data.token) return;
  const isSuperAdmin = data.user?.role === "admin";

  for (const [part, keys] of Object.entries(IT_ASSETS_PARTS) as [ItAssetsPart, (typeof IT_ASSETS_PARTS)[ItAssetsPart]][]) {
    const role = isSuperAdmin ? "admin" : data.user?.roles?.[part] ?? null;
    if (role) {
      localStorage.setItem(keys.tokenKey, data.token);
      localStorage.setItem(keys.roleKey, role);
    } else {
      localStorage.removeItem(keys.tokenKey);
      localStorage.removeItem(keys.roleKey);
    }
  }
}

export function clearItAssetsSession() {
  for (const keys of Object.values(IT_ASSETS_PARTS)) {
    localStorage.removeItem(keys.tokenKey);
    localStorage.removeItem(keys.roleKey);
  }
}

/** The signed-in account's role in each part, or null where it has none. */
export function getItAssetsAccess(): Record<ItAssetsPart, string | null> {
  const read = (part: ItAssetsPart) => {
    const { tokenKey, roleKey } = IT_ASSETS_PARTS[part];
    return localStorage.getItem(tokenKey) ? localStorage.getItem(roleKey) : null;
  };
  return { inventory: read("inventory"), pcinfo: read("pcinfo") };
}

export function isItAssetsAdmin(part: ItAssetsPart): boolean {
  const role = getItAssetsAccess()[part];
  return role === "admin" || role === `${part}_admin`;
}
