import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Package, Plus, Trash2 } from 'lucide-react';
import { usePricingRules, usePricingConfig } from '../../hooks/useData';
import { db } from '../../backend';
import { formatPHP } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Checkbox, ConfirmDialog, EmptyState, Field, Input, Modal, SearchInput, Select, StatusBadge, Table, THead, TH, TR, TD, SectionHeader } from '../../components/ui';
import type { PricingConfig, PricingRule } from '../../types';
import { PROJECT_TYPES, SCOPES } from '../../lib/constants';

export default function AdminPricing() {
  const { pricingRules, loading } = usePricingRules();
  const { config, loading: configLoading } = usePricingConfig();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PricingRule | null>(null);
  const [deleting, setDeleting] = useState<PricingRule | null>(null);
  const [form, setForm] = useState<{ name: string; projectType: string; scope: string; baseRate: number }>({ name: '', projectType: PROJECT_TYPES[0], scope: SCOPES[0], baseRate: 0 });
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return pricingRules.filter((r) => [r.name, r.projectType, r.scope].join(' ').toLowerCase().includes(q));
  }, [pricingRules, query]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', projectType: PROJECT_TYPES[0], scope: SCOPES[0], baseRate: 25000 });
    setFormOpen(true);
  };

  const openEdit = (r: PricingRule) => {
    setEditing(r);
    setForm({ name: r.name, projectType: r.projectType, scope: r.scope, baseRate: r.baseRate });
    setFormOpen(true);
  };

  const save = async () => {
    if (form.baseRate < 0) {
      toast.error('Base rate must be zero or more.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, isActive: form.baseRate > 0, version: editing?.version ?? 1, effectiveDate: editing?.effectiveDate ?? new Date().toISOString().slice(0, 10) };
      if (editing) {
        await db.pricingRules.update(editing.id, payload);
        toast.success('Pricing rule updated');
      } else {
        await db.pricingRules.create(payload);
        toast.success('Pricing rule created');
      }
      if (user) await db.createAuditLog({ actorId: user.uid, actorName: user.fullName, actorRole: user.role, action: editing ? 'pricing_rule_updated' : 'pricing_rule_created', module: 'pricing', targetId: editing?.id, metadata: { name: payload.name, baseRate: payload.baseRate } });
      setFormOpen(false);
    } catch {
      toast.error('Unable to save the pricing rule.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await db.pricingRules.remove(deleting.id);
      toast.success('Pricing rule deleted');
    } catch {
      toast.error('Unable to delete the pricing rule.');
    } finally {
      setDeleting(null);
    }
  };

  const updateMultiplier = async (key: keyof Pick<PricingConfig, 'laborMultiplier' | 'materialMultipliers' | 'designMultipliers' | 'scopeMultipliers'>, subKey: string | null, value: number) => {
    if (!config) return;
    try {
      if (key === 'laborMultiplier') {
        await db.setPricingConfig({ ...config, laborMultiplier: value });
      } else if (key === 'materialMultipliers') {
        await db.setPricingConfig({ ...config, materialMultipliers: { ...config.materialMultipliers, [subKey!]: value } });
      } else if (key === 'designMultipliers') {
        await db.setPricingConfig({ ...config, designMultipliers: { ...config.designMultipliers, [subKey!]: value } });
      } else {
        await db.setPricingConfig({ ...config, scopeMultipliers: { ...config.scopeMultipliers, [subKey!]: value } });
      }
      toast.success('Multiplier updated');
    } catch {
      toast.error('Unable to update the multiplier.');
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Quotation engine"
        title="Pricing rules"
        description="Base rates per square meter used by the Smart Quotation Assistant."
        action={<Button onClick={openNew}><Plus size={16} /> New rule</Button>}
      />

      <SearchInput value={query} onChange={setQuery} placeholder="Search rules…" className="max-w-sm" />

      {loading ? (
        <Table><THead><TR><TH>Rule</TH><TH>Type</TH><TH>Scope</TH><TH>Base rate</TH><TH /></TR></THead></Table>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Package size={22} />} title="No pricing rules" description="Create a base rate for each project type and scope." action={<Button onClick={openNew}><Plus size={16} /> New rule</Button>} />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Rule</TH>
              <TH>Project type</TH>
              <TH>Scope</TH>
              <TH>Base rate / sqm</TH>
              <TH>Status</TH>
              <TH>Actions</TH>
            </TR>
          </THead>
          <tbody>
            {filtered.map((r) => (
              <TR key={r.id}>
                <TD className="font-semibold text-agdark-800">{r.name}</TD>
                <TD>{r.projectType}</TD>
                <TD>{r.scope}</TD>
                <TD className="font-mono-data font-semibold">{formatPHP(r.baseRate)}</TD>
                <TD><StatusBadge status={r.isActive ? 'Active' : 'Inactive'} /></TD>
                <TD>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(r)} className="rounded-lg p-2 text-agdark-400 transition hover:bg-agdark-100 hover:text-agdark-700" aria-label="Edit"><Pencil size={15} /></button>
                    <button onClick={() => setDeleting(r)} className="rounded-lg p-2 text-agdark-400 transition hover:bg-red-50 hover:text-red-600" aria-label="Delete"><Trash2 size={15} /></button>
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}

      <Card className="p-6">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-agdark-800">Adjustment multipliers</h2>
        <p className="mt-1 text-sm text-agdark-500">These multipliers scale the base cost in the estimation engine. Values are saved immediately.</p>

        {configLoading || !config ? (
          <p className="mt-4 text-sm text-agdark-400">Loading configuration…</p>
        ) : (
          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-agdark-500">Labor multiplier</p>
              <div className="mt-2 flex items-center gap-3">
                <Input type="number" step="0.01" min="0" value={config.laborMultiplier} onChange={(e) => updateMultiplier('laborMultiplier', null, Number(e.target.value) || 0)} className="max-w-[160px]" />
                <span className="text-xs text-agdark-400">× base cost</span>
              </div>
            </div>
            <MultiplierEditor label="Material preference" items={Object.entries(config.materialMultipliers)} onChange={(k, v) => updateMultiplier('materialMultipliers', k, v)} />
            <MultiplierEditor label="Design preference" items={Object.entries(config.designMultipliers)} onChange={(k, v) => updateMultiplier('designMultipliers', k, v)} />
            <MultiplierEditor label="Scope of work" items={Object.entries(config.scopeMultipliers)} onChange={(k, v) => updateMultiplier('scopeMultipliers', k, v)} />
          </div>
        )}
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit pricing rule' : 'New pricing rule'}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Save changes' : 'Create rule'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Rule name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Auto-generated if blank" />
          </Field>
          <Field label="Project type" required>
            <Select value={form.projectType} onChange={(e) => setForm({ ...form, projectType: e.target.value })}>
              {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Scope" required>
            <Select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })}>
              {SCOPES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Base rate (₱ per sqm)" required>
            <Input type="number" min="0" step="500" value={form.baseRate || ''} onChange={(e) => setForm({ ...form, baseRate: Number(e.target.value) || 0 })} />
          </Field>
          <Checkbox label="Active" checked={form.baseRate > 0} onChange={() => {}} />
          <p className="text-xs text-agdark-400">A rule is automatically active when its base rate is greater than zero.</p>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete this pricing rule?"
        message={`"${deleting?.name}" will be removed from the engine.`}
        confirmLabel="Delete rule"
      />
    </div>
  );
}

function MultiplierEditor({ label, items, onChange }: { label: string; items: [string, number][]; onChange: (key: string, value: number) => void }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-agdark-500">{label}</p>
      <div className="mt-2 space-y-2">
        {items.map(([key, value]) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <span className="text-sm text-agdark-600">{key}</span>
            <Input type="number" step="0.01" min="0" value={value} onChange={(e) => onChange(key, Number(e.target.value) || 0)} className="max-w-[140px] text-right" />
          </div>
        ))}
      </div>
    </div>
  );
}
