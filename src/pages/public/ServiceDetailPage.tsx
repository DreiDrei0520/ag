import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import { useServices } from '../../hooks/useData';
import { formatPHP } from '../../lib/format';
import { Card, EmptyState, PageLoader } from '../../components/ui';

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const { services, loading } = useServices(true);

  if (loading) return <PageLoader />;
  const service = services.find((s) => s.slug === slug);
  if (!service) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState title="Service not found" description="This service may have been removed or unpublished." action={<Link to="/services" className="btn-secondary">Back to services</Link>} />
      </div>
    );
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-agdark-800">
        <div className="absolute inset-0 blueprint-grid" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Link to="/services" className="inline-flex items-center gap-1.5 text-sm font-semibold text-agdark-300 hover:text-white">
            <ArrowLeft size={15} /> All services
          </Link>
          <p className="eyebrow mt-6">{service.category}</p>
          <h1 className="mt-2 max-w-3xl font-display text-5xl font-extrabold uppercase tracking-wide text-white">{service.title}</h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-8">
            <div className="overflow-hidden rounded-xl">
              <img src={service.imageUrl} alt={service.title} className="h-80 w-full object-cover" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-agdark-800">Overview</h2>
              <p className="mt-3 leading-7 text-agdark-600">{service.description}</p>
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-agdark-800">What's included</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {service.inclusions.map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-lg border border-agdark-100 bg-white px-3 py-2.5 text-sm text-agdark-700">
                    <CheckCircle2 size={15} className="shrink-0 text-agorange" /> {item}
                  </div>
                ))}
              </div>
            </div>

            {service.slug === 'master-plan-design-package' && (
              <div>
                <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-agdark-800">3D design preview</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {[
                    'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=900&q=80',
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80',
                    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900&q=80',
                  ].map((src) => (
                    <img key={src} src={src} alt="3D interior and exterior design" className="h-44 w-full rounded-xl object-cover" />
                  ))}
                </div>
              </div>
            )}

            {service.slug === 'master-plan-design-package' && (
              <div>
                <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-agdark-800">Signed and sealed documents</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {[
                    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900&q=80',
                    'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=900&q=80',
                    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80',
                  ].map((src) => (
                    <img key={src} src={src} alt="Signed and sealed construction plans" className="h-44 w-full rounded-xl object-cover" />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <Card className="p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-agdark-400">Starting price</p>
              <p className="mt-1 font-display text-3xl font-extrabold text-agorange">
                {service.startingPrice > 0 ? formatPHP(service.startingPrice) : 'Custom'}
              </p>
              <p className="text-sm text-agdark-500">{service.startingPrice > 0 ? service.priceUnit : 'Based on project brief'}</p>
              <div className="mt-5 space-y-2 border-t border-agdark-100 pt-5">
                {service.features.map((f) => (
                  <p key={f} className="flex items-center gap-2 text-sm text-agdark-700">
                    <CheckCircle2 size={15} className="shrink-0 text-agorange" /> {f}
                  </p>
                ))}
              </div>
            </Card>

            <Card className="bg-agdark-800 p-6">
              <p className="eyebrow">Preliminary estimate</p>
              <h3 className="mt-2 font-display text-xl font-bold uppercase tracking-wide text-white">Get an instant estimate</h3>
              <p className="mt-2 text-sm leading-6 text-agdark-200">
                Answer a few questions and receive an itemized preliminary estimate in minutes.
              </p>
              <Link to="/quotation" className="btn-primary mt-5 w-full">
                Start Smart Quotation <Sparkles size={15} />
              </Link>
              <Link to="/contact" className="btn-outline-white mt-3 w-full">
                Ask a question
              </Link>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
