import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Calculator, ChevronRight, Printer, RefreshCcw } from 'lucide-react';
import { useServiceCategories, useServices } from '../../hooks/useData';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../backend';
import { formatPHP, makeQuotationNumber, nowIso } from '../../lib/format';
import { writeAuditLog, notifyAdmins } from '../../lib/activity';
import type { Quotation } from '../../types';
import { Card, PageLoader } from '../../components/ui';

type Step = 'category' | 'service' | 'measure' | 'details' | 'quote' | 'done';

interface MeasureInput {
  length: string;
  width: string;
  quantity: string;
}

export default function QuotationPage() {
  const { items: categories } = useServiceCategories();
  const { services, loading } = useServices(true);
  const { user } = useAuth();

  const [step, setStep] = useState<Step>('category');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [measure, setMeasure] = useState<MeasureInput>({ length: '', width: '', quantity: '' });
  const [details, setDetails] = useState({ name: '', email: '', phone: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const category = useMemo(() => categories.find((c) => c.id === categoryId), [categories, categoryId]);
  const service = useMemo(() => services.find((s) => s.id === serviceId), [services, serviceId]);

  const measuredQty = useMemo(() => {
    const q = Number(measure.quantity) || 0;
    if (service?.measuringUnit === 'm²' || service?.measuringUnit === 'lm') {
      const l = Number(measure.length) || 0;
      const w = Number(measure.width) || 0;
      if (l <= 0 || (service.measuringUnit === 'm²' && w <= 0)) return 0;
      return service.measuringUnit === 'm²' ? l * w : l;
    }
    return q;
  }, [measure, service]);

  const estimate = useMemo(() => {
    if (!service || measuredQty <= 0) return null;
    const labor = measuredQty * service.pricePerUnit;
    const materials = labor * service.materialPct;
    const misc = service.includeMisc ? (labor + materials) * service.miscPct : 0;
    const subtotal = labor + materials + misc;
    const vat = subtotal * service.vatPct;
    const total = subtotal + vat;
    return { labor, materials, misc, subtotal, vat, total };
  }, [service, measuredQty]);

  useEffect(() => {
    if (service) {
      setMeasure({ length: '', width: '', quantity: '' });
      setDetails({ name: '', email: '', phone: '', notes: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service?.id]);

  const reset = () => {
    setStep('category');
    setCategoryId(null);
    setServiceId(null);
    setMeasure({ length: '', width: '', quantity: '' });
    setDetails({ name: '', email: '', phone: '', notes: '' });
  };

  const submit = async () => {
    if (!service || !estimate) return;
    setSubmitting(true);
    try {
      const quotation: Quotation = {
        id: `q-${Date.now().toString(36)}`,
        quotationNumber: makeQuotationNumber(),
        clientId: user?.uid ?? '',
        clientName: details.name,
        clientEmail: details.email,
        clientPhone: details.phone,
        inputs: {
          projectType: service.category,
          scopeOfWork: 'Full Construction',
          floorArea: measuredQty,
          floors: 1,
          materialPreference: 'Standard',
          designPreference: 'Modern',
          budgetRange: '',
          additionalServiceIds: [],
          specialRequests: details.notes || undefined,
        },
        baseCost: estimate.labor,
        materialCost: estimate.materials,
        scopeCost: 0,
        designCost: 0,
        laborCost: estimate.labor,
        additionalCost: estimate.misc,
        totalEstimate: estimate.total,
        lines: [
          { label: `${service.title} — Labor`, detail: `${measuredQty} ${service.measuringUnit} × ${formatPHP(service.pricePerUnit)}`, amount: estimate.labor },
          { label: 'Materials & Overhead', detail: `Labor × ${Math.round(service.materialPct * 100)}%`, amount: estimate.materials },
          ...(estimate.misc > 0 ? [{ label: 'Miscellaneous', detail: `Subtotal × ${Math.round(service.miscPct * 100)}%`, amount: estimate.misc }] : []),
          { label: 'VAT', detail: `Subtotal × ${Math.round(service.vatPct * 100)}%`, amount: estimate.vat },
        ],
        pricingVersion: 'v1',
        pricingSnapshot: { pricingConfig: {}, pricingRule: null, computedAt: nowIso() },
        status: 'Submitted',
        createdAt: nowIso(),
      };
      await db.quotations.create(quotation);
      if (user) {
        await writeAuditLog({ actor: user }, 'quotation_generated', 'quotation', quotation.id, {
          number: quotation.quotationNumber,
          total: quotation.totalEstimate,
        });
      }
      await notifyAdmins({
        title: 'New estimate request',
        message: `${details.name} submitted a preliminary estimate request for ${service.title} (${formatPHP(quotation.totalEstimate)}).`,
        type: 'quotation',
        referenceId: quotation.id,
        link: '/admin/quotations',
      });
      setStep('done');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;

  const steps: { key: Step; label: string }[] = [
    { key: 'category', label: 'Category' },
    { key: 'service', label: 'Service' },
    { key: 'measure', label: 'Measurements' },
    { key: 'details', label: 'Your details' },
    { key: 'quote', label: 'Estimate' },
  ];

  return (
    <div className="min-h-screen bg-agdark-50">
      <section className="relative overflow-hidden bg-agdark-800">
        <div className="absolute inset-0 blueprint-grid" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="eyebrow">Smart Quotation</p>
          <h1 className="mt-3 max-w-2xl font-display text-5xl font-extrabold uppercase tracking-wide text-white">
            Your estimate, in minutes.
          </h1>
          <p className="mt-4 max-w-xl text-agdark-200">
            Walk through a few quick steps and we'll generate an itemized preliminary estimate for your project.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <ol className="flex items-center justify-between gap-2">
            {steps.map((s, i) => {
              const active = s.key === step;
              const done = step !== 'done' && (i < steps.findIndex((x) => x.key === step));
              return (
                <li key={s.key} className="flex flex-1 flex-col items-center gap-2">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                      done || active ? 'bg-agorange text-white' : 'bg-agdark-200 text-agdark-500'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className={`text-[11px] font-bold uppercase tracking-widest ${active || done ? 'text-agdark-800' : 'text-agdark-400'}`}>
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ol>
          <div className="mt-2 h-1.5 rounded-full bg-agdark-200">
            <div
              className="h-full rounded-full bg-agorange transition-all duration-300"
              style={{ width: step === 'done' ? '100%' : `${((steps.findIndex((x) => x.key === step) + 1) / steps.length) * 100}%` }}
            />
          </div>

          <Card className="mt-8 p-6 sm:p-8">
            {step === 'category' && (
              <>
                <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-agdark-800">What are we building?</h2>
                <p className="mt-1 text-sm text-agdark-500">Choose the category that best describes your project.</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setCategoryId(c.id); setStep('service'); }}
                      className="group rounded-xl border border-agdark-100 bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-agorange hover:shadow-lg"
                    >
                      <Calculator size={20} className="text-agorange" />
                      <h3 className="mt-3 font-display text-lg font-bold uppercase tracking-wide text-agdark-800">{c.name}</h3>
                      <p className="mt-1 text-sm leading-6 text-agdark-500">{c.description}</p>
                      <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-agorange">
                        Select <ChevronRight size={14} />
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 'service' && (
              <>
                <button onClick={() => setStep('category')} className="inline-flex items-center gap-1.5 text-sm font-bold text-agorange hover:underline">
                  <ArrowLeft size={14} /> Back
                </button>
                <h2 className="mt-4 font-display text-2xl font-bold uppercase tracking-wide text-agdark-800">{category?.name}</h2>
                <p className="mt-1 text-sm text-agdark-500">Select the specific service you need.</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {services.filter((s) => s.categoryId === categoryId).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setServiceId(s.id); setStep('measure'); }}
                      className="group rounded-xl border border-agdark-100 bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-agorange hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-display text-lg font-bold uppercase tracking-wide text-agdark-800">{s.title}</h3>
                        <span className="shrink-0 text-sm font-bold text-agorange">{formatPHP(s.pricePerUnit)}/{s.measuringUnit}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-agdark-500">{s.shortDescription}</p>
                      <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-agorange">
                        Select <ChevronRight size={14} />
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 'measure' && (
              <>
                <button onClick={() => setStep('service')} className="inline-flex items-center gap-1.5 text-sm font-bold text-agorange hover:underline">
                  <ArrowLeft size={14} /> Back
                </button>
                <h2 className="mt-4 font-display text-2xl font-bold uppercase tracking-wide text-agdark-800">{service?.title}</h2>
                <p className="mt-1 text-sm text-agdark-500">Rough measurements are fine — this is a preliminary estimate.</p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {service?.measuringUnit === 'item' ? (
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Quantity</span>
                      <input
                        type="number"
                        min="1"
                        value={measure.quantity}
                        onChange={(e) => setMeasure((m) => ({ ...m, quantity: e.target.value }))}
                        placeholder="e.g. 2"
                        className="mt-1.5 h-11 w-full rounded-lg border border-agdark-200 px-3 text-sm"
                      />
                    </label>
                  ) : (
                    <>
                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">
                          {service?.measuringUnit === 'lm' ? 'Total length (linear meters)' : 'Length (meters)'}
                        </span>
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={measure.length}
                          onChange={(e) => setMeasure((m) => ({ ...m, length: e.target.value }))}
                          placeholder="e.g. 5.5"
                          className="mt-1.5 h-11 w-full rounded-lg border border-agdark-200 px-3 text-sm"
                        />
                      </label>
                      {service?.measuringUnit === 'm²' && (
                        <label className="block">
                          <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Width (meters)</span>
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={measure.width}
                            onChange={(e) => setMeasure((m) => ({ ...m, width: e.target.value }))}
                            placeholder="e.g. 4"
                            className="mt-1.5 h-11 w-full rounded-lg border border-agdark-200 px-3 text-sm"
                          />
                        </label>
                      )}
                    </>
                  )}
                </div>

                {service && (
                  <p className="mt-4 rounded-lg bg-agdark-100 px-4 py-3 text-sm text-agdark-600">
                    Estimated quantity: <span className="font-bold text-agorange">{measuredQty > 0 ? `${measuredQty} ${service.measuringUnit}` : '—'}</span>
                  </p>
                )}

                <div className="mt-6 flex justify-end">
                  <button disabled={measuredQty <= 0} onClick={() => setStep('details')} className="btn-primary disabled:cursor-not-allowed disabled:opacity-40">
                    Continue <ArrowRight size={15} />
                  </button>
                </div>
              </>
            )}

            {step === 'details' && (
              <>
                <button onClick={() => setStep('measure')} className="inline-flex items-center gap-1.5 text-sm font-bold text-agorange hover:underline">
                  <ArrowLeft size={14} /> Back
                </button>
                <h2 className="mt-4 font-display text-2xl font-bold uppercase tracking-wide text-agdark-800">Your details</h2>
                <p className="mt-1 text-sm text-agdark-500">Where should we send your estimate?</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Full name</span>
                    <input required value={details.name} onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))} placeholder="Juan Dela Cruz" className="mt-1.5 h-11 w-full rounded-lg border border-agdark-200 px-3 text-sm" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Email</span>
                    <input required type="email" value={details.email} onChange={(e) => setDetails((d) => ({ ...d, email: e.target.value }))} placeholder="you@email.com" className="mt-1.5 h-11 w-full rounded-lg border border-agdark-200 px-3 text-sm" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Phone</span>
                    <input required type="tel" value={details.phone} onChange={(e) => setDetails((d) => ({ ...d, phone: e.target.value }))} placeholder="0917 000 0000" className="mt-1.5 h-11 w-full rounded-lg border border-agdark-200 px-3 text-sm" />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-agdark-500">Notes (optional)</span>
                    <textarea rows={3} value={details.notes} onChange={(e) => setDetails((d) => ({ ...d, notes: e.target.value }))} placeholder="Timeline, location, additional requirements…" className="mt-1.5 w-full rounded-lg border border-agdark-200 px-3 py-2 text-sm" />
                  </label>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    disabled={!details.name.trim() || !details.email.trim() || !details.phone.trim()}
                    onClick={() => setStep('quote')}
                    className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Generate estimate <ArrowRight size={15} />
                  </button>
                </div>
              </>
            )}

            {step === 'quote' && estimate && (
              <>
                <button onClick={() => setStep('details')} className="inline-flex items-center gap-1.5 text-sm font-bold text-agorange hover:underline">
                  <ArrowLeft size={14} /> Back
                </button>
                <h2 className="mt-4 font-display text-2xl font-bold uppercase tracking-wide text-agdark-800">Your estimate</h2>
                <p className="mt-1 text-sm text-agdark-500">Review your preliminary estimate below.</p>

                <div className="mt-6 overflow-hidden rounded-xl border border-agdark-100">
                  <div className="bg-agdark-800 px-5 py-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-agdark-300">Service</p>
                    <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white">{service?.title}</h3>
                    <p className="text-xs text-agdark-300">{measuredQty} {service?.measuringUnit} × {formatPHP(service!.pricePerUnit)} / {service?.measuringUnit}</p>
                  </div>
                  <div className="space-y-2.5 px-5 py-4 text-sm">
                    <p className="flex justify-between text-agdark-600"><span>Labor cost</span><span className="font-semibold text-agdark-800">{formatPHP(estimate.labor)}</span></p>
                    <p className="flex justify-between text-agdark-600"><span>Materials & overhead</span><span className="font-semibold text-agdark-800">{formatPHP(estimate.materials)}</span></p>
                    {estimate.misc > 0 && (
                      <p className="flex justify-between text-agdark-600"><span>Miscellaneous</span><span className="font-semibold text-agdark-800">{formatPHP(estimate.misc)}</span></p>
                    )}
                    <p className="flex justify-between border-t border-dashed border-agdark-200 pt-2.5 text-agdark-700"><span>Subtotal</span><span className="font-semibold">{formatPHP(estimate.subtotal)}</span></p>
                    <p className="flex justify-between text-agdark-600"><span>VAT ({Math.round(service!.vatPct * 100)}%)</span><span className="font-semibold text-agdark-800">{formatPHP(estimate.vat)}</span></p>
                    <p className="flex justify-between border-t border-agdark-800 pt-3 text-base font-bold text-agdark-800">
                      <span>Estimated total</span><span className="text-agorange">{formatPHP(estimate.total)}</span>
                    </p>
                  </div>
                </div>

                <p className="mt-4 rounded-lg bg-agorange/10 px-4 py-3 text-xs leading-5 text-agdark-600">
                  This is a preliminary estimate generated from standard rates. Final pricing depends on site conditions and the detailed scope of work.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <button onClick={reset} className="btn-secondary">
                    <RefreshCcw size={15} /> Start over
                  </button>
                  <button onClick={submit} disabled={submitting} className="btn-primary disabled:opacity-50">
                    <Printer size={15} /> {submitting ? 'Sending…' : 'Submit estimate request'}
                  </button>
                </div>
              </>
            )}

            {step === 'done' && (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-agorange/15">
                  <CheckCircleIcon />
                </div>
                <h2 className="mt-5 font-display text-2xl font-bold uppercase tracking-wide text-agdark-800">Request received!</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-agdark-500">
                  Thank you, {details.name.split(' ')[0] || 'there'}! Your preliminary estimate has been submitted and our team will reach out
                  within one business day to discuss the details.
                </p>
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link to="/contact" className="btn-secondary">Contact us</Link>
                  <button onClick={reset} className="btn-primary">Create another estimate</button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-agorange" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
