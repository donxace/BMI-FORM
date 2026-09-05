import { Navigate, Outlet } from "react-router-dom";

export default function PersonnelProtectedRoute() {
  const token = localStorage.getItem("personnelAuthToken");
  const role = localStorage.getItem("personnelUserRole");

  // Personnel self-service routes require a personnel-role token
  if (!token || role !== "personnel") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
