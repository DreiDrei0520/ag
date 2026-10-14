import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Hammer,
  HardHat,
  Home as HomeIcon,
  Landmark,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useServices, useProjects, useSettings } from '../../hooks/useData';
import { formatPHP } from '../../lib/format';
import { Card, Skeleton } from '../../components/ui';
import { DESIGN_PACKAGE, FINISH_PACKAGES } from '../../lib/companyInfo';

const TICKER_ITEMS = [
  '120+ Projects Delivered',
  '98% Client Satisfaction',
  'CALABARZON & NCR Coverage',
  'Engineer-Supervised Builds',
  'Transparent Milestone Billing',
  'PCAB Licensed',
  'PhilGEPS Red Registered',
  'Cash, Bank & Pag-IBIG Financing',
  '24hr Response Time',
  'FREE Site Visit',
  '5-Year Structural Warranty',
];

function Hero() {
  const { settings } = useSettings();
  return (
    <section className="relative overflow-hidden bg-agdark-800">
      <div className="absolute inset-0 blueprint-grid" aria-hidden="true" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            'radial-gradient(ellipse at 20% 20%, rgba(242,107,33,0.55) 0%, transparent 45%), radial-gradient(ellipse at 85% 75%, rgba(27,79,140,0.6) 0%, transparent 45%)',
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
        <div>
          <p className="eyebrow">{settings?.companyName ?? 'AG Construction Builders'}</p>
          <h1 className="mt-4 max-w-2xl text-5xl font-extrabold uppercase leading-[0.95] tracking-wide text-white sm:text-6xl lg:text-7xl">
            Build your vision,
            <span className="text-agorange"> simplified.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-agdark-200">
            From ground-zero construction to full renovations — get an instant preliminary estimate,
            then let our engineers turn your project into a delivered reality across CALABARZON and Metro Manila.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/quotation" className="btn-primary !h-12 !px-7 !text-base">
              Get Your Free Estimate <ArrowRight size={18} />
            </Link>
            <Link to="/services" className="btn-outline-white !h-12 !px-7 !text-base">
              Explore Services
            </Link>
          </div>
          <div className="mt-10 grid max-w-lg grid-cols-3 gap-4">
            {[
              { value: '120+', label: 'Projects delivered' },
              { value: '98%', label: 'Client satisfaction' },
              { value: '<24h', label: 'Response time' },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-display text-3xl font-bold text-agorange">{s.value}</p>
                <p className="mt-0.5 text-xs text-agdark-300">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            <img
              src="/projects/two-storey-wood-stone-residence/03-right-angle.webp"
              alt="Two-storey residence with wood and stone accents under construction by AG"
              className="h-[520px] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-agdark-900/70 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-xl border border-white/15 bg-agdark-900/80 p-4 backdrop-blur">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-agorange">Smart Quotation</p>
                <p className="font-display text-xl font-bold uppercase text-white">Estimate in minutes</p>
              </div>
              <Link to="/quotation" className="flex h-10 w-10 items-center justify-center rounded-full bg-agorange text-white">
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="relative -mx-1 mb-[-8px]">
        <div className="tape-ticker" aria-hidden="true">
          <div className="tape-track">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i}>{item} <span className="mx-2 opacity-70">//</span></span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="eyebrow">About AG Construction Builders</p>
          <h2 className="mt-3 font-display text-4xl font-bold uppercase leading-tight tracking-wide text-agdark-800">
            Engineering discipline, transparent planning, premium outcomes.
          </h2>
          <p className="mt-5 leading-7 text-agdark-600">
            AG Construction Builders delivers dependable construction solutions that blend technical
            excellence, local expertise, and client-first communication — from concept to turnover.
            Our smart quotation system brings clarity to every build, so you know what your project
            costs before a single shovel hits the ground.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              { icon: <ShieldCheck size={20} />, title: 'Licensed & Registered', text: 'PCAB-licensed and PhilGEPS Red registered, with complete business permits.' },
              { icon: <Hammer size={20} />, title: 'Engineer-Supervised', text: 'Every build overseen by qualified engineers at every milestone.' },
              { icon: <ClipboardCheck size={20} />, title: 'Transparent Milestones', text: 'Progress billing tied to completed work, for cash, bank loan, and Pag-IBIG.' },
              { icon: <MessageSquareText size={20} />, title: 'Client-First Support', text: 'A dedicated point of contact and response within 24 hours.' },
            ].map((f) => (
              <div key={f.title} className="flex gap-3 rounded-xl border border-agdark-100 bg-white p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-agorange-50 text-agorange">{f.icon}</span>
                <div>
                  <p className="font-semibold text-agdark-800">{f.title}</p>
                  <p className="mt-0.5 text-sm text-agdark-500">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <img src="/projects/modern-two-storey-house/03-low-angle.webp" alt="Modern two-storey house built by AG" className="h-64 w-full rounded-xl object-cover" />
          <img src="/projects/modern-bungalow-house/06-kitchen-living.webp" alt="Bungalow kitchen and living area built by AG" className="mt-8 h-64 w-full rounded-xl object-cover" />
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const { services, loading: servicesLoading } = useServices(true);
  const { projects, loading: projectsLoading } = useProjects(true);

  const featuredServices = services.filter((s) => s.isFeatured).slice(0, 4);
  const featuredProjects = projects.filter((p) => p.isFeatured).slice(0, 3);

  return (
    <div>
      <Hero />

      <About />

      {/* Services */}
      <section className="bg-agdark-50/50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Featured services</p>
              <h2 className="mt-3 font-display text-4xl font-bold uppercase tracking-wide text-agdark-800">What we build</h2>
            </div>
            <Link to="/services" className="inline-flex items-center gap-2 text-sm font-bold text-agorange hover:text-agorange-600">
              View all services <ArrowRight size={16} />
            </Link>
          </div>
          {servicesLoading ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-80" />)}
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {featuredServices.map((service) => (
                <Link
                  key={service.id}
                  to={`/services/${service.slug}`}
                  className="group overflow-hidden rounded-xl border border-agdark-100 bg-white shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-44 overflow-hidden">
                    <img src={service.imageUrl} alt={service.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <span className="absolute left-3 top-3 rounded-md bg-agdark-900/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur">
                      {service.category}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-xl font-bold uppercase tracking-wide text-agdark-800">{service.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-agdark-500">{service.shortDescription}</p>
                    <p className="mt-4 font-display text-lg font-bold text-agorange">
                      {service.startingPrice > 0 ? `From ${formatPHP(service.startingPrice)}` : 'Custom quote'}
                      <span className="ml-1 text-xs font-semibold text-agdark-400">{service.startingPrice > 0 ? service.priceUnit : ''}</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Process */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <p className="eyebrow">How we work</p>
        <h2 className="mt-3 font-display text-4xl font-bold uppercase tracking-wide text-agdark-800">Complete design & build construction, from start to turnover</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { step: '01', title: 'Free Site Visit', text: 'Our team visits your site for FREE anywhere in CALABARZON and NCR to assess the property and discuss your vision.' },
            { step: '02', title: 'Design & Planning', text: 'Two design options and a complete Master Plan — signed and sealed by engineers in 5–7 days.' },
            { step: '03', title: 'Costing & Contract', text: 'Approve the plan, review the costing proposal, and sign a contract with clear progress-billing terms.' },
            { step: '04', title: 'Building Permit', text: 'We process building permits and clearances for you, end-to-end.' },
            { step: '05', title: 'Ground Breaking', text: 'Site preparation and excavation kick off the construction phase.' },
            { step: '06', title: 'Construction Phase', text: 'Engineer-supervised execution with transparent milestone billing and progress reports.' },
            { step: '07', title: 'Turnover', text: 'Punch-list inspection and fixes, then turnover of your home with a certificate.' },
            { step: '08', title: 'Warranty', text: '5-year structural warranty and 1-month finishing warranty on private projects.' },
          ].map((s) => (
            <div key={s.step} className="relative rounded-xl border border-agdark-100 bg-white p-6 shadow-card">
              <span className="font-display text-5xl font-extrabold text-agorange-100">{s.step}</span>
              <h3 className="mt-3 font-display text-xl font-bold uppercase tracking-wide text-agdark-800">{s.title}</h3>
              <p className="mt-2 text-sm leading-6 text-agdark-500">{s.text}</p>
            </div>
          ))}
        </div>
        <Link to="/faq#process" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-agorange hover:text-agorange-600">
          Payment terms, timelines, and requirements <ArrowRight size={16} />
        </Link>
      </section>

      {/* Smart quotation CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-agdark-800">
          <div className="absolute inset-0 blueprint-grid" aria-hidden="true" />
          <div className="relative grid gap-8 px-8 py-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:px-12">
            <div>
              <p className="eyebrow">Smart Quotation</p>
              <h2 className="mt-3 font-display text-4xl font-bold uppercase tracking-wide text-white">
                Know your estimate in <span className="text-agorange">minutes</span>, not days.
              </h2>
              <p className="mt-4 max-w-xl leading-7 text-agdark-200">
                Answer a few guided questions and our quotation engine — using administrator-configured
                pricing rules — produces a transparent, itemized preliminary estimate. No waiting, no guesswork.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {['Project type', 'Floor area', 'Materials', 'Design style', 'Additional services'].map((chip) => (
                  <span key={chip} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
                    {chip}
                  </span>
                ))}
              </div>
              <Link to="/quotation" className="btn-primary mt-8">
                Start your quotation <Sparkles size={16} />
              </Link>
            </div>
            <div className="hidden rounded-xl border border-white/10 bg-agdark-900/60 p-6 backdrop-blur lg:block">
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-3">
                  <HomeIcon size={16} className="text-agorange" />
                  <div className="flex-1">
                    <p className="text-xs text-agdark-300">Project type</p>
                    <p className="text-sm font-semibold text-white">Residential</p>
                  </div>
                  <CheckCircle2 size={16} className="text-emerald-400" />
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-3">
                  <Building2 size={16} className="text-agorange" />
                  <div className="flex-1">
                    <p className="text-xs text-agdark-300">Floor area</p>
                    <p className="text-sm font-semibold text-white">120 sqm · 2 floors</p>
                  </div>
                  <CheckCircle2 size={16} className="text-emerald-400" />
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-3">
                  <Landmark size={16} className="text-agorange" />
                  <div className="flex-1">
                    <p className="text-xs text-agdark-300">Estimated total</p>
                    <p className="font-display text-lg font-bold text-agorange">₱4,980,000</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Design package */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="grid grid-cols-2 gap-4">
            <img src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900&q=80" alt="Master plan design package" className="h-64 w-full rounded-xl object-cover" />
            <img src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=900&q=80" alt="Design documents signed and sealed" className="mt-8 h-64 w-full rounded-xl object-cover" />
          </div>
          <div>
            <p className="eyebrow">Design & Planning</p>
            <h2 className="mt-3 font-display text-4xl font-bold uppercase tracking-wide text-agdark-800">
              Master Plan Design Package — <span className="text-agorange">₱60,000 all-in</span>
            </h2>
            <p className="mt-5 leading-7 text-agdark-600">
              A complete design package that covers everything you need to build with confidence:
              2D plans, structural, architectural, electrical, plumbing and sanitary documents, plus 3D
              interior and exterior design — all signed and sealed by licensed engineers, delivered in soft
              copy and A3 hard copy. Includes 2 design options, ready in 5–7 days. Every plan is original,
              drawn from your title, lot plan, and our site-visit measurements.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                '2D & 3D plans',
                'Structural, Electrical, Plumbing, Sanitary',
                '2 design options',
                '5–7 days process',
                'Signed and sealed by engineers',
                'Soft copy and A3 hard copy',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-agdark-600">
                  <CheckCircle2 size={16} className="shrink-0 text-agorange" /> {f}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-agdark-500">
              Need only part of it?{' '}
              {DESIGN_PACKAGE.alaCarte.map((o) => `${o.label} ${formatPHP(o.price)}`).join(' · ')}
            </p>
            <Link to="/services/master-plan-design-package" className="btn-primary mt-8">
              Learn more about the design package <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="mt-14">
          <p className="text-center eyebrow">Finishing packages</p>
          <h3 className="mt-3 text-center font-display text-3xl font-bold uppercase tracking-wide text-agdark-800">
            Choose your finish — per square meter
          </h3>
          <p className="mt-2 text-center text-sm text-agdark-500">All-in material and labor with supervision.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { img: '/finishes/standard.webp', pkg: FINISH_PACKAGES[0], text: 'Porcelain tiles and counter top, aluminum modular cabinet, flat ceiling, and painted wall accents.' },
              { img: '/finishes/elegant.webp', pkg: FINISH_PACKAGES[1], text: 'Wall tile and grooving accents, granite counter top, corner glass, glass stair railings, and high ceiling.' },
              { img: '/finishes/luxury.webp', pkg: FINISH_PACKAGES[2], text: 'Stone accent, granite or quartz counter top, glass railings and bathroom partition, high ceiling, and landscape.' },
            ].map(({ img, pkg, text }) => (
              <div key={pkg.name} className="overflow-hidden rounded-xl border border-agdark-100 bg-white shadow-card">
                <div className="h-48 overflow-hidden">
                  <img src={img} alt={`${pkg.shortName} design render`} className="h-full w-full object-cover" />
                </div>
                <div className="p-5">
                  <h4 className="font-display text-lg font-bold uppercase tracking-wide text-agdark-800">{pkg.shortName}</h4>
                  <p className="mt-1 font-display text-lg font-bold text-agorange">{formatPHP(pkg.pricePerSqm)} / sqm</p>
                  <p className="mt-2 text-sm text-agdark-500">{text}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center">
            <Link to="/faq#packages" className="inline-flex items-center gap-2 text-sm font-bold text-agorange hover:text-agorange-600">
              See full inclusions and exclusions <ArrowRight size={16} />
            </Link>
          </p>
        </div>
      </section>

      {/* Projects */}
      <section className="bg-agdark-50/50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Featured projects</p>
              <h2 className="mt-3 font-display text-4xl font-bold uppercase tracking-wide text-agdark-800">Recent work</h2>
            </div>
            <Link to="/projects" className="inline-flex items-center gap-2 text-sm font-bold text-agorange hover:text-agorange-600">
              View portfolio <ArrowRight size={16} />
            </Link>
          </div>
          {projectsLoading ? (
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-96" />)}
            </div>
          ) : (
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              {featuredProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="group overflow-hidden rounded-xl border border-agdark-100 bg-white shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img src={project.featuredImage} alt={project.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <span className="absolute left-3 top-3 rounded-md bg-agorange px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                      {project.category}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-xl font-bold uppercase tracking-wide text-agdark-800">{project.title}</h3>
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-agdark-500">
                      <Building2 size={14} /> {project.location || project.status}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow">Try it now</p>
            <h2 className="mt-3 font-display text-4xl font-bold uppercase tracking-wide text-agdark-800">Get a preliminary estimate in 3 steps</h2>
            <div className="mt-6 space-y-4">
              {[
                { n: '1', text: 'Answer guided questions about your project — type, scope, area, materials, and design.' },
                { n: '2', text: 'Our quotation engine applies transparent company pricing rules to compute a detailed estimate.' },
                { n: '3', text: 'Review the breakdown, save your quotation, and submit a formal inquiry to our team.' },
              ].map((s) => (
                <div key={s.n} className="flex items-start gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-agdark-800 font-display text-lg font-bold text-agorange">{s.n}</span>
                  <p className="pt-1.5 text-sm leading-6 text-agdark-600">{s.text}</p>
                </div>
              ))}
            </div>
            <Link to="/quotation" className="btn-primary mt-8">Start Smart Quotation</Link>
          </div>
          <div className="rounded-2xl bg-agdark-800 p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-agorange"><HardHat size={20} /></span>
              <div>
                <p className="font-display text-lg font-bold uppercase text-white">Testimonials</p>
                <p className="text-xs text-agdark-300">What our clients say</p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {[
                { quote: 'The quotation tool gave us a realistic budget before we even met in person.', name: 'Ramon D.', role: 'Homeowner, Los Baños' },
                { quote: 'Professional crew, on-time delivery, and clear documentation throughout our commercial build.', name: 'Cristina P.', role: 'Retail Developer, Calamba' },
                { quote: 'Compliant, organized, and easy to coordinate with for our public infrastructure project.', name: 'Engr. Bautista', role: 'Barangay Project Coordinator' },
              ].map((t) => (
                <div key={t.name} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm leading-6 text-agdark-100">“{t.quote}”</p>
                  <div className="mt-3 flex items-center gap-2">
                    <TrendingUp size={14} className="text-agorange" />
                    <p className="text-xs font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-agdark-300">· {t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <Card className="flex flex-col items-start justify-between gap-6 p-8 lg:flex-row lg:items-center">
          <div>
            <p className="eyebrow">Ready to build?</p>
            <h2 className="mt-2 font-display text-3xl font-bold uppercase tracking-wide text-agdark-800">
              Request a consultation or book a site visit.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/contact" className="btn-primary">Request Consultation</Link>
            <Link to="/quotation" className="btn-secondary">Get an Estimate</Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
