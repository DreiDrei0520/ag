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
import { nowIso, uid } from '../lib/format';
import { sendVerificationCode, isEmailConfigured } from '../lib/email';
import { seedData } from './seed';

const DB_KEY = 'ag_local_db_v2';
const SESSION_KEY = 'ag_session_v1';
const AUTH_KEY = 'ag_auth_v1';
const RESET_KEY = 'ag_reset_codes_v1';
const CHANGE_EVENT = 'ag-db-change';
const AUTH_EVENT = 'ag-auth-change';

interface LocalStore {
  users: AppUser[];
  serviceCategories: ServiceCategory[];
  services: Service[];
  projectCategories: ProjectCategory[];
  projects: Project[];
  pricingRules: PricingRule[];
  pricingConfig: PricingConfig | null;
  additionalServices: AdditionalService[];
  quotations: Quotation[];
  inquiries: Inquiry[];
  inquiryMessages: InquiryMessage[];
  notifications: AppNotification[];
  announcements: Announcement[];
  settings: SystemSettings | null;
  auditLogs: AuditLog[];
  bookings: SiteVisitBooking[];
}

type StoreKey = keyof LocalStore;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function defaultStore(): LocalStore {
  return clone(seedData);
}

const BROKEN_IMAGE_REPAIRS: Record<string, string> = {
  'https://images.unsplash.com/photo-1591588582259-2e34b7e8c0f2?w=1200&q=80':
    'https://images.unsplash.com/photo-1460317442991-0ec209397118?w=1200&q=80',
  'https://images.unsplash.com/photo-1590644365607-1c5a92909e15?w=1200&q=80':
    'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=1200&q=80',
};

function repairBrokenImages(store: LocalStore): boolean {
  let changed = false;
  store.services = store.services.map((s) => {
    const replacement = BROKEN_IMAGE_REPAIRS[s.imageUrl];
    if (replacement) {
      changed = true;
      return { ...s, imageUrl: replacement };
    }
    return s;
  });
  return changed;
}

// Earlier builds seeded the portfolio with stock-photo placeholder projects (ids proj-1 … proj-8).
// Swap those for the real seed projects, keeping any project an admin added.
function replacePlaceholderProjects(store: LocalStore): boolean {
  const isPlaceholder = (p: Project) => /^proj-\d+$/.test(p.id) && p.featuredImage.includes('images.unsplash.com');
  if (!store.projects.some(isPlaceholder)) return false;
  const kept = store.projects.filter((p) => !isPlaceholder(p));
  const missing = seedData.projects.filter((s) => !kept.some((p) => p.id === s.id));
  store.projects = [...clone(missing), ...kept];
  return true;
}

function read(): LocalStore {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const store = { ...defaultStore(), ...(JSON.parse(raw) as Partial<LocalStore>) } as LocalStore;
      const repaired = repairBrokenImages(store);
      if (replacePlaceholderProjects(store) || repaired) write(store);
      return store;
    }
  } catch {
    /* fall through */
  }
  const store = defaultStore();
  write(store);
  return store;
}

function write(store: LocalStore) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(store));
  } catch {
    /* storage may be full in demo mode */
  }
}

function mutate(fn: (store: LocalStore) => void, key: StoreKey) {
  const store = read();
  fn(store);
  write(store);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: key }));
}

