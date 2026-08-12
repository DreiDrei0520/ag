import React from 'react';
import { AlertTriangle, CheckCircle2, FileText, Printer } from 'lucide-react';
import type { Quotation } from '../../types';
import { formatPHP, formatDate } from '../../lib/format';
import { Button, Card, StatusBadge } from '../ui';
import { openQuotationPdf } from '../../lib/quotationPdf';
import type { SystemSettings } from '../../types';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-agdark-50 py-2.5 last:border-0">
      <span className="text-sm text-agdark-500">{label}</span>
      <span className="text-right text-sm font-semibold text-agdark-800">{value}</span>
    </div>
  );
}

export default function QuotationResultView({
  quotation,
  settings,
  actions,
}: {
  quotation: Quotation;
  settings: SystemSettings | null;
  actions?: React.ReactNode;
}) {
  const q = quotation;
  const disclaimer = settings?.quotationDisclaimer;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="border-b-4 border-agorange bg-agdark-800 px-6 py-5 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="inline-block bg-agorange px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white">
                Preliminary estimate
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold uppercase tracking-wide">Quotation {q.quotationNumber}</h2>
              <p className="mt-0.5 text-xs text-agdark-300">Issued {formatDate(q.createdAt)} • Pricing version {q.pricingVersion}</p>
            </div>
            <StatusBadge status={q.status} />
          </div>
        </div>

        <div className="grid gap-x-8 gap-y-1 px-6 py-5 md:grid-cols-2">
          <DetailRow label="Client" value={q.clientName} />
          <DetailRow label="Project type" value={q.inputs.projectType} />
          <DetailRow label="Scope of work" value={q.inputs.scopeOfWork} />
          <DetailRow label="Floor area" value={`${q.inputs.floorArea} sqm · ${q.inputs.floors} floor${q.inputs.floors > 1 ? 's' : ''}`} />
          <DetailRow label="Material preference" value={q.inputs.materialPreference} />
          <DetailRow label="Design preference" value={q.inputs.designPreference} />
          <DetailRow label="Budget range" value={q.inputs.budgetRange} />
          <DetailRow label="Selected services" value={q.inputs.additionalServiceIds.length ? `${q.inputs.additionalServiceIds.length} additional service(s)` : 'None'} />
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 border-b border-agdark-100 px-6 py-4">
          <FileText size={16} className="text-agorange" />
          <h3 className="font-display text-lg font-bold uppercase tracking-wide text-agdark-800">Cost breakdown</h3>
        </div>
        <div className="px-6 py-4">
          {q.lines.map((line, index) => (
            <div key={index} className="flex items-center justify-between gap-4 border-b border-agdark-50 py-3 last:border-0">
              <div>
                <p className="text-sm font-semibold text-agdark-800">{line.label}</p>
                <p className="text-xs text-agdark-400">{line.detail}</p>
              </div>
              <p className="text-sm font-semibold text-agdark-800">{formatPHP(line.amount)}</p>
            </div>
          ))}
          <div className="mt-3 flex items-center justify-between gap-4 rounded-lg bg-agdark-800 px-5 py-4 text-white">
            <p className="font-display text-lg font-bold uppercase tracking-wide">Estimated total</p>
            <p className="font-display text-2xl font-bold text-agorange">{formatPHP(q.totalEstimate)}</p>
          </div>

          {q.budgetNote ? (
            <div className={`mt-4 flex items-start gap-2 rounded-lg border p-3 text-sm ${q.withinBudget ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
              {q.withinBudget ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
              <p>{q.budgetNote}</p>
            </div>
          ) : null}
        </div>
      </Card>

      {disclaimer ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-xs leading-5 text-amber-800">
          <strong>Important:</strong> {disclaimer}
        </div>
      ) : null}

      {actions ? (
        <div className="flex flex-wrap items-center justify-end gap-3">{actions}</div>
      ) : (
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button variant="outline" onClick={() => openQuotationPdf(q, settings)}>
            <Printer size={16} /> Print / Save PDF
          </Button>
        </div>
      )}
    </div>
  );
}
