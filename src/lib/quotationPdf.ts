import type { Quotation, SystemSettings } from '../types';
import { formatPHP, formatDate } from './format';

const PRINT_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1C2126; font-size: 13px; line-height: 1.5; }
  .sheet { max-width: 760px; margin: 0 auto; padding: 48px; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid #F26B21; padding-bottom: 20px; }
  .brand { font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
  .brand span { color: #F26B21; }
  .company-info { text-align: right; font-size: 11px; color: #5D6874; }
  .preliminary { margin-top: 24px; display: inline-block; background: #F26B21; color: #fff; font-weight: 800; letter-spacing: 3px; padding: 6px 14px; font-size: 12px; }
  h1 { font-size: 24px; margin-top: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 32px; margin-top: 24px; }
  .meta .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #5D6874; font-weight: 700; }
  .meta .value { font-size: 14px; font-weight: 600; margin-top: 2px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; margin: 28px 0 10px; border-bottom: 1px solid #DEE1E4; padding-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #5D6874; padding: 8px; border-bottom: 1px solid #DEE1E4; }
  td { padding: 8px; border-bottom: 1px solid #F2F3F4; }
  tr.total td { font-weight: 800; font-size: 15px; border-top: 2px solid #1C2126; border-bottom: none; }
  .disclaimer { margin-top: 28px; background: #F2F3F4; padding: 12px 14px; font-size: 10px; color: #5D6874; }
  .footer { margin-top: 24px; display: flex; justify-content: space-between; font-size: 11px; color: #5D6874; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
`;

export function openQuotationPdf(quotation: Quotation, settings: SystemSettings | null) {
  const company = settings ?? ({} as SystemSettings);
  const q = quotation;
  const inputs = q.inputs;

  const rows = q.lines
    .map(
      (line) => `
      <tr>
        <td style="font-weight:600">${line.label}</td>
        <td style="color:#5D6874;font-size:12px">${line.detail}</td>
        <td style="text-align:right">${formatPHP(line.amount)}</td>
      </tr>`
    )
    .join('');

  const html = `<!doctype html>
<html>
<head><meta charset="utf-8" /><title>${q.quotationNumber} — Preliminary Estimate</title><style>${PRINT_STYLES}</style></head>
<body>
  <div class="sheet">
    <div class="top">
      <div>
        <div class="brand">AG <span>Construction Builders</span></div>
        <div style="font-size:11px;color:#5D6874;margin-top:4px">${company.address ?? ''}</div>
      </div>
      <div class="company-info">
        ${company.email ?? ''}<br />${company.phone ?? ''}<br />${company.businessHours ?? ''}
      </div>
    </div>

    <div class="preliminary">PRELIMINARY ESTIMATE</div>
    <h1>Quotation</h1>

    <div class="meta">
      <div><div class="label">Quotation number</div><div class="value">${q.quotationNumber}</div></div>
      <div><div class="label">Date issued</div><div class="value">${formatDate(q.createdAt)}</div></div>
      <div><div class="label">Client</div><div class="value">${q.clientName}</div></div>
      <div><div class="label">Pricing version</div><div class="value">${q.pricingVersion}</div></div>
      <div><div class="label">Project type</div><div class="value">${inputs.projectType}</div></div>
      <div><div class="label">Scope of work</div><div class="value">${inputs.scopeOfWork}</div></div>
      <div><div class="label">Floor area</div><div class="value">${inputs.floorArea} sqm (${inputs.floors} floor${inputs.floors > 1 ? 's' : ''})</div></div>
      <div><div class="label">Material preference</div><div class="value">${inputs.materialPreference}</div></div>
      <div><div class="label">Design preference</div><div class="value">${inputs.designPreference}</div></div>
      <div><div class="label">Budget range</div><div class="value">${inputs.budgetRange}</div></div>
    </div>

    <h2>Cost breakdown</h2>
    <table>
      <thead><tr><th>Item</th><th>Detail</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>
        ${rows}
        <tr class="total"><td>ESTIMATED TOTAL</td><td></td><td style="text-align:right">${formatPHP(q.totalEstimate)}</td></tr>
      </tbody>
    </table>

    ${q.budgetNote ? `<div style="margin-top:16px;font-size:12px;font-weight:600;color:#1B4F8C">${q.budgetNote}</div>` : ''}

    <div class="disclaimer"><strong>Important:</strong> ${company.quotationDisclaimer ?? 'This quotation is an estimated preliminary cost. Final costs may vary after site inspection, detailed planning, material selection, and professional assessment.'}</div>

    <div class="footer">
      <span>Generated by the AG Construction Smart Quotation System</span>
      <span>${company.companyName ?? 'AG Construction Builders'}</span>
    </div>
  </div>
  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=1200');
  if (!win) {
    alert('Please allow pop-ups to download the PDF.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
