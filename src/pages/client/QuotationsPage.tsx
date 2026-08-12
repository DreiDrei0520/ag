import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQuotations } from '../../hooks/useData';
import { formatPHP, formatDate } from '../../lib/format';
import { EmptyState, SearchInput, StatusBadge, Table, THead, TH, TR, TD, SectionHeader } from '../../components/ui';

export default function ClientQuotations() {
  const { user } = useAuth();
  const { quotations, loading } = useQuotations(user?.uid);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return quotations.filter((x) => [x.quotationNumber, x.inputs.projectType, x.status].join(' ').toLowerCase().includes(q));
  }, [quotations, query]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Client portal"
        title="My quotations"
        description="Preliminary estimates generated for your projects."
        action={<Link to="/quotation" className="btn-primary"><Plus size={16} /> New quotation</Link>}
      />

      <SearchInput value={query} onChange={setQuery} placeholder="Search quotations…" className="max-w-sm" />

      {loading ? (
        <Table><THead><TR><TH>Number</TH><TH>Project</TH><TH>Date</TH><TH>Total</TH><TH>Status</TH></TR></THead></Table>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText size={22} />}
          title="No quotations found"
          description="Generate a preliminary estimate with the Smart Quotation tool."
          action={<Link to="/quotation" className="btn-primary">Get an estimate</Link>}
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Number</TH>
              <TH>Project type</TH>
              <TH>Date issued</TH>
              <TH>Total estimate</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <tbody>
            {filtered.map((q) => (
              <TR key={q.id} onClick={() => navigate(`/client/quotations/${q.id}`)}>
                <TD className="font-semibold text-agblue">{q.quotationNumber}</TD>
                <TD>{q.inputs.projectType}</TD>
                <TD>{formatDate(q.createdAt)}</TD>
                <TD className="font-semibold">{formatPHP(q.totalEstimate)}</TD>
                <TD><StatusBadge status={q.status} /></TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
