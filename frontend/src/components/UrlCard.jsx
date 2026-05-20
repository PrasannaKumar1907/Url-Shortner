import { useState } from 'react';
import { Copy, Trash2, BarChart2, Check, ExternalLink, Clock, MousePointer,
         AlertCircle, Lock, Shuffle, Eye, Globe, Wifi, WifiOff, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import api from '../api/axios';

const BASE_URL = import.meta.env.VITE_BASE_URL || window.location.origin.replace('5173', '5000');

function Pill({ color, bg, children }) {
  return (
    <span className="badge" style={{ color, background: bg }}>
      {children}
    </span>
  );
}

export default function UrlCard({ url, onDelete }) {
  const [copied, setCopied]         = useState(false);
  const [confirmDelete, setConfirm] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [health, setHealth]         = useState(null);

  const shortUrl  = `${BASE_URL}/${url.short_code}`;
  const isExpired = (url.expires_at && isPast(new Date(url.expires_at))) ||
                    (url.max_clicks  && Number(url.total_clicks) >= url.max_clicks);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true); toast.success('Copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('Copy failed'); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await onDelete(url.id); toast.success('Link deleted'); }
    catch { toast.error('Delete failed'); setDeleting(false); setConfirm(false); }
  };

  const checkHealth = async () => {
    setHealth('checking');
    try {
      const { data } = await api.get(`/urls/${url.id}/health`);
      setHealth(data);
    } catch { setHealth({ alive: false, error: 'Request failed' }); }
  };

  return (
    <div className="card" style={{
      padding: '16px 20px',
      opacity: isExpired ? 0.65 : 1,
      transition: 'box-shadow 0.2s',
    }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>

        {/* Favicon */}
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0, marginTop: 2,
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <img
            src={`https://www.google.com/s2/favicons?domain=${new URL(url.original_url).hostname}&sz=32`}
            alt=""
            style={{ width: 18, height: 18, borderRadius: 3 }}
            onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
          />
          <div style={{ display: 'none', alignItems: 'center', justifyContent: 'center' }}>
            <Globe size={14} style={{ color: 'var(--text-4)' }} />
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Short URL row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <a
              href={shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.textDecoration = 'underline'}
              onMouseLeave={e => e.target.style.textDecoration = 'none'}
            >
              {shortUrl.replace(/^https?:\/\//, '')}
            </a>

            {/* Badges */}
            {isExpired        && <Pill color="#92400E" bg="#FEF3C7"><AlertCircle size={9} />Inactive</Pill>}
            {url.password_hash && <Pill color="#5B21B6" bg="#EDE9FE"><Lock size={9} />Protected</Pill>}
            {url.ab_url        && <Pill color="#0E7490" bg="#CFFAFE"><Shuffle size={9} />A/B</Pill>}
            {url.preview_enabled && <Pill color="#065F46" bg="#D1FAE5"><Eye size={9} />Preview</Pill>}
            {url.is_public     && <Pill color="#1D4ED8" bg="#DBEAFE"><Globe size={9} />Public</Pill>}
            {url.custom_alias  && <Pill color="#7C3AED" bg="#F3E8FF">Custom</Pill>}
          </div>

          {/* Title */}
          {url.title && (
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {url.title}
            </p>
          )}

          {/* Original URL */}
          <a
            href={url.original_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, color: 'var(--text-3)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-2)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>
              {url.original_url.length > 70 ? url.original_url.slice(0, 70) + '…' : url.original_url}
            </span>
            <ExternalLink size={10} style={{ flexShrink: 0 }} />
          </a>

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-3)' }}>
              <Clock size={11} />
              {formatDistanceToNow(new Date(url.created_at), { addSuffix: true })}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-3)' }}>
              <MousePointer size={11} />
              <strong style={{ color: 'var(--text-2)', fontWeight: 600 }}>{url.total_clicks ?? 0}</strong>
              {url.max_clicks ? <span style={{ color: 'var(--text-4)' }}>/{url.max_clicks}</span> : ''}
              &nbsp;clicks
            </span>
            {url.expires_at && (
              <span style={{ fontSize: 12, color: isPast(new Date(url.expires_at)) ? 'var(--danger)' : 'var(--warning)' }}>
                Expires {format(new Date(url.expires_at), 'MMM d, yyyy')}
              </span>
            )}
            {/* Health result */}
            {health && health !== 'checking' && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
                color: health.alive ? 'var(--success)' : 'var(--danger)',
              }}>
                {health.alive ? <Wifi size={11} /> : <WifiOff size={11} />}
                {health.alive ? `${health.statusCode} · ${health.responseTime}ms` : 'Unreachable'}
              </span>
            )}
            {health === 'checking' && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-3)' }}>
                <span style={{
                  width: 10, height: 10, border: '1.5px solid currentColor',
                  borderTopColor: 'transparent', borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite', display: 'inline-block',
                }} />
                Checking…
              </span>
            )}
          </div>

          {/* Tags */}
          {url.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
              {url.tags.map(t => (
                <span key={t} style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 20,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-3)',
                }}>#{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          <button onClick={handleCopy} title="Copy short URL" className="icon-btn accent">
            {copied ? <Check size={15} style={{ color: 'var(--success)' }} /> : <Copy size={15} />}
          </button>
          <button
            onClick={checkHealth}
            title="Check if URL is alive"
            className="icon-btn info-v"
            disabled={health === 'checking'}
          >
            <Wifi size={15} />
          </button>
          <Link to={`/analytics/${url.id}`} title="View analytics" className="icon-btn">
            <BarChart2 size={15} />
          </Link>

          {confirmDelete ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: '4px 10px', fontSize: 12, borderRadius: 6, cursor: 'pointer',
                  background: 'var(--danger)', color: '#fff', border: 'none', fontWeight: 600,
                }}
              >
                {deleting ? '…' : 'Delete'}
              </button>
              <button
                onClick={() => setConfirm(false)}
                style={{
                  padding: '4px 10px', fontSize: 12, borderRadius: 6, cursor: 'pointer',
                  background: 'var(--bg-surface)', color: 'var(--text-3)', border: '1px solid var(--border)',
                }}
              >
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
