import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Eye, EyeOff, Info } from 'lucide-react';
import { auth, isDemoMode } from '../../backend';
import { Button, Input } from '../../components/ui';
import { Logo } from '../../layouts/PublicLayout';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await auth.login(email.trim(), password, remember);
      toast.success('Welcome back!');
      navigate(from || '/', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: 'admin' | 'client') => {
    if (role === 'admin') {
      setEmail('admin@agbuilders.ph');
      setPassword('Admin123!');
    } else {
      setEmail('client@agbuilders.ph');
      setPassword('Client123!');
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-agdark-800">
      <div className="absolute inset-0 blueprint-grid" aria-hidden="true" />
      <div className="relative z-10 flex items-center justify-between px-6 py-6">
        <Link to="/" aria-label="Back to home">
          <Logo dark />
        </Link>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-agdark-300 hover:text-white">
          <ArrowLeft size={15} /> Back to site
        </Link>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 shadow-2xl">
            <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-agdark-800">Log in</h1>
            <p className="mt-1 text-sm text-agdark-500">Access your dashboard and continue your projects.</p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Email</span>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required className="mt-1.5" />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Password</span>
                <div className="relative mt-1.5">
                  <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="pr-10" />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-agdark-400 hover:text-agdark-700" aria-label="Toggle password visibility">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-agdark-600">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-agdark-300 text-agorange focus:ring-agorange" />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-sm font-semibold text-agorange hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" size="lg" className="w-full" loading={loading}>
                Log in
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-agdark-500">
              New here?{' '}
              <Link to="/register" className="font-bold text-agorange hover:underline">
                Create an account
              </Link>
            </p>
          </div>

          {isDemoMode ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-agdark-200">
              <p className="flex items-center gap-1.5 font-semibold text-white">
                <Info size={14} className="text-agorange" /> Demo mode
              </p>
              <p className="mt-1.5">Quick-fill a demo account:</p>
              <div className="mt-2 flex gap-2">
                <button onClick={() => fillDemo('admin')} className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/10">
                  Admin demo
                </button>
                <button onClick={() => fillDemo('client')} className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/10">
                  Client demo
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
