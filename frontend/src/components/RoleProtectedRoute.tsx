import { Navigate, Outlet } from "react-router-dom";

type RoleProtectedRouteProps = {
  /** Domain role(s) this route accepts, e.g. "inventory_admin", or
   *  ["inventory_admin", "inventory_viewer"] when a domain has both a
   *  full-access and a read-only role. */
  requiredRole: string | string[];
  /** localStorage key holding this domain's JWT. */
  tokenKey: string;
  /** localStorage key holding this domain's stored role. */
  roleKey: string;
  /** Where to send an unauthenticated visitor. */
  loginPath: string;
};

/*
 * Generic per-domain auth gate. Each of the 5 landing-page systems
 * (BMI, Intrusion Detection, Environment Monitoring, Hardware
 * Inventory, PC Information System) gets its own instance of this with
 * its own role/token/role storage keys, so signing into one domain
 * never signs you into another. The legacy 'admin' role is still
 * accepted everywhere — it's an unrestricted super-role kept for the
 * one pre-existing account, mirrored from AdminAuthGuard's backend
 * check.
 */
export default function RoleProtectedRoute({
  requiredRole,
  tokenKey,
  roleKey,
  loginPath,
}: RoleProtectedRouteProps) {
  const token = localStorage.getItem(tokenKey);
  const role = localStorage.getItem(roleKey);
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  if (!token || (role !== "admin" && !(role && allowedRoles.includes(role)))) {
    return <Navigate to={loginPath} replace />;
  }

  return <Outlet />;
}
