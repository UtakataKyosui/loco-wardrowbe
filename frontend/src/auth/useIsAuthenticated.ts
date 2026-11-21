import { useAuth } from "@clerk/clerk-react";

/** `null` while Clerk is loading, so the first client render matches the server's. */
export function useIsAuthenticated(): boolean | null {
  const { isLoaded, isSignedIn } = useAuth();
  return isLoaded ? isSignedIn : null;
}
