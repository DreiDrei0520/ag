// ---------- Shared ----------

export type Role = 'admin' | 'client' | 'system';

export interface Timestamped {
  createdAt: string;
  updatedAt: string;
}

// ---------- Auth & users ----------

export interface AppUser extends Partial<Timestamped> {
  uid: string;
  fullName: string;
  email: string;
  role: Role;
  phone?: string;
  address?: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

// ---------- Services ----------

export interface ServiceCategory extends Timestamped {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
}

export type MeasuringUnit = 'm²' | 'lm' | 'item';

export interface Service extends Timestamped {
  id: string;
  title: string;
  slug: string;
  category: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  imageUrl: string;
  features: string[];
  inclusions: string[];
  startingPrice: number;
  priceUnit: string;
  measuringUnit: MeasuringUnit;
  pricePerUnit: number;
  materialPct: number;
  miscPct: number;
  vatPct: number;
  includeMisc: boolean;
  isFeatured: boolean;
  isActive: boolean;
}

// ---------- Projects ----------

export interface ProjectCategory extends Timestamped {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

export type ProjectStatus = 'Completed' | 'Ongoing' | 'Upcoming';

export interface Project extends Timestamped {
  id: string;
  title: string;
  slug: string;
  category: string;
  categoryId: string;
  projectType: string;
  location: string;
  description: string;
  completionDate?: string;
  images: string[];
  featuredImage: string;
  servicesUsed: string[];
  status: ProjectStatus;
  area: number;
  highlights: string[];
  isFeatured: boolean;
  isPublished: boolean;
}

// ---------- Quotation ----------

export type QuotationStatus = 'Draft' | 'Submitted' | 'Approved' | 'Converted' | 'Rejected';

export interface QuotationInputs {
  projectType: string;
  scopeOfWork: string;
  floorArea: number;
  floors: number;
  materialPreference: string;
  designPreference: string;
  budgetRange: string;
  additionalServiceIds: string[];
  specialRequests?: string;
}

export interface CostLine {
  label: string;
  detail: string;
  amount: number;
}

export interface PricingSnapshot {
  pricingConfig: Partial<PricingConfig>;
  pricingRule: PricingRule | null;
  computedAt: string;
}

export interface Quotation extends Partial<Timestamped> {
  id: string;
  quotationNumber: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  inputs: QuotationInputs;
  baseCost: number;
  materialCost: number;
  scopeCost: number;
  designCost: number;
  laborCost: number;
  additionalCost: number;
  totalEstimate: number;
  lines: CostLine[];
  pricingVersion: string;
  pricingRuleId?: string;
  pricingSnapshot: PricingSnapshot;
  budgetNote?: string;
  withinBudget?: boolean;
  status: QuotationStatus;
  createdAt: string;
}

export interface AdditionalService extends Timestamped {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: 'lump sum' | 'per sqm';
  category: string;
  isActive: boolean;
}

export interface PricingRule extends Timestamped {
  id: string;
  name: string;
  projectType: string;
  scope: string;
  baseRate: number;
  isActive: boolean;
  version: number;
  effectiveDate: string;
}

export interface PricingConfig {
  id: string;
  version: number;
  laborMultiplier: number;
  materialMultipliers: Record<string, number>;
  designMultipliers: Record<string, number>;
  scopeMultipliers: Record<string, number>;
  updatedAt: string;
}

// ---------- Inquiries ----------

export type InquiryStatus = 'Pending' | 'In Progress' | 'Resolved' | 'Cancelled';

export interface Attachment {
  name: string;
  url: string;
  type: string;
}

export interface Inquiry extends Timestamped {
  id: string;
  inquiryNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  subject: string;
  message: string;
  projectDetails?: string;
  serviceId?: string;
  serviceTitle?: string;
  quotationId?: string;
  quotationNumber?: string;
  attachments: Attachment[];
  status: InquiryStatus;
}

export interface InquiryMessage {
  id: string;
  inquiryId: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ---------- Notifications ----------

export interface AppNotification {
  id: string;
  userId: string;
  audience: 'client' | 'admin' | 'all';
  title: string;
  message: string;
  type: string;
  referenceId?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// ---------- Announcements ----------

export type AnnouncementStatus = 'Published' | 'Draft' | 'Archived';

export interface Announcement extends Timestamped {
  id: string;
  title: string;
  content: string;
  status: AnnouncementStatus;
  publishDate: string;
  expirationDate?: string;
}

// ---------- Audit ----------

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  action: string;
  module: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

// ---------- Bookings ----------

export type BookingStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';

export interface SiteVisitBooking extends Partial<Timestamped> {
  id: string;
  clientId?: string;
  name: string;
  address?: string;
  contactNumber: string;
  landmark?: string;
  preferredDate: string;
  preferredTime: string;
  purpose?: string;
  status: BookingStatus;
  createdAt: string;
}

// ---------- Settings ----------

export interface SystemSettings {
  companyName: string;
  companyTagline: string;
  companyDescription: string;
  logoUrl: string;
  email: string;
  phone: string;
  address: string;
  businessHours: string;
  facebook: string;
  instagram: string;
  quotationDisclaimer: string;
  currency: string;
}
