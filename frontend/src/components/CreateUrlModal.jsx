import { useState } from 'react';
import { X, Link2, Tag, Hash, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';

export default function CreateUrlModal({ onClose, onCreated }) {
  const { isDark } = useTheme();
  const [form, setForm]       = useState({ original_url: '', title: '', custom_alias: '', expires_at: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.original_url.trim()) {
      e.original_url = 'URL is required';
    } else {
      try {
        const u = new URL(form.original_url);
        if (!['http:', 'https:'].includes(u.protocol)) throw new Error();
      } catch { e.original_url = 'Enter a valid URL starting with http:// or https://'; }
    }
    if (form.custom_alias && !/^[a-zA-Z0-9_-]{3,30}$/.test(form.custom_alias))
      e.custom_alias = 'Alias: 3–30 chars, letters/numbers/- /_ only';
    if (form.expires_at && new Date(form.expires_at) <= new Date())
      e.expires_at = 'Expiry must be a future date';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/urls', {
        original_url: form.original_url.trim(),
        title:        form.title.trim() || undefined,
        custom_alias: form.custom_alias.trim() || undefined,
        expires_at:   form.expires_at || undefined,
      });
      toast.success('Short URL created!');
      onCreated(data.url);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create URL');
    } finally { setLoading(false); }
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(er => ({ ...er, [e.target.name]: '' }));
  };

  const today = new Date().toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
      <div className="card w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold t1">Create Short URL</h2>
          <button onClick={onClose} className="icon-btn" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* Long URL */}
          <div>
            <label className="block text-sm font-medium t2 mb-1.5">
              Long URL <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div className="relative">
              <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 t4 pointer-events-none" />
              <input
                type="url" name="original_url"
                value={form.original_url} onChange={handleChange}
                placeholder="https://example.com/very/long/url"
                className={`input-field${errors.original_url ? ' err' : ''}`}
                autoFocus
              />
            </div>
            {errors.original_url && <p className="mt-1 text-xs t-danger">{errors.original_url}</p>}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium t2 mb-1.5">
              Title <span className="text-xs t3">(optional)</span>
            </label>
            <div className="relative">
              <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 t4 pointer-events-none" />
              <input
                type="text" name="title"
                value={form.title} onChange={handleChange}
                placeholder="My landing page"
                className="input-field"
              />
            </div>
          </div>

          {/* Custom Alias */}
          <div>
            <label className="block text-sm font-medium t2 mb-1.5">
              Custom Alias <span className="text-xs t3">(optional)</span>
            </label>
            <div className="relative">
              <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 t4 pointer-events-none" />
              <input
                type="text" name="custom_alias"
                value={form.custom_alias} onChange={handleChange}
                placeholder="my-brand"
                className={`input-field${errors.custom_alias ? ' err' : ''}`}
              />
            </div>
            {errors.custom_alias
              ? <p className="mt-1 text-xs t-danger">{errors.custom_alias}</p>
              : form.custom_alias && (
                <p className="mt-1 text-xs t3">
                  Short URL: <span style={{ color: 'var(--accent)' }}>{window.location.origin.replace('5173','5000')}/{form.custom_alias}</span>
                </p>
              )
            }
          </div>

          {/* Expiry */}
          <div>
            <label className="block text-sm font-medium t2 mb-1.5">
              Expiry Date <span className="text-xs t3">(optional)</span>
            </label>
            <div className="relative">
              <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 t4 pointer-events-none" />
              <input
                type="datetime-local" name="expires_at"
                value={form.expires_at} onChange={handleChange}
                min={today}
                className={`input-field${errors.expires_at ? ' err' : ''}`}
                style={{ colorScheme: isDark ? 'dark' : 'light' }}
              />
            </div>
            {errors.expires_at && <p className="mt-1 text-xs t-danger">{errors.expires_at}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5">
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="spinner-sm" />Creating…</span>
                : 'Create Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
