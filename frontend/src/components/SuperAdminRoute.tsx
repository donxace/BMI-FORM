import { Navigate, Outlet } from "react-router-dom";
import { findAuthLogsSession } from "../utils/adminSession";

/*
 * Gate for the Auth Logs page. Unlike RoleProtectedRoute — which checks
 * one specific domain's token/role pair — this checks across all 5
 * domains' session keys, since either the literal 'admin' account or
 * that domain's own "_admin" role can land here, and the admin account
 * specifically can be signed in through any one of the 5 domain logins.
 * The backend still scopes what data comes back based on which role
 * actually made the request — this only gates whether the page loads.
 */
export default function SuperAdminRoute() {
  const session = findAuthLogsSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
