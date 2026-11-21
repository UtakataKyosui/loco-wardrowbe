import { ClerkProvider } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

// Clerk's publishable key is public by design. A key inlined at build time
// (`vite.config.ts`, from `CLERK_PUBLISHABLE_KEY`) wins; otherwise the backend
// serves the one from its own config at `/config.json`.
const buildTimeKey = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined) ?? "";

async function fetchPublishableKey(signal: AbortSignal): Promise<string> {
  try {
    const response = await fetch("/config.json", { signal });
    if (!response.ok) return "";
    const config = (await response.json()) as { clerkPublishableKey?: unknown };
    return typeof config.clerkPublishableKey === "string" ? config.clerkPublishableKey : "";
  } catch {
    return "";
  }
}

export function ClerkAuthProvider({ children }: { children: ReactNode }) {
  // `null` while the key is still being fetched.
  const [publishableKey, setPublishableKey] = useState<string | null>(
    buildTimeKey ? buildTimeKey : null,
  );

  useEffect(() => {
    if (buildTimeKey) return;
    const controller = new AbortController();
    void fetchPublishableKey(controller.signal).then((key) => {
      if (!controller.signal.aborted) setPublishableKey(key);
    });
    return () => controller.abort();
  }, []);

  if (publishableKey === null) return null;

  if (!publishableKey) {
    return (
      <main id="main" tabIndex={-1} role="alert" style={{ padding: "1.25rem" }} lang="en">
        <h1>Clerk is not configured</h1>
        <p>
          Set <code>CLERK_PUBLISHABLE_KEY</code> (Clerk dashboard → API keys) on the server.
        </p>
      </main>
    );
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl="/login"
      signUpUrl="/register"
      signInFallbackRedirectUrl="/closet"
      signUpFallbackRedirectUrl="/closet"
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}
