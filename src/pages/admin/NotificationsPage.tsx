import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bell, BellRing } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useData';
import { db } from '../../backend';
import { timeAgo } from '../../lib/format';
import { Button, Card, EmptyState } from '../../components/ui';
import { cn } from '../../lib/cn';

export default function AdminNotifications() {
  const { user } = useAuth();
  const { notifications, unread } = useNotifications(user?.uid ?? '', 'admin');

  if (!user) return null;

  const markAll = async () => {
    try {
      const ids = notifications.filter((n) => !n.isRead).map((n) => n.id);
      await Promise.all(ids.map((id) => db.notifications.update(id, { isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Unable to update notifications.');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-agdark-800">Notifications</h1>
          <p className="mt-1 text-sm text-agdark-500">{unread > 0 ? `${unread} unread notification${unread === 1 ? '' : 's'}` : 'You are all caught up.'}</p>
        </div>
        {unread > 0 ? <Button variant="outline" size="sm" onClick={markAll}>Mark all read</Button> : null}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={<BellRing size={22} />} title="No notifications" description="New inquiries, quotations, and client activity will appear here." />
      ) : (
        <Card className="divide-y divide-agdark-50 overflow-hidden">
          {notifications.map((n) => (
            <div key={n.id} className={cn('flex items-start gap-3 px-5 py-4', !n.isRead && 'bg-agorange-50/50')}>
              <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', n.isRead ? 'bg-agdark-100 text-agdark-500' : 'bg-agorange text-white')}>
                <Bell size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-agdark-800">{n.title}</p>
                <p className="mt-0.5 text-sm leading-6 text-agdark-500">{n.message}</p>
                {n.link ? (
                  <Link to={n.link} className="mt-1 inline-block text-xs font-bold text-agorange hover:underline">View details →</Link>
                ) : null}
              </div>
              <span className="shrink-0 text-xs text-agdark-400">{timeAgo(n.createdAt)}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
