import { useState } from 'react';
import toast from 'react-hot-toast';
import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAdditionalServices } from '../../hooks/useData';
import { db } from '../../backend';
import { formatPHP } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, Select, StatusBadge, Table, THead, TH, TR, TD, SectionHeader, Textarea } from '../../components/ui';
import type { AdditionalService } from '../../types';

const emptyForm = { name: '', description: '', price: 0, unit: 'lump sum' as AdditionalService['unit'], category: 'Design', isActive: true };

export default function AdminAdditionalServices() {
  const { additionalServices, loading } = useAdditionalServices();
  const { user } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdditionalService | null>(null);
  const [deleting, setDeleting] = useState<AdditionalService | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (s: AdditionalService) => {
    setEditing(s);
    setForm({ name: s.name, description: s.description, price: s.price, unit: s.unit, category: s.category, isActive: s.isActive });
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await db.additionalServices.update(editing.id, form);
        toast.success('Additional service updated');
      } else {
        await db.additionalServices.create(form);
        toast.success('Additional service created');
      }
      if (user) await db.createAuditLog({ actorId: user.uid, actorName: user.fullName, actorRole: user.role, action: editing ? 'additional_service_updated' : 'additional_service_created', module: 'pricing', targetId: editing?.id });
      setFormOpen(false);
    } catch {
      toast.error('Unable to save the additional service.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await db.additionalServices.remove(deleting.id);
      toast.success('Additional service deleted');
    } catch {
      toast.error('Unable to delete the additional service.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Quotation engine"
        title="Additional services"
        description="Optional add-ons clients can select during the Smart Quotation flow."
        action={<Button onClick={openNew}><Plus size={16} /> New additional service</Button>}
      />

      {loading ? (
        <Card className="h-40" />
      ) : additionalServices.length === 0 ? (
        <EmptyState icon={<ClipboardList size={22} />} title="No additional services" description="Add optional services like permits or rendering packages." action={<Button onClick={openNew}><Plus size={16} /> New additional service</Button>} />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Category</TH>
              <TH>Pricing</TH>
              <TH>Status</TH>
              <TH>Actions</TH>
            </TR>
          </THead>
          <tbody>
            {additionalServices.map((s) => (
              <TR key={s.id}>
                <TD>
                  <p className="font-semibold text-agdark-800">{s.name}</p>
                  <p className="max-w-md truncate text-xs text-agdark-400">{s.description}</p>
                </TD>
                <TD>{s.category}</TD>
                <TD className="font-mono-data font-semibold">{formatPHP(s.price)}<span className="text-xs font-normal text-agdark-400"> {s.unit === 'per sqm' ? '/ sqm' : ' lump sum'}</span></TD>
                <TD><StatusBadge status={s.isActive ? 'Active' : 'Inactive'} /></TD>
                <TD>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(s)} className="rounded-lg p-2 text-agdark-400 transition hover:bg-agdark-100 hover:text-agdark-700" aria-label="Edit"><Pencil size={15} /></button>
                    <button onClick={() => setDeleting(s)} className="rounded-lg p-2 text-agdark-400 transition hover:bg-red-50 hover:text-red-600" aria-label="Delete"><Trash2 size={15} /></button>
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit additional service' : 'New additional service'}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Save changes' : 'Create service'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Description">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Price (₱)" required>
              <Input type="number" min="0" value={form.price || ''} onChange={(e) => setForm({ ...form, price: Number(e.target.value) || 0 })} />
            </Field>
            <Field label="Unit">
              <Select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value as AdditionalService['unit'] })}>
                <option value="lump sum">Lump sum</option>
                <option value="per sqm">Per sqm</option>
              </Select>
            </Field>
          </div>
          <Field label="Category">
            <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Design, Permits & Compliance" />
          </Field>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-agdark-700">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 rounded border-agdark-300 text-agorange focus:ring-agorange" />
            Active
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete this additional service?"
        message={`"${deleting?.name}" will be removed from the quotation flow.`}
        confirmLabel="Delete service"
      />
    </div>
  );
}
