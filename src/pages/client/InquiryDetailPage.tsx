import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useInquiries, useInquiryMessages } from '../../hooks/useData';
import { db } from '../../backend';
import { formatDateTime } from '../../lib/format';
import { Button, Card, EmptyState, PageLoader, StatusBadge } from '../../components/ui';
import { cn } from '../../lib/cn';

export default function ClientInquiryDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { inquiries, loading } = useInquiries(user?.uid);
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
    setSending(true);
    try {
      await db.messages.create(inquiry.id, {
        senderId: user?.uid ?? 'client',
        senderName: user?.fullName ?? inquiry.clientName,
        senderRole: 'client',
        message: text.trim(),
      });
      await db.inquiries.update(inquiry.id, { status: inquiry.status === 'Resolved' ? 'In Progress' : inquiry.status });
      setText('');
    } catch {
      toast.error('Unable to send message.');
    } finally {
      setSending(false);
    }
  }, [inquiry, text, user]);

  if (loading) return <PageLoader />;
  if (!inquiry) {
    return (
      <EmptyState
        title="Inquiry not found"
        description="This inquiry may have been removed."
        action={<Link to="/client/inquiries" className="btn-secondary">Back to inquiries</Link>}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/client/inquiries" className="inline-flex items-center gap-1.5 text-sm font-bold text-agorange hover:underline">
          <ArrowLeft size={15} /> All inquiries
        </Link>
        <StatusBadge status={inquiry.status} />
      </div>

      <Card className="p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-agdark-400">{inquiry.inquiryNumber}</p>
        <h1 className="mt-1 font-display text-2xl font-bold uppercase tracking-wide text-agdark-800">{inquiry.subject}</h1>
        <p className="mt-3 text-sm leading-6 text-agdark-600">{inquiry.message}</p>
        {inquiry.projectDetails ? (
          <p className="mt-2 rounded-lg bg-agdark-50 px-4 py-3 text-sm text-agdark-600">
            <span className="font-semibold text-agdark-800">Project details:</span> {inquiry.projectDetails}
          </p>
        ) : null}
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-agdark-100 px-5 py-3">
          <h2 className="font-display text-base font-bold uppercase tracking-wide text-agdark-800">Conversation</h2>
        </div>
        <div ref={scrollRef} className="max-h-[420px] space-y-3 overflow-y-auto bg-agdark-50/40 px-5 py-4">
          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-agdark-400">No messages yet — say hello to get things started.</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={cn('flex', m.senderRole === 'client' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-6 shadow-sm', m.senderRole === 'client' ? 'rounded-tr-sm bg-agblue text-white' : 'rounded-tl-sm bg-white text-agdark-700')}>
                  <p className={cn('mb-0.5 text-[11px] font-bold', m.senderRole === 'client' ? 'text-white/70' : 'text-agorange')}>{m.senderName}</p>
                  <p>{m.message}</p>
                  <p className={cn('mt-1 text-[10px]', m.senderRole === 'client' ? 'text-white/60' : 'text-agdark-400')}>{formatDateTime(m.createdAt)}</p>
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
            placeholder="Type your message…"
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
