import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, Building2, DatabaseZap, MessageSquareText, ReceiptText, Users, Wrench } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useServices, useProjects, useQuotations, useInquiries } from '../../hooks/useData';
import { formatPHP, formatDate } from '../../lib/format';
import { Button, Card, StatCard, StatusBadge, PageLoader } from '../../components/ui';
import { db } from '../../backend';
import { importStarterContent } from '../../backend/starterContent';

// Shown to an admin on a fresh Firebase database, to copy in the website's built-in content.
function StarterContentCard() {
  const [step, setStep] = useState<string | null>(null);
  const run = async () => {
    try {
      await importStarterContent(setStep);
      toast.success('Website content imported.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed. Please try again.');
    } finally {
      setStep(null);
    }
  };
  return (
    <Card className="flex flex-col gap-4 border-agorange/40 bg-agorange-50/60 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <DatabaseZap size={22} className="mt-0.5 shrink-0 text-agorange" />
        <div>
          <p className="font-semibold text-agdark-800">Your database is empty</p>
          <p className="mt-0.5 text-sm text-agdark-600">
            Import the website's services, projects, packages, announcements, and settings so the public site has content.
          </p>
        </div>
      </div>
      <Button onClick={run} loading={step !== null} className="shrink-0">
        {step ? `Importing ${step.toLowerCase()}…` : 'Import website content'}
      </Button>
    </Card>
  );
}

export default function AdminDashboard() {
  const { services, loading: servicesLoading } = useServices();
  const { projects, loading: projectsLoading } = useProjects();
  const { quotations, loading: quotationsLoading } = useQuotations();
  const { inquiries, loading: inquiriesLoading } = useInquiries();

  if (servicesLoading || quotationsLoading || projectsLoading || inquiriesLoading) {
    return <PageLoader label="Loading dashboard…" />;
  }

  const clients = new Set([...quotations, ...inquiries].map((r) => r.clientEmail?.toLowerCase()).filter(Boolean));
  const activeServices = services.filter((s) => s.isActive);
  const submitted = quotations.filter((q) => q.status === 'Submitted' || q.status === 'Approved');
  const openInquiries = inquiries.filter((i) => i.status === 'Pending' || i.status === 'In Progress');
  const totalQuoted = quotations.reduce((sum, q) => sum + q.totalEstimate, 0);
  const completed = projects.filter((p) => p.status === 'Completed').length;

  const monthly = (() => {
    const buckets = new Map<string, number>();
    quotations.forEach((q) => {
      const key = q.createdAt.slice(0, 7);
      buckets.set(key, (buckets.get(key) ?? 0) + q.totalEstimate);
    });
    return [...buckets.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, total]) => ({
        month: new Date(`${month}-01`).toLocaleDateString('en-PH', { month: 'short' }),
        total: Math.round(total),
      }));
  })();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-agdark-800">Operations overview</h1>
        <p className="mt-1 text-sm text-agdark-500">A live snapshot of AG Construction Builders.</p>
      </div>

      {!db.isDemoMode && services.length === 0 && projects.length === 0 ? <StarterContentCard /> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Quotations" value={quotations.length} icon={<ReceiptText size={20} />} hint={`${submitted.length} awaiting review`} />
        <StatCard label="Quoted value" value={formatPHP(totalQuoted)} icon={<ReceiptText size={20} />} accent="blue" hint="Across all quotations" />
        <StatCard label="Open inquiries" value={openInquiries.length} icon={<MessageSquareText size={20} />} accent="green" hint={`${inquiries.length} total`} />
        <StatCard label="Clients" value={clients.size} icon={<Users size={20} />} accent="dark" hint="Unique emails from requests" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Services" value={activeServices.length} icon={<Wrench size={18} />} hint={`${services.length} total`} />
        <StatCard label="Projects" value={projects.length} icon={<Building2 size={18} />} hint={`${completed} completed`} />
        <StatCard label="Inquiries" value={inquiries.length} icon={<MessageSquareText size={18} />} hint={`${openInquiries.length} open`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-agdark-800">Estimated value by month</h2>
          <div className="mt-4 h-64">
            {monthly.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-agdark-400">No quotations yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DEE1E4" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${Math.round(v / 1000)}k`}`} />
                  <Tooltip formatter={(value) => [formatPHP(Number(value)), 'Estimated value']} cursor={{ fill: '#F2F3F4' }} />
                  <Bar dataKey="total" fill="#F26B21" radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-agdark-100 px-5 py-4">
              <h2 className="font-display text-lg font-bold uppercase tracking-wide text-agdark-800">Recent quotations</h2>
              <Link to="/admin/quotations" className="inline-flex items-center gap-1 text-sm font-bold text-agorange">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            {quotations.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-agdark-400">No quotations yet.</p>
            ) : (
              <ul className="divide-y divide-agdark-50">
                {quotations.slice(0, 4).map((q) => (
                  <li key={q.id}>
                    <Link to={`/admin/quotations/${q.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-agdark-50">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-agdark-800">{q.quotationNumber}</p>
                        <p className="truncate text-xs text-agdark-400">{q.clientName} · {formatDate(q.createdAt)}</p>
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
              <Link to="/admin/inquiries" className="inline-flex items-center gap-1 text-sm font-bold text-agorange">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            {inquiries.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-agdark-400">No inquiries yet.</p>
            ) : (
              <ul className="divide-y divide-agdark-50">
                {inquiries.slice(0, 4).map((i) => (
                  <li key={i.id}>
                    <Link to={`/admin/inquiries/${i.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-agdark-50">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-agdark-800">{i.subject}</p>
                        <p className="text-xs text-agdark-400">{i.clientName} · {i.inquiryNumber}</p>
                      </div>
                      <StatusBadge status={i.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
