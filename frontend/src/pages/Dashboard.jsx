import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Link2, TrendingUp, MousePointer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import UrlCard from '../components/UrlCard';
import CreateUrlModal from '../components/CreateUrlModal';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

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
  const { user }    = useAuth();
  const [urls, setUrls]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch]       = useState('');

  const fetchUrls = useCallback(async () => {
    try {
      const { data } = await api.get('/urls');
      setUrls(data.urls || []);
    } catch { toast.error('Failed to load URLs'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { fetchUrls(); }, [fetchUrls]);

  const handleCreated = (newUrl) => setUrls(prev => [newUrl, ...prev]);
  const handleDelete  = async (id) => {
    await api.delete(`/urls/${id}`);
    setUrls(prev => prev.filter(u => u.id !== id));
  };

  const filtered = urls.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.original_url.toLowerCase().includes(q) ||
      u.short_code.toLowerCase().includes(q) ||
      u.title?.toLowerCase().includes(q)
    );
  });

  const totalClicks = urls.reduce((s, u) => s + (u.total_clicks || 0), 0);

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
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 shrink-0"
          >
            <Plus size={18} /> New Short URL
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard icon={Link2}       label="Total Links"       value={urls.length}
            iconBg="rgba(99,102,241,0.12)"  iconColor="#6366f1" />
          <StatCard icon={MousePointer} label="Total Clicks"     value={totalClicks.toLocaleString()}
            iconBg="rgba(168,85,247,0.12)"  iconColor="#a855f7" />
          <StatCard icon={TrendingUp}  label="Avg. Clicks / Link" value={urls.length ? (totalClicks / urls.length).toFixed(1) : '0'}
            iconBg="rgba(16,185,129,0.12)"  iconColor="#10b981" />
        </div>

        {/* Search + List */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 t4 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by URL, alias, or title…"
              className="input-field"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="spinner" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              {search ? (
                <>
                  <Search size={40} className="mx-auto t4 mb-3" />
                  <p className="t3">No links match "{search}"</p>
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
                {search ? ` matching "${search}"` : ''}
              </p>
              {filtered.map(url => (
                <UrlCard key={url.id} url={url} baseUrl={BASE_URL} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </main>

      {showCreate && (
        <CreateUrlModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
