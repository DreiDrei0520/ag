import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MessageSquareText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQuotations } from '../../hooks/useData';
import { useSettings } from '../../hooks/useData';
import { formatDate } from '../../lib/format';
import { Card, EmptyState, PageLoader, StatusBadge } from '../../components/ui';
import QuotationResultView from '../../components/quotation/QuotationResultView';

export default function ClientQuotationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { quotations, loading } = useQuotations(user?.uid);
  const { settings } = useSettings();

  if (loading) return <PageLoader />;
  const quotation = quotations.find((q) => q.id === id);
  if (!quotation) {
    return (
      <EmptyState
        title="Quotation not found"
        description="This quotation may have been removed."
        action={<Link to="/client/quotations" className="btn-secondary">Back to quotations</Link>}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/client/quotations" className="inline-flex items-center gap-1.5 text-sm font-bold text-agorange hover:underline">
          <ArrowLeft size={15} /> All quotations
        </Link>
        <div className="flex items-center gap-3">
          <StatusBadge status={quotation.status} />
          <span className="text-sm text-agdark-500">{formatDate(quotation.createdAt)}</span>
        </div>
      </div>

      <QuotationResultView quotation={quotation} settings={settings} />

      <Card className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-display text-lg font-bold uppercase tracking-wide text-agdark-800">Ready to discuss this project?</h3>
          <p className="mt-1 text-sm text-agdark-500">Reference this quotation when you submit an inquiry and we'll pick up right where you left off.</p>
        </div>
        <Link to={`/client/inquiries/new?quotationId=${quotation.id}`} className="btn-primary shrink-0">
          <MessageSquareText size={16} /> Ask about this quote
        </Link>
      </Card>
    </div>
  );
}
