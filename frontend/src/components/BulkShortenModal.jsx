import { useState } from 'react';
import { X, Upload, Check, AlertCircle, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../api/axios';

const BASE_URL = import.meta.env.VITE_BASE_URL || window.location.origin.replace('5173', '5000');

export default function BulkShortenModal({ onClose, onCreated }) {
  const [text, setText]       = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleSubmit = async () => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return toast.error('Paste at least one URL');
    if (lines.length > 50) return toast.error('Maximum 50 URLs at once');
    setLoading(true);
    try {
      const { data } = await api.post('/urls/bulk', { urls: lines });
      setResults(data.results);
      const ok = data.results.filter(r => !r.error).length;
      toast.success(`${ok} of ${lines.length} URLs shortened!`);
      onCreated(data.results.filter(r => !r.error));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bulk shorten failed');
    } finally { setLoading(false); }
  };

  const copyAll = () => {
    const text = results
      .filter(r => !r.error)
      .map(r => `${BASE_URL}/${r.short_code}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    toast.success('All short URLs copied!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
      <div className="card w-full max-w-xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-6 pb-4 shrink-0">
          <div>
            <h2 className="text-lg font-semibold t1">Bulk URL Shortener</h2>
            <p className="text-xs t3 mt-0.5">Paste up to 50 URLs, one per line</p>
          </div>
          <button onClick={onClose} className="icon-btn"><X size={20} /></button>
        </div>

        <div className="px-6 pb-6 flex-1 overflow-y-auto space-y-4">
          {!results ? (
            <>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={`https://example.com/page-one\nhttps://example.com/page-two\nhttps://example.com/page-three`}
                rows={10}
                className="w-full rounded-xl p-3 text-sm font-mono resize-none outline-none transition-colors"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--input-border)',
                         color: 'var(--text-1)' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e  => e.target.style.borderColor = 'var(--input-border)'}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs t3">{text.split('\n').filter(l => l.trim()).length} URLs</span>
                <div className="flex gap-2">
                  <button onClick={onClose} className="btn-secondary px-4 py-2">Cancel</button>
                  <button onClick={handleSubmit} disabled={loading} className="btn-primary px-5 py-2">
                    {loading
                      ? <span className="flex items-center gap-2"><span className="spinner-sm" />Shortening…</span>
                      : <span className="flex items-center gap-2"><Upload size={15} />Shorten All</span>}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium t1">
                  {results.filter(r => !r.error).length} shortened · {results.filter(r => r.error).length} failed
                </span>
                <div className="flex gap-2">
                  <button onClick={copyAll} className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-sm">
                    <Copy size={14} /> Copy All
                  </button>
                  <button onClick={onClose} className="btn-primary px-3 py-1.5 text-sm">Done</button>
                </div>
              </div>
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: r.error ? 'var(--danger-subtle)' : 'var(--bg-surface)',
                             border: '1px solid var(--border)' }}>
                    {r.error
                      ? <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                      : <Check size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs t3 truncate">{r.original_url}</p>
                      {!r.error
                        ? <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--accent)' }}>
                            {BASE_URL}/{r.short_code}
                          </p>
                        : <p className="text-xs mt-0.5" style={{ color: 'var(--danger)' }}>{r.error}</p>}
                    </div>
                    {!r.error && (
                      <button onClick={() => { navigator.clipboard.writeText(`${BASE_URL}/${r.short_code}`); toast.success('Copied!'); }}
                        className="icon-btn accent shrink-0" style={{ padding: 4 }}>
                        <Copy size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
