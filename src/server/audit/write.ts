import "server-only";
import type { AuditOutcome, Role } from "@/contracts/shared";
import { db } from "@/server/db";

export type AuditEntry = {
  actorId: string;
  actorRole: Role;
  action: string;
  resourceType: string;
  resourceId: string | null;
  patientId: string | null;
  consentId: string | null;
  outcome: AuditOutcome;
  reason: string;
};

export async function writeAudit(entry: AuditEntry) {
  await db.auditLog.create({ data: entry });
}
