import { Navigate, Outlet } from "react-router-dom";
import { getItAssetsAccess, IT_ASSETS_LOGIN_PATH } from "../utils/itAssetsSession";

/*
 * Gate for pages that belong to IT Asset Management as a whole (the
 * combined overview) rather than to one of its halves: any account with
 * a Hardware Inventory OR a PC Information System role may enter. The
 * half-specific pages keep their own RoleProtectedRoute.
 */
export default function ItAssetsProtectedRoute() {
  const access = getItAssetsAccess();

  if (!access.inventory && !access.pcinfo) {
    return <Navigate to={IT_ASSETS_LOGIN_PATH} replace />;
  }

  return <Outlet />;
}
