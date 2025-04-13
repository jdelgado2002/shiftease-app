import { prisma } from '@/lib/prisma';

export interface AuditLogEntry {
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  metadata?: Record<string, any>;
}

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      userId: entry.userId,
      metadata: entry.metadata || {},
      timestamp: new Date(),
    },
  });
}

export async function getAuditLogs(
  entityType?: string,
  entityId?: string,
  userId?: string,
  limit: number = 100
) {
  return await prisma.auditLog.findMany({
    where: {
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
      ...(userId && { userId }),
    },
    orderBy: {
      timestamp: 'desc',
    },
    take: limit,
  });
} 