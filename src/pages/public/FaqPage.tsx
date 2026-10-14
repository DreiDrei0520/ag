import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ChevronDown, ShieldCheck, XCircle } from 'lucide-react';
import { formatPHP } from '../../lib/format';
import {
  BUILDING_PERMIT_REQUIREMENTS,
  CONSTRUCTION_PROCESS,
  CONSTRUCTION_TIMELINE,
  DESIGN_PACKAGE,
  DESIGN_REQUIREMENTS,
  EXCLUSIONS,
  FINISH_PACKAGES,
  INCLUSIONS,
  PAGIBIG_CHECKLIST,
  PAGIBIG_REQUIREMENTS,
  PAYMENT_METHODS,
  PAYMENT_METHODS_NOTE,
  PROGRESS_BILLING,
  PROGRESS_BILLING_NOTE,
  TIMELINE_NOTE,
  WARRANTY,
} from '../../lib/companyInfo';

const sections = [
  { id: 'payment', label: 'Mode of payment' },
  { id: 'timeline', label: 'Construction timeline' },
  { id: 'packages', label: 'Construction packages' },
  { id: 'inclusions', label: 'Inclusions & exclusions' },
  { id: 'design', label: 'Design package' },
  { id: 'warranty', label: 'Warranty' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'process', label: 'Construction process' },
];

function SectionTitle({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-bold uppercase tracking-wide text-agdark-800">{title}</h2>
      {children ? <p className="mt-3 max-w-2xl leading-7 text-agdark-600">{children}</p> : null}
    </div>
  );
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2 text-sm leading-6 text-agdark-600">
      <CheckCircle2 size={16} className="mt-1 shrink-0 text-agorange" />
      <span>{children}</span>
    </li>
  );
}

