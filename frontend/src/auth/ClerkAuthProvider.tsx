import { ClerkProvider } from "@clerk/clerk-react";
import type { ReactNode } from "react";

// Clerk's publishable key is public by design. `vite.config.ts` inlines it at
// build time from `CLERK_PUBLISHABLE_KEY`.
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

export function ClerkAuthProvider({ children }: { children: ReactNode }) {
  if (!publishableKey) {
    return (
      <main id="main" tabIndex={-1} role="alert" style={{ padding: "1.25rem" }} lang="en">
        <h1>Clerk is not configured</h1>
        <p>
          Set <code>CLERK_PUBLISHABLE_KEY</code> (Clerk dashboard → API keys) and rebuild the
          frontend.
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
