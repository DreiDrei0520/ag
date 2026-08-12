import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile as updateAuthProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from 'firebase/auth';
import { auth, db, storage } from '../config';
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
import { nowIso } from '../lib/format';

// ---------- helpers ----------

type FirestoreDoc = { id: string; data(): unknown };
type FirestoreQuerySnapshot = { docs: FirestoreDoc[] };
type FirestoreDocSnapshot = { exists(): boolean; data(): unknown };
type FirebaseUser = { uid: string; email: string | null; emailVerified: boolean };

function toIso(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  const t = value as { toDate?: () => Date };
  if (typeof t.toDate === 'function') return t.toDate().toISOString();
  return new Date(value as number).toISOString();
}

function withId<T>(id: string, data: Record<string, unknown>): T {
  return { id, ...data } as T;
}

function normalizeDoc<T>(docData: Record<string, unknown>, id: string): T {
  if (typeof docData.createdAt !== 'string') docData.createdAt = toIso(docData.createdAt);
  if (typeof docData.updatedAt !== 'string') docData.updatedAt = toIso(docData.updatedAt);
  return withId<T>(id, docData);
}

function stripUndefined(obj: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));
}

// ---------- generic collection ----------

function fbCollection<T>(name: string) {
  const col = collection(db, name);
  return {
    async list(): Promise<T[]> {
      const snap = await getDocs(query(col, orderBy('createdAt', 'desc')));
      return snap.docs.map((d: FirestoreDoc) => normalizeDoc<T>(d.data() as Record<string, unknown>, d.id));
    },
    async get(id: string): Promise<T | null> {
      const snap = await getDoc(doc(db, name, id));
      return snap.exists() ? normalizeDoc<T>(snap.data() as Record<string, unknown>, id) : null;
    },
    async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<T> {
      const payload = {
        ...stripUndefined(data as object),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      let refId: string;
      if (data.id) {
        refId = data.id;
        await setDoc(doc(db, name, refId), payload);
      } else {
        const ref = await addDoc(col, payload);
        refId = ref.id;
      }
      return { id: refId, ...(data as object), createdAt: nowIso(), updatedAt: nowIso() } as T;
    },
    async update(id: string, patch: Partial<T>): Promise<void> {
      await updateDoc(doc(db, name, id), { ...stripUndefined(patch as object), updatedAt: serverTimestamp() });
    },
    async remove(id: string): Promise<void> {
      await deleteDoc(doc(db, name, id));
    },
    subscribe(callback: (items: T[]) => void): () => void {
      return onSnapshot(col, (snap: FirestoreQuerySnapshot) =>
        callback(snap.docs.map((d: FirestoreDoc) => normalizeDoc<T>(d.data() as Record<string, unknown>, d.id)))
      );
    },
  };
}

export const fbCollections = {
  services: fbCollection<Service>('services'),
  serviceCategories: fbCollection<ServiceCategory>('serviceCategories'),
  projects: fbCollection<Project>('projects'),
  projectCategories: fbCollection<ProjectCategory>('projectCategories'),
  quotations: fbCollection<Quotation>('quotations'),
  inquiries: fbCollection<Inquiry>('inquiries'),
  notifications: fbCollection<AppNotification>('notifications'),
  pricingRules: fbCollection<PricingRule>('pricingRules'),
  additionalServices: fbCollection<AdditionalService>('additionalServices'),
  announcements: fbCollection<Announcement>('announcements'),
  auditLogs: fbCollection<AuditLog>('auditLogs'),
  bookings: fbCollection<SiteVisitBooking>('bookings'),
  users: fbCollection<AppUser>('users'),
};

// ---------- singletons ----------

export const fbSingletons = {
  async getPricingConfig(): Promise<PricingConfig | null> {
    const snap = await getDoc(doc(db, 'pricingConfig', 'default'));
    if (!snap.exists()) return null;
    const data = snap.data() as Record<string, unknown>;
    return { id: 'default', ...data, updatedAt: toIso(data.updatedAt) } as PricingConfig;
  },
  async setPricingConfig(cfg: PricingConfig): Promise<void> {
    const { id: _id, updatedAt: _updatedAt, ...rest } = cfg;
    await setDoc(doc(db, 'pricingConfig', 'default'), { ...stripUndefined(rest), updatedAt: serverTimestamp() });
  },
  subscribePricingConfig(callback: (cfg: PricingConfig | null) => void): () => void {
    return onSnapshot(doc(db, 'pricingConfig', 'default'), (snap: FirestoreDocSnapshot) => {
      if (!snap.exists()) return callback(null);
      const data = snap.data() as Record<string, unknown>;
      callback({ id: 'default', ...data, updatedAt: toIso(data.updatedAt) } as PricingConfig);
    });
  },
  async getSettings(): Promise<SystemSettings | null> {
    const snap = await getDoc(doc(db, 'systemSettings', 'company'));
    if (!snap.exists()) return null;
    return snap.data() as SystemSettings;
  },
  async setSettings(settings: SystemSettings): Promise<void> {
    await setDoc(doc(db, 'systemSettings', 'company'), stripUndefined(settings), { merge: true });
  },
  subscribeSettings(callback: (settings: SystemSettings | null) => void): () => void {
    return onSnapshot(doc(db, 'systemSettings', 'company'), (snap: FirestoreDocSnapshot) =>
      callback(snap.exists() ? (snap.data() as SystemSettings) : null)
    );
  },
};

// ---------- inquiry messages ----------

export const fbMessages = {
  async listFor(inquiryId: string): Promise<InquiryMessage[]> {
    const q = query(
      collection(db, 'inquiries', inquiryId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d: FirestoreDoc) => normalizeDoc<InquiryMessage>(d.data() as Record<string, unknown>, d.id));
  },
  async create(
    inquiryId: string,
    data: Omit<InquiryMessage, 'id' | 'createdAt' | 'isRead' | 'inquiryId'>
  ): Promise<InquiryMessage> {
    const ref = await addDoc(collection(db, 'inquiries', inquiryId, 'messages'), {
      ...stripUndefined(data as object),
      isRead: false,
      createdAt: serverTimestamp(),
    });
    return { id: ref.id, inquiryId, ...data, isRead: false, createdAt: nowIso() };
  },
  subscribeFor(inquiryId: string, callback: (items: InquiryMessage[]) => void): () => void {
    const q = query(
      collection(db, 'inquiries', inquiryId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snap: FirestoreQuerySnapshot) =>
      callback(snap.docs.map((d: FirestoreDoc) => normalizeDoc<InquiryMessage>(d.data() as Record<string, unknown>, d.id)))
    );
  },
  async markRead(inquiryId: string, messageId: string): Promise<void> {
    await updateDoc(doc(db, 'inquiries', inquiryId, 'messages', messageId), { isRead: true });
  },
};

// ---------- auth ----------

export const fbAuth = {
  async registerClient(input: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }): Promise<AppUser> {
    const credential = await createUserWithEmailAndPassword(auth, input.email, input.password);
    await updateAuthProfile(credential.user, { displayName: input.fullName });
    const appUser: AppUser = {
      uid: credential.user.uid,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      address: input.address,
      role: 'client',
      emailVerified: credential.user.emailVerified,
      isActive: true,
      createdAt: nowIso(),
    };
    await setDoc(doc(db, 'users', credential.user.uid), {
      ...stripUndefined(appUser),
      createdAt: serverTimestamp(),
    });
    return appUser;
  },
  async login(email: string, password: string, remember: boolean): Promise<void> {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    await signInWithEmailAndPassword(auth, email, password);
  },
  async logout(): Promise<void> {
    await signOut(auth);
  },
  async requestPasswordResetCode(email: string): Promise<{ sentCode: boolean; demoCode?: string }> {
    await sendPasswordResetEmail(auth, email);
    return { sentCode: false };
  },
  async resetPasswordWithCode(_email: string, _code: string, _newPassword: string): Promise<void> {
    throw new Error('Code-based reset is only available in demo mode. In production, use the email reset link instead.');
  },
  async updateProfile(uidValue: string, patch: Partial<AppUser>): Promise<void> {
    await updateDoc(doc(db, 'users', uidValue), { ...stripUndefined(patch as object), updatedAt: serverTimestamp() });
  },
  async changePassword(current: string, next: string): Promise<void> {
    const fbUser = auth.currentUser;
    if (!fbUser?.email) throw new Error('You must be logged in to change your password.');
    const credential = EmailAuthProvider.credential(fbUser.email, current);
    await reauthenticateWithCredential(fbUser, credential);
    await updatePassword(fbUser, next);
  },
  async getCurrentUser(): Promise<AppUser | null> {
    const fbUser = auth.currentUser;
    if (!fbUser) return null;
    const snap = await getDoc(doc(db, 'users', fbUser.uid));
    if (!snap.exists()) return null;
    const data = snap.data() as Record<string, unknown>;
    return normalizeDoc<AppUser>({ ...data, createdAt: toIso(data.createdAt) }, fbUser.uid);
  },
  subscribe(callback: (user: AppUser | null) => void): () => void {
    return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (!fbUser) {
        callback(null);
        return;
      }
      const snap = await getDoc(doc(db, 'users', fbUser.uid));
      if (!snap.exists()) {
        callback(null);
        return;
      }
      const data = snap.data() as Record<string, unknown>;
      callback(withId<AppUser>(fbUser.uid, { ...data, createdAt: toIso(data.createdAt) }));
    });
  },
};

// ---------- storage ----------

export async function fbUploadAttachment(path: string, file: File): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function ensurePricingConfigExists() {
  const snap = await getDoc(doc(db, 'pricingConfig', 'default'));
  if (!snap.exists()) {
    await setDoc(doc(db, 'pricingConfig', 'default'), {
      version: 1,
      laborMultiplier: 0.25,
      materialMultipliers: { Standard: 1, 'Mid-Range': 1.15, Premium: 1.35 },
      designMultipliers: { Modern: 1, Minimalist: 1, Industrial: 1.08, Classic: 1.05, Scandinavian: 1.1, Luxury: 1.3 },
      scopeMultipliers: { 'Full Construction': 0, Renovation: 0.15, Interior: 0.1, Exterior: 0.12, 'Design & Build': 0.18 },
      updatedAt: serverTimestamp(),
    });
  }
}

export function readRoleFromFirebase(fbUser: FirebaseUser | null, dbUser: AppUser | null): AppUser | null {
  return dbUser;
}

// kept for potential future custom claims
export const FIREBASE_LIMIT = limit;
