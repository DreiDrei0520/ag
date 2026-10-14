import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Eye, Pencil, Plus, Trash2, Wrench } from 'lucide-react';
import { useServices, useServiceCategories } from '../../hooks/useData';
import { db } from '../../backend';
import { formatPHP, slugify } from '../../lib/format';
import { writeAuditLog } from '../../lib/activity';
import { useAuth } from '../../context/AuthContext';
import { GalleryField, ImageField } from '../../components/shared/ImageUpload';
import {
  Badge, Button, ConfirmDialog, EmptyState, Field, Input, Modal, SearchInput, Select,
  StatusBadge, Table, THead, TH, TR, TD, SectionHeader, Textarea, Checkbox,
} from '../../components/ui';
import type { Service } from '../../types';

const emptyService: Omit<Service, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '',
  slug: '',
  category: '',
  categoryId: '',
  shortDescription: '',
  description: '',
  imageUrl: '',
  gallery: [],
  features: [],
  inclusions: [],
  startingPrice: 0,
  priceUnit: 'per sqm',
  measuringUnit: 'm²',
  pricePerUnit: 0,
  materialPct: 0.6,
  miscPct: 0.05,
  vatPct: 0.12,
  includeMisc: true,
  isFeatured: false,
  isActive: true,
};

export default function AdminServices() {
  const { services, loading } = useServices();
  const { items: categories } = useServiceCategories();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const [form, setForm] = useState(emptyService);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return services.filter((s) => {
      const matchesStatus = status === 'All' || (status === 'Active' ? s.isActive : !s.isActive);
      return matchesStatus && [s.title, s.category, s.shortDescription].join(' ').toLowerCase().includes(q);
    });
  }, [services, query, status]);

  const openNew = () => {
    const firstCategory = categories[0];
    setEditing(null);
    setForm({ ...emptyService, category: firstCategory?.name ?? '', categoryId: firstCategory?.id ?? '' });
    setFormOpen(true);
  };

  const openEdit = (service: Service) => {
    setEditing(service);
    setForm({
      title: service.title,
      slug: service.slug,
      category: service.category,
      categoryId: service.categoryId,
      shortDescription: service.shortDescription,
      description: service.description,
      imageUrl: service.imageUrl,
      gallery: service.gallery ?? [],
      features: service.features,
      inclusions: service.inclusions,
      startingPrice: service.startingPrice,
      priceUnit: service.priceUnit,
      measuringUnit: service.measuringUnit,
      pricePerUnit: service.pricePerUnit,
      materialPct: service.materialPct,
      miscPct: service.miscPct,
      vatPct: service.vatPct,
      includeMisc: service.includeMisc,
      isFeatured: service.isFeatured,
      isActive: service.isActive,
    });
    setFormOpen(true);
  };

  const setFromCategory = (categoryId: string) => {
    const c = categories.find((x) => x.id === categoryId);
    setForm((f) => ({ ...f, categoryId, category: c?.name ?? '', slug: slugify(f.title || c?.name || '') }));
  };

  const save = async () => {
    if (!form.title.trim() || !form.categoryId) {
      toast.error('Title and category are required.');
      return;
    }
    if (!form.imageUrl) {
      toast.error('Add a cover image for the service.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, slug: form.slug || slugify(form.title) };
      if (editing) {
        await db.services.update(editing.id, payload);
        if (user) await writeAuditLog({ actor: user }, 'service_updated', 'service', editing.id, { title: payload.title });
        toast.success('Service updated');
      } else {
        await db.services.create(payload);
        if (user) await writeAuditLog({ actor: user }, 'service_created', 'service', undefined, { title: payload.title });
        toast.success('Service created');
      }
      setFormOpen(false);
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'Unable to save the service.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await db.services.remove(deleting.id);
      if (user) await writeAuditLog({ actor: user }, 'service_deleted', 'service', deleting.id, { title: deleting.title });
      toast.success('Service deleted');
    } catch {
      toast.error('Unable to delete the service.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Content"
        title="Services"
        description="Manage the services clients browse and price through the Smart Quotation tool."
        action={<Button onClick={openNew}><Plus size={16} /> New service</Button>}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={query} onChange={setQuery} placeholder="Search services…" className="w-full sm:max-w-sm" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full sm:w-44">
          <option value="All">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </Select>
      </div>

      {loading ? (
        <Table><THead><TR><TH>Service</TH><TH>Category</TH><TH>Rate</TH><TH>Status</TH><TH /></TR></THead></Table>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Wrench size={22} />} title="No services found" description="Try a different search, or create a new service." action={<Button onClick={openNew}><Plus size={16} /> New service</Button>} />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Service</TH>
              <TH>Category</TH>
              <TH>Rate</TH>
              <TH>Status</TH>
              <TH>Actions</TH>
            </TR>
          </THead>
          <tbody>
            {filtered.map((s) => (
              <TR key={s.id}>
                <TD>
                  <div className="flex items-center gap-3">
                    <img src={s.imageUrl} alt="" className="h-10 w-14 rounded-md object-cover" />
                    <div>
                      <p className="font-semibold text-agdark-800">{s.title}</p>
                      <p className="flex items-center gap-2 text-xs text-agdark-400">
                        {s.measuringUnit === 'm²' ? 'Area-based' : s.measuringUnit === 'lm' ? 'Linear-meter' : 'Item'} pricing
                        {s.isFeatured ? <Badge tone="orange">Featured</Badge> : null}
                      </p>
                    </div>
                  </div>
                </TD>
                <TD>{s.category}</TD>
                <TD>
                  <p className="font-semibold text-agdark-800">{formatPHP(s.pricePerUnit)}<span className="text-xs font-normal text-agdark-400"> / {s.measuringUnit}</span></p>
                  <p className="text-xs text-agdark-400">from {formatPHP(s.startingPrice)}</p>
                </TD>
                <TD><StatusBadge status={s.isActive ? 'Active' : 'Inactive'} /></TD>
                <TD>
                  <div className="flex items-center gap-1">
                    <Link to={`/services/${s.slug}`} className="rounded-lg p-2 text-agdark-400 transition hover:bg-agdark-100 hover:text-agdark-700" aria-label="View on site"><Eye size={15} /></Link>
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
        title={editing ? 'Edit service' : 'New service'}
        description="Configure how this service is priced in the Smart Quotation tool."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Save changes' : 'Create service'}</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" required className="sm:col-span-2">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) })} placeholder="e.g. Ground Zero Construction" />
          </Field>
          <Field label="Slug" required>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
          </Field>
          <Field label="Category" required>
            <Select value={form.categoryId} onChange={(e) => setFromCategory(e.target.value)}>
              <option value="">Select a category…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Short description" className="sm:col-span-2">
            <Textarea rows={2} value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} placeholder="One-line summary shown on cards." />
          </Field>
          <Field label="Full description" className="sm:col-span-2">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Cover image" required hint="Shown on service cards and at the top of the service page." className="sm:col-span-2">
            <ImageField folder="services" value={form.imageUrl} onChange={(imageUrl) => setForm((f) => ({ ...f, imageUrl }))} />
          </Field>
          <Field label="Gallery" hint="Extra photos shown on the service page. Use the arrows to reorder." className="sm:col-span-2">
            <GalleryField folder="services" value={form.gallery ?? []} onChange={(gallery) => setForm((f) => ({ ...f, gallery }))} />
          </Field>
          <Field label="Features (comma separated)" className="sm:col-span-2">
            <Input value={form.features.join(', ')} onChange={(e) => setForm({ ...form, features: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
          </Field>
          <Field label="Inclusions (comma separated)" className="sm:col-span-2">
            <Input value={form.inclusions.join(', ')} onChange={(e) => setForm({ ...form, inclusions: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
          </Field>

          <Field label="Measuring unit" required>
            <Select value={form.measuringUnit} onChange={(e) => setForm({ ...form, measuringUnit: e.target.value as Service['measuringUnit'], priceUnit: e.target.value === 'm²' ? 'per sqm' : e.target.value === 'lm' ? 'per linear meter' : 'lump sum' })}>
              <option value="m²">Square meters (m²)</option>
              <option value="lm">Linear meters (lm)</option>
              <option value="item">Per item</option>
            </Select>
          </Field>
          <Field label="Price per unit (₱)" required>
            <Input type="number" min="0" step="100" value={form.pricePerUnit || ''} onChange={(e) => setForm({ ...form, pricePerUnit: Number(e.target.value) || 0 })} />
          </Field>
          <Field label="Starting price (₱)" required>
            <Input type="number" min="0" step="100" value={form.startingPrice || ''} onChange={(e) => setForm({ ...form, startingPrice: Number(e.target.value) || 0 })} />
          </Field>
          <Field label="Materials % of labor">
            <Input type="number" min="0" max="5" step="0.05" value={form.materialPct} onChange={(e) => setForm({ ...form, materialPct: Number(e.target.value) || 0 })} />
          </Field>
          <Field label="Misc % (labor + materials)">
            <Input type="number" min="0" max="1" step="0.01" value={form.miscPct} onChange={(e) => setForm({ ...form, miscPct: Number(e.target.value) || 0 })} />
          </Field>
          <Field label="VAT %">
            <Input type="number" min="0" max="1" step="0.01" value={form.vatPct} onChange={(e) => setForm({ ...form, vatPct: Number(e.target.value) || 0 })} />
          </Field>
          <div className="flex items-end gap-4 pb-1">
            <Checkbox label="Include miscellaneous fee" checked={form.includeMisc} onChange={(v) => setForm({ ...form, includeMisc: v })} />
          </div>
          <div className="flex items-end gap-4 pb-1">
            <Checkbox label="Featured on homepage" checked={form.isFeatured} onChange={(v) => setForm({ ...form, isFeatured: v })} />
          </div>
          <div className="flex items-end gap-4 pb-1">
            <Checkbox label="Active" checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete this service?"
        message={`"${deleting?.title}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete service"
      />
    </div>
  );
}
