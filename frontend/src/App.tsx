import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router"
import { Container } from "lism-css/react"
import { AppShell } from './components/AppShell'
import { isShellPath, screenLabel } from './components/AppShell/nav'
import { clearToken } from './auth/token'
import { useIsAuthenticated } from './auth/useIsAuthenticated'

export function App() {
  const navigate = useNavigate()
  const isAuthenticated = useIsAuthenticated()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  function handleLogout() {
    clearToken()
    navigate({ to: '/login' })
  }

  // Wardrobe screens get the top bar + floating bottom nav.
  if (isShellPath(pathname)) {
    return (
      <AppShell subLabel={screenLabel(pathname)}>
        <Outlet />
      </AppShell>
    )
  }

  // Home and the auth routes (login/register/verify/magic-link): no bottom nav.
  return (
    <Container isContainer>
      {isAuthenticated && (
        <nav>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      )}
      <Outlet />
    </Container>
  )
}
