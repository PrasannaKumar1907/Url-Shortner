import { useState } from 'react';
import { X, Link2, Tag, Hash, Calendar, Lock, MousePointer, Eye, Shuffle, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';

const BASE_URL = import.meta.env.VITE_BASE_URL || window.location.origin.replace('5173', '5000');

function Field({ label, optional, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium t2 mb-1.5">
        {label}{' '}
        {optional && <span className="text-xs t3">(optional)</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs t-danger">{error}</p>}
    </div>
  );
}

function IconInput({ icon: Icon, children }) {
  return (
    <div className="relative">
      <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 t4 pointer-events-none" />
      {children}
    </div>
  );
}

export default function CreateUrlModal({ onClose, onCreated }) {
  const { isDark } = useTheme();
  const [form, setForm] = useState({
    original_url: '', title: '', custom_alias: '',
    expires_at: '', password: '', max_clicks: '',
    tags: '', is_public: false, preview_enabled: false,
    ab_url: '', ab_split: 50,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }));
  };
  const handleChange = e => set(e.target.name, e.target.type === 'checkbox' ? e.target.checked : e.target.value);

  const addTag = (raw) => {
    const t = raw.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (t && !tags.includes(t) && tags.length < 8) setTags(p => [...p, t]);
    setTagInput('');
  };
  const removeTag = t => setTags(p => p.filter(x => x !== t));

  const validate = () => {
    const e = {};
    if (!form.original_url.trim()) { e.original_url = 'URL is required'; }
    else { try { const u = new URL(form.original_url); if (!['http:','https:'].includes(u.protocol)) throw new Error(); }
           catch { e.original_url = 'Enter a valid URL (http:// or https://)'; } }
    if (form.ab_url) { try { new URL(form.ab_url); } catch { e.ab_url = 'Invalid A/B URL'; } }
    if (form.custom_alias && !/^[a-zA-Z0-9_-]{3,30}$/.test(form.custom_alias))
      e.custom_alias = 'Alias: 3–30 chars, letters/numbers/- /_';
    if (form.expires_at && new Date(form.expires_at) <= new Date())
      e.expires_at = 'Expiry must be a future date';
    if (form.max_clicks && (isNaN(form.max_clicks) || Number(form.max_clicks) < 1))
      e.max_clicks = 'Must be a positive number';
    if (form.password && form.password.length < 4)
      e.password = 'Password must be at least 4 characters';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async ev => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/urls', {
        original_url:    form.original_url.trim(),
        title:           form.title.trim() || undefined,
        custom_alias:    form.custom_alias.trim() || undefined,
        expires_at:      form.expires_at ? new Date(form.expires_at).toISOString() : undefined,
        password:        form.password   || undefined,
        max_clicks:      form.max_clicks ? Number(form.max_clicks) : undefined,
        tags,
        is_public:       form.is_public,
        preview_enabled: form.preview_enabled,
        ab_url:          form.ab_url.trim() || undefined,
        ab_split:        Number(form.ab_split),
      });
      toast.success('Short URL created!');
      onCreated(data.url);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create URL');
    } finally { setLoading(false); }
  };

  const today = new Date().toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
      <div className="card w-full max-w-lg max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 shrink-0">
          <h2 className="text-lg font-semibold t1">Create Short URL</h2>
          <button onClick={onClose} className="icon-btn"><X size={20} /></button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 pb-6 space-y-4 flex-1">
          <form onSubmit={handleSubmit} noValidate id="create-form">

            {/* ── Core fields ── */}
            <div className="space-y-4">
              <Field label="Long URL" error={errors.original_url}>
                <IconInput icon={Link2}>
                  <input type="url" name="original_url" value={form.original_url}
                    onChange={handleChange} placeholder="https://example.com/very/long/url"
                    className={`input-field${errors.original_url ? ' err' : ''}`} autoFocus />
                </IconInput>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Title" optional>
                  <IconInput icon={Tag}>
                    <input type="text" name="title" value={form.title} onChange={handleChange}
                      placeholder="My page" className="input-field" />
                  </IconInput>
                </Field>
                <Field label="Custom Alias" optional error={errors.custom_alias}>
                  <IconInput icon={Hash}>
                    <input type="text" name="custom_alias" value={form.custom_alias}
                      onChange={handleChange} placeholder="my-brand"
                      className={`input-field${errors.custom_alias ? ' err' : ''}`} />
                  </IconInput>
                  {form.custom_alias && !errors.custom_alias && (
                    <p className="mt-1 text-xs" style={{ color: 'var(--accent)' }}>{BASE_URL}/{form.custom_alias}</p>
                  )}
                </Field>
              </div>
            </div>

            {/* ── Advanced toggle ── */}
            <button type="button" onClick={() => setShowAdvanced(s => !s)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-4"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
              <span>Advanced Options</span>
              {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showAdvanced && (
              <div className="space-y-4 pt-1">

                {/* Expiry + Max Clicks */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Expiry Date" optional error={errors.expires_at}>
                    <IconInput icon={Calendar}>
                      <input type="datetime-local" name="expires_at" value={form.expires_at}
                        onChange={handleChange} min={today}
                        className={`input-field${errors.expires_at ? ' err' : ''}`}
                        style={{ colorScheme: isDark ? 'dark' : 'light' }} />
                    </IconInput>
                  </Field>
                  <Field label="Max Clicks" optional error={errors.max_clicks}>
                    <IconInput icon={MousePointer}>
                      <input type="number" name="max_clicks" value={form.max_clicks}
                        onChange={handleChange} placeholder="e.g. 100" min="1"
                        className={`input-field${errors.max_clicks ? ' err' : ''}`} />
                    </IconInput>
                    <div className="flex gap-1 mt-1">
                      {[1,10,100].map(n => (
                        <button key={n} type="button" onClick={() => set('max_clicks', n)}
                          className="text-xs px-2 py-0.5 rounded-full transition-colors"
                          style={{ background: Number(form.max_clicks) === n ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                                   color: Number(form.max_clicks) === n ? 'var(--accent)' : 'var(--text-3)',
                                   border: '1px solid var(--border)' }}>
                          {n === 1 ? 'One-time' : `${n}`}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>

                {/* Password */}
                <Field label="Password Protection" optional error={errors.password}>
                  <IconInput icon={Lock}>
                    <input type="password" name="password" value={form.password}
                      onChange={handleChange} placeholder="Leave blank for no password"
                      className={`input-field${errors.password ? ' err' : ''}`} />
                  </IconInput>
                  {form.password && <p className="mt-1 text-xs t3">🔒 Visitors will need to enter this password</p>}
                </Field>

                {/* Tags */}
                <Field label="Tags" optional>
                  <div className="relative">
                    <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 t4 pointer-events-none" />
                    <input type="text" value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (['Enter',',',' '].includes(e.key)) { e.preventDefault(); addTag(tagInput); } }}
                      onBlur={() => tagInput && addTag(tagInput)}
                      placeholder="Type and press Enter to add tags"
                      className="input-field" />
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tags.map(t => (
                        <span key={t} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                          #{t}
                          <button type="button" onClick={() => removeTag(t)}
                            className="hover:opacity-70 ml-0.5">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </Field>

                {/* A/B Split Testing */}
                <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <Shuffle size={15} style={{ color: 'var(--accent)' }} />
                    <span className="text-sm font-medium t1">A/B Split Testing</span>
                    <span className="text-xs t3">(optional)</span>
                  </div>
                  <Field label="URL B (alternate destination)" optional error={errors.ab_url}>
                    <IconInput icon={Link2}>
                      <input type="url" name="ab_url" value={form.ab_url} onChange={handleChange}
                        placeholder="https://variant-b.com/page"
                        className={`input-field${errors.ab_url ? ' err' : ''}`} />
                    </IconInput>
                  </Field>
                  {form.ab_url && (
                    <div>
                      <div className="flex justify-between text-xs t3 mb-1">
                        <span>URL A (original): <strong className="t1">{form.ab_split}%</strong></span>
                        <span>URL B: <strong className="t1">{100 - form.ab_split}%</strong></span>
                      </div>
                      <input type="range" min="0" max="100" value={form.ab_split}
                        onChange={e => set('ab_split', Number(e.target.value))}
                        className="w-full" style={{ accentColor: 'var(--accent)' }} />
                    </div>
                  )}
                </div>

                {/* Toggles row */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'preview_enabled', icon: Eye, label: 'Preview Page', desc: 'Show 5s interstitial before redirect' },
                    { key: 'is_public',       icon: Globe, label: 'Show on Bio', desc: 'Appear on your public link-in-bio page' },
                  ].map(({ key, icon: Icon, label, desc }) => (
                    <label key={key} className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                      style={{ background: form[key] ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                               border: `1px solid ${form[key] ? 'var(--accent)' : 'var(--border)'}` }}>
                      <input type="checkbox" name={key} checked={form[key]} onChange={handleChange}
                        className="mt-0.5" style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />
                      <div>
                        <div className="flex items-center gap-1.5 text-sm font-medium t1">
                          <Icon size={14} /> {label}
                        </div>
                        <p className="text-xs t3 mt-0.5">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-4 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
          <button type="submit" form="create-form" disabled={loading} className="btn-primary flex-1 py-2.5">
            {loading ? <span className="flex items-center justify-center gap-2"><span className="spinner-sm" />Creating…</span> : 'Create Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
