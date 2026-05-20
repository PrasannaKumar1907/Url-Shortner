import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Link2, LayoutDashboard, User, Settings, LogOut,
  Sun, Moon, X, BarChart2, Globe,
} from 'lucide-react';

const NAV = [
  { label: 'Links',     icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Analytics', icon: BarChart2,       to: null,        note: 'click any link' },
  { label: 'Bio Page',  icon: Globe,           to: 'bio' },
  { label: 'Account',   icon: Settings,        to: '/account' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate   = useNavigate();
  const location   = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (to) => {
    if (!to) return false;
    if (to === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(to);
  };

  const bioPATH = `/bio/${encodeURIComponent(user?.name || '')}`;

  return (
    <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>

      {/* ── Logo ── */}
      <div className="flex items-center justify-between px-5 py-5 shrink-0">
        <Link to="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--sidebar-active-bar)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Link2 size={16} color="#fff" />
          </div>
          <span className="brand-text">Snipli<span className="brand-dot">.</span></span>
        </Link>
        {/* Mobile close */}
        <button
          onClick={onClose}
          className="md:hidden icon-btn"
          style={{ color: 'var(--sidebar-text)' }}
        >
          <X size={18} />
        </button>
      </div>

      <hr className="divider" style={{ borderColor: 'var(--sidebar-border)' }} />

      {/* ── Navigation ── */}
      <nav className="flex-1 px-0 py-3 overflow-y-auto">

        <p className="section-label" style={{ padding: '8px 22px 6px', color: 'var(--sidebar-text)', opacity: 0.5 }}>
          Main
        </p>

        {NAV.map(({ label, icon: Icon, to, note }) => {
          const resolvedTo = label === 'Bio Page' ? bioPATH : to;
          const active = label === 'Bio Page'
            ? location.pathname.startsWith('/bio')
            : isActive(to);

          if (!to && label === 'Analytics') {
            return (
              <div key={label}
                className="sidebar-item"
                style={{ opacity: 0.45, cursor: 'default', userSelect: 'none' }}
              >
                <Icon size={17} />
                <span>{label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.7 }}>per link</span>
              </div>
            );
          }

          return (
            <Link
              key={label}
              to={resolvedTo}
              className={`sidebar-item ${active ? 'active' : ''}`}
              onClick={onClose}
            >
              <Icon size={17} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom ── */}
      <div className="shrink-0 pb-4">
        <hr className="divider" style={{ borderColor: 'var(--sidebar-border)', marginBottom: 12 }} />

        {/* Theme toggle */}
        <div className="flex items-center justify-between px-5 mb-3">
          <span style={{ fontSize: 13, color: 'var(--sidebar-text)' }}>
            {isDark ? 'Dark mode' : 'Light mode'}
          </span>
          <button onClick={toggle} className="theme-toggle" title="Toggle theme">
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        {/* User row */}
        <div className="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="avatar" style={{ width: 34, height: 34, fontSize: 13, borderRadius: 8 }}>
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 13, fontWeight: 600, color: '#E5E7EB', lineHeight: 1.2 }}
               className="truncate">
              {user?.name || 'User'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--sidebar-text)' }} className="truncate">
              {user?.email}
            </p>
          </div>
          <button onClick={handleLogout} title="Sign out"
            className="icon-btn" style={{ color: 'var(--sidebar-text)', padding: 5 }}>
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
