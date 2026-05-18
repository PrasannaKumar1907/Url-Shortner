import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, Link2, LayoutDashboard, Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 navbar-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
            <Link2 size={16} className="text-white" />
          </div>
          <span className="gradient-text">Snipli</span>
        </Link>

        <div className="flex items-center gap-2">
          {user && (
            <Link
              to="/dashboard"
              className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
            >
              <LayoutDashboard size={15} />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          )}

          {/* Theme toggle */}
          <button onClick={toggle} className="theme-toggle" title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {user && (
            <>
              <div className="flex items-center gap-2 pl-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm t3 max-w-[8rem] truncate">
                  {user.name || user.email}
                </span>
              </div>
              <button onClick={handleLogout} className="nav-link danger">
                <LogOut size={15} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
