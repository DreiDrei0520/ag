import type { AppUser } from '../types';
import { db } from '../backend';

export interface AuditContext {
  actor: AppUser | null;
}

export async function writeAuditLog(
  ctx: AuditContext,
  action: string,
  module: string,
  targetId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await db.createAuditLog({
      actorId: ctx.actor?.uid ?? 'system',
      actorName: ctx.actor?.fullName ?? 'System',
      actorRole: ctx.actor?.role ?? 'system',
      action,
      module,
      targetId,
      metadata,
    });
  } catch {
    // audit logging must never break the primary flow
  }
}

export async function notifyUser(input: {
  userId: string;
  audience: 'client' | 'admin' | 'all';
  title: string;
  message: string;
  type: string;
  referenceId?: string;
  link?: string;
}): Promise<void> {
  try {
    await db.notifications.create({
      userId: input.userId,
      audience: input.audience,
      title: input.title,
      message: input.message,
      type: input.type,
      referenceId: input.referenceId,
      link: input.link,
      isRead: false,
    });
  } catch {
    // non-critical
  }
}

export async function notifyAdmins(input: {
  title: string;
  message: string;
  type: string;
  referenceId?: string;
  link?: string;
}): Promise<void> {
  await notifyUser({ userId: '', audience: 'admin', ...input });
}
