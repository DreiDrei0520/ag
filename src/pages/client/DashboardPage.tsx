import { Link } from 'react-router-dom';
import { ArrowRight, Calculator, MessageSquareText, ReceiptText, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQuotations, useInquiries, useBookings } from '../../hooks/useData';
import { formatPHP, formatDate } from '../../lib/format';
import { Card, StatCard, StatusBadge, PageLoader } from '../../components/ui';

export default function ClientDashboard() {
  const { user } = useAuth();
  const { quotations, loading: qLoading } = useQuotations(user?.uid);
  const { inquiries, loading: iLoading } = useInquiries(user?.uid);
  const { bookings, loading: bLoading } = useBookings(user?.uid);

  if (!user) return <PageLoader />;

  const totalQuotes = quotations.reduce((sum, q) => sum + q.totalEstimate, 0);
  const pendingBookings = bookings.filter((b) => b.status === 'Pending' || b.status === 'Confirmed');
  const openInquiries = inquiries.filter((i) => i.status === 'Pending' || i.status === 'In Progress');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-agdark-800">
          Welcome back, {user.fullName.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-agdark-500">Here's what's happening with your projects.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Quotations" value={qLoading ? '…' : quotations.length} icon={<ReceiptText size={20} />} hint="Total records" />
        <StatCard label="Estimated value" value={qLoading ? '…' : formatPHP(totalQuotes)} icon={<Calculator size={20} />} accent="blue" hint="Across your quotations" />
        <StatCard label="Open inquiries" value={iLoading ? '…' : openInquiries.length} icon={<MessageSquareText size={20} />} accent="green" hint={`${inquiries.length} total`} />
        <StatCard label="Upcoming visits" value={bLoading ? '…' : pendingBookings.length} icon={<UserPlus size={20} />} accent="dark" hint="Pending or confirmed" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-agdark-100 px-5 py-4">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide text-agdark-800">Recent quotations</h2>
            <Link to="/client/quotations" className="inline-flex items-center gap-1 text-sm font-bold text-agorange">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {qLoading ? (
            <p className="px-5 py-10 text-center text-sm text-agdark-400">Loading quotations…</p>
          ) : quotations.length === 0 ? (
            <EmptyList text="No quotations yet. Try the Smart Quotation tool to generate one." cta={{ to: '/quotation', label: 'Get an estimate' }} />
          ) : (
            <ul className="divide-y divide-agdark-50">
              {quotations.slice(0, 4).map((q) => (
                <li key={q.id}>
                  <Link to={`/client/quotations/${q.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-agdark-50">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-agdark-800">{q.quotationNumber}</p>
                      <p className="text-xs text-agdark-400">{formatDate(q.createdAt)} · {q.inputs.projectType}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-bold text-agdark-800">{formatPHP(q.totalEstimate)}</span>
                      <StatusBadge status={q.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-agdark-100 px-5 py-4">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide text-agdark-800">Recent inquiries</h2>
            <Link to="/client/inquiries" className="inline-flex items-center gap-1 text-sm font-bold text-agorange">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {iLoading ? (
            <p className="px-5 py-10 text-center text-sm text-agdark-400">Loading inquiries…</p>
          ) : inquiries.length === 0 ? (
            <EmptyList text="No inquiries yet. Ask us about your project." cta={{ to: '/client/inquiries/new', label: 'Start an inquiry' }} />
          ) : (
            <ul className="divide-y divide-agdark-50">
              {inquiries.slice(0, 4).map((i) => (
                <li key={i.id}>
                  <Link to={`/client/inquiries/${i.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-agdark-50">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-agdark-800">{i.subject}</p>
                      <p className="text-xs text-agdark-400">{i.inquiryNumber} · {formatDate(i.createdAt)}</p>
                    </div>
                    <StatusBadge status={i.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-4 rounded-xl bg-agdark-800 p-6 sm:grid-cols-2">
        <Link to="/quotation" className="group flex items-start gap-3 rounded-lg p-4 transition hover:bg-white/5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-agorange text-white">
            <Calculator size={20} />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white">Smart Quotation</h3>
            <p className="mt-1 text-sm leading-6 text-agdark-300">Generate a preliminary estimate in minutes.</p>
            <span className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-agorange">
              Start now <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
        <Link to="/client/inquiries/new" className="group flex items-start gap-3 rounded-lg p-4 transition hover:bg-white/5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-agblue text-white">
            <MessageSquareText size={20} />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white">Submit an inquiry</h3>
            <p className="mt-1 text-sm leading-6 text-agdark-300">Ask a question or reference a quotation.</p>
            <span className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-agorange">
              New inquiry <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}

function EmptyList({ text, cta }: { text: string; cta: { to: string; label: string } }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <p className="text-sm text-agdark-500">{text}</p>
      <Link to={cta.to} className="btn-secondary">{cta.label}</Link>
    </div>
  );
}
