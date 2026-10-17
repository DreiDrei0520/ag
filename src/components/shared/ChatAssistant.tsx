import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Bot, MessageCircle, RotateCcw, Send, Users, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { db } from '../../backend';
import type { InquiryMessage } from '../../types';
import {
  LIVE_MAX_CHARS,
  LiveChatStart,
  LiveChatThread,
  loadSeenCount,
  loadSession,
  saveSeenCount,
  saveSession,
  sendLiveMessage,
  type LiveChatSession,
} from './LiveChat';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  /** Local-only messages (the greeting and error notices) are never sent back to the model. */
  local?: boolean;
  error?: boolean;
}

const STORAGE_KEY = 'ag_assistant_chat_v1';
const MAX_CHARS = 1000;
const GREETING: ChatMessage = {
  role: 'assistant',
  local: true,
  text: 'Hi! I can answer questions about our packages, payment terms, timelines, warranty, and permit requirements. Pwede rin po sa Tagalog.',
};
const SUGGESTIONS = [
  'How much per sqm?',
  'Ano ang mode of payment?',
  'Gaano katagal ang 2-storey?',
  'Building permit requirements?',
];
const SITE_PATHS = /(\/(?:quotation|faq|services|projects|contact|about))\b/g;

function loadMessages(): ChatMessage[] {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null') as ChatMessage[] | null;
    if (Array.isArray(saved) && saved.length) return saved;
  } catch {
    /* storage unavailable — start fresh */
  }
  return [GREETING];
}

