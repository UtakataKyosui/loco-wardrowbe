import { Outlet, useRouterState } from "@tanstack/react-router";
import { Button } from "@utakata-ui/react";
import { Container } from "lism-css/react";
import { RouteAnnouncer } from "./components/a11y/RouteAnnouncer";
import { AppShell } from "./components/AppShell";
import { isShellPath, screenLabel } from "./components/AppShell/nav";
import { useIsAuthenticated } from "./auth/useIsAuthenticated";
import { useLogout } from "./auth/useLogout";

export function App() {
  const handleLogout = useLogout();
  const isAuthenticated = useIsAuthenticated();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Wardrobe screens get the top bar + floating bottom nav.
  if (isShellPath(pathname)) {
    return (
      <>
        <RouteAnnouncer />
        <AppShell subLabel={screenLabel(pathname)}>
          <Outlet />
        </AppShell>
      </>
    );
  }

  // Home and the auth routes (login/register/verify/magic-link): no bottom nav.
  return (
    <Container isContainer>
      <RouteAnnouncer />
      {isAuthenticated && (
        <nav aria-label="アカウント">
          <Button type="button" variant="ghost" lang="en" onClick={handleLogout}>
            Logout
          </Button>
        </nav>
      )}
      <Outlet />
    </Container>
  );
}
