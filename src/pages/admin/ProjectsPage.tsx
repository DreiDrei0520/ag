import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useProjects, useProjectCategories } from '../../hooks/useData';
import { db } from '../../backend';
import { slugify } from '../../lib/format';
import { writeAuditLog } from '../../lib/activity';
import { useAuth } from '../../context/AuthContext';
import { Badge, Button, Checkbox, ConfirmDialog, EmptyState, Field, Input, Modal, SearchInput, Select, StatusBadge, Table, THead, TH, TR, TD, SectionHeader, Textarea } from '../../components/ui';
import type { Project, ProjectStatus } from '../../types';

const emptyProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '',
  slug: '',
  category: '',
  categoryId: '',
  projectType: 'Residential',
  location: '',
  description: '',
  images: [],
  featuredImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
  servicesUsed: [],
  status: 'Upcoming',
  area: 0,
  highlights: [],
  isFeatured: false,
  isPublished: true,
};

export default function AdminProjects() {
  const { projects, loading } = useProjects();
  const { items: categories } = useProjectCategories();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [form, setForm] = useState(emptyProject);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return projects.filter((p) => [p.title, p.location, p.category, p.status].join(' ').toLowerCase().includes(q));
  }, [projects, query]);

  const openNew = () => {
    const first = categories[0];
    setEditing(null);
    setForm({ ...emptyProject, category: first?.name ?? '', categoryId: first?.id ?? '' });
    setFormOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({ ...p, images: p.images, servicesUsed: p.servicesUsed, highlights: p.highlights });
    setFormOpen(true);
  };

  const setFromCategory = (id: string) => {
    const c = categories.find((x) => x.id === id);
    setForm((f) => ({ ...f, categoryId: id, category: c?.name ?? '', projectType: c?.name ?? f.projectType }));
  };

  const save = async () => {
    if (!form.title.trim() || !form.categoryId) {
      toast.error('Title and category are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, slug: form.slug || slugify(form.title) };
      if (editing) {
        await db.projects.update(editing.id, payload);
        if (user) await writeAuditLog({ actor: user }, 'project_updated', 'project', editing.id, { title: payload.title });
        toast.success('Project updated');
      } else {
        await db.projects.create(payload);
        if (user) await writeAuditLog({ actor: user }, 'project_created', 'project', undefined, { title: payload.title });
        toast.success('Project created');
      }
      setFormOpen(false);
    } catch {
      toast.error('Unable to save the project.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await db.projects.remove(deleting.id);
      toast.success('Project deleted');
    } catch {
      toast.error('Unable to delete the project.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Content"
        title="Projects"
        description="Portfolio entries shown on the public Projects page."
        action={<Button onClick={openNew}><Plus size={16} /> New project</Button>}
      />

      <SearchInput value={query} onChange={setQuery} placeholder="Search projects…" className="max-w-sm" />

      {loading ? (
        <Table><THead><TR><TH>Project</TH><TH>Category</TH><TH>Status</TH><TH /></TR></THead></Table>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Building2 size={22} />} title="No projects found" description="Try a different search or create a new project." action={<Button onClick={openNew}><Plus size={16} /> New project</Button>} />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Project</TH>
              <TH>Category</TH>
              <TH>Area</TH>
              <TH>Status</TH>
              <TH>Actions</TH>
            </TR>
          </THead>
          <tbody>
            {filtered.map((p) => (
              <TR key={p.id}>
                <TD>
                  <div className="flex items-center gap-3">
                    <img src={p.featuredImage} alt="" className="h-10 w-14 rounded-md object-cover" />
                    <div>
                      <p className="font-semibold text-agdark-800">{p.title}</p>
                      <p className="text-xs text-agdark-400">{p.location}</p>
                    </div>
                  </div>
                </TD>
                <TD>
                  {p.category}
                  {p.isFeatured ? <Badge tone="orange" className="ml-2">Featured</Badge> : null}
                  {!p.isPublished ? <Badge tone="neutral" className="ml-2">Hidden</Badge> : null}
                </TD>
                <TD>{p.area ? `${p.area} m²` : '—'}</TD>
                <TD><StatusBadge status={p.status} /></TD>
                <TD>
                  <div className="flex items-center gap-1">
                    <a href={`/projects/${p.id}`} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-agdark-400 transition hover:bg-agdark-100 hover:text-agdark-700" aria-label="View on site"><Eye size={15} /></a>
                    <button onClick={() => openEdit(p)} className="rounded-lg p-2 text-agdark-400 transition hover:bg-agdark-100 hover:text-agdark-700" aria-label="Edit"><Pencil size={15} /></button>
                    <button onClick={() => setDeleting(p)} className="rounded-lg p-2 text-agdark-400 transition hover:bg-red-50 hover:text-red-600" aria-label="Delete"><Trash2 size={15} /></button>
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
        title={editing ? 'Edit project' : 'New project'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Save changes' : 'Create project'}</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" required className="sm:col-span-2">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) })} />
          </Field>
          <Field label="Slug">
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
          </Field>
          <Field label="Category" required>
            <Select value={form.categoryId} onChange={(e) => setFromCategory(e.target.value)}>
              <option value="">Select a category…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}>
              <option value="Upcoming">Upcoming</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
            </Select>
          </Field>
          <Field label="Location">
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City, Province" />
          </Field>
          <Field label="Area (m²)">
            <Input type="number" min="0" value={form.area || ''} onChange={(e) => setForm({ ...form, area: Number(e.target.value) || 0 })} />
          </Field>
          <Field label="Completion date">
            <Input type="date" value={form.completionDate ?? ''} onChange={(e) => setForm({ ...form, completionDate: e.target.value })} />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Cover image URL" className="sm:col-span-2">
            <Input value={form.featuredImage} onChange={(e) => setForm({ ...form, featuredImage: e.target.value })} />
          </Field>
          <Field label="Gallery images (one per line)" className="sm:col-span-2">
            <Textarea rows={3} value={form.images.join('\n')} onChange={(e) => setForm({ ...form, images: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} />
          </Field>
          <Field label="Highlights (one per line)" className="sm:col-span-2">
            <Textarea rows={3} value={form.highlights.join('\n')} onChange={(e) => setForm({ ...form, highlights: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} />
          </Field>
          <Field label="Services used (comma separated)" className="sm:col-span-2">
            <Input value={form.servicesUsed.join(', ')} onChange={(e) => setForm({ ...form, servicesUsed: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
          </Field>
          <div className="flex items-end gap-4 pb-1">
            <Checkbox label="Featured" checked={form.isFeatured} onChange={(v) => setForm({ ...form, isFeatured: v })} />
          </div>
          <div className="flex items-end gap-4 pb-1">
            <Checkbox label="Published" checked={form.isPublished} onChange={(v) => setForm({ ...form, isPublished: v })} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete this project?"
        message={`"${deleting?.title}" will be permanently removed from the portfolio.`}
        confirmLabel="Delete project"
      />
    </div>
  );
}
