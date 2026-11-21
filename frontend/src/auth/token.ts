// Clerk keeps the session and refreshes its short-lived token; ask it for the
// current one on every request instead of storing a copy.
declare global {
  interface Window {
    Clerk?: { session?: { getToken: () => Promise<string | null> } | null };
  }
}

/** The signed-in user's session token, or `null` when signed out (or on the server). */
export async function getToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  return (await window.Clerk?.session?.getToken()) ?? null;
}
