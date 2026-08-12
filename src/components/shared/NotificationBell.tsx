import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../hooks/useData';
import { db } from '../../backend';
import { timeAgo } from '../../lib/format';
import { cn } from '../../lib/cn';
import type { AppUser } from '../../types';

export default function NotificationBell({ user }: { user: AppUser }) {
  const { notifications, unread } = useNotifications(user.uid, user.role);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function markAllRead() {
    const unreadItems = notifications.filter((n) => !n.isRead);
    await Promise.all(unreadItems.map((n) => db.notifications.update(n.id, { isRead: true })));
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-agdark-500 transition hover:bg-agdark-100 hover:text-agdark-800"
        aria-label={`Notifications (${unread} unread)`}
      >
        <Bell size={18} />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-agorange px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-agdark-100 bg-white shadow-2xl sm:w-96">
          <div className="flex items-center justify-between border-b border-agdark-100 px-4 py-3">
            <p className="text-sm font-semibold text-agdark-800">Notifications</p>
            {unread > 0 ? (
              <button onClick={markAllRead} className="text-xs font-semibold text-agorange hover:text-agorange-600">
                Mark all as read
              </button>
            ) : null}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-agdark-400">No notifications yet.</div>
            ) : (
              notifications.slice(0, 12).map((n) => (
                <Link
                  key={n.id}
                  to={n.link ?? '#'}
                  onClick={() => {
                    if (!n.isRead) void db.notifications.update(n.id, { isRead: true });
                    setOpen(false);
                  }}
                  className={cn(
                    'block border-b border-agdark-50 px-4 py-3 transition hover:bg-agdark-50',
                    !n.isRead && 'bg-agorange-50/50'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-agdark-800">{n.title}</p>
                    <span className="shrink-0 text-[10px] text-agdark-400">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-agdark-500">{n.message}</p>
                </Link>
              ))
            )}
          </div>
          <Link
            to={user.role === 'admin' ? '/admin/notifications' : '/client/notifications'}
            onClick={() => setOpen(false)}
            className="block border-t border-agdark-100 bg-agdark-50 px-4 py-2.5 text-center text-xs font-semibold text-agorange hover:bg-agdark-100"
          >
            View all notifications
          </Link>
        </div>
      ) : null}
    </div>
  );
}
