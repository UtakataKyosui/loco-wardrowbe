import { Link, Outlet, useNavigate } from "@tanstack/react-router"
import { clearToken } from './auth/token'
import { useIsAuthenticated } from './auth/useIsAuthenticated'

export function App() {
  const navigate = useNavigate()
  const isAuthenticated = useIsAuthenticated()

  function handleLogout() {
    clearToken()
    navigate({ to: '/login' })
  }

  return (
    <div>
      <nav>
        <Link to="/">Home</Link>
        {isAuthenticated && (
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        )}
      </nav>
      <Outlet />
    </div>
  )
}
