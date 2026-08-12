import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { auth } from '../../backend';
import { Button, Input } from '../../components/ui';
import { Logo } from '../../layouts/PublicLayout';

const PASSWORD_MIN = 8;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', address: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validPassword = form.password.length >= PASSWORD_MIN;
  const valid = Boolean(form.fullName.trim() && form.email.trim() && validPassword && form.password === form.confirm);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await auth.registerClient({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
      });
      toast.success('Account created — welcome to AG Construction!');
      navigate('/client/dashboard', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to create your account. Please try again.');
    } finally {
      setLoading(false);
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
            <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-agdark-800">Create account</h1>
            <p className="mt-1 text-sm text-agdark-500">Track quotations, inquiries, and bookings from one dashboard.</p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Full name</span>
                <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Juan Dela Cruz" required className="mt-1.5" />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Email</span>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" required className="mt-1.5" />
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Phone</span>
                  <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Optional" className="mt-1.5" />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Address</span>
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Optional" className="mt-1.5" />
                </label>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Password</span>
                  <div className="relative mt-1.5">
                    <Input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 characters" required className="pr-10" />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-agdark-400 hover:text-agdark-700" aria-label="Toggle password visibility">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {!validPassword && form.password ? (
                    <p className="mt-1 text-xs text-red-600">Password must be at least {PASSWORD_MIN} characters.</p>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Confirm password</span>
                  <Input type={showPassword ? 'text' : 'password'} value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} placeholder="Repeat password" required className="mt-1.5" />
                  {form.confirm && form.confirm !== form.password ? (
                    <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
                  ) : null}
                </label>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={!valid} loading={loading}>
                Create account
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-agdark-500">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-agorange hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
