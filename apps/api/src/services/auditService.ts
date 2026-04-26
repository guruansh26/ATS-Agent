import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { getLogger } from "../lib/logger.js";

export type AuditAction =
  | "job_created"
  | "candidate_created"
  | "screening_requested"
  | "screening_completed"
  | "screening_failed";

export async function recordAudit(input: {
  action: AuditAction;
  entityType: "job" | "candidate" | "screening";
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata
      }
    });
  } catch (err) {
    getLogger().warn(
      { err, action: input.action, entityId: input.entityId },
      "audit_log_write_failed"
    );
  }
}
