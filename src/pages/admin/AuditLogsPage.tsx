import { useState } from 'react';
import { ScrollText } from 'lucide-react';
import { useAuditLogs } from '../../hooks/useData';
import { formatDateTime } from '../../lib/format';
import { Card, EmptyState, Input, Select, Table, THead, TH, TR, TD } from '../../components/ui';

export default function AdminAuditLogs() {
  const { auditLogs: logs, loading } = useAuditLogs();
  const [query, setQuery] = useState('');
  const [module, setModule] = useState('All');

  const modules = [...new Set(logs.map((l) => l.module))].sort();
  const filtered = logs.filter((l) => {
    const q = query.toLowerCase().trim();
    const matchesQuery = [l.actorName, l.action, l.module, l.targetId ?? ''].join(' ').toLowerCase().includes(q);
    return matchesQuery && (module === 'All' || l.module === module);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-agdark-800">Audit logs</h1>
        <p className="mt-1 text-sm text-agdark-500">A trail of significant actions across the platform.</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search actor, action, or target…" className="w-full sm:max-w-sm" />
        <Select value={module} onChange={(e) => setModule(e.target.value)} className="w-full sm:w-44">
          <option value="All">All modules</option>
          {modules.map((m) => <option key={m} value={m}>{m}</option>)}
        </Select>
      </div>

      {loading ? (
        <Card className="h-40" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<ScrollText size={22} />} title="No audit logs" description="Significant actions will appear here as they happen." />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Timestamp</TH>
              <TH>Actor</TH>
              <TH>Action</TH>
              <TH>Module</TH>
              <TH>Target</TH>
            </TR>
          </THead>
          <tbody>
            {filtered.map((l) => (
              <TR key={l.id}>
                <TD className="whitespace-nowrap text-xs text-agdark-500">{formatDateTime(l.timestamp)}</TD>
                <TD className="font-semibold text-agdark-800">{l.actorName}</TD>
                <TD><span className="rounded-md bg-agdark-100 px-2 py-0.5 font-mono-data text-xs text-agdark-700">{l.action}</span></TD>
                <TD>{l.module}</TD>
                <TD className="font-mono-data text-xs text-agblue">{l.targetId ?? '—'}</TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
