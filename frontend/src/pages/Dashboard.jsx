import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Link2, TrendingUp, MousePointer, Download, Layers } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import AppLayout from '../components/AppLayout';
import UrlCard from '../components/UrlCard';
import CreateUrlModal from '../components/CreateUrlModal';
import BulkShortenModal from '../components/BulkShortenModal';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const BASE_URL = import.meta.env.VITE_BASE_URL || window.location.origin.replace('5173', '5000');

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div className="stat-icon" style={{ background: bg }}>
          <Icon size={18} style={{ color }} />
        </div>
        <div>
          <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1 }}>{value}</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [urls, setUrls]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showBulk, setShowBulk]   = useState(false);
  const [search, setSearch]       = useState('');
  const [activeTag, setActiveTag] = useState(null);

  const fetchUrls = useCallback(async () => {
    try {
      const { data } = await api.get('/urls');
      setUrls(data.urls || []);
    } catch { toast.error('Failed to load links'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUrls(); }, [fetchUrls]);

  const handleCreated = (newUrls) => {
    const list = Array.isArray(newUrls) ? newUrls : [newUrls];
    setUrls(prev => [...list, ...prev]);
  };

  const handleDelete = async (id) => {
    await api.delete(`/urls/${id}`);
    setUrls(prev => prev.filter(u => u.id !== id));
  };

  const allTags = [...new Set(urls.flatMap(u => u.tags || []))].sort();
  const totalClicks = urls.reduce((s, u) => s + (Number(u.total_clicks) || 0), 0);

  const filtered = urls.filter(u => {
    const matchSearch = !search || [u.original_url, u.short_code, u.title, ...(u.tags || [])]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()));
    const matchTag = !activeTag || (u.tags || []).includes(activeTag);
    return matchSearch && matchTag;
  });

  const exportCSV = () => {
    const headers = ['Short URL','Original URL','Title','Tags','Clicks','Created','Expires','Password','Max Clicks'];
    const rows = urls.map(u => [
      `${BASE_URL}/${u.short_code}`,
      u.original_url, u.title || '',
      (u.tags || []).join('; '), u.total_clicks || 0,
      format(new Date(u.created_at), 'yyyy-MM-dd HH:mm'),
      u.expires_at ? format(new Date(u.expires_at), 'yyyy-MM-dd HH:mm') : '',
      u.password_hash ? 'Yes' : 'No', u.max_clicks || '',
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `snipli-${format(new Date(),'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('CSV exported');
  };

  return (
    <AppLayout>

      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Links</h1>
          <p className="page-subtitle">
            {urls.length} link{urls.length !== 1 ? 's' : ''} · {totalClicks.toLocaleString()} total clicks
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={exportCSV} className="btn-secondary" style={{ fontSize: 13 }}>
            <Download size={14} /> Export CSV
          </button>
          <button onClick={() => setShowBulk(true)} className="btn-secondary" style={{ fontSize: 13 }}>
            <Layers size={14} /> Bulk
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={16} /> Create Link
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard icon={Link2}        label="Total Links"        value={urls.length}
          color="var(--accent)"   bg="var(--accent-subtle)" />
        <StatCard icon={MousePointer} label="Total Clicks"       value={totalClicks.toLocaleString()}
          color="var(--success)"  bg="var(--success-subtle)" />
        <StatCard icon={TrendingUp}   label="Avg. Clicks / Link" value={urls.length ? (totalClicks / urls.length).toFixed(1) : '0'}
          color="var(--info, #3B82F6)"   bg="var(--info-subtle, rgba(59,130,246,0.1))" />
      </div>

      {/* ── Search + Tag filters ── */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ flex: '1 1 220px', position: 'relative', minWidth: 180 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search links…"
              className="input-field"
              style={{ paddingLeft: '2.25rem', height: 38, fontSize: 13 }}
            />
          </div>

          {/* Tag chips */}
          {allTags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={() => setActiveTag(null)}
                style={{
                  fontSize: 12, padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
                  border: '1px solid var(--border)',
                  background: !activeTag ? 'var(--accent)' : 'transparent',
                  color: !activeTag ? '#fff' : 'var(--text-3)',
                  fontWeight: !activeTag ? 600 : 400,
                }}
              >All</button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  style={{
                    fontSize: 12, padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
                    border: `1px solid ${activeTag === tag ? 'var(--accent)' : 'var(--border)'}`,
                    background: activeTag === tag ? 'var(--accent-subtle)' : 'transparent',
                    color: activeTag === tag ? 'var(--accent)' : 'var(--text-3)',
                    fontWeight: activeTag === tag ? 600 : 400,
                  }}
                >#{tag}</button>
              ))}
            </div>
          )}

          {(search || activeTag) && (
            <button onClick={() => { setSearch(''); setActiveTag(null); }} className="btn-ghost" style={{ fontSize: 12 }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Link list ── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          {search || activeTag ? (
            <>
              <Search size={36} style={{ margin: '0 auto 12px', color: 'var(--text-4)' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>No links match</p>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>Try adjusting your search or filters</p>
              <button onClick={() => { setSearch(''); setActiveTag(null); }} className="btn-secondary">
                Clear filters
              </button>
            </>
          ) : (
            <>
              <div style={{
                width: 64, height: 64, borderRadius: 16, background: 'var(--accent-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              }}>
                <Link2 size={28} style={{ color: 'var(--accent)' }} />
              </div>
              <p style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-1)', marginBottom: 6 }}>
                No links yet
              </p>
              <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 20 }}>
                Create your first short link and start tracking clicks
              </p>
              <button onClick={() => setShowCreate(true)} className="btn-primary">
                <Plus size={16} /> Create your first link
              </button>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          <p style={{ fontSize: 12, color: 'var(--text-4)', marginBottom: 2 }}>
            {filtered.length} link{filtered.length !== 1 ? 's' : ''}
            {(search || activeTag) ? ' found' : ''}
          </p>
          {filtered.map(url => (
            <UrlCard key={url.id} url={url} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showCreate && <CreateUrlModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
      {showBulk   && <BulkShortenModal onClose={() => setShowBulk(false)} onCreated={handleCreated} />}
    </AppLayout>
  );
}
