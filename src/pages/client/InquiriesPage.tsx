import { Link, useNavigate } from 'react-router-dom';
import { MessageSquareText, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useInquiries } from '../../hooks/useData';
import { formatDate } from '../../lib/format';
import { EmptyState, StatusBadge, Table, THead, TH, TR, TD, SectionHeader } from '../../components/ui';

export default function ClientInquiries() {
  const { user } = useAuth();
  const { inquiries, loading } = useInquiries(user?.uid);
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Client portal"
        title="My inquiries"
        description="Conversations with our team about your projects."
        action={<Link to="/client/inquiries/new" className="btn-primary"><Plus size={16} /> New inquiry</Link>}
      />

      {loading ? (
        <Table><THead><TR><TH>Subject</TH><TH>Number</TH><TH>Date</TH><TH>Status</TH></TR></THead></Table>
      ) : inquiries.length === 0 ? (
        <EmptyState
          icon={<MessageSquareText size={22} />}
          title="No inquiries yet"
          description="Ask us anything about your project — we reply within one business day."
          action={<Link to="/client/inquiries/new" className="btn-primary">Start an inquiry</Link>}
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Subject</TH>
              <TH>Number</TH>
              <TH>Last updated</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <tbody>
            {inquiries.map((i) => (
              <TR key={i.id} onClick={() => navigate(`/client/inquiries/${i.id}`)}>
                <TD className="font-semibold text-agdark-800">{i.subject}</TD>
                <TD className="font-semibold text-agblue">{i.inquiryNumber}</TD>
                <TD>{formatDate(i.updatedAt ?? i.createdAt)}</TD>
                <TD><StatusBadge status={i.status} /></TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
