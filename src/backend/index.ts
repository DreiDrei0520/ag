import { isFirebaseConfigured } from '../config';
import type {
  AdditionalService,
  Announcement,
  AppNotification,
  AppUser,
  AuditLog,
  Inquiry,
  InquiryMessage,
  PricingConfig,
  PricingRule,
  Project,
  ProjectCategory,
  Quotation,
  Service,
  ServiceCategory,
  SiteVisitBooking,
  SystemSettings,
} from '../types';
import {
  localAuth,
  localCollections,
  localMessages,
  localSingletons,
  localUploadAttachment,
} from './local';
import {
  fbAuth,
  fbCollections,
  fbMessages,
  fbSingletons,
  fbUploadAttachment,
} from './firebase';

export const isDemoMode = !isFirebaseConfigured;

type AuthAPI = {
  login(email: string, password: string, remember: boolean): Promise<void>;
  logout(): Promise<void>;
  requestPasswordResetCode(email: string): Promise<{ sentCode: boolean; demoCode?: string }>;
  resetPasswordWithCode(email: string, code: string, newPassword: string): Promise<void>;
  updateProfile(uid: string, patch: Partial<AppUser>): Promise<void>;
  changePassword(current: string, next: string): Promise<void>;
  /** Resolves `pendingVerification` when the new address must confirm a link before it takes effect. */
  changeEmail(currentPassword: string, newEmail: string): Promise<{ pendingVerification: boolean }>;
  getCurrentUser(): Promise<AppUser | null>;
  subscribe(callback: (user: AppUser | null) => void): () => void;
};

type CollectionAPI<T> = {
  list(): Promise<T[]>;
  get(id: string): Promise<T | null>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<void>;
  remove(id: string): Promise<void>;
  subscribe(callback: (items: T[]) => void): () => void;
};

type MessagesAPI = {
  listFor(inquiryId: string): Promise<InquiryMessage[]>;
  create(inquiryId: string, data: Omit<InquiryMessage, 'id' | 'createdAt' | 'isRead' | 'inquiryId'>): Promise<InquiryMessage>;
  subscribeFor(inquiryId: string, callback: (items: InquiryMessage[]) => void): () => void;
  markRead(inquiryId: string, messageId: string): Promise<void>;
};

export const auth: AuthAPI = isFirebaseConfigured ? fbAuth : localAuth;

const services: CollectionAPI<Service> = isFirebaseConfigured ? fbCollections.services : localCollections.services;
const serviceCategories: CollectionAPI<ServiceCategory> = isFirebaseConfigured ? fbCollections.serviceCategories : localCollections.serviceCategories;
const projects: CollectionAPI<Project> = isFirebaseConfigured ? fbCollections.projects : localCollections.projects;
const projectCategories: CollectionAPI<ProjectCategory> = isFirebaseConfigured ? fbCollections.projectCategories : localCollections.projectCategories;
const quotations: CollectionAPI<Quotation> = isFirebaseConfigured ? fbCollections.quotations : localCollections.quotations;
const inquiries: CollectionAPI<Inquiry> = isFirebaseConfigured ? fbCollections.inquiries : localCollections.inquiries;
const notifications: CollectionAPI<AppNotification> = isFirebaseConfigured ? fbCollections.notifications : localCollections.notifications;
const pricingRules: CollectionAPI<PricingRule> = isFirebaseConfigured ? fbCollections.pricingRules : localCollections.pricingRules;
const additionalServices: CollectionAPI<AdditionalService> = isFirebaseConfigured ? fbCollections.additionalServices : localCollections.additionalServices;
const announcements: CollectionAPI<Announcement> = isFirebaseConfigured ? fbCollections.announcements : localCollections.announcements;
const auditLogs: CollectionAPI<AuditLog> = isFirebaseConfigured ? fbCollections.auditLogs : localCollections.auditLogs;
const bookings: CollectionAPI<SiteVisitBooking> = isFirebaseConfigured ? fbCollections.bookings : localCollections.bookings;
const users: CollectionAPI<AppUser> = isFirebaseConfigured ? fbCollections.users : localCollections.users;

