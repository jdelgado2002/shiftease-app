import prisma from '@/lib/prisma';

export interface AuditLogEntry {
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  metadata?: Record<string, any>;
}

export async function createAuditLog({
  action,
  entityType,
  entityId,
  userId,
  metadata,
}: {
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  metadata?: Record<string, any>;
}) {
  return prisma.auditLog.create({
    data: {
      action,
      entityType,
      entityId,
      userId,
      metadata,
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