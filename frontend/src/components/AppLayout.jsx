import { useState } from 'react';
import { Menu, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="app-layout">

      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-20 md:hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setOpen(false)}
        />
      )}

      <Sidebar isOpen={open} onClose={() => setOpen(false)} />

      {/* Main */}
      <div className="app-main">

        {/* Mobile top bar */}
        <div className="topbar md:hidden">
          <button
            onClick={() => setOpen(true)}
            className="icon-btn mr-3"
            style={{ color: 'var(--text-2)' }}
          >
            <Menu size={20} />
          </button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Link2 size={14} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, color: 'var(--text-1)' }}>
              Snipli<span style={{ color: 'var(--accent)' }}>.</span>
            </span>
          </Link>
        </div>

        {/* Page content */}
        <main style={{ flex: 1, padding: '28px 24px', maxWidth: 1100, width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
