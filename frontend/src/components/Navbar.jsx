import { Link, NavLink, useLocation } from 'react-router-dom'

const Navbar = () => {
  const location = useLocation()
  const token = localStorage.getItem('auth_token')
  const role = localStorage.getItem('auth_role')

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_role')
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-20 bg-surface/80 backdrop-blur border-b border-border">
      <nav className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="text-lg font-semibold tracking-tight text-textPrimary">
          PreOrderFood
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {!token && (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md border border-transparent hover:border-border ${
                    isActive ? 'text-primary' : 'text-textSecondary'
                  }`
                }
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md bg-primary text-white hover:bg-primary/90`
                }
              >
                Register
              </NavLink>
            </>
          )}
          {token && (
            <>
              {role === 'customer' && (
                <>
                  <NavLink
                    to="/customer/home"
                    className={({ isActive }) =>
                      `px-3 py-1.5 rounded-md ${
                        isActive ? 'text-primary' : 'text-textSecondary'
                      }`
                    }
                  >
                    Restaurants
                  </NavLink>
                  <NavLink
                    to="/customer/orders"
                    className={({ isActive }) =>
                      `px-3 py-1.5 rounded-md ${
                        isActive ? 'text-primary' : 'text-textSecondary'
                      }`
                    }
                  >
                    Orders
                  </NavLink>
                  <NavLink
                    to="/customer/profile"
                    className={({ isActive }) =>
                      `px-3 py-1.5 rounded-md ${
                        isActive ? 'text-primary' : 'text-textSecondary'
                      }`
                    }
                  >
                    Profile
                  </NavLink>
                </>
              )}
              {role === 'restaurant' && (
                <>
                  <NavLink
                    to="/restaurant/dashboard"
                    className={({ isActive }) =>
                      `px-3 py-1.5 rounded-md ${
                        isActive ? 'text-primary' : 'text-textSecondary'
                      }`
                    }
                  >
                    Dashboard
                  </NavLink>
                  <NavLink
                    to="/restaurant/profile"
                    className={({ isActive }) =>
                      `px-3 py-1.5 rounded-md ${
                        isActive ? 'text-primary' : 'text-textSecondary'
                      }`
                    }
                  >
                    Profile
                  </NavLink>
                </>
              )}
              {role === 'admin' && (
                <NavLink
                  to="/admin/dashboard"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-md ${
                      isActive ? 'text-primary' : 'text-textSecondary'
                    }`
                  }
                >
                  Admin
                </NavLink>
              )}
              <button
                onClick={handleLogout}
                className="ml-2 px-3 py-1.5 rounded-md border border-border text-textSecondary hover:bg-slate-50"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Navbar
