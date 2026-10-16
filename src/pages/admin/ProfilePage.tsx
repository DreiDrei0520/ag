import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../backend';
import { Button, Card, Field, Input, SectionHeader } from '../../components/ui';

export default function AdminProfile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName ?? '',
    phone: user?.phone ?? '',
    address: user?.address ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [emailForm, setEmailForm] = useState({ newEmail: '', currentPassword: '' });
  const [changingEmail, setChangingEmail] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  if (!user) return null;

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await auth.updateProfile(user.uid, {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      });
      refreshUser();
      toast.success('Profile updated');
    } catch {
      toast.error('Unable to update your profile.');
    } finally {
      setSaving(false);
    }
  };

  const changeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingEmail(true);
    try {
      const { pendingVerification } = await auth.changeEmail(emailForm.currentPassword, emailForm.newEmail);
      setEmailForm({ newEmail: '', currentPassword: '' });
      if (pendingVerification) {
        toast.success(`Verification link sent to ${emailForm.newEmail.trim()}. Open it to finish the change, then log in with the new email.`, { duration: 8000 });
      } else {
        refreshUser();
        toast.success('Login email updated');
      }
    } catch (err) {
      toast.error(emailErrorMessage(err));
    } finally {
      setChangingEmail(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (passwordForm.newPassword === passwordForm.currentPassword) {
      toast.error('New password must be different from your current password.');
      return;
    }
    setChangingPassword(true);
    try {
      await auth.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated');
    } catch (err) {
      toast.error(passwordErrorMessage(err));
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Admin portal" title="Profile settings" description="Your administrator account details." />

      <Card className="max-w-xl p-6">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-agdark-800">Personal details</h2>
        <form onSubmit={saveProfile} className="mt-5 space-y-4">
          <Field label="Full name" required>
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </Field>
          <Field label="Email" hint="Change your login email in the section below.">
            <Input value={user.email} disabled />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Address">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" loading={saving}>Save changes</Button>
          </div>
        </form>
      </Card>

      <Card className="max-w-xl p-6">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-agdark-800">Change login email</h2>
        <p className="mt-1 text-sm text-agdark-500">Enter your current password to confirm it's you.</p>
        <form onSubmit={changeEmail} className="mt-5 space-y-4">
          <Field label="New email" required>
            <Input
              type="email"
              autoComplete="email"
              value={emailForm.newEmail}
              onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
              required
            />
          </Field>
          <Field label="Current password" required>
            <Input
              type="password"
              autoComplete="current-password"
              value={emailForm.currentPassword}
              onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })}
              required
            />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" loading={changingEmail}>Change email</Button>
          </div>
        </form>
      </Card>

      <Card className="max-w-xl p-6">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-agdark-800">Change password</h2>
        <p className="mt-1 text-sm text-agdark-500">Enter your current password to confirm it's you.</p>
        <form onSubmit={changePassword} className="mt-5 space-y-4">
          <Field label="Current password" required>
            <Input
              type="password"
              autoComplete="current-password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              required
            />
          </Field>
          <Field label="New password" hint="At least 8 characters." required>
            <Input
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              required
            />
          </Field>
          <Field label="Confirm new password" required>
            <Input
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              required
            />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" loading={changingPassword}>Change password</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function emailErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code;
  switch (code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Current password is incorrect.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/email-already-in-use':
      return 'Another account already uses this email.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/requires-recent-login':
      return 'Please log out and log in again, then retry.';
    default:
      return err instanceof Error && !code ? err.message : 'Unable to change your email.';
  }
}

function passwordErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code;
  switch (code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Current password is incorrect.';
    case 'auth/weak-password':
      return 'New password is too weak. Use at least 8 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/requires-recent-login':
      return 'Please log out and log in again, then retry.';
    default:
      return err instanceof Error && !code ? err.message : 'Unable to change your password.';
  }
}
