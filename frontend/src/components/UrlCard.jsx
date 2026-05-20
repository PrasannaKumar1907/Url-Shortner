import { useState } from 'react';
import { Copy, Trash2, BarChart2, Check, ExternalLink, Clock, MousePointer,
         AlertCircle, Lock, Shuffle, Eye, Globe, Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import api from '../api/axios';

const BASE_URL = import.meta.env.VITE_BASE_URL || window.location.origin.replace('5173', '5000');

function Badge({ color, bg, children }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium"
      style={{ color, background: bg }}>{children}</span>
  );
}

export default function UrlCard({ url, onDelete }) {
  const [copied, setCopied]           = useState(false);
  const [confirmDelete, setConfirm]   = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [health, setHealth]           = useState(null); // null | 'checking' | {alive,statusCode,responseTime}

  const shortUrl  = `${BASE_URL}/${url.short_code}`;
  const isExpired = (url.expires_at && isPast(new Date(url.expires_at))) ||
                    (url.max_clicks  && Number(url.total_clicks) >= url.max_clicks);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true); toast.success('Copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('Failed to copy'); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await onDelete(url.id); toast.success('Deleted'); }
    catch { toast.error('Failed to delete'); setDeleting(false); setConfirm(false); }
  };

  const checkHealth = async () => {
    setHealth('checking');
    try {
      const { data } = await api.get(`/urls/${url.id}/health`);
      setHealth(data);
    } catch { setHealth({ alive: false, error: 'Request failed' }); }
  };

  return (
    <div className="card p-4 sm:p-5 transition-all" style={{ opacity: isExpired ? 0.6 : 1 }}>
      <div className="flex items-start gap-3">

        {/* Left: info */}
        <div className="flex-1 min-w-0">
          {/* Short URL + badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <a href={shortUrl} target="_blank" rel="noopener noreferrer"
               className="text-sm font-semibold hover:underline truncate max-w-xs"
               style={{ color: 'var(--accent)' }}>
              {shortUrl}
            </a>
            {isExpired          && <Badge color="#f59e0b" bg="rgba(245,158,11,0.1)"><AlertCircle size={10} />Inactive</Badge>}
            {url.password_hash  && <Badge color="#8b5cf6" bg="rgba(139,92,246,0.1)"><Lock size={10} />Protected</Badge>}
            {url.ab_url         && <Badge color="#06b6d4" bg="rgba(6,182,212,0.1)"><Shuffle size={10} />A/B Test</Badge>}
            {url.preview_enabled && <Badge color="#10b981" bg="rgba(16,185,129,0.1)"><Eye size={10} />Preview</Badge>}
            {url.is_public      && <Badge color="#6366f1" bg="rgba(99,102,241,0.1)"><Globe size={10} />Public</Badge>}
            {url.custom_alias   && <Badge color="#a855f7" bg="rgba(168,85,247,0.1)">Custom</Badge>}
          </div>

          {/* Title */}
          {url.title && <p className="text-sm font-medium t1 mt-0.5 truncate">{url.title}</p>}

          {/* Original URL */}
          <a href={url.original_url} target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-1 mt-0.5 group text-xs t3 hover:t2 transition-colors">
            <span className="truncate max-w-xs sm:max-w-sm">
              {url.original_url.length > 65 ? url.original_url.slice(0, 65) + '…' : url.original_url}
            </span>
            <ExternalLink size={10} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>

          {/* Stats row */}
          <div className="flex items-center gap-3 mt-2 text-xs t3 flex-wrap">
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {formatDistanceToNow(new Date(url.created_at), { addSuffix: true })}
            </span>
            <span className="flex items-center gap-1">
              <MousePointer size={10} />
              <strong className="t2">{url.total_clicks ?? 0}</strong>
              {url.max_clicks ? `/${url.max_clicks}` : ''} clicks
            </span>
            {url.last_clicked_at && (
              <span className="hidden sm:inline">
                Last: {format(new Date(url.last_clicked_at), 'MMM d')}
              </span>
            )}
            {/* Health indicator */}
            {health && health !== 'checking' && (
              <span className="flex items-center gap-1"
                style={{ color: health.alive ? 'var(--success)' : 'var(--danger)' }}>
                {health.alive ? <Wifi size={10} /> : <WifiOff size={10} />}
                {health.alive ? `${health.statusCode} · ${health.responseTime}ms` : 'Unreachable'}
              </span>
            )}
            {health === 'checking' && (
              <span className="flex items-center gap-1 t3">
                <span className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin inline-block" />
                Checking…
              </span>
            )}
          </div>

          {/* Tags */}
          {url.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {url.tags.map(t => (
                <span key={t} className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={handleCopy} title="Copy" className="icon-btn accent">
            {copied ? <Check size={15} style={{ color: 'var(--success)' }} /> : <Copy size={15} />}
          </button>
          <button onClick={checkHealth} title="Check if URL is alive" className="icon-btn"
            disabled={health === 'checking'}>
            <Wifi size={15} />
          </button>
          <Link to={`/analytics/${url.id}`} title="Analytics" className="icon-btn purple-v">
            <BarChart2 size={15} />
          </Link>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button onClick={handleDelete} disabled={deleting}
                className="px-2 py-1 text-xs rounded-lg font-medium"
                style={{ background: 'var(--danger-subtle)', color: 'var(--danger)' }}>
                {deleting ? '…' : 'Confirm'}
              </button>
              <button onClick={() => setConfirm(false)}
                className="px-2 py-1 text-xs rounded-lg"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-3)' }}>
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirm(true)} title="Delete" className="icon-btn danger-v">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
