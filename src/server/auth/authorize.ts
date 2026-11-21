import "server-only";
import { RecordType, type SessionUser } from "@/contracts/shared";
import type { ConsentGrant, HealthRecord, LabOrder, Prescription } from "@/generated/prisma/client";
import { writeAudit } from "@/server/audit/write";
import { activeGrant } from "@/server/consent/engine";

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

export type Resource =
  | { kind: "record"; record: Pick<HealthRecord, "id" | "patientId" | "type" | "authorId" | "institutionId"> }
  | { kind: "patientRecords"; patientId: string; types: RecordType[] }
  | { kind: "consent"; consent: ConsentGrant }
  | { kind: "patient"; patientId: string }
  | { kind: "labOrder"; order: LabOrder }
  | { kind: "prescription"; prescription: Prescription & { patientId: string } }
  | { kind: "none" };

type DenyCode = "FORBIDDEN" | "CONSENT_REQUIRED" | "NOT_FOUND" | "STAFF_UNVERIFIED";

export type Decision =
  | { allowed: true; reason: string; consentId?: string; allowedTypes?: RecordType[] }
  | { allowed: false; code: DenyCode; reason: string };

export type Grant = Pick<ConsentGrant, "id" | "patientId" | "doctorId" | "status" | "scopes" | "validFrom" | "validTo">;

function allow(reason: string, consentId?: string, allowedTypes?: RecordType[]): Decision {
  return { allowed: true, reason: reason, consentId: consentId, allowedTypes: allowedTypes };
}

function deny(code: DenyCode, reason: string): Decision {
  return { allowed: false, code: code, reason: reason };
}

export function isGrantActive(grant: Grant, doctorId: string, patientId: string, now: Date): boolean {
  if (grant.status !== "GRANTED") return false;
  if (grant.doctorId !== doctorId) return false;
  if (grant.patientId !== patientId) return false;
  if (!grant.validFrom || !grant.validTo) return false;
  if (now < grant.validFrom) return false;
  if (now >= grant.validTo) return false;
  return true;
}

export function decide(user: SessionUser, action: Action, resource: Resource, grant: Grant | null, now: Date): Decision {
  if (!user.verified) {
    return deny("STAFF_UNVERIFIED", "UNVERIFIED");
  }

  if (action === "record:read" || action === "file:read") {
    return decideRecordRead(user, action, resource, grant, now);
  }
  if (action === "record:list") {
    return decideRecordList(user, resource, grant, now);
  }
  if (action === "record:create:self" || action === "audit:read:self") {
    return decidePatientOwnData(user, resource);
  }
  if (action === "record:create:clinical" || action === "labOrder:create") {
    return decideClinicalWrite(user, resource, grant, now);
  }
  if (action === "consent:request" || action === "patient:lookup") {
    return onlyRole(user, "DOCTOR");
  }
  if (action === "consent:decide") {
    return decideConsentDecide(user, resource);
  }
  if (action === "consent:list") {
    return decideConsentList(user, resource);
  }
  if (action === "labOrder:list:lab" || action === "labResult:upload") {
    return decideLabOrder(user, action, resource);
  }
  if (action === "prescription:lookup" || action === "prescription:dispense") {
    return decidePharmacy(user, resource);
  }
  if (action === "institution:manage" || action === "staff:verify" || action === "audit:read:all") {
    return onlyRole(user, "ADMIN");
  }
  return deny("FORBIDDEN", "WRONG_ROLE");
}

function onlyRole(user: SessionUser, role: SessionUser["role"]): Decision {
  if (user.role === role) {
    return allow("ROLE");
  }
  return deny("FORBIDDEN", "WRONG_ROLE");
}

function decideRecordRead(user: SessionUser, action: Action, resource: Resource, grant: Grant | null, now: Date): Decision {
  if (resource.kind !== "record") {
    return deny("FORBIDDEN", "BAD_RESOURCE");
  }
  const record = resource.record;

  if (user.role === "PATIENT") {
    if (record.patientId === user.id) {
      return allow("OWNER");
    }
    return deny("NOT_FOUND", "NOT_OWNER");
  }

  if (user.role === "DOCTOR") {
    if (record.authorId === user.id) {
      return allow("AUTHOR");
    }
    if (grant === null || !isGrantActive(grant, user.id, record.patientId, now)) {
      return deny("CONSENT_REQUIRED", "NO_ACTIVE_CONSENT");
    }
    if (!grant.scopes.includes(record.type)) {
      return deny("CONSENT_REQUIRED", "SCOPE_EXCLUDED");
    }
    return allow("CONSENT", grant.id);
  }

  if (user.role === "LAB" && action === "file:read") {
    if (record.authorId === user.id) {
      return allow("AUTHOR");
    }
    return deny("NOT_FOUND", "NOT_OWNER");
  }

  return deny("NOT_FOUND", "WRONG_ROLE");
}

