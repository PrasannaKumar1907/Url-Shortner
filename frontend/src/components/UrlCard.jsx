import { useState } from 'react';
import { Copy, Trash2, BarChart2, Check, ExternalLink, Clock, MousePointer, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow, format, isPast } from 'date-fns';

function truncate(str, max = 60) {
  return str?.length > max ? str.slice(0, max) + '…' : str ?? '';
}

export default function UrlCard({ url, baseUrl, onDelete }) {
  const [copied, setCopied]               = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const shortUrl  = `${baseUrl}/${url.short_code}`;
  const isExpired = url.expires_at && isPast(new Date(url.expires_at));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('Failed to copy'); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(url.id);
      toast.success('URL deleted');
    } catch {
      toast.error('Failed to delete');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div
      className="card p-4 sm:p-5"
      style={{ opacity: isExpired ? 0.65 : 1 }}
    >
      <div className="flex items-start justify-between gap-3">

        {/* Left: info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold truncate max-w-xs" style={{ color: 'var(--accent)' }}>
              {shortUrl}
            </span>
            {isExpired && (
              <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full"
                    style={{ color: 'var(--warning)', background: 'rgba(245,158,11,0.1)' }}>
                <AlertCircle size={11} /> Expired
              </span>
            )}
            {url.custom_alias && (
              <span className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ color: '#a855f7', background: 'rgba(168,85,247,0.1)' }}>
                Custom
              </span>
            )}
          </div>

          {url.title && (
            <p className="text-sm font-medium t1 mt-0.5">{url.title}</p>
          )}

          <a
            href={url.original_url}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 mt-1 group"
            style={{ color: 'var(--text-3)', fontSize: 12 }}
          >
            <span className="truncate max-w-xs sm:max-w-sm">{truncate(url.original_url)}</span>
            <ExternalLink size={11} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>

          <div className="flex items-center gap-3 mt-2" style={{ color: 'var(--text-3)', fontSize: 12 }}>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {formatDistanceToNow(new Date(url.created_at), { addSuffix: true })}
            </span>
            <span className="flex items-center gap-1">
              <MousePointer size={11} />
              <strong className="t2">{url.total_clicks ?? 0}</strong> clicks
            </span>
            {url.last_clicked_at && (
              <span className="hidden sm:flex items-center gap-1">
                Last: {format(new Date(url.last_clicked_at), 'MMM d')}
              </span>
            )}
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={handleCopy} title="Copy" className="icon-btn accent">
            {copied
              ? <Check size={15} style={{ color: 'var(--success)' }} />
              : <Copy size={15} />}
          </button>

          <Link to={`/analytics/${url.id}`} title="Analytics" className="icon-btn purple-v">
            <BarChart2 size={15} />
          </Link>

          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete} disabled={deleting}
                className="px-2 py-1 text-xs rounded-lg font-medium transition-colors"
                style={{ background: 'var(--danger-subtle)', color: 'var(--danger)' }}
              >
                {deleting ? '…' : 'Confirm'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 text-xs rounded-lg transition-colors"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-3)' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} title="Delete" className="icon-btn danger-v">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
