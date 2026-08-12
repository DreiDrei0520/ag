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

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Admin portal" title="Profile settings" description="Your administrator account details." />

      <Card className="max-w-xl p-6">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-agdark-800">Personal details</h2>
        <form onSubmit={saveProfile} className="mt-5 space-y-4">
          <Field label="Full name" required>
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </Field>
          <Field label="Email" hint="Contact support to change your email address.">
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
    </div>
  );
}
