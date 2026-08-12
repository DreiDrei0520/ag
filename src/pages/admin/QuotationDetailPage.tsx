import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, MessageSquareText } from 'lucide-react';
import { useQuotations, useSettings } from '../../hooks/useData';
import { db } from '../../backend';
import { useAuth } from '../../context/AuthContext';
import { writeAuditLog, notifyUser } from '../../lib/activity';
import { formatPHP, makeInquiryNumber } from '../../lib/format';
import { Button, Card, EmptyState, PageLoader, Select, StatusBadge } from '../../components/ui';
import QuotationResultView from '../../components/quotation/QuotationResultView';
import { QUOTATION_STATUSES } from '../../lib/constants';
import type { QuotationStatus } from '../../types';

const ALLOWED_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> = {
  Draft: ['Submitted'],
  Submitted: ['Approved', 'Rejected'],
  Approved: ['Converted', 'Rejected'],
  Converted: [],
  Rejected: [],
};

export default function AdminQuotationDetail() {
  const { id } = useParams();
  const { quotations, loading } = useQuotations();
  const { settings } = useSettings();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(false);
  const [creating, setCreating] = useState(false);

  if (loading) return <PageLoader />;
  const quotation = quotations.find((q) => q.id === id);
  if (!quotation) {
    return (
      <EmptyState
        title="Quotation not found"
        description="This quotation may have been removed."
        action={<Link to="/admin/quotations" className="btn-secondary">Back to quotations</Link>}
      />
    );
  }

  const changeStatus = async (status: string) => {
    const next = status as QuotationStatus;
    if (next === quotation.status) return;
    const allowed = ALLOWED_TRANSITIONS[quotation.status] ?? [];
    if (!allowed.includes(next)) {
      toast.error(`Cannot move a quotation from "${quotation.status}" to "${next}".`);
      return;
    }
    setUpdating(true);
    try {
      await db.quotations.update(quotation.id, { status: next });
      if (user) await writeAuditLog({ actor: user }, 'quotation_status_changed', 'quotation', quotation.id, { from: quotation.status, to: next });
      if (quotation.clientId && (next === 'Approved' || next === 'Rejected')) {
        await notifyUser({
          userId: quotation.clientId,
          audience: 'client',
          title: `Quotation ${next.toLowerCase()}`,
          message: `Your quotation ${quotation.quotationNumber} was marked ${next} by our team.`,
          type: 'quotation',
          referenceId: quotation.id,
          link: `/client/quotations/${quotation.id}`,
        });
      }
      toast.success(`Status updated to ${next}`);
    } catch {
      toast.error('Unable to update the status.');
    } finally {
      setUpdating(false);
    }
  };

  const createInquiry = async () => {
    setCreating(true);
    try {
      const inquiry = await db.inquiries.create({
        inquiryNumber: makeInquiryNumber(),
        clientId: quotation.clientId ?? '',
        clientName: quotation.clientName,
        clientEmail: quotation.clientEmail ?? '',
        clientPhone: quotation.clientPhone,
        subject: `Discussion for quotation ${quotation.quotationNumber}`,
        message: `Follow-up regarding quotation ${quotation.quotationNumber} (${formatPHP(quotation.totalEstimate)}).`,
        projectDetails: `${quotation.inputs.projectType} — ${quotation.inputs.scopeOfWork}, ${quotation.inputs.floorArea} sqm`,
        serviceId: undefined,
        serviceTitle: undefined,
        quotationId: quotation.id,
        quotationNumber: quotation.quotationNumber,
        attachments: [],
        status: 'Pending',
      });
      if (user) {
        await writeAuditLog({ actor: user }, 'inquiry_created', 'inquiry', inquiry.id, { number: inquiry.inquiryNumber });
      }
      toast.success('Inquiry created');
      navigate(`/admin/inquiries/${inquiry.id}`);
    } catch {
      toast.error('Unable to create the inquiry.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/admin/quotations" className="inline-flex items-center gap-1.5 text-sm font-bold text-agorange hover:underline">
          <ArrowLeft size={15} /> All quotations
        </Link>
        <div className="flex items-center gap-3">
          <StatusBadge status={quotation.status} />
          <Select value={quotation.status} onChange={(e) => changeStatus(e.target.value)} className="w-44" disabled={updating}>
            {QUOTATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      </div>

      <QuotationResultView quotation={quotation} settings={settings} />

      <Card className="p-5">
        <h3 className="font-display text-base font-bold uppercase tracking-wide text-agdark-800">Client summary</h3>
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <p><span className="text-agdark-400">Client:</span> <span className="font-semibold text-agdark-800">{quotation.clientName}</span></p>
          <p><span className="text-agdark-400">Email:</span> <span className="font-semibold text-agdark-800">{quotation.clientEmail ?? '—'}</span></p>
          <p><span className="text-agdark-400">Phone:</span> <span className="font-semibold text-agdark-800">{quotation.clientPhone ?? '—'}</span></p>
          <p><span className="text-agdark-400">Total:</span> <span className="font-mono-data font-semibold text-agorange">{formatPHP(quotation.totalEstimate)}</span></p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-agdark-100 pt-4">
          {quotation.clientId ? (
            <Button variant="outline" onClick={createInquiry} loading={creating}>
              Create inquiry for this client
            </Button>
          ) : (
            <p className="text-xs text-agdark-400">This quotation was submitted as a guest. Follow up directly via email or phone.</p>
          )}
          <Button variant="outline" onClick={createInquiry} loading={creating}>
            <MessageSquareText size={15} /> Start discussion
          </Button>
        </div>
      </Card>
    </div>
  );
}
