import { Calendar, Megaphone } from 'lucide-react';
import { useAnnouncements } from '../../hooks/useData';
import { formatDate } from '../../lib/format';
import { EmptyState, Skeleton } from '../../components/ui';

export default function AnnouncementsPage() {
  const { announcements, loading } = useAnnouncements(true);

  return (
    <div>
      <section className="relative overflow-hidden bg-agdark-800">
        <div className="absolute inset-0 blueprint-grid" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="eyebrow">News & updates</p>
          <h1 className="mt-3 max-w-2xl font-display text-5xl font-extrabold uppercase tracking-wide text-white">
            Announcements.
          </h1>
          <p className="mt-4 max-w-xl text-agdark-200">
            Company updates, project milestones, and community news from AG Construction.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44" />)}
          </div>
        ) : announcements.length === 0 ? (
          <EmptyState title="No announcements yet" description="Check back soon for updates." />
        ) : (
          <div className="space-y-6">
            {announcements.map((a) => (
              <article key={a.id} className="block rounded-xl border border-agdark-100 bg-white p-6 shadow-card">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-agdark-400">
                  <Megaphone size={14} className="text-agorange" />
                  {a.status}
                  <span className="text-agdark-300">·</span>
                  <Calendar size={14} />
                  {formatDate(a.publishDate)}
                </div>
                <h2 className="mt-2 font-display text-xl font-bold uppercase tracking-wide text-agdark-800">
                  {a.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-agdark-500">{a.content}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
