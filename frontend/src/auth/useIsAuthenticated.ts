import { useEffect, useState } from "react";
import { getToken } from "./token";

// The token lives in localStorage, so the server always renders "signed out".
// Reading it after mount keeps the first client render identical to the server's.
export function useIsAuthenticated(): boolean | null {
  const [state, setState] = useState<boolean | null>(null);
  useEffect(() => setState(getToken() !== null), []);
  return state;
}
