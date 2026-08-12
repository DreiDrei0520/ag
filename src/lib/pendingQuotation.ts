import type { AppUser, Quotation } from '../types';
import { db } from '../backend';
import { writeAuditLog } from './activity';

const KEY = 'ag_pending_quotation';

export function savePendingQuotation(quotation: Quotation) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(quotation));
  } catch {
    /* ignore */
  }
}

export function getPendingQuotation(): Quotation | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Quotation) : null;
  } catch {
    return null;
  }
}

export function clearPendingQuotation() {
  sessionStorage.removeItem(KEY);
}

export async function restorePendingQuotation(user: AppUser): Promise<Quotation | null> {
  const pending = getPendingQuotation();
  if (!pending) return null;
  const saved = await db.quotations.create({
    ...pending,
    clientId: user.uid,
    clientName: user.fullName,
    clientEmail: user.email,
    status: 'Submitted',
  });
  clearPendingQuotation();
  await writeAuditLog({ actor: user }, 'quotation_generated', 'quotation', saved.id, {
    number: saved.quotationNumber,
    total: saved.totalEstimate,
    restored: true,
  });
  return saved;
}
