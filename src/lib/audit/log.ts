import type { AuditAction, AuditEntityType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/** Append-only audit trail — fire-and-forget from API handlers after successful mutations. */
export async function writeAuditLog(params: {
  actorId?: string | null;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId ?? null,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      before: params.before,
      after: params.after,
      metadata: params.metadata,
    },
  });
}
