import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, KeyRound, MailCheck } from 'lucide-react';
import { auth, isDemoMode } from '../../backend';
import { Button, Input } from '../../components/ui';
import { Logo } from '../../layouts/PublicLayout';

type Step = 'email' | 'code' | 'done' | 'sent-link';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await auth.requestPasswordResetCode(email.trim());
      if (!result.sentCode) {
        setStep('sent-link');
      } else {
        setDemoCode(result.demoCode ?? '');
        setStep('code');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await auth.resetPasswordWithCode(email.trim(), code.trim(), newPassword);
      setStep('done');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to reset password. Please try again.');
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
            {step === 'done' && (
              <div className="py-6 text-center">
                <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
                <h1 className="mt-4 font-display text-2xl font-extrabold uppercase tracking-wide text-agdark-800">Password changed</h1>
                <p className="mt-2 text-sm leading-6 text-agdark-500">
                  Your password has been updated successfully. You can now log in with your new password.
                </p>
                <Link to="/login" className="btn-primary mt-6">
                  Log in
                </Link>
              </div>
            )}

            {step === 'sent-link' && (
              <div className="py-6 text-center">
                <MailCheck size={40} className="mx-auto text-agorange" />
                <h1 className="mt-4 font-display text-2xl font-extrabold uppercase tracking-wide text-agdark-800">Check your email</h1>
                <p className="mt-2 text-sm leading-6 text-agdark-500">
                  {isDemoMode ? (
                    <>
                      We sent a 6-digit verification code to <span className="font-semibold text-agdark-700">{email}</span>. The code expires in 10 minutes.
                    </>
                  ) : (
                    <>
                      We sent password-reset instructions to <span className="font-semibold text-agdark-700">{email}</span>. Follow the link in the email to set a new password.
                    </>
                  )}
                </p>
                {isDemoMode ? (
                  <button type="button" onClick={() => setStep('code')} className="btn-primary mt-6 w-full">
                    I have a code
                  </button>
                ) : null}
                <Link to="/login" className="btn-secondary mt-3 w-full">
                  Back to log in
                </Link>
              </div>
            )}

            {step === 'email' && (
              <>
                <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-agdark-800">Reset password</h1>
                <p className="mt-1 text-sm text-agdark-500">
                  Enter your account email and we'll send you a verification code to change your password.
                </p>
                <form onSubmit={sendCode} className="mt-6 space-y-4">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Email</span>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required className="mt-1.5" />
                  </label>
                  <Button type="submit" size="lg" className="w-full" loading={loading}>
                    Send verification code
                  </Button>
                </form>
                <p className="mt-5 text-center text-sm text-agdark-500">
                  Remembered it?{' '}
                  <Link to="/login" className="font-bold text-agorange hover:underline">
                    Log in
                  </Link>
                </p>
              </>
            )}

            {step === 'code' && (
              <>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-agorange/10 text-agorange">
                    <KeyRound size={20} />
                  </span>
                  <div>
                    <h1 className="font-display text-2xl font-extrabold uppercase tracking-wide text-agdark-800">Verify &amp; change password</h1>
                    <p className="text-sm text-agdark-500">for {email}</p>
                  </div>
                </div>

                {demoCode && (
                  <div className="mt-5 rounded-xl border border-agorange/30 bg-agorange/10 p-4 text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-agorange">Demo mode</p>
                    <p className="mt-1 font-display text-2xl font-extrabold tracking-widest text-agdark-800">{demoCode}</p>
                    <p className="mt-1 text-xs text-agdark-500">This code expires in 10 minutes. In production it is sent by email.</p>
                  </div>
                )}

                <form onSubmit={resetWithCode} className="mt-6 space-y-4">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Verification code</span>
                    <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" inputMode="numeric" maxLength={6} required className="mt-1.5 text-center font-mono text-lg tracking-[0.4em]" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">New password</span>
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" required className="mt-1.5" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Confirm new password</span>
                    <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" required className="mt-1.5" />
                  </label>
                  <Button type="submit" size="lg" className="w-full" loading={loading}>
                    Change password
                  </Button>
                </form>
                <p className="mt-5 text-center text-sm text-agdark-500">
                  Didn't get a code?{' '}
                  <button type="button" onClick={() => setStep('email')} className="font-bold text-agorange hover:underline">
                    Resend
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
