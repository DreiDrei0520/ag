import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Search } from 'lucide-react';
import { useServices, useServiceCategories } from '../../hooks/useData';
import { formatPHP } from '../../lib/format';
import { EmptyState, Input, Skeleton } from '../../components/ui';

export default function ServicesPage() {
  const { services, loading } = useServices(true);
  const { items: categories } = useServiceCategories();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return services.filter((s) => {
      const matchesCategory = category === 'All' || s.category === category;
      const matchesQuery = [s.title, s.shortDescription, s.description].join(' ').toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [services, query, category]);

  return (
    <div>
      <section className="relative overflow-hidden bg-agdark-800">
        <div className="absolute inset-0 blueprint-grid" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="eyebrow">Construction services</p>
          <h1 className="mt-3 max-w-2xl font-display text-5xl font-extrabold uppercase tracking-wide text-white">
            Services for every build, from ground zero to finish.
          </h1>
          <p className="mt-4 max-w-xl text-agdark-200">
            Browse our specialized construction services. Use the Smart Quotation tool to get an instant
            preliminary estimate for your project.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-agdark-400" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search services…" className="pl-9" />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 w-full max-w-xs rounded-lg border border-agdark-200 bg-white px-3 text-sm">
            <option value="All">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-96" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="No services match your search"
              description="Try a different keyword or category."
            />
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((service) => (
              <Link
                key={service.id}
                to={`/services/${service.slug}`}
                className="group overflow-hidden rounded-xl border border-agdark-100 bg-white shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-48 overflow-hidden">
                  <img src={service.imageUrl} alt={service.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <span className="absolute left-3 top-3 rounded-md bg-agdark-900/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur">
                    {service.category}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-xl font-bold uppercase tracking-wide text-agdark-800">{service.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-agdark-500">{service.shortDescription}</p>
                  <ul className="mt-4 space-y-1.5">
                    {service.features.slice(0, 3).map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-agdark-600">
                        <CheckCircle2 size={14} className="shrink-0 text-agorange" /> {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex items-center justify-between border-t border-agdark-100 pt-4">
                    <p className="font-display text-lg font-bold text-agdark-800">
                      {service.startingPrice > 0 ? formatPHP(service.startingPrice) : 'Custom quote'}
                      <span className="ml-1 text-xs font-semibold text-agdark-400">{service.startingPrice > 0 ? service.priceUnit : ''}</span>
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-agorange">
                      Details <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="bg-agdark-50/50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="eyebrow">Finishing packages</p>
          <h2 className="mt-3 font-display text-4xl font-bold uppercase tracking-wide text-agdark-800">
            Choose your finish — per square meter
          </h2>
          <p className="mt-4 max-w-2xl text-agdark-500">
            Every construction project is delivered with your choice of finish package, priced per square meter.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { img: '/finishes/standard.webp', name: 'Standard Finish', price: '₱28,000 / sqm', text: 'Quality, practical finishes for budget-conscious builds.' },
              { img: '/finishes/elegant.webp', name: 'Elegant Finish', price: '₱35,000 / sqm', text: 'Elevated finishes with premium tiles, fittings, and detailing.' },
              { img: '/finishes/luxury.webp', name: 'Luxury Finish', price: '₱45,000 / sqm', text: 'Premium luxury finishes with high-end materials and fixtures.' },
            ].map((f) => (
              <div key={f.name} className="overflow-hidden rounded-xl border border-agdark-100 bg-white shadow-card">
                <div className="h-52 overflow-hidden">
                  <img src={f.img} alt={f.name} className="h-full w-full object-cover" />
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-agdark-800">{f.name}</h3>
                  <p className="mt-1 font-display text-xl font-bold text-agorange">{f.price}</p>
                  <p className="mt-2 text-sm text-agdark-500">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
