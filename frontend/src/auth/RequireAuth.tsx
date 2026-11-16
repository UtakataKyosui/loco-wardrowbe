import { Navigate, Outlet } from "@tanstack/react-router";
import { getToken } from "./token";

export function RequireAuth() {
  if (getToken() === null) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
