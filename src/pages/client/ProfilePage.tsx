import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../backend';
import { Button, Card, Field, Input, SectionHeader } from '../../components/ui';

export default function ClientProfile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName ?? '',
    phone: user?.phone ?? '',
    address: user?.address ?? '',
  });
  const [password, setPassword] = useState({ current: '', next: '' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

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

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.next.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    setSavingPw(true);
    try {
      await auth.changePassword(password.current, password.next);
      setPassword({ current: '', next: '' });
      toast.success('Password updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to change password.');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Client portal" title="Profile settings" description="Manage the contact details we use for your projects." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-agdark-800">Personal details</h2>
          <form onSubmit={saveProfile} className="mt-5 space-y-4">
            <Field label="Full name" required>
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </Field>
            <Field label="Email" hint="Contact us to change your email address.">
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

        <Card className="p-6">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-agdark-800">Change password</h2>
          <form onSubmit={changePassword} className="mt-5 space-y-4">
            <Field label="Current password" required>
              <Input type="password" value={password.current} onChange={(e) => setPassword({ ...password, current: e.target.value })} required />
            </Field>
            <Field label="New password" required>
              <Input type="password" value={password.next} onChange={(e) => setPassword({ ...password, next: e.target.value })} required placeholder="Min. 8 characters" />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" loading={savingPw} disabled={!password.current || !password.next}>Update password</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
