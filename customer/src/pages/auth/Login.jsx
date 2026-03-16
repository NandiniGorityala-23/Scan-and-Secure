import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import useAuthStore from '../../store/auth.store';
import AuthInput from '../../components/ui/AuthInput';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: 'customer',
      });
      setAuth(data.user, data.token);
      navigate(redirect);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="size-14 rounded-2xl bg-white/10 flex items-center justify-center">
            <ShieldCheck size={28} className="text-white" />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-xl font-bold text-slate-900 mb-1">Sign in</h1>
          <p className="text-sm text-slate-500 mb-6">Access your warranty records</p>
          <form onSubmit={submit} className="space-y-4">
            <AuthInput
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@email.com"
              value={form.email}
              onChange={handle}
              required
            />
            <AuthInput
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="********"
              value={form.password}
              onChange={handle}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            No account?{' '}
            <Link to="/register" className="text-indigo-600 font-medium hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
