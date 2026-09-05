import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoute() {
  const token = localStorage.getItem("authToken");
  const role = localStorage.getItem("userRole");
  const location = useLocation();

  // Admin routes require one of the BMI domain roles (or the legacy
  // unrestricted 'admin' super-role), mirrored from AdminAuthGuard's
  // backend check.
  const bmiRoles = ["bmi_admin", "bmi_editor", "bmi_viewer"];
  if (!token || (role !== "admin" && !(role && bmiRoles.includes(role)))) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}