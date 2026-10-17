import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail, Phone, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useInquiries, useInquiryMessages } from '../../hooks/useData';
import { db } from '../../backend';
import { writeAuditLog } from '../../lib/activity';
import { isReplyEmailConfigured, replyMailtoLink, sendInquiryReply } from '../../lib/email';
import { formatDateTime } from '../../lib/format';
import { Button, Card, EmptyState, PageLoader, Select, StatusBadge } from '../../components/ui';
import { INQUIRY_STATUSES } from '../../lib/constants';
import { cn } from '../../lib/cn';
import type { InquiryStatus } from '../../types';

const ALLOWED_TRANSITIONS: Record<InquiryStatus, InquiryStatus[]> = {
  Pending: ['In Progress', 'Cancelled'],
  'In Progress': ['Resolved', 'Cancelled'],
  Resolved: [],
  Cancelled: [],
};

export default function AdminInquiryDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { inquiries, loading } = useInquiries();
  const { messages } = useInquiryMessages(id ?? '');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const inquiry = useMemo(() => inquiries.find((i) => i.id === id), [inquiries, id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  const send = useCallback(async () => {
    if (!inquiry || !text.trim()) return;
    const message = text.trim();
    setSending(true);
    try {
      await db.messages.create(inquiry.id, {
        senderId: user?.uid ?? 'admin',
        senderName: user?.fullName ?? 'AG Construction',
        senderRole: 'admin',
        message,
      });
      if (inquiry.status === 'Pending') {
        await db.inquiries.update(inquiry.id, { status: 'In Progress' });
      }
      setText('');
      // Chat clients read replies in the website chat, so there is nothing to email.
      if (inquiry.channel === 'chat') return;
      if (!inquiry.clientEmail) {
        toast.success('Reply saved. This client has no email — contact them by phone.');
        return;
      }
      const subject = `Re: ${inquiry.inquiryNumber} — ${inquiry.subject}`;
      if (isReplyEmailConfigured) {
        try {
          await sendInquiryReply({
            toEmail: inquiry.clientEmail,
            toName: inquiry.clientName,
            subject,
            message,
            inquiryNumber: inquiry.inquiryNumber,
          });
          toast.success(`Reply emailed to ${inquiry.clientEmail}`);
        } catch {
          toast.error('Reply saved, but the email could not be sent. Opening your email app instead.');
          window.location.href = replyMailtoLink(inquiry.clientEmail, subject, message);
        }
      } else {
        // No email service set up: hand the reply to the admin's own email app to send.
        window.location.href = replyMailtoLink(inquiry.clientEmail, subject, message);
      }
    } catch {
      toast.error('Unable to save the message.');
    } finally {
      setSending(false);
    }
  }, [inquiry, text, user]);

  const changeStatus = async (status: string) => {
    if (!inquiry || status === inquiry.status) return;
    const next = status as InquiryStatus;
    const allowed = ALLOWED_TRANSITIONS[inquiry.status] ?? [];
    if (!allowed.includes(next)) {
      toast.error(`Cannot move an inquiry from "${inquiry.status}" to "${next}".`);
      return;
    }
    try {
      await db.inquiries.update(inquiry.id, { status: next });
      if (user) await writeAuditLog({ actor: user }, 'inquiry_status_changed', 'inquiry', inquiry.id, { from: inquiry.status, to: next });
      toast.success(`Status updated to ${next}`);
    } catch {
      toast.error('Unable to update the status.');
    }
  };

  if (loading) return <PageLoader />;
  if (!inquiry) {
    return (
      <EmptyState
        title="Inquiry not found"
        description="This inquiry may have been removed."
        action={<Link to="/admin/inquiries" className="btn-secondary">Back to inquiries</Link>}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/admin/inquiries" className="inline-flex items-center gap-1.5 text-sm font-bold text-agorange hover:underline">
          <ArrowLeft size={15} /> All inquiries
        </Link>
        <div className="flex items-center gap-3">
          <StatusBadge status={inquiry.status} />
          <Select value={inquiry.status} onChange={(e) => changeStatus(e.target.value)} className="w-44">
            {INQUIRY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      </div>

      <Card className="p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-agdark-400">
          {inquiry.inquiryNumber} · {inquiry.clientName} · {inquiry.clientEmail}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold uppercase tracking-wide text-agdark-800">{inquiry.subject}</h1>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
          {inquiry.clientEmail ? (
            <a
              href={replyMailtoLink(inquiry.clientEmail, `Re: ${inquiry.inquiryNumber} — ${inquiry.subject}`)}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-agorange hover:underline"
            >
              <Mail size={14} /> {inquiry.clientEmail}
            </a>
          ) : null}
          {inquiry.clientPhone ? (
            <a href={`tel:${inquiry.clientPhone}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-agorange hover:underline">
              <Phone size={14} /> {inquiry.clientPhone}
            </a>
          ) : null}
        </div>
        <p className="mt-3 text-sm leading-6 text-agdark-600">{inquiry.message}</p>
        {inquiry.projectDetails ? (
          <p className="mt-2 rounded-lg bg-agdark-50 px-4 py-3 text-sm text-agdark-600">
            <span className="font-semibold text-agdark-800">Project details:</span> {inquiry.projectDetails}
          </p>
        ) : null}
        {inquiry.quotationId ? (
          <p className="mt-2 rounded-lg bg-agorange-50 px-4 py-3 text-sm text-agdark-700">
            <span className="font-semibold text-agorange">Referenced quotation:</span> {inquiry.quotationNumber ?? '—'}
            <Link to={`/admin/quotations/${inquiry.quotationId}`} className="ml-2 font-bold text-agorange hover:underline">View →</Link>
          </p>
        ) : null}
        {inquiry.attachments.length > 0 ? (
          <div className="mt-3">
            <p className="text-xs font-bold uppercase tracking-widest text-agdark-500">Attachments</p>
            <ul className="mt-1.5 space-y-1">
              {inquiry.attachments.map((a) => (
                <li key={a.name}><a href={a.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-agblue hover:underline">{a.name}</a></li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-agdark-100 px-5 py-3">
          <h2 className="font-display text-base font-bold uppercase tracking-wide text-agdark-800">Conversation</h2>
          <p className="mt-0.5 text-xs text-agdark-400">
            {inquiry.channel === 'chat'
              ? 'Live chat from the website — the client sees your replies in their chat window.'
              : isReplyEmailConfigured
                ? 'Your replies are emailed to the client automatically.'
                : 'Sending a reply opens your email app with it filled in.'}
          </p>
        </div>
        <div ref={scrollRef} className="max-h-[460px] space-y-3 overflow-y-auto bg-agdark-50/40 px-5 py-4">
          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-agdark-400">No messages yet — reply to the client below.</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={cn('flex', m.senderRole === 'admin' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-6 shadow-sm', m.senderRole === 'admin' ? 'rounded-tr-sm bg-agdark-800 text-white' : 'rounded-tl-sm bg-white text-agdark-700')}>
                  <p className={cn('mb-0.5 text-[11px] font-bold', m.senderRole === 'admin' ? 'text-agorange' : 'text-agblue')}>{m.senderName}</p>
                  <p>{m.message}</p>
                  <p className={cn('mt-1 text-[10px]', m.senderRole === 'admin' ? 'text-white/60' : 'text-agdark-400')}>{formatDateTime(m.createdAt)}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex items-center gap-2 border-t border-agdark-100 bg-white px-4 py-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Reply to the client…"
            className="h-10 flex-1 rounded-lg border border-agdark-200 px-3 text-sm focus:border-agblue focus:outline-none focus:ring-2 focus:ring-agblue/20"
          />
          <Button onClick={send} loading={sending} disabled={!text.trim()}>
            <Send size={15} /> Send
          </Button>
        </div>
      </Card>
    </div>
  );
}