const messages: MessagesAPI = isFirebaseConfigured ? fbMessages : {
  listFor: (inquiryId) => localMessages.listFor(inquiryId),
  create: (inquiryId, data) => localMessages.create(inquiryId, data),
  subscribeFor: localMessages.subscribeFor,
  markRead: (inquiryId, messageId) => localMessages.markRead(inquiryId, messageId),
};

const singletons = isFirebaseConfigured
  ? fbSingletons
  : {
      getPricingConfig: localSingletons.getPricingConfig,
      setPricingConfig: localSingletons.setPricingConfig,
      subscribePricingConfig: localSingletons.subscribePricingConfig,
      getSettings: localSingletons.getSettings,
      setSettings: localSingletons.setSettings,
      subscribeSettings: localSingletons.subscribeSettings,
    };

export const uploadAttachment = isFirebaseConfigured ? fbUploadAttachment : localUploadAttachment;

// ---------- Domain-level helpers (shared by both backends) ----------

function sortByDateDesc<T extends { createdAt?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

function sortByDateAsc<T extends { createdAt?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
}

export const db = {
  isDemoMode,
  services,
  serviceCategories,
  projects,
  projectCategories,
  quotations,
  inquiries,
  notifications,
  pricingRules,
  additionalServices,
  announcements,
  auditLogs,
  bookings,
  users,
  messages,
  singletons,

  async getPricingConfig(): Promise<PricingConfig | null> {
    return singletons.getPricingConfig();
  },
  async setPricingConfig(cfg: PricingConfig): Promise<void> {
    return singletons.setPricingConfig(cfg);
  },
  async getSettings(): Promise<SystemSettings | null> {
    return singletons.getSettings();
  },
  async setSettings(settings: SystemSettings): Promise<void> {
    return singletons.setSettings(settings);
  },

  async listActiveServices(): Promise<Service[]> {
    const items = await services.list();
    return items.filter((s) => s.isActive);
  },
  async listPublishedProjects(): Promise<Project[]> {
    const items = await projects.list();
    return items.filter((p) => p.isPublished);
  },
  async listQuotationsForClient(clientId: string): Promise<Quotation[]> {
    const items = await quotations.list();
    return sortByDateDesc(items.filter((q) => q.clientId === clientId));
  },
  async listInquiriesForClient(clientId: string): Promise<Inquiry[]> {
    const items = await inquiries.list();
    return sortByDateDesc(items.filter((q) => q.clientId === clientId));
  },
  async listUsersByRole(role: AppUser['role']): Promise<AppUser[]> {
    const items = await users.list();
    return sortByDateDesc(items.filter((u) => u.role === role));
  },
  async listNotificationsFor(userId: string, role: AppUser['role']): Promise<AppNotification[]> {
    const items = await notifications.list();
    return sortByDateDesc(
      items.filter((n) => n.userId === userId || (n.audience === 'all') || (n.userId === '' && n.audience === role))
    );
  },
  subscribeNotifications(
    userId: string,
    role: AppUser['role'],
    callback: (items: AppNotification[]) => void
  ): () => void {
    return notifications.subscribe((items) =>
      callback(
        sortByDateDesc(
          items.filter((n) => n.userId === userId || n.audience === 'all' || (n.userId === '' && n.audience === role))
        )
      )
    );
  },

  async listActivePricingRules(): Promise<PricingRule[]> {
    const items = await pricingRules.list();
    return items.filter((r) => r.isActive);
  },
  async listActiveAdditionalServices(): Promise<AdditionalService[]> {
    const items = await additionalServices.list();
    return items.filter((s) => s.isActive);
  },
  async listInquiryMessages(inquiryId: string): Promise<InquiryMessage[]> {
    return sortByDateAsc(await messages.listFor(inquiryId));
  },

  async createAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    return auditLogs.create({ ...entry, timestamp: new Date().toISOString() });
  },
};

export type { CollectionAPI, MessagesAPI, AuthAPI };
