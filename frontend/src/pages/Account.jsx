import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { User, Mail, Lock, Eye, EyeOff, Save, Trash2, Globe, AlertTriangle, ShieldCheck } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Account() {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();

  /* ── Profile state ── */
  const [profile, setProfile]   = useState({ name: user?.name || '', email: user?.email || '' });
  const [profileSaving, setProfileSaving] = useState(false);

  /* ── Password state ── */
  const [pw, setPw]         = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwErrors, setPwErrors] = useState({});

  /* ── Delete account state ── */
  const [deletePhase, setDeletePhase] = useState(0); // 0 idle, 1 confirm, 2 deleting
  const [deleteInput, setDeleteInput] = useState('');

  /* ── Handlers ── */
  const saveProfile = async () => {
    if (!profile.name.trim() || profile.name.trim().length < 2)
      return toast.error('Name must be at least 2 characters');
    setProfileSaving(true);
    try {
      const { data } = await api.put('/auth/profile', { name: profile.name.trim() });
      login(localStorage.getItem('token'), data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally { setProfileSaving(false); }
  };

  const validatePw = () => {
    const e = {};
    if (!pw.current) e.current = 'Current password required';
    if (!pw.next || pw.next.length < 8) e.next = 'New password must be 8+ characters';
    if (pw.next !== pw.confirm) e.confirm = 'Passwords do not match';
    setPwErrors(e);
    return !Object.keys(e).length;
  };

  const savePassword = async () => {
    if (!validatePw()) return;
    setPwSaving(true);
    try {
      await api.put('/auth/password', { currentPassword: pw.current, newPassword: pw.next });
      toast.success('Password changed successfully');
      setPw({ current: '', next: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally { setPwSaving(false); }
  };

  const deleteAccount = async () => {
    if (deleteInput !== user?.email) return toast.error('Email does not match');
    setDeletePhase(2);
    try {
      await api.delete('/auth/account');
      logout();
      toast.success('Account deleted');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete account');
      setDeletePhase(1);
    }
  };

  const pwStrength = (() => {
    const p = pw.next;
    if (!p) return null;
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^a-zA-Z0-9]/.test(p)) s++;
    if (s <= 1) return { label: 'Weak',   color: 'var(--danger)', w: '20%' };
    if (s <= 2) return { label: 'Fair',   color: 'var(--warning)', w: '45%' };
    if (s <= 3) return { label: 'Good',   color: 'var(--info)', w: '65%' };
    return          { label: 'Strong', color: 'var(--success)', w: '100%' };
  })();

  return (
    <AppLayout>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Account Settings</h1>
          <p className="page-subtitle">Manage your profile, security, and preferences</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 20, maxWidth: 680 }}>

        {/* ── Profile info ─────────────────────────────────── */}
        <div className="card">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3">
              <div className="stat-icon" style={{ background: 'var(--accent-subtle)' }}>
                <User size={18} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-1)' }}>Profile</p>
                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Update your name and display info</p>
              </div>
            </div>
          </div>

          <div style={{ padding: '20px 24px', display: 'grid', gap: 16 }}>
            {/* Avatar row */}
            <div className="flex items-center gap-4">
              <div className="avatar lg">
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 15 }}>{user?.name}</p>
                <p style={{ fontSize: 13, color: 'var(--text-3)' }}>{user?.email}</p>
              </div>
            </div>

            {/* Name field */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>
                Display Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  className="input-field"
                  placeholder="Your name"
                />
              </div>
            </div>

            {/* Email field (read-only) */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
                <input
                  type="email"
                  value={profile.email}
                  readOnly
                  className="input-field"
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>
                Email cannot be changed
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={saveProfile} disabled={profileSaving} className="btn-primary">
                {profileSaving
                  ? <><span className="spinner-sm" />Saving…</>
                  : <><Save size={14} />Save Changes</>}
              </button>
            </div>
          </div>
        </div>

        {/* ── Bio page link ────────────────────────────────── */}
        <div className="card">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3">
              <div className="stat-icon" style={{ background: 'var(--info-subtle, rgba(59,130,246,0.1))' }}>
                <Globe size={18} style={{ color: 'var(--info, #3B82F6)' }} />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-1)' }}>Bio Page</p>
                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Your public link-in-bio page</p>
              </div>
            </div>
          </div>
          <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              flex: 1, padding: '10px 14px', borderRadius: 8,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              fontSize: 13, color: 'var(--text-3)',
            }}>
              snipli.app/bio/<span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                {encodeURIComponent(user?.name || '')}
              </span>
            </div>
            <a
              href={`/bio/${encodeURIComponent(user?.name || '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              View Page
            </a>
          </div>
          <div style={{ padding: '0 24px 16px' }}>
            <p style={{ fontSize: 12, color: 'var(--text-4)' }}>
              Make links public (toggle "Show on Bio" when creating a link) to display them here.
            </p>
          </div>
        </div>

        {/* ── Change password ──────────────────────────────── */}
        <div className="card">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3">
              <div className="stat-icon" style={{ background: 'var(--success-subtle)' }}>
                <ShieldCheck size={18} style={{ color: 'var(--success)' }} />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-1)' }}>Change Password</p>
                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Use a strong, unique password</p>
              </div>
            </div>
          </div>

          <div style={{ padding: '20px 24px', display: 'grid', gap: 14 }}>
            {/* Current password */}
            {[
              { key: 'current', label: 'Current Password', placeholder: '••••••••' },
              { key: 'next',    label: 'New Password',     placeholder: '8+ characters' },
              { key: 'confirm', label: 'Confirm New Password', placeholder: 'Same as above' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>
                  {label}
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
                  <input
                    type={showPw[key] ? 'text' : 'password'}
                    value={pw[key]}
                    onChange={e => { setPw(p => ({ ...p, [key]: e.target.value })); setPwErrors(er => ({ ...er, [key]: '' })); }}
                    className={`input-field pr-icon${pwErrors[key] ? ' err' : ''}`}
                    placeholder={placeholder}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => ({ ...s, [key]: !s[key] }))}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {showPw[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {pwErrors[key] && <p style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>{pwErrors[key]}</p>}
                {key === 'next' && pwStrength && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ height: 3, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: pwStrength.w, background: pwStrength.color, borderRadius: 4, transition: 'width 0.3s' }} />
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
                      Strength: <span style={{ color: pwStrength.color, fontWeight: 600 }}>{pwStrength.label}</span>
                    </p>
                  </div>
                )}
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={savePassword} disabled={pwSaving} className="btn-primary">
                {pwSaving
                  ? <><span className="spinner-sm" />Updating…</>
                  : <><ShieldCheck size={14} />Update Password</>}
              </button>
            </div>
          </div>
        </div>

        {/* ── Danger zone ──────────────────────────────────── */}
        <div className="card" style={{ border: '1px solid rgba(239,68,68,0.25)' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
            <div className="flex items-center gap-3">
              <div className="stat-icon" style={{ background: 'var(--danger-subtle)' }}>
                <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--danger)' }}>Danger Zone</p>
                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Irreversible actions — proceed carefully</p>
              </div>
            </div>
          </div>

          <div style={{ padding: '20px 24px' }}>
            {deletePhase === 0 && (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>Delete Account</p>
                  <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
                    Permanently delete your account and all your short links. This cannot be undone.
                  </p>
                </div>
                <button onClick={() => setDeletePhase(1)} className="btn-danger" style={{ flexShrink: 0 }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}

            {deletePhase >= 1 && (
              <div style={{ display: 'grid', gap: 14 }}>
                <div style={{
                  padding: '12px 16px', borderRadius: 8,
                  background: 'var(--danger-subtle)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  fontSize: 13, color: 'var(--danger)',
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>
                    This will permanently delete <strong>your account and all {user?.totalLinks ?? 'your'} short links</strong>.
                    All analytics data will be lost. This action <strong>cannot be undone</strong>.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, color: 'var(--text-2)', marginBottom: 6 }}>
                    Type your email <strong>{user?.email}</strong> to confirm
                  </label>
                  <input
                    type="email"
                    value={deleteInput}
                    onChange={e => setDeleteInput(e.target.value)}
                    className="input-field no-icon"
                    placeholder={user?.email}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button onClick={() => { setDeletePhase(0); setDeleteInput(''); }} className="btn-secondary">
                    Cancel
                  </button>
                  <button
                    onClick={deleteAccount}
                    disabled={deleteInput !== user?.email || deletePhase === 2}
                    className="btn-danger"
                    style={{ opacity: deleteInput !== user?.email ? 0.5 : 1 }}
                  >
                    {deletePhase === 2
                      ? <><span className="spinner-sm" />Deleting…</>
                      : <><Trash2 size={14} />Delete My Account</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
