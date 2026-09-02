import { Navigate, Outlet } from "react-router-dom";

/*
 * Gate for the Security & Environment domain. Deliberately checks a
 * separate token/role than ProtectedRoute (BMI) — signing into one
 * domain does not sign you into the other, even though both still
 * validate against the same backend user table.
 */
export default function SecurityProtectedRoute() {
  const token = localStorage.getItem("securityAuthToken");
  const role = localStorage.getItem("securityUserRole");

  if (!token || role !== "admin") {
    return <Navigate to="/security/login" replace />;
  }

  return <Outlet />;
}
