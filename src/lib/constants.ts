export const PROJECT_TYPES = ['Residential', 'Commercial', 'Renovation', 'Fence & Perimeter', 'Government'] as const;

export const SCOPES = ['Full Construction', 'Renovation', 'Interior', 'Exterior', 'Design & Build'] as const;

export const MATERIAL_PREFS = ['Standard', 'Mid-Range', 'Premium'] as const;

export const DESIGN_PREFS = ['Modern', 'Minimalist', 'Industrial', 'Classic', 'Scandinavian', 'Luxury'] as const;

export const BUDGET_RANGES = ['Below ₱2M', '₱2M – ₱5M', '₱5M – ₱10M', 'Above ₱10M'] as const;

export const INQUIRY_STATUSES = ['Pending', 'In Progress', 'Resolved', 'Cancelled'] as const;

export const QUOTATION_STATUSES = ['Draft', 'Submitted', 'Approved', 'Converted', 'Rejected'] as const;

export const BOOKING_STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled'] as const;

export const STATUS_STYLES: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-800 border-amber-200',
  'In Progress': 'bg-sky-100 text-sky-800 border-sky-200',
  Resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Confirmed: 'bg-sky-100 text-sky-800 border-sky-200',
  Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Cancelled: 'bg-red-100 text-red-800 border-red-200',
  Rejected: 'bg-red-100 text-red-800 border-red-200',
  Draft: 'bg-slate-100 text-slate-700 border-slate-200',
  Submitted: 'bg-amber-100 text-amber-800 border-amber-200',
  Approved: 'bg-sky-100 text-sky-800 border-sky-200',
  Converted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Published: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Inactive: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const PROJECT_TYPE_ICONS: Record<string, string> = {
  Residential: 'Home',
  Commercial: 'Building2',
  Renovation: 'Hammer',
  'Fence & Perimeter': 'Fence',
  Government: 'Landmark',
};

export const DEFAULT_DISCLAIMER =
  'This quotation is an estimated preliminary cost based on the information you provided. It is not a final construction contract or official project quotation. Final costs may vary after site inspection, detailed planning, material selection, and professional assessment.';

export const DEFAULT_SETTINGS = {
  companyName: 'AG Construction Builders',
  companyTagline: 'Build Your Vision, Simplified',
  companyDescription:
    'A full-service design and construction company serving CALABARZON and NCR — from free site visits, design and planning, to ground-breaking and turnover, with a 5-year warranty.',
  logoUrl: '',
  email: 'agconbuilder@gmail.com',
  phone: '0927-837-2757',
  address: 'Main Office: Los Baños, Laguna',
  businessHours: 'Mon – Sat, 8:00 AM – 5:00 PM',
  facebook: 'https://facebook.com/agconbuilder',
  instagram: 'https://instagram.com/agconbuilder',
  quotationDisclaimer: DEFAULT_DISCLAIMER,
  currency: '₱',
};
