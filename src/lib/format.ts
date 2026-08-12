export function uid(prefix = ''): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}${time}${rand}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

export function formatPHP(amount: number, decimals = 0): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('en-PH').format(amount);
}

export function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function timeAgo(iso?: string): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 45) return 'just now';
  const intervals: Array<[number, string]> = [
    [60, 'minute'],
    [3600, 'hour'],
    [86400, 'day'],
    [604800, 'week'],
    [2592000, 'month'],
    [31536000, 'year'],
  ];
  for (let i = intervals.length - 1; i >= 0; i--) {
    const [size, unit] = intervals[i];
    if (seconds >= size) {
      const count = Math.floor(seconds / size);
      return `${count} ${unit}${count > 1 ? 's' : ''} ago`;
    }
  }
  return 'just now';
}

let quoteCounter = 0;
export function makeQuotationNumber(): string {
  const year = new Date().getFullYear();
  const seq = String((Date.now() % 100000) + quoteCounter++).padStart(3, '0');
  return `QT-${year}-${seq}`;
}

let inquiryCounter = 0;
export function makeInquiryNumber(): string {
  const seq = String((Date.now() % 100000) + inquiryCounter++).padStart(3, '0');
  return `INQ-${seq}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function parseBudgetMin(range: string): number | null {
  const match = range?.match(/[₱]?\s*([\d,.]+)\s*[M]/i);
  if (!match) return null;
  const value = parseFloat(match[1].replace(/,/g, ''));
  return value * 1_000_000;
}
