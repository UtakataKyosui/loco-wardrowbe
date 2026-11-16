import { Navigate, Outlet } from "@tanstack/react-router";
import { useIsAuthenticated } from "./useIsAuthenticated";

export function RequireAuth() {
  const isAuthenticated = useIsAuthenticated();

  if (isAuthenticated === null) {
    return null;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
