import { useState } from 'react';
import toast from 'react-hot-toast';
import { Megaphone, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAnnouncements } from '../../hooks/useData';
import { db } from '../../backend';
import { writeAuditLog } from '../../lib/activity';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, Select, StatusBadge, Table, THead, TH, TR, TD, SectionHeader, Textarea } from '../../components/ui';
import type { Announcement, AnnouncementStatus } from '../../types';

const emptyForm = { title: '', content: '', status: 'Published' as AnnouncementStatus, publishDate: new Date().toISOString().slice(0, 10), expirationDate: '' };

export default function AdminAnnouncements() {
  const { announcements, loading } = useAnnouncements();
  const { user } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState<Announcement | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setForm({ title: a.title, content: a.content, status: a.status, publishDate: a.publishDate, expirationDate: a.expirationDate ?? '' });
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, publishDate: form.publishDate || new Date().toISOString().slice(0, 10), expirationDate: form.expirationDate || undefined };
      if (editing) {
        await db.announcements.update(editing.id, payload);
        toast.success('Announcement updated');
      } else {
        await db.announcements.create(payload);
        toast.success('Announcement created');
      }
      if (user) await writeAuditLog({ actor: user }, editing ? 'announcement_updated' : 'announcement_created', 'announcement', editing?.id);
      setFormOpen(false);
    } catch {
      toast.error('Unable to save the announcement.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await db.announcements.remove(deleting.id);
      toast.success('Announcement deleted');
    } catch {
      toast.error('Unable to delete the announcement.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Content"
        title="Announcements"
        description="News and updates shown on the public announcements page."
        action={<Button onClick={openNew}><Plus size={16} /> New announcement</Button>}
      />

      {loading ? (
        <Card className="h-40" />
      ) : announcements.length === 0 ? (
        <EmptyState icon={<Megaphone size={22} />} title="No announcements" description="Publish updates about your company and projects." action={<Button onClick={openNew}><Plus size={16} /> New announcement</Button>} />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Title</TH>
              <TH>Publish date</TH>
              <TH>Expires</TH>
              <TH>Status</TH>
              <TH>Actions</TH>
            </TR>
          </THead>
          <tbody>
            {announcements.map((a) => (
              <TR key={a.id}>
                <TD>
                  <p className="font-semibold text-agdark-800">{a.title}</p>
                  <p className="max-w-lg truncate text-xs text-agdark-400">{a.content}</p>
                </TD>
                <TD>{a.publishDate}</TD>
                <TD>{a.expirationDate ?? '—'}</TD>
                <TD><StatusBadge status={a.status} /></TD>
                <TD>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(a)} className="rounded-lg p-2 text-agdark-400 transition hover:bg-agdark-100 hover:text-agdark-700" aria-label="Edit"><Pencil size={15} /></button>
                    <button onClick={() => setDeleting(a)} className="rounded-lg p-2 text-agdark-400 transition hover:bg-red-50 hover:text-red-600" aria-label="Delete"><Trash2 size={15} /></button>
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
        title={editing ? 'Edit announcement' : 'New announcement'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Save changes' : 'Publish announcement'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title" required>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Content" required>
            <Textarea rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Publish date">
              <Input type="date" value={form.publishDate} onChange={(e) => setForm({ ...form, publishDate: e.target.value })} />
            </Field>
            <Field label="Expiration date">
              <Input type="date" value={form.expirationDate} onChange={(e) => setForm({ ...form, expirationDate: e.target.value })} />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AnnouncementStatus })}>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
                <option value="Archived">Archived</option>
              </Select>
            </Field>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete this announcement?"
        message={`"${deleting?.title}" will be permanently removed.`}
        confirmLabel="Delete announcement"
      />
    </div>
  );
}
