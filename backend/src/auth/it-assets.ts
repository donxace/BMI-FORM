// IT Asset Management is the combined Hardware Inventory + PC Information
// System. It is still two systems underneath (separate tables, separate
// per-system roles in user_roles, separate registration keys); only the
// sign-in and the website are shared. A combined sign-in uses this
// `system` value and gets a token carrying the account's role in each part.
export const IT_ASSETS_SYSTEM = 'itam';
export const IT_ASSETS_PARTS = ['inventory', 'pcinfo'];

// 'inventory_admin' -> 'inventory', 'pcinfo_viewer' -> 'pcinfo'
export function systemOfRole(role: string): string {
  return role.split('_')[0];
}
