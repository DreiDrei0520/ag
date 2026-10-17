import { useState } from 'react';
import { db } from '../../backend';
import { notifyAdmins } from '../../lib/activity';
import { DEFAULT_SETTINGS } from '../../lib/constants';
import { makeInquiryNumber } from '../../lib/format';
import { cn } from '../../lib/cn';
import type { InquiryMessage } from '../../types';

// Visitors have no accounts, so a live chat is an inquiry (channel 'chat') whose random id is kept
// in this browser. The Firestore rules let whoever holds that id read the chat and keep replying.
export interface LiveChatSession {
  inquiryId: string;
  name: string;
}

const SESSION_KEY = 'ag_live_chat_v1';
const SEEN_KEY = 'ag_live_chat_seen_v1';
export const LIVE_MAX_CHARS = 1000;

export function loadSession(): LiveChatSession | null {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') as LiveChatSession | null;
    if (saved && typeof saved.inquiryId === 'string' && typeof saved.name === 'string') return saved;
  } catch {
    /* storage unavailable — no saved chat */
  }
  return null;
}

export function saveSession(session: LiveChatSession | null): void {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SEEN_KEY);
  } catch {
    /* storage unavailable — the chat lasts for this page view only */
  }
}

/** How many team replies this visitor has already seen, for the unread dot. */
export function loadSeenCount(): number {
  try {
    return Number(localStorage.getItem(SEEN_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function saveSeenCount(count: number): void {
  try {
    localStorage.setItem(SEEN_KEY, String(count));
  } catch {
    /* storage unavailable */
  }
}

async function startLiveChat(input: {
  name: string;
  email: string;
  phone: string;
  message: string;
  aiQuestions: string[];
}): Promise<LiveChatSession> {
  const context = input.aiQuestions.length
    ? `Started a live chat from the website. Earlier questions to the AI assistant:\n${input.aiQuestions.map((q) => `- ${q}`).join('\n')}`
    : 'Started a live chat from the website.';
  const inquiry = await db.inquiries.create({
    inquiryNumber: makeInquiryNumber(),
    clientId: '',
    clientName: input.name,
    clientEmail: input.email,
    clientPhone: input.phone || undefined,
    subject: 'Live chat',
    message: context.slice(0, 4000),
    attachments: [],
    status: 'Pending',
    channel: 'chat',
  });
  await db.messages.create(inquiry.id, {
    senderId: 'client',
    senderName: input.name,
    senderRole: 'client',
    message: input.message,
  });
  await notifyAdmins({
    title: `New live chat from ${input.name}`,
    message: input.message,
    type: 'chat',
    referenceId: inquiry.id,
    link: `/admin/inquiries/${inquiry.id}`,
  });
  return { inquiryId: inquiry.id, name: input.name };
}

export async function sendLiveMessage(session: LiveChatSession, message: string, previous?: InquiryMessage): Promise<void> {
  await db.messages.create(session.inquiryId, {
    senderId: 'client',
    senderName: session.name,
    senderRole: 'client',
    message,
  });
  // Notify once per turn: only when the client answers the team, not for every line they type.
  if (previous?.senderRole === 'admin') {
    await notifyAdmins({
      title: `${session.name} replied in live chat`,
      message,
      type: 'chat',
      referenceId: session.inquiryId,
      link: `/admin/inquiries/${session.inquiryId}`,
    });
  }
}

const inputClass = 'h-10 w-full rounded-lg border border-agdark-200 px-3 text-sm focus:border-agorange focus:outline-none';

export function LiveChatStart({ aiQuestions, onStarted }: { aiQuestions: string[]; onStarted: (s: LiveChatSession) => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const message = form.message.trim().slice(0, LIVE_MAX_CHARS);
    if (!email && !phone) {
      setError('Please give an email or phone number so we can reach you.');
      return;
    }
    setError('');
    setStarting(true);
    try {
      const session = await startLiveChat({ name, email, phone, message, aiQuestions: aiQuestions.slice(-6) });
      saveSession(session);
      onStarted(session);
    } catch {
      setError('Unable to start the chat right now. Please call 0927-837-2757 or use the Contact page.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2.5 rounded-2xl border border-agdark-100 bg-white p-4">
      <p className="text-sm font-semibold text-agdark-800">Chat with the AG team</p>
      <p className="text-xs leading-5 text-agdark-500">
        A team member will reply here during business hours ({DEFAULT_SETTINGS.businessHours}). You can close this window — your chat is saved on this device.
      </p>
      <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" autoComplete="name" className={inputClass} />
      <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" autoComplete="email" className={inputClass} />
      <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone (optional if you gave an email)" autoComplete="tel" className={inputClass} />
      <textarea
        required
        rows={3}
        maxLength={LIVE_MAX_CHARS}
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        placeholder="How can we help?"
        className="w-full resize-none rounded-lg border border-agdark-200 px-3 py-2 text-sm focus:border-agorange focus:outline-none"
      />
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={starting}
        className="h-10 w-full rounded-lg bg-agorange text-sm font-semibold text-white transition hover:bg-agorange-600 disabled:opacity-50"
      >
        {starting ? 'Starting…' : 'Start chat'}
      </button>
    </form>
  );
}

export function LiveChatThread({ messages }: { messages: InquiryMessage[] }) {
  const waiting = !messages.some((m) => m.senderRole === 'admin');
  return (
    <>
      {messages.map((m) => (
        <div key={m.id} className={cn('flex', m.senderRole === 'client' ? 'justify-end' : 'justify-start')}>
          <div
            className={cn(
              'max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-6',
              m.senderRole === 'client' ? 'rounded-br-md bg-agorange text-white' : 'rounded-bl-md border border-agdark-100 bg-white text-agdark-700'
            )}
          >
            {m.senderRole !== 'client' ? <p className="mb-0.5 text-[11px] font-bold text-agblue">{m.senderName || 'AG Team'}</p> : null}
            {m.message}
          </div>
        </div>
      ))}
      {waiting ? (
        <p className="px-2 text-center text-xs leading-5 text-agdark-400">
          Message sent. Our team will reply here during business hours ({DEFAULT_SETTINGS.businessHours}).
        </p>
      ) : null}
    </>
  );
}
