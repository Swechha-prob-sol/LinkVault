import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', label: 'Links', icon: 'link' },
  { to: '/bio', label: 'Bio', icon: 'user' },
  { to: '/analytics', label: 'Analytics', icon: 'chart' },
  { to: '/settings', label: 'Settings', icon: 'gear' },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen dark:bg-surface-950 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r p-5 md:flex transition-colors duration-300 dark:border-white/[0.06] dark:bg-surface-900/60 border-purple-200/30 bg-white/40">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white">
            LV
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">LinkVault</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-brand-500/10 text-brand-300 ring-1 ring-inset ring-brand-500/20'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="mx-1 mb-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors duration-150 hover:bg-white/[0.04] hover:text-slate-100"
        >
          {theme === 'dark' ? (
            <>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 1.78a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zm2.828 2.828a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zm2.828 2.829a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM10 7a3 3 0 100 6 3 3 0 000-6zm-4.22-1.78a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414L5.78 5.22a1 1 0 010-1.414zm2.828-2.829a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM10 18a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm4.22-1.78a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zm2.828-2.828a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM5.78 14.22a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zm-2.829-2.828a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span>Dark Mode</span>
            </>
          )}
        </button>

        {/* Profile section */}
        <div className="mt-auto border-t border-white/[0.06] pt-4">
          <div className="mb-3 flex items-center gap-3 px-2">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} className="h-9 w-9 rounded-full object-cover" onError={(e) => e.target.style.display = 'none'} />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-700 text-sm font-semibold text-slate-200">
                {user?.username?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-100">{user?.username}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="btn-secondary w-full text-sm"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        {/* Mobile Header */}
        <header className="flex items-center justify-between border-b px-4 py-3 md:hidden transition-colors duration-300 dark:border-white/[0.06] dark:bg-surface-900/40 border-purple-200/30 bg-white/40">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white">
              LV
            </div>
            <span className="text-base font-semibold text-white">LinkVault</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-slate-400 hover:text-slate-100"
            >
              ☰
            </button>
          </div>
        </header>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="border-b px-4 py-3 md:hidden transition-colors duration-300 dark:border-white/[0.06] dark:bg-surface-900/60 border-purple-200/30 bg-white/40">
            <nav className="space-y-2">
              {navItems.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-500/10 text-brand-300'
                        : 'text-slate-400 hover:bg-white/[0.04]'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
            <button
              type="button"
              onClick={logout}
              className="btn-secondary w-full text-sm mt-3"
            >
              Sign out
            </button>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
