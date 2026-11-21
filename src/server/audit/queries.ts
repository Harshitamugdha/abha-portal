import "server-only";
import type { AccessLogEntryDTO, AccessLogQuery } from "@/contracts/audit";
import type { Page, SessionUser } from "@/contracts/shared";
import { authorize } from "@/server/auth/authorize";
import { db } from "@/server/db";
import { ApiError } from "@/server/http";

export async function listMyAccessLog(user: SessionUser, query: AccessLogQuery): Promise<Page<AccessLogEntryDTO>> {
  const decision = await authorize(user, "audit:read:self", { kind: "patient", patientId: user.id });
  if (!decision.allowed) {
    throw new ApiError(decision.code);
  }

  const where = { patientId: user.id, actorId: { not: user.id } };

  const total = await db.auditLog.count({ where: where });
  const rows = await db.auditLog.findMany({
    where: where,
    orderBy: { at: "desc" },
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
  });

  const actorIds: string[] = [];
  const consentIds: string[] = [];
  for (const row of rows) {
    actorIds.push(row.actorId);
    if (row.consentId) {
      consentIds.push(row.consentId);
    }
  }

  const actors = await db.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true } });
  const consents = await db.consentGrant.findMany({
    where: { id: { in: consentIds } },
    select: { id: true, purpose: true },
  });

  const actorNames = new Map<string, string>();
  for (const actor of actors) {
    actorNames.set(actor.id, actor.name);
  }
  const purposes = new Map<string, string>();
  for (const consent of consents) {
    purposes.set(consent.id, consent.purpose);
  }

  const items: AccessLogEntryDTO[] = [];
  for (const row of rows) {
    let consentPurpose = null;
    if (row.consentId) {
      consentPurpose = purposes.get(row.consentId) || null;
    }
    items.push({
      id: row.id,
      at: row.at.toISOString(),
      actorName: actorNames.get(row.actorId) || "Unknown",
      actorRole: row.actorRole,
      action: row.action,
      outcome: row.outcome,
      reason: row.reason,
      consentPurpose: consentPurpose,
    });
  }

  return { items: items, page: query.page, pageSize: query.pageSize, total: total };
}
