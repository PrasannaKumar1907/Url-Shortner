import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Link2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name || data.user.email}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(er => ({ ...er, [e.target.name]: '' }));
  };

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
          <h1 className="text-2xl font-bold t1">Welcome back</h1>
          <p className="t3 mt-1">Sign in to manage your short links</p>
        </div>

        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

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
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 t4 hover:t2 transition-colors"
                  style={{ color: 'var(--text-4)' }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs t-danger">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-6 py-2.5">
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="spinner-sm" />Signing in…</span>
                : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm t3 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-500 hover:text-indigo-400 font-medium">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
