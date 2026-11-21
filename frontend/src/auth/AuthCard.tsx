import type { ReactNode } from "react";
import "./auth.css";

/** Centers a Clerk sign-in / sign-up component on the page. */
export function AuthPage({ children }: { children: ReactNode }) {
  return (
    <main id="main" tabIndex={-1} className="c--authPage" lang="en">
      {children}
    </main>
  );
}
