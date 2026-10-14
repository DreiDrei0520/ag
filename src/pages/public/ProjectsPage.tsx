import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { useProjects, useProjectCategories } from '../../hooks/useData';
import { EmptyState, Input, Skeleton } from '../../components/ui';
import { PAYMENT_METHODS, PAYMENT_METHODS_NOTE, PROGRESS_BILLING } from '../../lib/companyInfo';

export default function ProjectsPage() {
  const { projects, loading } = useProjects(true);
  const { items: types } = useProjectCategories();
  const [query, setQuery] = useState('');
  const [projectType, setProjectType] = useState('All');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return projects.filter((p) => {
      const matchesType = projectType === 'All' || p.categoryId === projectType;
      const matchesQuery = [p.title, p.location, p.description].join(' ').toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  }, [projects, query, projectType]);

  return (
    <div>
      <section className="relative overflow-hidden bg-agdark-800">
        <div className="absolute inset-0 blueprint-grid" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="eyebrow">Our portfolio</p>
          <h1 className="mt-3 max-w-2xl font-display text-5xl font-extrabold uppercase tracking-wide text-white">
            Projects that speak for themselves.
          </h1>
          <p className="mt-4 max-w-xl text-agdark-200">
            A selection of completed and ongoing construction projects across residential, commercial, and infrastructure work.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-agdark-400" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects…" className="pl-9" />
          </div>
          <select value={projectType} onChange={(e) => setProjectType(e.target.value)} className="h-10 w-full max-w-xs rounded-lg border border-agdark-200 bg-white px-3 text-sm">
            <option value="All">All project types</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-80" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10">
            <EmptyState title="No projects found" description="Try adjusting your search or filters." />
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="group relative overflow-hidden rounded-xl shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              >
                <img src={project.featuredImage} alt={project.title} className="h-80 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-agdark-900 via-agdark-900/40 to-transparent" />
                <div className="absolute right-0 left-0 bottom-0 p-5">
                  <p className="inline-block rounded-md bg-agorange/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                    {project.status}
                  </p>
                  <h3 className="mt-2 font-display text-xl font-bold uppercase tracking-wide text-white">{project.title}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-agdark-200">
                    <span className="text-agorange">{project.area}</span> m² · {project.location}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-agorange">
                    View project <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="bg-agdark-50/50 py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="overflow-hidden rounded-xl">
            <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80" alt="Transparent payment terms" className="h-80 w-full object-cover" />
          </div>
          <div>
            <p className="eyebrow">Transparent billing</p>
            <h2 className="mt-3 font-display text-3xl font-bold uppercase tracking-wide text-agdark-800">
              Progress billing, no surprises
            </h2>
            <p className="mt-4 leading-7 text-agdark-600">
              You pay in stages as the work is completed — for the safety and assurance of both you and
              the contractor. We accept {PAYMENT_METHODS.join(', ').toLowerCase()} ({PAYMENT_METHODS_NOTE.toLowerCase()})
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {PROGRESS_BILLING.map((plan) => (
                <div key={plan.scheme} className="rounded-lg border border-agdark-100 bg-white p-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-agdark-500">{plan.scheme}</p>
                  <p className="mt-1 font-display text-lg font-bold text-agorange">{plan.stages.map((s) => s.pct).join(' / ')}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/faq#payment" className="btn-primary">See payment terms <ArrowRight size={16} /></Link>
              <Link to="/quotation" className="btn-secondary">Get a preliminary estimate</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
