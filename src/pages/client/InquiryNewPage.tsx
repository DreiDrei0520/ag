import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Paperclip, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useServices, useQuotations } from '../../hooks/useData';
import { db, uploadAttachment } from '../../backend';
import { makeInquiryNumber } from '../../lib/format';
import { writeAuditLog, notifyAdmins } from '../../lib/activity';
import { Button, Card, Input, Select, Textarea } from '../../components/ui';
import type { Attachment } from '../../types';

export default function ClientInquiryNew() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preQuotationId = params.get('quotationId') ?? '';
  const { services } = useServices(true);
  const { quotations } = useQuotations(user?.uid);

  const preQuotation = useMemo(() => quotations.find((q) => q.id === preQuotationId), [quotations, preQuotationId]);
  const subjectEdited = useRef(false);

  const [form, setForm] = useState({
    subject: '',
    serviceId: '',
    message: '',
    projectDetails: '',
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (preQuotation && !subjectEdited.current) {
      setForm((f) => ({ ...f, subject: `Question about ${preQuotation.quotationNumber}` }));
    }
  }, [preQuotation]);

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const url = await uploadAttachment(`inquiry/${Date.now()}-${file.name}`, file);
        const attachment: Attachment = { name: file.name, url, type: file.type };
        setAttachments((prev) => [...prev, attachment]);
      }
    } catch {
      toast.error('One or more files could not be uploaded. Already uploaded files were kept.');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.subject.trim() || !form.message.trim()) return;
    setSubmitting(true);
    try {
      const service = services.find((s) => s.id === form.serviceId);
      const inquiry = await db.inquiries.create({
        inquiryNumber: makeInquiryNumber(),
        clientId: user.uid,
        clientName: user.fullName,
        clientEmail: user.email,
        clientPhone: user.phone,
        subject: form.subject.trim(),
        message: form.message.trim(),
        projectDetails: form.projectDetails.trim(),
        serviceId: service?.id,
        serviceTitle: service?.title,
        quotationId: preQuotation?.id,
        quotationNumber: preQuotation?.quotationNumber,
        attachments,
        status: 'Pending',
      });
      await writeAuditLog({ actor: user }, 'inquiry_created', 'inquiry', inquiry.id, { number: inquiry.inquiryNumber });
      await notifyAdmins({
        title: 'New inquiry received',
        message: `${user.fullName} submitted a new inquiry: ${inquiry.subject}`,
        type: 'inquiry',
        referenceId: inquiry.id,
        link: `/admin/inquiries/${inquiry.id}`,
      });
      toast.success('Inquiry submitted!');
      navigate(`/client/inquiries/${inquiry.id}`);
    } catch {
      toast.error('Unable to submit your inquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to="/client/inquiries" className="inline-flex items-center gap-1.5 text-sm font-bold text-agorange hover:underline">
        <ArrowLeft size={15} /> All inquiries
      </Link>
      <div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-agdark-800">New inquiry</h1>
        <p className="mt-1 text-sm text-agdark-500">Tell us about your project and we'll get back to you within one business day.</p>
      </div>

      {preQuotation ? (
        <Card className="flex items-center justify-between gap-3 p-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-agdark-400">Referencing quotation</p>
            <p className="font-display text-base font-bold text-agdark-800">{preQuotation.quotationNumber}</p>
          </div>
          <Link to={`/client/quotations/${preQuotation.id}`} className="btn-secondary">View quote</Link>
        </Card>
      ) : null}

      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Subject</span>
            <Input required value={form.subject} onChange={(e) => { subjectEdited.current = true; setForm({ ...form, subject: e.target.value }); }} placeholder="e.g. Question about house construction" className="mt-1.5" />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Related service (optional)</span>
            <Select value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })} className="mt-1.5">
              <option value="">No specific service</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </Select>
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Message</span>
            <Textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Describe your project or question…" className="mt-1.5" />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Project details (optional)</span>
            <Textarea rows={2} value={form.projectDetails} onChange={(e) => setForm({ ...form, projectDetails: e.target.value })} placeholder="Lot size, location, timeline, budget…" className="mt-1.5" />
          </label>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Attachments (optional)</span>
            <div className="mt-1.5 flex items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-agdark-200 px-4 py-2 text-sm font-semibold text-agdark-600 transition hover:border-agorange hover:text-agorange">
                <Paperclip size={15} /> {uploading ? 'Uploading…' : 'Add files'}
                <input type="file" multiple className="hidden" onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }} disabled={uploading} />
              </label>
            </div>
            {attachments.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {attachments.map((a, i) => (
                  <li key={i} className="flex items-center justify-between rounded-lg bg-agdark-50 px-3 py-2 text-sm">
                    <span className="truncate text-agdark-700">{a.name}</span>
                    <button type="button" onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))} className="text-agdark-400 hover:text-red-600" aria-label="Remove file">
                      <X size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="flex justify-end border-t border-agdark-100 pt-4">
            <Button type="submit" loading={submitting} disabled={!form.subject.trim() || !form.message.trim()}>
              Submit inquiry
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