export default function FaqPage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-agdark-800">
        <div className="absolute inset-0 blueprint-grid" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="eyebrow">Frequently asked questions</p>
          <h1 className="mt-3 max-w-2xl font-display text-5xl font-extrabold uppercase tracking-wide text-white">
            Everything to know before you build.
          </h1>
          <p className="mt-4 max-w-xl text-agdark-200">
            Payment terms, timelines, what's included, warranty coverage, and the documents you'll need —
            for cash, bank loan, and Pag-IBIG projects.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[220px_1fr] lg:px-8">
        <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs font-bold uppercase tracking-widest text-agdark-400">On this page</p>
          <ul className="mt-3 flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="block rounded-lg border border-agdark-100 px-3 py-1.5 text-sm font-semibold text-agdark-600 hover:border-agorange hover:text-agorange lg:border-transparent lg:px-2"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-16">
          {/* Payment */}
          <section id="payment" className="scroll-mt-24">
            <SectionTitle eyebrow="Payment" title="Mode of payment">{PROGRESS_BILLING_NOTE}</SectionTitle>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {PAYMENT_METHODS.map((m) => (
                <span key={m} className="rounded-full bg-agdark-800 px-4 py-1.5 text-sm font-semibold text-white">{m}</span>
              ))}
              <span className="text-sm text-agdark-500">· {PAYMENT_METHODS_NOTE}</span>
            </div>
            <div className="mt-8 grid gap-5 xl:grid-cols-3">
              {PROGRESS_BILLING.map((plan) => (
                <div key={plan.scheme} className="rounded-xl border border-agdark-100 bg-white p-5 shadow-card">
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-agdark-800">{plan.scheme}</h3>
                  <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-agdark-100" aria-hidden="true">
                    {plan.stages.map((s, i) => (
                      <span key={i} style={{ width: `${s.pct}%` }} className={i % 2 === 0 ? 'bg-agorange' : 'bg-agdark-700'} />
                    ))}
                  </div>
                  <ol className="mt-4 space-y-3">
                    {plan.stages.map((s, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="w-11 shrink-0 font-display text-xl font-bold text-agorange">{s.pct}%</span>
                        <span className="text-sm leading-6 text-agdark-600">{s.work}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>

          {/* Timeline */}
          <section id="timeline" className="scroll-mt-24">
            <SectionTitle eyebrow="Schedule" title="Construction timeline" />
            <div className="mt-6 overflow-x-auto rounded-xl border border-agdark-100">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-agdark-800 text-xs uppercase tracking-widest text-white">
                  <tr>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Bungalow house</th>
                    <th className="px-4 py-3">2-storey house</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-agdark-100">
                  {CONSTRUCTION_TIMELINE.map((row) => (
                    <tr key={row.scheme}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-agdark-800">{row.scheme}</p>
                        {row.note ? <p className="text-xs text-agdark-500">{row.note}</p> : null}
                      </td>
                      <td className="px-4 py-3 font-semibold text-agdark-700">{row.bungalow}</td>
                      <td className="px-4 py-3 font-semibold text-agdark-700">{row.twoStorey}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-agdark-500">{TIMELINE_NOTE}</p>
          </section>

          {/* Packages */}
          <section id="packages" className="scroll-mt-24">
            <SectionTitle eyebrow="Pricing" title="Construction packages">
              All-in material and labor with supervision, priced per square meter of floor area.
            </SectionTitle>
            <div className="mt-6 grid gap-5 xl:grid-cols-3">
              {FINISH_PACKAGES.map((p) => (
                <div key={p.name} className="rounded-xl border border-agdark-100 bg-white p-5 shadow-card">
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-agdark-800">{p.name}</h3>
                  <p className="mt-1 font-display text-2xl font-bold text-agorange">
                    {formatPHP(p.pricePerSqm)} <span className="text-sm font-semibold text-agdark-400">/ sqm</span>
                  </p>
                  <ul className="mt-4 space-y-1.5">
                    {p.inclusions.map((i) => <Bullet key={i}>{i}</Bullet>)}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Inclusions */}
          <section id="inclusions" className="scroll-mt-24">
            <SectionTitle eyebrow="Scope" title="Inclusions & exclusions" />
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-xl border border-agdark-100 bg-white p-5">
                <h3 className="font-semibold text-agdark-800">Included in every build</h3>
                <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {INCLUSIONS.map((i) => <Bullet key={i}>{i}</Bullet>)}
                </ul>
              </div>
              <div className="rounded-xl border border-agdark-100 bg-agdark-50 p-5">
                <h3 className="font-semibold text-agdark-800">Not included</h3>
                <ul className="mt-3 space-y-1.5">
                  {EXCLUSIONS.map((i) => (
                    <li key={i} className="flex gap-2 text-sm leading-6 text-agdark-600">
                      <XCircle size={16} className="mt-1 shrink-0 text-agdark-400" />
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Design */}
          <section id="design" className="scroll-mt-24">
            <SectionTitle eyebrow="Design & planning" title={`Design package — ${formatPHP(DESIGN_PACKAGE.price)} all-in`} />
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-xl border border-agdark-100 bg-white p-5">
                <h3 className="font-semibold text-agdark-800">The package includes</h3>
                <ul className="mt-3 space-y-1.5">
                  {DESIGN_PACKAGE.inclusions.map((i) => <Bullet key={i}>{i}</Bullet>)}
                </ul>
              </div>
              <div className="rounded-xl border border-agdark-100 bg-white p-5">
                <h3 className="font-semibold text-agdark-800">Need only part of it?</h3>
                <ul className="mt-3 divide-y divide-agdark-100">
                  {DESIGN_PACKAGE.alaCarte.map((o) => (
                    <li key={o.label} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                      <span className="text-agdark-600">{o.label}</span>
                      <span className="shrink-0 font-display text-lg font-bold text-agorange">{formatPHP(o.price)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs leading-5 text-agdark-500">{DESIGN_PACKAGE.note}</p>
              </div>
            </div>
          </section>

          {/* Warranty */}
          <section id="warranty" className="scroll-mt-24">
            <SectionTitle eyebrow={WARRANTY.scope} title="Construction warranty" />
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {WARRANTY.items.map((w) => (
                <div key={w.title} className="flex gap-4 rounded-xl bg-agdark-800 p-5">
                  <ShieldCheck size={28} className="shrink-0 text-agorange" />
                  <div>
                    <p className="font-display text-2xl font-bold uppercase text-white">
                      {w.term} <span className="text-agorange">· {w.title}</span>
                    </p>
                    <p className="mt-1 text-sm leading-6 text-agdark-200">{w.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-lg border-l-4 border-agorange bg-agorange-50 px-4 py-3 text-sm leading-6 text-agdark-700">
              {WARRANTY.voidNote}
            </p>
          </section>

          {/* Requirements */}
          <section id="requirements" className="scroll-mt-24">
            <SectionTitle eyebrow="Documents" title="Requirements" />
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div className="rounded-xl border border-agdark-100 bg-white p-5">
                <h3 className="font-display text-lg font-bold uppercase tracking-wide text-agdark-800">Construction design</h3>
                <ul className="mt-3 space-y-1.5">
                  {DESIGN_REQUIREMENTS.map((i) => <Bullet key={i}>{i}</Bullet>)}
                </ul>
              </div>
              <div className="rounded-xl border border-agdark-100 bg-white p-5 lg:row-span-2">
                <h3 className="font-display text-lg font-bold uppercase tracking-wide text-agdark-800">Building permit</h3>
                <ul className="mt-3 divide-y divide-agdark-100">
                  {BUILDING_PERMIT_REQUIREMENTS.map((r) => (
                    <li key={r.item} className="flex items-start justify-between gap-3 py-2 text-sm">
                      <span>
                        <span className="font-semibold text-agdark-700">{r.item}</span>
                        {r.note ? <span className="block text-xs text-agdark-500">{r.note}</span> : null}
                      </span>
                      {r.provider ? (
                        <span
                          className={
                            r.provider === 'client'
                              ? 'shrink-0 rounded-md bg-agdark-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-agdark-700'
                              : 'shrink-0 rounded-md bg-agorange-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-agorange'
                          }
                        >
                          {r.provider === 'client' ? 'You provide' : 'We provide'}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-agdark-100 bg-white p-5">
                <h3 className="font-display text-lg font-bold uppercase tracking-wide text-agdark-800">Pag-IBIG loan</h3>
                <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {PAGIBIG_REQUIREMENTS.map((i) => <Bullet key={i}>{i}</Bullet>)}
                </ul>
                <details className="group mt-4 rounded-lg border border-agdark-100">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-agdark-800">
                    Full Pag-IBIG checklist of loan requirements
                    <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="space-y-4 border-t border-agdark-100 px-4 py-4">
                    {PAGIBIG_CHECKLIST.map((g) => (
                      <div key={g.group}>
                        <p className="text-xs font-bold uppercase tracking-widest text-agorange">{g.group}</p>
                        {g.note ? <p className="mt-1 text-xs text-agdark-500">{g.note}</p> : null}
                        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-agdark-600">
                          {g.items.map((i) => <li key={i}>{i}</li>)}
                        </ol>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          </section>

          {/* Process */}
          <section id="process" className="scroll-mt-24">
            <SectionTitle eyebrow="How it works" title="Construction process" />
            <ol className="mt-6 grid gap-3 sm:grid-cols-2">
              {CONSTRUCTION_PROCESS.map((step, i) => (
                <li key={step} className="flex items-center gap-4 rounded-xl border border-agdark-100 bg-white px-4 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-agdark-800 font-display text-lg font-bold text-agorange">
                    {i + 1}
                  </span>
                  <span className="font-semibold text-agdark-700">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <div className="flex flex-col items-start gap-4 rounded-2xl bg-agdark-800 p-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-display text-2xl font-bold uppercase tracking-wide text-white">Still have a question?</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/contact" className="btn-primary">Contact us <ArrowRight size={16} /></Link>
              <Link to="/quotation" className="btn-outline-white">Get an estimate</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