// Turn site paths the assistant mentions (e.g. "/quotation") into in-app links.
function renderText(text: string, onNavigate: () => void): ReactNode {
  return text.split('\n').map((line, i) => (
    <Fragment key={i}>
      {i > 0 ? <br /> : null}
      {line.split(SITE_PATHS).map((part, j) =>
        j % 2 === 1 ? (
          <Link key={j} to={part} onClick={onNavigate} className="font-semibold text-agorange underline underline-offset-2">
            {part}
          </Link>
        ) : (
          part
        )
      )}
    </Fragment>
  ));
}

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Live chat with the team, alongside the AI assistant.
  const [session, setSession] = useState<LiveChatSession | null>(loadSession);
  const [tab, setTab] = useState<'ai' | 'team'>(() => (loadSession() ? 'team' : 'ai'));
  const [liveMessages, setLiveMessages] = useState<InquiryMessage[]>([]);
  const [chatClosed, setChatClosed] = useState(false);
  const [liveError, setLiveError] = useState('');
  const [seenReplies, setSeenReplies] = useState(loadSeenCount);

  const teamReplies = liveMessages.filter((m) => m.senderRole === 'admin').length;
  const unread = Math.max(0, teamReplies - seenReplies);
  const onTeamTab = tab === 'team';

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* storage unavailable — the chat still works for this page view */
    }
  }, [messages]);

  useEffect(() => {
    if (!session) {
      setLiveMessages([]);
      return;
    }
    return db.messages.subscribeFor(session.inquiryId, setLiveMessages);
  }, [session]);

  // A chat the team resolved, cancelled or deleted can't take new messages.
  useEffect(() => {
    if (!session || !open) return;
    let active = true;
    db.inquiries
      .get(session.inquiryId)
      .then((inquiry) => active && setChatClosed(!inquiry || inquiry.status === 'Resolved' || inquiry.status === 'Cancelled'))
      .catch(() => active && setChatClosed(true));
    return () => {
      active = false;
    };
  }, [session, open]);

  useEffect(() => {
    if (open && onTeamTab && teamReplies !== seenReplies) {
      setSeenReplies(teamReplies);
      saveSeenCount(teamReplies);
    }
  }, [open, onTeamTab, teamReplies, seenReplies]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    inputRef.current?.focus();
  }, [open, messages, sending, tab, liveMessages]);

  const sendLive = async (text: string) => {
    const message = text.trim().slice(0, LIVE_MAX_CHARS);
    if (!message || !session || sending) return;
    setDraft('');
    setSending(true);
    setLiveError('');
    try {
      await sendLiveMessage(session, message, liveMessages[liveMessages.length - 1]);
    } catch {
      setDraft(message);
      setLiveError('Message not sent. This chat may have been closed — start a new one, or call 0927-837-2757.');
    } finally {
      setSending(false);
    }
  };

  const startNewLiveChat = () => {
    saveSession(null);
    setSession(null);
    setChatClosed(false);
    setLiveError('');
    setSeenReplies(0);
  };

  const send = async (text: string) => {
    const question = text.trim().slice(0, MAX_CHARS);
    if (!question || sending) return;
    const next = [...messages, { role: 'user' as const, text: question }];
    setMessages(next);
    setDraft('');
    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.filter((m) => !m.local).map(({ role, text: t }) => ({ role, text: t })) }),
      });
      const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
      if (!res.ok || !data.reply) throw new Error(data.error || 'The assistant is unavailable right now.');
      setMessages((m) => [...m, { role: 'assistant', text: data.reply! }]);
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'The assistant is unavailable right now.';
      setMessages((m) => [
        ...m,
        { role: 'assistant', local: true, error: true, text: `${reason} You can also call 0927-837-2757 or message us on /contact.` },
      ]);
    } finally {
      setSending(false);
    }
  };

  const reset = () => setMessages([GREETING]);
  const close = () => setOpen(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open ? (
        <section
          role="dialog"
          aria-label="AG Assistant"
          onKeyDown={(e) => e.key === 'Escape' && close()}
          className="flex h-[min(560px,calc(100dvh-6rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-agdark-100 bg-white shadow-2xl"
        >
          <header className="flex items-center gap-3 bg-agdark-800 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-agorange text-white">
              {onTeamTab ? <Users size={18} /> : <Bot size={18} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-bold uppercase tracking-wide text-white">{onTeamTab ? 'AG Team' : 'AG Assistant'}</p>
              <p className="truncate text-[11px] text-agdark-300">
                {onTeamTab ? 'Chat with a real person from our team' : 'AI answers — please confirm details with our team'}
              </p>
            </div>
            {onTeamTab ? null : (
              <button onClick={reset} className="rounded-lg p-2 text-agdark-300 hover:bg-white/10 hover:text-white" aria-label="Start a new chat" title="New chat">
                <RotateCcw size={16} />
              </button>
            )}
            <button onClick={close} className="rounded-lg p-2 text-agdark-300 hover:bg-white/10 hover:text-white" aria-label="Close chat">
              <X size={18} />
            </button>
          </header>

          <div className="flex border-b border-agdark-100 bg-white text-xs font-bold" role="tablist">
            {([['ai', 'AI Assistant'], ['team', 'Chat with our team']] as const).map(([value, label]) => (
              <button
                key={value}
                role="tab"
                aria-selected={tab === value}
                onClick={() => setTab(value)}
                className={cn(
                  'relative flex-1 border-b-2 px-3 py-2.5 transition',
                  tab === value ? 'border-agorange text-agorange' : 'border-transparent text-agdark-500 hover:text-agdark-800'
                )}
              >
                {label}
                {value === 'team' && unread > 0 ? (
                  <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] text-white">{unread}</span>
                ) : null}
              </button>
            ))}
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-agdark-50/60 px-4 py-4" aria-live="polite">
            {onTeamTab ? (
              session ? (
                <>
                  <LiveChatThread messages={liveMessages} />
                  {chatClosed ? (
                    <div className="rounded-xl border border-agdark-100 bg-white p-3 text-center text-xs text-agdark-500">
                      This chat has been closed by our team.
                      <button onClick={startNewLiveChat} className="mt-2 block w-full font-bold text-agorange hover:underline">
                        Start a new chat
                      </button>
                    </div>
                  ) : null}
                  {liveError ? <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{liveError}</p> : null}
                </>
              ) : (
                <LiveChatStart
                  aiQuestions={messages.filter((m) => m.role === 'user').map((m) => m.text)}
                  onStarted={(s) => {
                    setSession(s);
                    setChatClosed(false);
                    setSeenReplies(0);
                  }}
                />
              )
            ) : null}
            {onTeamTab ? null : messages.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-6',
                    m.role === 'user'
                      ? 'rounded-br-md bg-agorange text-white'
                      : m.error
                        ? 'rounded-bl-md border border-red-200 bg-red-50 text-red-800'
                        : 'rounded-bl-md border border-agdark-100 bg-white text-agdark-700'
                  )}
                >
                  {m.role === 'user' ? m.text : renderText(m.text, close)}
                </div>
              </div>
            ))}
            {sending && !onTeamTab ? (
              <div className="flex justify-start">
                <div className="flex gap-1 rounded-2xl rounded-bl-md border border-agdark-100 bg-white px-4 py-3" aria-label="Assistant is typing">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-agdark-400" style={{ animationDelay: `${d * 150}ms` }} />
                  ))}
                </div>
              </div>
            ) : null}
            {!onTeamTab && messages.length === 1 && !sending ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-agorange/40 bg-white px-3 py-1.5 text-xs font-semibold text-agorange hover:bg-agorange-50"
                  >
                    {s}
                  </button>
                ))}
                <button
                  onClick={() => setTab('team')}
                  className="rounded-full border border-agdark-200 bg-white px-3 py-1.5 text-xs font-semibold text-agdark-600 hover:bg-agdark-50"
                >
                  Talk to a person
                </button>
              </div>
            ) : null}
          </div>

          {onTeamTab && (!session || chatClosed) ? null : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (onTeamTab) sendLive(draft);
              else send(draft);
            }}
            className="flex items-end gap-2 border-t border-agdark-100 bg-white p-3"
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              maxLength={MAX_CHARS}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (onTeamTab) sendLive(draft);
                  else send(draft);
                }
              }}
              placeholder={onTeamTab ? 'Message our team…' : 'Ask about packages, payment, permits…'}
              aria-label={onTeamTab ? 'Your message' : 'Your question'}
              className="max-h-28 min-h-[40px] flex-1 resize-none rounded-lg border border-agdark-200 px-3 py-2 text-sm focus:border-agorange focus:outline-none"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-agorange text-white transition hover:bg-agorange-600 disabled:opacity-40"
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </form>
          )}
        </section>
      ) : null}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close AG Assistant' : 'Open AG Assistant'}
        className="relative flex h-14 items-center gap-2 rounded-full bg-agorange px-4 font-semibold text-white shadow-xl transition hover:bg-agorange-600 active:scale-95"
      >
        {!open && unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] text-white" aria-label={`${unread} new replies from our team`}>
            {unread}
          </span>
        ) : null}
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        <span className={cn('text-sm', open ? 'sr-only' : 'hidden sm:inline')}>Ask AG</span>
      </button>
    </div>
  );
}
