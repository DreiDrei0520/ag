import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useQuotations, useInquiries, useProjects } from '../../hooks/useData';
import { formatPHP } from '../../lib/format';
import { Card, PageLoader, StatCard } from '../../components/ui';

const COLORS = ['#F26B21', '#1B4F8C', '#10B981', '#F59E0B', '#EF4444', '#8D97A0'];

export default function AdminReports() {
  const { quotations, loading: quotationsLoading } = useQuotations();
  const { inquiries, loading: inquiriesLoading } = useInquiries();
  const { projects, loading: projectsLoading } = useProjects();

  if (quotationsLoading || inquiriesLoading || projectsLoading) {
    return <PageLoader label="Loading reports…" />;
  }

  const clients = new Set([...quotations, ...inquiries].map((r) => r.clientEmail?.toLowerCase()).filter(Boolean));
  const totalQuoted = quotations.reduce((sum, q) => sum + q.totalEstimate, 0);
  const avgQuote = quotations.length ? Math.round(totalQuoted / quotations.length) : 0;
  const approved = quotations.filter((q) => q.status === 'Approved' || q.status === 'Converted');
  const conversion = quotations.length ? Math.round((approved.length / quotations.length) * 100) : 0;

  const monthly = (() => {
    const buckets = new Map<string, number>();
    quotations.forEach((q) => {
      const key = q.createdAt.slice(0, 7);
      buckets.set(key, (buckets.get(key) ?? 0) + q.totalEstimate);
    });
    return [...buckets.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, total]) => ({ month: new Date(`${month}-01`).toLocaleDateString('en-PH', { month: 'short' }), total: Math.round(total) }));
  })();

  const byStatus = (() => {
    const counts = new Map<string, number>();
    quotations.forEach((q) => counts.set(q.status, (counts.get(q.status) ?? 0) + 1));
    return [...counts.entries()].map(([name, value]) => ({ name, value }));
  })();

  const byProjectType = (() => {
    const counts = new Map<string, number>();
    quotations.forEach((q) => counts.set(q.inputs.projectType, (counts.get(q.inputs.projectType) ?? 0) + 1));
    return [...counts.entries()].map(([name, value]) => ({ name, value }));
  })();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-agdark-800">Analytics & reports</h1>
        <p className="mt-1 text-sm text-agdark-500">Performance across quotations, inquiries, and the portfolio.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total quoted" value={formatPHP(totalQuoted)} icon={<span className="text-lg">₱</span>} />
        <StatCard label="Average estimate" value={formatPHP(avgQuote)} icon={<span className="text-lg">∑</span>} accent="blue" />
        <StatCard label="Conversion rate" value={`${conversion}%`} icon={<span className="text-lg">✓</span>} accent="green" hint={`${approved.length} approved / converted`} />
        <StatCard label="Clients" value={clients.size} icon={<span className="text-lg">👥</span>} accent="dark" hint={`${projects.length} portfolio projects`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-agdark-800">Estimated value by month</h2>
          <div className="mt-4 h-72">
            {monthly.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-agdark-400">No data yet.</div>
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

        <Card className="p-6">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-agdark-800">Quotations by status</h2>
          <div className="mt-4 h-72">
            {byStatus.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-agdark-400">No data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3}>
                    {byStatus.map((s, i) => <Cell key={s.name} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-agdark-800">Quotations by project type</h2>
        <div className="mt-4 h-72">
          {byProjectType.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-agdark-400">No data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byProjectType} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DEE1E4" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#F2F3F4' }} />
                <Bar dataKey="value" fill="#1B4F8C" radius={[0, 4, 4, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="Total inquiries" value={inquiries.length} />
        <MiniStat label="Open inquiries" value={inquiries.filter((i) => i.status === 'Pending' || i.status === 'In Progress').length} accent />
        <MiniStat label="Published projects" value={projects.filter((p) => p.isPublished).length} />
        <MiniStat label="Unique clients" value={clients.size} accent />
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${accent ? 'border-agorange/30 bg-agorange-50' : 'border-agdark-100 bg-white'}`}>
      <p className="text-sm font-medium text-agdark-500">{label}</p>
      <p className={`mt-1 font-display text-3xl font-bold ${accent ? 'text-agorange' : 'text-agdark-800'}`}>{value}</p>
    </div>
  );
}
