import "server-only";
import { RecordType, type SessionUser } from "@/contracts/shared";
import type { ConsentGrant, HealthRecord, LabOrder, Prescription } from "@/generated/prisma/client";
import { writeAudit } from "@/server/audit/write";

// THE security boundary (CONTRACTS §3, Master §4.1).
// Every read or write of patient data calls authorize() first and uses what it returns.
//
// ============================================================================================
// STUB — Phase 0 only. It ALLOWS EVERYTHING, so Vivek can build screens before the real rules
// exist. It already has the final signature and already writes the audit row, so nothing that
// calls it has to change in Phase 3, when the real policy matrix replaces `decide()`.
// ============================================================================================

// What someone is trying to do.
export type Action =
  | "record:read"
  | "record:list"
  | "record:create:self"
  | "record:create:clinical"
  | "file:read"
  | "consent:request"
  | "consent:decide"
  | "consent:list"
  | "labOrder:create"
  | "labOrder:list:lab"
  | "labResult:upload"
  | "prescription:lookup"
  | "prescription:dispense"
  | "patient:lookup"
  | "institution:manage"
  | "staff:verify"
  | "audit:read:self"
  | "audit:read:all";

// What they are trying to do it to.
export type Resource =
  | { kind: "record"; record: Pick<HealthRecord, "id" | "patientId" | "type" | "authorId" | "institutionId"> }
  | { kind: "patientRecords"; patientId: string; types: RecordType[] } // list queries
  | { kind: "consent"; consent: ConsentGrant }
  | { kind: "patient"; patientId: string }
  | { kind: "labOrder"; order: LabOrder }
  | { kind: "prescription"; prescription: Prescription & { patientId: string } }
  | { kind: "none" };

// The answer. A deny is RETURNED, never thrown, so no caller can forget a try/catch.
export type Decision =
  | { allowed: true; consentId?: string; allowedTypes?: RecordType[]; reason: string }
  | {
      allowed: false;
      code: "FORBIDDEN" | "CONSENT_REQUIRED" | "NOT_FOUND" | "STAFF_UNVERIFIED";
      reason: string;
    };

export async function authorize(user: SessionUser, action: Action, resource: Resource): Promise<Decision> {
  const decision = decide(user, action, resource);

  // Audit row FIRST, before the caller runs its query. If the query fails later, the
  // attempt is still on record.
  const about = describeResource(resource);
  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: action,
    resourceType: about.resourceType,
    resourceId: about.resourceId,
    patientId: about.patientId,
    consentId: decision.allowed && decision.consentId ? decision.consentId : null,
    outcome: decision.allowed ? "ALLOWED" : "DENIED",
    reason: decision.reason,
  });

  return decision;
}

// STUB: allow everything and every record type. Phase 3 replaces this function with the policy
// matrix from CONTRACTS §3 (a pure function, so it can be tested cell by cell).
// The parameters are unused for now; they are the ones the real version needs.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function decide(user: SessionUser, action: Action, resource: Resource): Decision {
  return {
    allowed: true,
    allowedTypes: RecordType.options, // all four types
    reason: "STUB",
  };
}

// Pulls out what the audit row needs to know about the resource.
function describeResource(resource: Resource) {
  switch (resource.kind) {
    case "record":
      return { resourceType: "HealthRecord", resourceId: resource.record.id, patientId: resource.record.patientId };
    case "patientRecords":
      return { resourceType: "HealthRecord", resourceId: null, patientId: resource.patientId };
    case "consent":
      return { resourceType: "ConsentGrant", resourceId: resource.consent.id, patientId: resource.consent.patientId };
    case "patient":
      return { resourceType: "Patient", resourceId: resource.patientId, patientId: resource.patientId };
    case "labOrder":
      return { resourceType: "LabOrder", resourceId: resource.order.id, patientId: resource.order.patientId };
    case "prescription":
      return {
        resourceType: "Prescription",
        resourceId: resource.prescription.recordId,
        patientId: resource.prescription.patientId,
      };
    case "none":
      return { resourceType: "None", resourceId: null, patientId: null };
  }
}
