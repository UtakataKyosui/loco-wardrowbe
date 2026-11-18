import { useNavigate } from "@tanstack/react-router";
import { clearToken } from "./token";

export function useLogout() {
  const navigate = useNavigate();
  return () => {
    clearToken();
    void navigate({ to: "/login" });
  };
}
