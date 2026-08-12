import { useEffect, useRef, useState, useCallback } from 'react';
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
  Quotation,
  Service,
  SiteVisitBooking,
  SystemSettings,
} from '../types';
import { db } from '../backend';
import { useAuth as useAuthLocal } from '../context/AuthContext';
import { DEFAULT_DISCLAIMER } from '../lib/constants';

export interface UseItemsResult<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useItems<T>(
  listFn: () => Promise<T[]>,
  subscribeFn?: (cb: (items: T[]) => void) => () => void,
  deps: unknown[] = []
): UseItemsResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    let unsub: (() => void) | undefined;
    let active = true;

    listFn()
      .then((data) => {
        if (active) {
          setItems(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err?.message || 'Something went wrong. Please try again.');
          setLoading(false);
        }
      });

    if (subscribeFn) {
      unsub = subscribeFn((data) => {
        if (active) {
          setItems(data);
          setLoading(false);
        }
      });
    }

    return () => {
      active = false;
      mounted.current = false;
      unsub?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((v) => v + 1), []);

  return { items, loading, error, reload };
}

export function useServices(activeOnly = false) {
  const { items, ...rest } = useItems<Service>(
    () => (activeOnly ? db.listActiveServices() : db.services.list()),
    activeOnly ? undefined : (cb) => db.services.subscribe(cb)
  );
  return { services: items, ...rest };
}

export function useProjects(publishedOnly = false) {
  const { items, ...rest } = useItems<Project>(
    () => (publishedOnly ? db.listPublishedProjects() : db.projects.list()),
    publishedOnly ? undefined : (cb) => db.projects.subscribe(cb)
  );
  return { projects: items, ...rest };
}

export function useQuotations(clientId?: string) {
  const { items, ...rest } = useItems<Quotation>(
    () => (clientId ? db.listQuotationsForClient(clientId) : db.quotations.list()),
    clientId ? undefined : (cb) => db.quotations.subscribe(cb),
    [clientId]
  );
  return { quotations: items, ...rest };
}

export function useInquiries(clientId?: string) {
  const { items, ...rest } = useItems<Inquiry>(
    () => (clientId ? db.listInquiriesForClient(clientId) : db.inquiries.list()),
    clientId ? undefined : (cb) => db.inquiries.subscribe(cb),
    [clientId]
  );
  return { inquiries: items, ...rest };
}

export function useInquiryMessages(inquiryId: string) {
  const { items, ...rest } = useItems<InquiryMessage>(
    () => db.listInquiryMessages(inquiryId),
    (cb) => db.messages.subscribeFor(inquiryId, cb),
    [inquiryId]
  );
  return { messages: items, ...rest };
}

export function useNotifications(userId: string, role?: AppUser['role']) {
  const { items, ...rest } = useItems<AppNotification>(
    () => db.listNotificationsFor(userId, role ?? 'client'),
    userId ? (cb) => db.subscribeNotifications(userId, role ?? 'client', cb) : undefined,
    [userId, role]
  );
  const unread = items.filter((n) => !n.isRead).length;
  return { notifications: items, unread, ...rest };
}

export function usePricingRules(activeOnly = false) {
  const { items, ...rest } = useItems<PricingRule>(
    () => (activeOnly ? db.listActivePricingRules() : db.pricingRules.list()),
    activeOnly ? undefined : (cb) => db.pricingRules.subscribe(cb)
  );
  return { pricingRules: items, ...rest };
}

export function usePricingConfig() {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let unsub: (() => void) | undefined;
    db.getPricingConfig()
      .then((cfg) => {
        setConfig(cfg);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    unsub = db.singletons.subscribePricingConfig((cfg) => {
      setConfig(cfg);
      setLoading(false);
    });
    return () => unsub?.();
  }, []);
  return { config, loading };
}

export function useAdditionalServices(activeOnly = false) {
  const { items, ...rest } = useItems<AdditionalService>(
    () => (activeOnly ? db.listActiveAdditionalServices() : db.additionalServices.list()),
    activeOnly ? undefined : (cb) => db.additionalServices.subscribe(cb)
  );
  return { additionalServices: items, ...rest };
}

export function useAnnouncements(publishedOnly = false) {
  const { items, ...rest } = useItems<Announcement>(
    () => db.announcements.list(),
    (cb) => db.announcements.subscribe(cb)
  );
  const published = publishedOnly
    ? items.filter(
        (a) => a.status === 'Published' && (!a.expirationDate || a.expirationDate >= new Date().toISOString().slice(0, 10))
      )
    : items;
  return { announcements: published, ...rest };
}

export function useSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let unsub: (() => void) | undefined;
    db.getSettings().then((s) => {
      if (s) {
        setSettings(s);
      } else {
        setSettings({
          companyName: 'AG Construction Builders',
          companyTagline: 'Build Your Vision, Simplified',
          companyDescription: '',
          logoUrl: '',
          email: '',
          phone: '',
          address: '',
          businessHours: '',
          facebook: '',
          instagram: '',
          quotationDisclaimer: DEFAULT_DISCLAIMER,
          currency: '₱',
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
    unsub = db.singletons.subscribeSettings((s) => {
      setSettings(s);
      setLoading(false);
    });
    return () => unsub?.();
  }, []);
  return { settings, loading };
}

export function useUsers(role?: AppUser['role']) {
  const { items, ...rest } = useItems<AppUser>(
    () => (role ? db.listUsersByRole(role) : db.users.list()),
    role ? undefined : (cb) => db.users.subscribe(cb),
    [role]
  );
  return { users: items, ...rest };
}

export function useAuditLogs() {
  const { items, ...rest } = useItems<AuditLog>(() => db.auditLogs.list(), (cb) => db.auditLogs.subscribe(cb));
  return { auditLogs: items, ...rest };
}

export function useBookings(clientId?: string) {
  const { items, ...rest } = useItems<SiteVisitBooking>(
    () => {
      const list = db.bookings.list();
      return list.then((all) => (clientId ? all.filter((b) => b.clientId === clientId) : all));
    },
    (cb) =>
      db.bookings.subscribe((all) => {
        cb(clientId ? all.filter((b) => b.clientId === clientId) : all);
      }),
    [clientId]
  );
  return { bookings: items, ...rest };
}

export function useServiceCategories() {
  return useItems(db.serviceCategories.list, (cb) => db.serviceCategories.subscribe(cb));
}

export function useProjectCategories() {
  return useItems(db.projectCategories.list, (cb) => db.projectCategories.subscribe(cb));
}

export function useCurrentUser() {
  const { user, loading, isDemo, refreshUser } = useAuthLocal();
  return { user, loading, isDemo, refreshUser };
}

