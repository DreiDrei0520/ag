import { Award, Building2, HardHat, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

const values = [
  {
    icon: HardHat,
    title: 'Safety first',
    description: 'Every job runs on rigorous safety protocols — for our people, our partners, and the communities we build in.',
  },
  {
    icon: Award,
    title: 'Quality craftsmanship',
    description: 'We use certified materials and experienced trades to deliver work that stands the test of time.',
  },
  {
    icon: Target,
    title: 'On-time delivery',
    description: 'Clear timelines and transparent progress reporting keep projects on schedule and on budget.',
  },
  {
    icon: Building2,
    title: 'Client partnership',
    description: 'We listen first, build second — treating your goals as the blueprint for everything we do.',
  },
];

export default function AboutPage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-agdark-800">
        <div className="absolute inset-0 blueprint-grid" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="eyebrow">About us</p>
          <h1 className="mt-3 max-w-2xl font-display text-5xl font-extrabold uppercase tracking-wide text-white">
            Built on trust. Driven by craft.
          </h1>
          <p className="mt-4 max-w-xl text-agdark-200">
            A full-service design and construction company covering CALABARZON and NCR — from free site
            visits and design to groundbreaking, construction, and turnover, with a 5-year warranty.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="overflow-hidden rounded-xl">
            <img src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&q=80" alt="Construction site" className="h-96 w-full object-cover" />
          </div>
          <div>
            <h2 className="font-display text-3xl font-extrabold uppercase tracking-wide text-agdark-800">Who we are</h2>
            <p className="mt-4 leading-7 text-agdark-600">
              AG Construction Builders is a full-service design and build contractor headquartered in
              Los Baños, Laguna, serving clients across CALABARZON and NCR. From residential homes and
              commercial buildings to roads, highways, and private projects, we take a 'scratch to hatch'
              approach — handling everything from design and planning to permits, construction, and
              turnover under engineer supervision.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { value: '120+', label: 'Projects completed' },
                { value: '98%', label: 'Client satisfaction' },
                { value: '5-Yr', label: 'Build warranty' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-agdark-800 p-4 text-center">
                  <p className="font-display text-2xl font-extrabold text-agorange">{s.value}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-agdark-300">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-agdark-100 bg-agdark-50 p-8">
              <p className="eyebrow">Vision</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold uppercase tracking-wide text-agdark-800">Our vision</h2>
              <p className="mt-4 leading-7 text-agdark-600">
                To be a trusted leader in the construction industry, delivering world-class infrastructure
                and building solutions that shape communities, enhance lives, and inspire future generations.
              </p>
            </div>
            <div className="rounded-2xl bg-agdark-800 p-8">
              <p className="eyebrow">Mission</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold uppercase tracking-wide text-white">Our mission</h2>
              <p className="mt-4 leading-7 text-agdark-200">
                Our mission is to provide high-quality, innovative, and sustainable construction services
                with a commitment to safety, integrity, and excellence. We strive to exceed client
                expectations by fostering long-term partnerships, empowering our people, and embracing
                modern technologies to build strong foundations for a better tomorrow. Rooted in faith,
                love, and mutual respect, we continue to grow through our dedicated team, the trust of our
                clients, and the strength of our shared vision.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-display text-3xl font-extrabold uppercase tracking-wide text-agdark-800">What we stand for</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-xl border border-agdark-100 bg-agdark-50 p-6">
                <Icon size={22} className="text-agorange" />
                <h3 className="mt-3 font-display text-lg font-bold uppercase tracking-wide text-agdark-800">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-agdark-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 text-center sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl font-extrabold uppercase tracking-wide text-agdark-800">Ready to start your project?</h2>
        <p className="mx-auto mt-2 max-w-md text-agdark-500">Get a preliminary estimate in minutes with our Smart Quotation tool.</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/quotation" className="btn-primary">Start Smart Quotation</Link>
          <Link to="/contact" className="btn-secondary">Contact us</Link>
        </div>
      </section>
    </div>
  );
}
