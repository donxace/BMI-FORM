import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoute() {
  const token = localStorage.getItem("authToken");
  const role = localStorage.getItem("userRole");
  const location = useLocation();

  // Admin routes require an admin-role token
  if (!token || role !== "admin") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}