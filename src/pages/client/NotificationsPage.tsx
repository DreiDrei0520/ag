import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useData';
import { db } from '../../backend';
import { timeAgo } from '../../lib/format';
import { Button, Card, EmptyState, SectionHeader } from '../../components/ui';
import { cn } from '../../lib/cn';

export default function ClientNotifications() {
  const { user } = useAuth();
  const { notifications, unread } = useNotifications(user?.uid ?? '', 'client');

  if (!user) return null;

  const markAll = async () => {
    const unreadItems = notifications.filter((n) => !n.isRead);
    await Promise.all(unreadItems.map((n) => db.notifications.update(n.id, { isRead: true })));
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Client portal"
        title="Notifications"
        description={`${unread} unread notification${unread === 1 ? '' : 's'}`}
        action={
          unread > 0 ? (
            <Button variant="outline" onClick={markAll}>Mark all as read</Button>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState icon={<Bell size={22} />} title="No notifications" description="Updates about your quotations and inquiries will appear here." />
      ) : (
        <Card className="divide-y divide-agdark-50 overflow-hidden">
          {notifications.map((n) => (
            <Link
              key={n.id}
              to={n.link ?? '#'}
              onClick={() => { if (!n.isRead) void db.notifications.update(n.id, { isRead: true }); }}
              className={cn('flex items-start justify-between gap-4 px-5 py-4 transition hover:bg-agdark-50', !n.isRead && 'bg-agorange-50/50')}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-agdark-800">{n.title}</p>
                <p className="mt-0.5 text-sm leading-6 text-agdark-500">{n.message}</p>
              </div>
              <span className="shrink-0 text-xs text-agdark-400">{timeAgo(n.createdAt)}</span>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
