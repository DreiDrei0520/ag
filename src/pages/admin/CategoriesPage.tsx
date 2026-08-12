import { useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { useServiceCategories } from '../../hooks/useData';
import { db } from '../../backend';
import { slugify } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, SectionHeader, Table, THead, TH, TR, TD, Textarea } from '../../components/ui';
import type { ServiceCategory } from '../../types';

export default function AdminCategories() {
  const { items, loading } = useServiceCategories();
  const { user } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceCategory | null>(null);
  const [deleting, setDeleting] = useState<ServiceCategory | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', slug: '', description: '' });
    setFormOpen(true);
  };

  const openEdit = (c: ServiceCategory) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, description: c.description ?? '' });
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required.');
      return;
    }
    setSaving(true);
    try {
      const nextSortOrder = items.length ? Math.max(...items.map((i) => i.sortOrder)) + 1 : 1;
      const payload = { name: form.name.trim(), slug: form.slug || slugify(form.name), description: form.description.trim(), sortOrder: editing?.sortOrder ?? nextSortOrder };
      if (editing) {
        await db.serviceCategories.update(editing.id, payload);
        toast.success('Category updated');
      } else {
        await db.serviceCategories.create(payload);
        toast.success('Category created');
      }
      if (user) await db.createAuditLog({ actorId: user.uid, actorName: user.fullName, actorRole: user.role, action: editing ? 'service_category_updated' : 'service_category_created', module: 'catalog', targetId: editing?.id });
      setFormOpen(false);
    } catch {
      toast.error('Unable to save the category.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await db.serviceCategories.remove(deleting.id);
      toast.success('Category deleted');
    } catch {
      toast.error('Unable to delete the category.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Content"
        title="Service categories"
        description="Group services by project type for the Smart Quotation wizard."
        action={<Button onClick={openNew}><Plus size={16} /> New category</Button>}
      />

      {loading ? (
        <Card className="h-40" />
      ) : items.length === 0 ? (
        <EmptyState icon={<Tags size={22} />} title="No categories yet" description="Create your first service category to organize services." action={<Button onClick={openNew}><Plus size={16} /> New category</Button>} />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Category</TH>
              <TH>Slug</TH>
              <TH>Description</TH>
              <TH>Order</TH>
              <TH>Actions</TH>
            </TR>
          </THead>
          <tbody>
            {items.map((c) => (
              <TR key={c.id}>
                <TD className="font-semibold text-agdark-800">{c.name}</TD>
                <TD className="font-mono-data text-xs text-agdark-500">{c.slug}</TD>
                <TD className="max-w-md text-agdark-500">{c.description}</TD>
                <TD>{c.sortOrder}</TD>
                <TD>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(c)} className="rounded-lg p-2 text-agdark-400 transition hover:bg-agdark-100 hover:text-agdark-700" aria-label="Edit"><Pencil size={15} /></button>
                    <button onClick={() => setDeleting(c)} className="rounded-lg p-2 text-agdark-400 transition hover:bg-red-50 hover:text-red-600" aria-label="Delete"><Trash2 size={15} /></button>
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
        title={editing ? 'Edit category' : 'New category'}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Save changes' : 'Create category'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })} placeholder="e.g. Vertical Construction" />
          </Field>
          <Field label="Slug">
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
          </Field>
          <Field label="Description">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete this category?"
        message={`"${deleting?.name}" will be removed. Services assigned to it will need re-categorization.`}
        confirmLabel="Delete category"
      />
    </div>
  );
}
