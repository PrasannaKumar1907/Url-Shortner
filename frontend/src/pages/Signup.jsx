import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Link2, Mail, Lock, User, Eye, EyeOff, Zap, BarChart2, Shield } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/signup', {
        name: form.name.trim(), email: form.email, password: form.password,
      });
      login(data.token, data.user);
      toast.success('Account created! Welcome aboard.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed');
    } finally { setLoading(false); }
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(er => ({ ...er, [e.target.name]: '' }));
  };

  const strength = (() => {
    const p = form.password;
    if (!p) return null;
    let s = 0;
    if (p.length >= 8)  s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^a-zA-Z0-9]/.test(p)) s++;
    if (s <= 1) return { label: 'Weak',   color: 'var(--danger)',  w: '20%' };
    if (s <= 2) return { label: 'Fair',   color: 'var(--warning)', w: '45%' };
    if (s <= 3) return { label: 'Good',   color: 'var(--info)',    w: '65%' };
    return          { label: 'Strong', color: 'var(--success)', w: '100%' };
  })();

  const features = [
    { icon: Zap,       text: 'Shorten links in seconds' },
    { icon: BarChart2, text: 'Track clicks & analytics' },
    { icon: Shield,    text: 'Password & expiry controls' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── Left panel (brand) ── */}
      <div style={{
        flex: '0 0 420px',
        background: '#111827',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 48px',
      }} className="auth-left">

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: '#EE6123',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Link2 size={20} color="#fff" />
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Snipli</span>
        </div>

        <h2 style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 12, lineHeight: 1.3 }}>
          Start for free. Grow fast.
        </h2>
        <p style={{ fontSize: 15, color: '#9CA3AF', marginBottom: 40, lineHeight: 1.6 }}>
          Create unlimited short links and get powerful insights with every click.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {features.map(({ icon: Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: 'rgba(238,97,35,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={17} color="#EE6123" />
              </div>
              <span style={{ fontSize: 14, color: '#D1D5DB' }}>{text}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 48 }}>
          <p style={{ fontSize: 12, color: '#4B5563' }}>© 2024 Snipli · All rights reserved</p>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        background: 'var(--bg-page)',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' }}
               className="auth-mobile-logo">
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: '#EE6123',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Link2 size={18} color="#fff" />
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.5px' }}>Snipli</span>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>
            Create your account
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 28 }}>
            Start shortening URLs in seconds — it's free
          </p>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
                <input
                  type="text" name="name"
                  value={form.name} onChange={handleChange}
                  placeholder="John Doe"
                  className={`input-field${errors.name ? ' err' : ''}`}
                  autoComplete="name"
                />
              </div>
              {errors.name && <p style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
                <input
                  type="email" name="email"
                  value={form.email} onChange={handleChange}
                  placeholder="you@example.com"
                  className={`input-field${errors.email ? ' err' : ''}`}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
                <input
                  type={showPw ? 'text' : 'password'} name="password"
                  value={form.password} onChange={handleChange}
                  placeholder="8+ characters"
                  className={`input-field pr-icon${errors.password ? ' err' : ''}`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                           color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {strength && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ height: 3, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: strength.w, background: strength.color,
                                  borderRadius: 4, transition: 'width 0.3s' }} />
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
                    Strength: <span style={{ color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                  </p>
                </div>
              )}
              {errors.password && <p style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>{errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
                <input
                  type={showPw ? 'text' : 'password'} name="confirm"
                  value={form.confirm} onChange={handleChange}
                  placeholder="••••••••"
                  className={`input-field${errors.confirm ? ' err' : ''}`}
                  autoComplete="new-password"
                />
              </div>
              {errors.confirm && <p style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>{errors.confirm}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary"
              style={{ width: '100%', padding: '11px 0', marginTop: 6, fontSize: 15 }}>
              {loading
                ? <><span className="spinner-sm" />Creating account…</>
                : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-3)', marginTop: 24 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
