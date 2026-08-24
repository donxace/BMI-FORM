import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const token = localStorage.getItem("authToken");

  // If no token exists, redirect directly to /login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Token exists, render the requested child route
  return <Outlet />;
}