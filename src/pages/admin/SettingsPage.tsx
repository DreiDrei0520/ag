import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../hooks/useData';
import { db } from '../../backend';
import { writeAuditLog } from '../../lib/activity';
import { Button, Card, Input, PageLoader, Textarea } from '../../components/ui';
import type { SystemSettings } from '../../types';

const EMPTY: SystemSettings = {
  companyName: '',
  companyTagline: '',
  companyDescription: '',
  logoUrl: '',
  email: '',
  phone: '',
  address: '',
  businessHours: '',
  facebook: '',
  instagram: '',
  quotationDisclaimer: '',
  currency: '₱',
};

export default function AdminSettings() {
  const { user } = useAuth();
  const { settings, loading } = useSettings();
  const [form, setForm] = useState<SystemSettings>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  if (loading) return <PageLoader label="Loading settings…" />;

  const set = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      await db.setSettings(form);
      if (user) await writeAuditLog({ actor: user }, 'settings_updated', 'settings');
      toast.success('Settings saved');
    } catch {
      toast.error('Unable to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-agdark-800">Site settings</h1>
          <p className="mt-1 text-sm text-agdark-500">Company information used across the public site and quotations.</p>
        </div>
        <Button onClick={save} loading={saving}><Save size={15} /> Save changes</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-agdark-800">Company profile</h2>
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Company name</span>
              <Input className="mt-1.5" value={form.companyName} onChange={(e) => set('companyName', e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Tagline</span>
              <Input className="mt-1.5" value={form.companyTagline} onChange={(e) => set('companyTagline', e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Description</span>
              <Textarea className="mt-1.5" rows={3} value={form.companyDescription} onChange={(e) => set('companyDescription', e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Currency symbol</span>
              <Input className="mt-1.5" value={form.currency} onChange={(e) => set('currency', e.target.value)} />
            </label>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-agdark-800">Contact details</h2>
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Email</span>
              <Input className="mt-1.5" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Phone</span>
              <Input className="mt-1.5" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Address</span>
              <Input className="mt-1.5" value={form.address} onChange={(e) => set('address', e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Business hours</span>
              <Input className="mt-1.5" value={form.businessHours} onChange={(e) => set('businessHours', e.target.value)} />
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Facebook</span>
                <Input className="mt-1.5" value={form.facebook} onChange={(e) => set('facebook', e.target.value)} />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Instagram</span>
                <Input className="mt-1.5" value={form.instagram} onChange={(e) => set('instagram', e.target.value)} />
              </label>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-agdark-800">Quotation disclaimer</h2>
        <p className="mt-1 text-sm text-agdark-500">Printed on every generated quotation document.</p>
        <Textarea className="mt-4" rows={4} value={form.quotationDisclaimer} onChange={(e) => set('quotationDisclaimer', e.target.value)} />
      </Card>
    </div>
  );
}