function decideRecordList(user: SessionUser, resource: Resource, grant: Grant | null, now: Date): Decision {
  if (resource.kind !== "patientRecords") {
    return deny("FORBIDDEN", "BAD_RESOURCE");
  }

  let requested = resource.types;
  if (requested.length === 0) {
    requested = RecordType.options;
  }

  if (user.role === "PATIENT") {
    if (resource.patientId === user.id) {
      return allow("OWNER", undefined, requested);
    }
    return deny("NOT_FOUND", "NOT_OWNER");
  }

  if (user.role === "DOCTOR") {
    if (grant === null || !isGrantActive(grant, user.id, resource.patientId, now)) {
      return deny("CONSENT_REQUIRED", "NO_ACTIVE_CONSENT");
    }
    const allowedTypes: RecordType[] = [];
    for (const type of requested) {
      if (grant.scopes.includes(type)) {
        allowedTypes.push(type);
      }
    }
    return allow("CONSENT", grant.id, allowedTypes);
  }

  return deny("NOT_FOUND", "WRONG_ROLE");
}

function decidePatientOwnData(user: SessionUser, resource: Resource): Decision {
  if (resource.kind !== "patient") {
    return deny("FORBIDDEN", "BAD_RESOURCE");
  }
  if (user.role !== "PATIENT") {
    return deny("FORBIDDEN", "WRONG_ROLE");
  }
  if (resource.patientId !== user.id) {
    return deny("NOT_FOUND", "NOT_OWNER");
  }
  return allow("OWNER");
}

function decideClinicalWrite(user: SessionUser, resource: Resource, grant: Grant | null, now: Date): Decision {
  if (resource.kind !== "patient") {
    return deny("FORBIDDEN", "BAD_RESOURCE");
  }
  if (user.role !== "DOCTOR") {
    return deny("FORBIDDEN", "WRONG_ROLE");
  }
  if (grant === null || !isGrantActive(grant, user.id, resource.patientId, now)) {
    return deny("CONSENT_REQUIRED", "NO_ACTIVE_CONSENT");
  }
  return allow("CONSENT", grant.id);
}

function decideConsentDecide(user: SessionUser, resource: Resource): Decision {
  if (resource.kind !== "consent") {
    return deny("FORBIDDEN", "BAD_RESOURCE");
  }
  if (user.role !== "PATIENT") {
    return deny("FORBIDDEN", "WRONG_ROLE");
  }
  if (resource.consent.patientId !== user.id) {
    return deny("NOT_FOUND", "NOT_OWNER");
  }
  return allow("OWNER");
}

function decideConsentList(user: SessionUser, resource: Resource): Decision {
  if (user.role === "PATIENT") {
    if (resource.kind === "patient" && resource.patientId === user.id) {
      return allow("OWNER");
    }
    return deny("NOT_FOUND", "NOT_OWNER");
  }
  if (user.role === "DOCTOR") {
    return allow("ROLE");
  }
  return deny("FORBIDDEN", "WRONG_ROLE");
}

function decideLabOrder(user: SessionUser, action: Action, resource: Resource): Decision {
  if (user.role !== "LAB") {
    return deny("FORBIDDEN", "WRONG_ROLE");
  }
  if (action === "labOrder:list:lab" && resource.kind === "none") {
    return allow("ROLE");
  }
  if (resource.kind !== "labOrder") {
    return deny("FORBIDDEN", "BAD_RESOURCE");
  }
  if (user.institutionIds.includes(resource.order.labInstitutionId)) {
    return allow("ROLE");
  }
  return deny("NOT_FOUND", "NOT_OWNER");
}

function decidePharmacy(user: SessionUser, resource: Resource): Decision {
  if (resource.kind !== "prescription") {
    return deny("FORBIDDEN", "BAD_RESOURCE");
  }
  if (user.role !== "PHARMACY") {
    return deny("NOT_FOUND", "WRONG_ROLE");
  }
  return allow("ROLE");
}

export async function authorize(user: SessionUser, action: Action, resource: Resource): Promise<Decision> {
  const now = new Date();
  const about = describeResource(resource);

  let grant = null;
  if (user.role === "DOCTOR" && user.verified && about.patientId) {
    grant = await activeGrant(about.patientId, user.id, now);
  }

  const decision = decide(user, action, resource, grant, now);

  let consentId = null;
  let outcome: "ALLOWED" | "DENIED" = "DENIED";
  if (decision.allowed) {
    outcome = "ALLOWED";
    consentId = decision.consentId || null;
  }

  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: action,
    resourceType: about.resourceType,
    resourceId: about.resourceId,
    patientId: about.patientId,
    consentId: consentId,
    outcome: outcome,
    reason: decision.reason,
  });

  return decision;
}

type ResourceInfo = {
  resourceType: string;
  resourceId: string | null;
  patientId: string | null;
};

function describeResource(resource: Resource): ResourceInfo {
  if (resource.kind === "record") {
    return { resourceType: "HealthRecord", resourceId: resource.record.id, patientId: resource.record.patientId };
  }
  if (resource.kind === "patientRecords") {
    return { resourceType: "HealthRecord", resourceId: null, patientId: resource.patientId };
  }
  if (resource.kind === "consent") {
    return { resourceType: "ConsentGrant", resourceId: resource.consent.id, patientId: resource.consent.patientId };
  }
  if (resource.kind === "patient") {
    return { resourceType: "Patient", resourceId: resource.patientId, patientId: resource.patientId };
  }
  if (resource.kind === "labOrder") {
    return { resourceType: "LabOrder", resourceId: resource.order.id, patientId: resource.order.patientId };
  }
  if (resource.kind === "prescription") {
    return { resourceType: "Prescription", resourceId: resource.prescription.recordId, patientId: resource.prescription.patientId };
  }
  return { resourceType: "None", resourceId: null, patientId: null };
}
