import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Link2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const { login }   = useAuth();
  const navigate    = useNavigate();

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
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^a-zA-Z0-9]/.test(p)) s++;
    if (s <= 1) return { label: 'Weak',   color: '#ef4444', w: '20%' };
    if (s <= 2) return { label: 'Fair',   color: '#f59e0b', w: '45%' };
    if (s <= 3) return { label: 'Good',   color: '#3b82f6', w: '65%' };
    return          { label: 'Strong', color: '#10b981', w: '100%' };
  })();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Link2 size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Snipli</span>
          </div>
          <h1 className="text-2xl font-bold t1">Create your account</h1>
          <p className="t3 mt-1">Start shortening URLs in seconds</p>
        </div>

        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Name */}
            <div>
              <label className="block text-sm font-medium t2 mb-1.5">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 t4 pointer-events-none" />
                <input
                  type="text" name="name"
                  value={form.name} onChange={handleChange}
                  placeholder="John Doe"
                  className={`input-field${errors.name ? ' err' : ''}`}
                  autoComplete="name"
                />
              </div>
              {errors.name && <p className="mt-1 text-xs t-danger">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium t2 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 t4 pointer-events-none" />
                <input
                  type="email" name="email"
                  value={form.email} onChange={handleChange}
                  placeholder="you@example.com"
                  className={`input-field${errors.email ? ' err' : ''}`}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs t-danger">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium t2 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 t4 pointer-events-none" />
                <input
                  type={showPw ? 'text' : 'password'} name="password"
                  value={form.password} onChange={handleChange}
                  placeholder="••••••••"
                  className={`input-field pr-icon${errors.password ? ' err' : ''}`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-4)' }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {strength && (
                <div className="mt-2">
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full transition-all duration-300 rounded-full"
                         style={{ width: strength.w, background: strength.color }} />
                  </div>
                  <p className="text-xs t3 mt-1">Strength: <span className="t2">{strength.label}</span></p>
                </div>
              )}
              {errors.password && <p className="mt-1 text-xs t-danger">{errors.password}</p>}
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-sm font-medium t2 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 t4 pointer-events-none" />
                <input
                  type={showPw ? 'text' : 'password'} name="confirm"
                  value={form.confirm} onChange={handleChange}
                  placeholder="••••••••"
                  className={`input-field${errors.confirm ? ' err' : ''}`}
                  autoComplete="new-password"
                />
              </div>
              {errors.confirm && <p className="mt-1 text-xs t-danger">{errors.confirm}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-6 py-2.5">
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="spinner-sm" />Creating account…</span>
                : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm t3 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-500 hover:text-indigo-400 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
