import { prisma } from '@/lib/prisma';

type AuditLogInput = {
  action: string;
  entity?: string;
  entityId?: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  metadata?: unknown;
};

const toMetadata = (value: unknown) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return undefined;
  }
};

export async function writeAuditLog(input: AuditLogInput) {
  try {
    await prisma.auditLog.create({
      data: {
        action: String(input.action || '').trim(),
        entity: input.entity ? String(input.entity).trim() : null,
        entityId: input.entityId ? String(input.entityId).trim() : null,
        actorId: input.actorId ? String(input.actorId).trim() : null,
        actorEmail: input.actorEmail ? String(input.actorEmail).trim() : null,
        actorRole: input.actorRole ? String(input.actorRole).trim() : null,
        metadata: toMetadata(input.metadata),
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
