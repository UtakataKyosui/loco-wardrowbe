import { Link, Outlet, useNavigate } from "@tanstack/react-router"
import { clearToken, getToken } from './auth/token'

export function App() {
  const navigate = useNavigate()
  const isAuthenticated = getToken() !== null

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
