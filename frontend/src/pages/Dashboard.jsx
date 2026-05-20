import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Link2, TrendingUp, MousePointer, Download, Layers, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import UrlCard from '../components/UrlCard';
import CreateUrlModal from '../components/CreateUrlModal';
import BulkShortenModal from '../components/BulkShortenModal';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const BASE_URL = import.meta.env.VITE_BASE_URL || window.location.origin.replace('5173', '5000');

function StatCard({ icon: Icon, label, value, iconBg, iconColor }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <div className="stat-icon" style={{ background: iconBg }}>
          <Icon size={20} style={{ color: iconColor }} />
        </div>
        <div>
          <p className="text-2xl font-bold t1">{value}</p>
          <p className="text-xs t3">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user }  = useAuth();
  const [urls, setUrls]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate]   = useState(false);
  const [showBulk, setShowBulk]       = useState(false);
  const [search, setSearch]           = useState('');
  const [activeTag, setActiveTag]     = useState(null);

  const fetchUrls = useCallback(async () => {
    try { const { data } = await api.get('/urls'); setUrls(data.urls || []); }
    catch { toast.error('Failed to load URLs'); }
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

  // All unique tags across all URLs
  const allTags = [...new Set(urls.flatMap(u => u.tags || []))].sort();

  const filtered = urls.filter(u => {
    const matchSearch = !search || [u.original_url, u.short_code, u.title, ...(u.tags || [])]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()));
    const matchTag = !activeTag || (u.tags || []).includes(activeTag);
    return matchSearch && matchTag;
  });

  const totalClicks = urls.reduce((s, u) => s + (Number(u.total_clicks) || 0), 0);

  const exportCSV = () => {
    const headers = ['Short URL','Original URL','Title','Tags','Clicks','Created','Expires','Password','Max Clicks'];
    const rows = urls.map(u => [
      `${BASE_URL}/${u.short_code}`,
      u.original_url,
      u.title || '',
      (u.tags || []).join('; '),
      u.total_clicks || 0,
      format(new Date(u.created_at), 'yyyy-MM-dd HH:mm'),
      u.expires_at ? format(new Date(u.expires_at), 'yyyy-MM-dd HH:mm') : '',
      u.password_hash ? 'Yes' : 'No',
      u.max_clicks || '',
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `snipli-links-${format(new Date(),'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('CSV exported!');
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold t1">
              Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0] || 'there'}</span>
            </h1>
            <p className="t3 mt-1">Manage and track all your short links</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/bio/${encodeURIComponent(user?.name || '')}`}
              className="btn-secondary flex items-center gap-1.5 px-4 py-2 text-sm shrink-0">
              <User size={15} /> My Bio Page
            </Link>
            <button onClick={exportCSV}
              className="btn-secondary flex items-center gap-1.5 px-4 py-2 text-sm shrink-0">
              <Download size={15} /> Export CSV
            </button>
            <button onClick={() => setShowBulk(true)}
              className="btn-secondary flex items-center gap-1.5 px-4 py-2 text-sm shrink-0">
              <Layers size={15} /> Bulk Shorten
            </button>
            <button onClick={() => setShowCreate(true)}
              className="btn-primary flex items-center gap-2 px-5 py-2 shrink-0">
              <Plus size={18} /> New Link
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard icon={Link2}        label="Total Links"       value={urls.length}
            iconBg="rgba(99,102,241,0.12)"  iconColor="#6366f1" />
          <StatCard icon={MousePointer} label="Total Clicks"      value={totalClicks.toLocaleString()}
            iconBg="rgba(168,85,247,0.12)"  iconColor="#a855f7" />
          <StatCard icon={TrendingUp}   label="Avg. Clicks / Link" value={urls.length ? (totalClicks / urls.length).toFixed(1) : '0'}
            iconBg="rgba(16,185,129,0.12)"  iconColor="#10b981" />
        </div>

        {/* Tag filter chips */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className="text-xs t3">Filter:</span>
            <button onClick={() => setActiveTag(null)}
              className="text-xs px-3 py-1 rounded-full transition-colors"
              style={{ background: !activeTag ? 'var(--accent)' : 'var(--bg-surface)',
                       color: !activeTag ? '#fff' : 'var(--text-3)',
                       border: '1px solid var(--border)' }}>
              All
            </button>
            {allTags.map(tag => (
              <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className="text-xs px-3 py-1 rounded-full transition-colors"
                style={{ background: activeTag === tag ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                         color: activeTag === tag ? 'var(--accent)' : 'var(--text-3)',
                         border: `1px solid ${activeTag === tag ? 'var(--accent)' : 'var(--border)'}` }}>
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 t4 pointer-events-none" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by URL, alias, title, or tag…"
            className="input-field" />
        </div>

        {/* URL List */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            {search || activeTag ? (
              <>
                <Search size={40} className="mx-auto t4 mb-3" />
                <p className="t3">No links match your filters</p>
                <button onClick={() => { setSearch(''); setActiveTag(null); }}
                  className="text-sm mt-2" style={{ color: 'var(--accent)' }}>
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <Link2 size={40} className="mx-auto t4 mb-3" />
                <p className="font-medium t1">No short URLs yet</p>
                <p className="text-sm t3 mt-1 mb-4">Create your first short link to get started</p>
                <button onClick={() => setShowCreate(true)} className="btn-primary px-5 py-2">
                  Create your first link
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs t3">
              {filtered.length} link{filtered.length !== 1 ? 's' : ''}
              {(search || activeTag) ? ' matching filters' : ''}
            </p>
            {filtered.map(url => (
              <UrlCard key={url.id} url={url} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      {showCreate && <CreateUrlModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
      {showBulk   && <BulkShortenModal onClose={() => setShowBulk(false)} onCreated={handleCreated} />}
    </div>
  );
}
