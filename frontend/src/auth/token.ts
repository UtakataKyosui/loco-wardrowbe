const TOKEN_KEY = "auth_token";

// TanStack Start renders on the server too, where `window` does not exist.
function storage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function getToken(): string | null {
  return storage()?.getItem(TOKEN_KEY) ?? null;
}

export function setToken(t: string): void {
  storage()?.setItem(TOKEN_KEY, t);
}

export function clearToken(): void {
  storage()?.removeItem(TOKEN_KEY);
}
