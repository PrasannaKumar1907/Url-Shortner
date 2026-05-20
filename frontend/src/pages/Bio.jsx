import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ExternalLink, MousePointer, Link2, Copy, Check, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const BASE_URL = import.meta.env.VITE_BASE_URL || window.location.origin.replace('5173', '5000');

export default function Bio() {
  const { username } = useParams();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    api.get(`/bio/${encodeURIComponent(username)}`)
      .then(r => setData(r.data))
      .catch(err => { if (err.response?.status === 404) setNotFound(true); })
      .finally(() => setLoading(false));
  }, [username]);

  const copy = async (shortCode, id) => {
    await navigator.clipboard.writeText(`${BASE_URL}/${shortCode}`);
    setCopiedId(id); toast.success('Copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="spinner" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="text-5xl mb-4">👤</div>
      <h1 className="text-2xl font-bold t1 mb-2">User not found</h1>
      <p className="t3 mb-6">No public bio page for &ldquo;{username}&rdquo;</p>
      {authUser ? (
        <button onClick={() => navigate('/dashboard')} className="btn-primary px-6 py-2.5">
          Go to Dashboard →
        </button>
      ) : (
        <Link to="/signup" className="btn-primary px-6 py-2.5">Create yours →</Link>
      )}
    </div>
  );

  const { user, links } = data;

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-lg mx-auto">

        {/* Profile header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4">
            {user.name?.[0]?.toUpperCase() || '?'}
          </div>
          <h1 className="text-2xl font-bold t1">{user.name}</h1>
          <p className="text-sm t3 mt-1">
            Member since {format(new Date(user.memberSince), 'MMMM yyyy')}
          </p>
          <div className="flex items-center justify-center gap-4 mt-3 text-sm t3">
            <span className="flex items-center gap-1">
              <Link2 size={14} />{links.length} public link{links.length !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <MousePointer size={14} />
              {links.reduce((s, l) => s + (Number(l.total_clicks) || 0), 0).toLocaleString()} total clicks
            </span>
          </div>
        </div>

        {/* Links */}
        {links.length === 0 ? (
          <div className="text-center py-16">
            <Link2 size={40} className="mx-auto t4 mb-3" />
            <p className="t3">No public links yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {links.map(link => (
              <div key={link.id} className="card p-4 group hover:shadow-lg transition-all">
                <div className="flex items-start gap-3">
                  {/* Favicon */}
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${new URL(link.original_url).hostname}&sz=32`}
                      alt="" className="w-5 h-5 rounded"
                      onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }}
                    />
                    <Link2 size={16} className="t3 hidden" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {link.title && <p className="font-semibold t1 text-sm truncate">{link.title}</p>}
                    <a href={`${BASE_URL}/${link.short_code}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm font-medium hover:underline"
                      style={{ color: 'var(--accent)' }}>
                      <span className="truncate">{BASE_URL}/{link.short_code}</span>
                      <ExternalLink size={12} className="shrink-0" />
                    </a>
                    <div className="flex items-center gap-3 mt-1 text-xs t3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MousePointer size={10} />{link.total_clicks || 0} clicks
                      </span>
                      {link.expires_at && (
                        <span className="flex items-center gap-1" style={{ color: 'var(--warning)' }}>
                          <Calendar size={10} />Expires {format(new Date(link.expires_at), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                    {/* Tags */}
                    {link.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {link.tags.map(t => (
                          <span key={t} className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button onClick={() => copy(link.short_code, link.id)}
                    className="icon-btn accent shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {copiedId === link.id ? <Check size={15} style={{ color: 'var(--success)' }} /> : <Copy size={15} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {!authUser && (
          <div className="text-center mt-10">
            <Link to="/signup" className="inline-flex items-center gap-2 text-sm t3 hover:t1 transition-colors">
              <div className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded flex items-center justify-center">
                <Link2 size={11} className="text-white" />
              </div>
              Create your own Snipli bio page →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
