import "server-only";
import type { AuditOutcome, Role } from "@/contracts/shared";
import { db } from "@/server/db";

// Writes one row to the audit log. Called ONLY by authorize(), once per decision,
// for allowed AND denied requests (Master §5). Nothing else in the app writes audit rows.

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

export async function writeAudit(entry: AuditEntry): Promise<void> {
  await db.auditLog.create({
    data: {
      actorId: entry.actorId,
      actorRole: entry.actorRole,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      patientId: entry.patientId,
      consentId: entry.consentId,
      outcome: entry.outcome,
      reason: entry.reason,
    },
  });
}
