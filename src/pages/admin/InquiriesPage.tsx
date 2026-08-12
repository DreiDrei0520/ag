import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquareText } from 'lucide-react';
import { useInquiries } from '../../hooks/useData';
import { formatDate } from '../../lib/format';
import { EmptyState, SearchInput, Select, StatusBadge, Table, THead, TH, TR, TD, SectionHeader } from '../../components/ui';
import { INQUIRY_STATUSES } from '../../lib/constants';

export default function AdminInquiries() {
  const { inquiries, loading } = useInquiries();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return inquiries.filter((i) => {
      const matchesStatus = status === 'All' || i.status === status;
      return matchesStatus && [i.subject, i.inquiryNumber, i.clientName, i.clientEmail].join(' ').toLowerCase().includes(q);
    });
  }, [inquiries, query, status]);

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Client management" title="Inquiries" description="Client questions and conversations with your team." />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={query} onChange={setQuery} placeholder="Search inquiries…" className="w-full sm:max-w-sm" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full sm:w-44">
          <option value="All">All statuses</option>
          {INQUIRY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      {loading ? (
        <Table><THead><TR><TH>Subject</TH><TH>Client</TH><TH>Date</TH><TH>Status</TH></TR></THead></Table>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<MessageSquareText size={22} />} title="No inquiries found" description="Adjust your filters or wait for new submissions." />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Subject</TH>
              <TH>Client</TH>
              <TH>Number</TH>
              <TH>Date</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <tbody>
            {filtered.map((i) => (
              <TR key={i.id} onClick={() => navigate(`/admin/inquiries/${i.id}`)}>
                <TD className="font-semibold text-agdark-800">{i.subject}</TD>
                <TD>
                  <p className="font-semibold text-agdark-800">{i.clientName}</p>
                  <p className="text-xs text-agdark-400">{i.clientEmail}</p>
                </TD>
                <TD className="font-mono-data text-xs text-agblue">{i.inquiryNumber}</TD>
                <TD>{formatDate(i.createdAt)}</TD>
                <TD><StatusBadge status={i.status} /></TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