function subscribeToChanges(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

// ---------- generic collection ----------

export function localCollection<T>(key: StoreKey, getId: (item: T) => string = (item) => (item as { id?: string }).id ?? '') {
  const all = (): T[] => read()[key] as unknown as T[];
  return {
    async list(): Promise<T[]> {
      return clone(all());
    },
    async get(id: string): Promise<T | null> {
      const found = all().find((item) => getId(item) === id);
      return found ? clone(found) : null;
    },
    async create(data: Omit<T, 'id'> & { id?: string }): Promise<T> {
      const item = { ...(data as object), id: data.id ?? uid(), createdAt: nowIso(), updatedAt: nowIso() } as unknown as T;
      mutate((s) => {
        (s[key] as unknown as T[]).unshift(item);
      }, key);
      return clone(item);
    },
    async update(id: string, patch: Partial<T>): Promise<void> {
      mutate((s) => {
        const arr = s[key] as unknown as T[];
        const index = arr.findIndex((item) => getId(item) === id);
        if (index >= 0) {
          arr[index] = { ...arr[index], ...(patch as object), updatedAt: nowIso() } as unknown as T;
        }
      }, key);
    },
    async remove(id: string): Promise<void> {
      mutate((s) => {
        (s[key] as unknown as T[]) = (s[key] as unknown as T[]).filter((item) => getId(item) !== id);
      }, key);
    },
    subscribe(callback: (items: T[]) => void): () => void {
      return subscribeToChanges(() => callback(clone(all())));
    },
  };
}

export const localCollections = {
  services: localCollection<Service>('services'),
  serviceCategories: localCollection<ServiceCategory>('serviceCategories'),
  projects: localCollection<Project>('projects'),
  projectCategories: localCollection<ProjectCategory>('projectCategories'),
  quotations: localCollection<Quotation>('quotations'),
  inquiries: localCollection<Inquiry>('inquiries'),
  notifications: localCollection<AppNotification>('notifications'),
  pricingRules: localCollection<PricingRule>('pricingRules'),
  additionalServices: localCollection<AdditionalService>('additionalServices'),
  announcements: localCollection<Announcement>('announcements'),
  auditLogs: localCollection<AuditLog>('auditLogs'),
  bookings: localCollection<SiteVisitBooking>('bookings'),
  users: localCollection<AppUser>('users', (u) => u.uid),
};

export const localSingletons = {
  async getPricingConfig(): Promise<PricingConfig | null> {
    return clone(read().pricingConfig);
  },
  async setPricingConfig(cfg: PricingConfig): Promise<void> {
    mutate((s) => {
      s.pricingConfig = { ...cfg, updatedAt: nowIso() };
    }, 'pricingConfig');
  },
  subscribePricingConfig(callback: (cfg: PricingConfig | null) => void): () => void {
    return subscribeToChanges(() => callback(clone(read().pricingConfig)));
  },
  async getSettings(): Promise<SystemSettings | null> {
    return clone(read().settings);
  },
  async setSettings(settings: SystemSettings): Promise<void> {
    mutate((s) => {
      s.settings = settings;
    }, 'settings');
  },
  subscribeSettings(callback: (settings: SystemSettings | null) => void): () => void {
    return subscribeToChanges(() => callback(clone(read().settings)));
  },
};

export const localMessages = {
  async listFor(inquiryId: string): Promise<InquiryMessage[]> {
    return clone(
      read()
        .inquiryMessages.filter((m) => m.inquiryId === inquiryId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    );
  },
  async create(inquiryId: string, data: Omit<InquiryMessage, 'id' | 'createdAt' | 'isRead' | 'inquiryId'>): Promise<InquiryMessage> {
    const message: InquiryMessage = { ...data, inquiryId, id: uid('m_'), isRead: false, createdAt: nowIso() };
    mutate((s) => {
      s.inquiryMessages.push(message);
    }, 'inquiryMessages');
    return clone(message);
  },
  subscribeFor(inquiryId: string, callback: (items: InquiryMessage[]) => void): () => void {
    return subscribeToChanges(() => callback(clone(read().inquiryMessages.filter((m) => m.inquiryId === inquiryId))));
  },
  async markRead(inquiryId: string, messageId: string): Promise<void> {
    mutate((s) => {
      const item = s.inquiryMessages.find((m) => m.inquiryId === inquiryId && m.id === messageId);
      if (item) item.isRead = true;
    }, 'inquiryMessages');
  },
};

// ---------- auth (demo only) ----------

function readAuthMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

function seedAuthMap() {
  const map = readAuthMap();
  map['admin-1'] = btoa('Admin123!');
  localStorage.setItem(AUTH_KEY, JSON.stringify(map));
}

type ResetEntry = { code: string; expiresAt: number };

function readResetMap(): Record<string, ResetEntry> {
  try {
    return JSON.parse(localStorage.getItem(RESET_KEY) || '{}') as Record<string, ResetEntry>;
  } catch {
    return {};
  }
}

function writeResetMap(map: Record<string, ResetEntry>) {
  try {
    localStorage.setItem(RESET_KEY, JSON.stringify(map));
  } catch {
    /* storage may be full */
  }
}

function emitAuth() {
  window.dispatchEvent(new CustomEvent(AUTH_EVENT));
}

export const localAuth = {
  async login(email: string, password: string): Promise<void> {
    seedAuthMap();
    const user = read().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error('No account found for this email.');
    const map = readAuthMap();
    if (map[user.uid] !== btoa(password)) throw new Error('Incorrect password.');
    if (user.role !== 'admin') throw new Error('Only admin accounts can log in.');
    if (!user.isActive) throw new Error('This account has been deactivated. Contact the administrator.');
    user.lastLoginAt = nowIso();
    mutate((s) => {
      s.users = s.users.map((u) => (u.uid === user.uid ? user : u));
    }, 'users');
    localStorage.setItem(SESSION_KEY, user.uid);
    emitAuth();
  },
  async logout(): Promise<void> {
    localStorage.removeItem(SESSION_KEY);
    emitAuth();
  },
  async requestPasswordResetCode(email: string): Promise<{ sentCode: boolean; demoCode?: string }> {
    const user = read().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error('No account found for this email.');
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const map = readResetMap();
    map[email.toLowerCase()] = { code, expiresAt: Date.now() + 10 * 60 * 1000 };
    writeResetMap(map);
    try {
      await sendVerificationCode(email, code);
    } catch {
      /* email delivery failed — fall back to showing the code in demo mode */
    }
    return { sentCode: true, demoCode: isEmailConfigured ? undefined : code };
  },
  async resetPasswordWithCode(email: string, code: string, newPassword: string): Promise<void> {
    const user = read().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error('No account found for this email.');
    if (newPassword.length < 8) throw new Error('Password must be at least 8 characters.');
    const map = readResetMap();
    const entry = map[email.toLowerCase()];
    if (!entry) throw new Error('No verification code was requested. Please request a new code.');
    if (Date.now() > entry.expiresAt) {
      delete map[email.toLowerCase()];
      writeResetMap(map);
      throw new Error('This verification code has expired. Please request a new code.');
    }
    if (entry.code !== code.trim()) throw new Error('Incorrect verification code.');
    const authMap = readAuthMap();
    authMap[user.uid] = btoa(newPassword);
    localStorage.setItem(AUTH_KEY, JSON.stringify(authMap));
    delete map[email.toLowerCase()];
    writeResetMap(map);
  },
  async updateProfile(uidValue: string, patch: Partial<AppUser>): Promise<void> {
    mutate((s) => {
      s.users = s.users.map((u) => (u.uid === uidValue ? { ...u, ...(patch as object), updatedAt: nowIso() } as AppUser : u));
    }, 'users');
    emitAuth();
  },
  async changePassword(current: string, next: string): Promise<void> {
    const session = localStorage.getItem(SESSION_KEY);
    const user = session ? read().users.find((u) => u.uid === session) : null;
    if (!user) throw new Error('You must be logged in to change your password.');
    seedAuthMap();
    const map = readAuthMap();
    if (map[user.uid] !== btoa(current)) throw new Error('Current password is incorrect.');
    if (next.length < 8) throw new Error('Password must be at least 8 characters.');
    map[user.uid] = btoa(next);
    localStorage.setItem(AUTH_KEY, JSON.stringify(map));
  },
  async getCurrentUser(): Promise<AppUser | null> {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) return null;
    const user = read().users.find((u) => u.uid === session);
    return user ? clone(user) : null;
  },
  subscribe(callback: (user: AppUser | null) => void): () => void {
    seedAuthMap();
    const emit = () => {
      const session = localStorage.getItem(SESSION_KEY);
      const user = session ? read().users.find((u) => u.uid === session) ?? null : null;
      callback(user ? clone(user) : null);
    };
    emit();
    const handler = () => emit();
    window.addEventListener(AUTH_EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(AUTH_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  },
};

// ---------- uploads (demo) ----------

export async function localUploadAttachment(path: string, file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      try {
        const map = JSON.parse(localStorage.getItem('ag_uploads') || '{}') as Record<string, string>;
        map[path] = dataUrl;
        localStorage.setItem('ag_uploads', JSON.stringify(map));
        resolve(dataUrl);
      } catch {
        resolve(URL.createObjectURL(file));
      }
    };
    reader.readAsDataURL(file);
  });
}
