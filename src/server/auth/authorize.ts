import "server-only";
import { RecordType, type SessionUser } from "@/contracts/shared";
import type { ConsentGrant, HealthRecord, LabOrder, Prescription } from "@/generated/prisma/client";
import { writeAudit } from "@/server/audit/write";
import { activeGrant } from "@/server/consent/engine";

// THE security boundary (CONTRACTS §3, Master §4.1).
// Every read or write of patient data calls authorize() first and uses what it returns.
//
// It has two parts:
//   decide()     a PURE function: user + action + resource + consent + time -> allowed or not.
//                No database, so authorize.test.ts can test every cell of the policy matrix.
//   authorize()  the thin wrapper: loads the doctor's active consent, calls decide(), writes the
//                audit row FIRST, then returns the decision.

// ---------- Types (CONTRACTS §3) ----------

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
  | { kind: "patientRecords"; patientId: string; types: RecordType[] } // list queries; [] = all types
  | { kind: "consent"; consent: ConsentGrant }
  | { kind: "patient"; patientId: string }
  | { kind: "labOrder"; order: LabOrder }
  | { kind: "prescription"; prescription: Prescription & { patientId: string } }
  | { kind: "none" };

// A deny is RETURNED, never thrown, so no caller can forget a try/catch.
export type Decision =
  | { allowed: true; consentId?: string; allowedTypes?: RecordType[]; reason: string }
  | {
      allowed: false;
      code: "FORBIDDEN" | "CONSENT_REQUIRED" | "NOT_FOUND" | "STAFF_UNVERIFIED";
      reason: string;
    };

// The parts of a consent that decide() looks at.
export type Grant = Pick<ConsentGrant, "id" | "patientId" | "doctorId" | "status" | "scopes" | "validFrom" | "validTo">;

// Reasons written to the audit log:
//   OWNER             a patient acting on their own data
//   ROLE              the role is enough for this action (e.g. a doctor looking up a patient)
//   AUTHOR            a doctor reading a record they wrote (D5)
//   CONSENT           allowed by an active consent
//   NO_ACTIVE_CONSENT doctor, but no active consent (none, expired, revoked or not started)
//   SCOPE_EXCLUDED    doctor with consent, but not for this record type
//   NOT_OWNER         right role, but not their patient / institution / record
//   WRONG_ROLE        this role can never do this action
//   UNVERIFIED        staff account not verified by an admin
//   BAD_RESOURCE      the caller passed the wrong kind of resource (a bug in the caller)

// ---------- Small helpers for building decisions ----------

function allow(reason: string, extra?: { consentId?: string; allowedTypes?: RecordType[] }): Decision {
  return { allowed: true, reason: reason, consentId: extra?.consentId, allowedTypes: extra?.allowedTypes };
}

function deny(code: "FORBIDDEN" | "CONSENT_REQUIRED" | "NOT_FOUND" | "STAFF_UNVERIFIED", reason: string): Decision {
  return { allowed: false, code: code, reason: reason };
}

// Is this consent usable by this doctor, for this patient, at this moment? (D9, TRAPS §6)
// The boundary is exact: at validTo itself the consent has ALREADY expired.
export function isGrantActive(grant: Grant, doctorId: string, patientId: string, now: Date): boolean {
  if (grant.status !== "GRANTED") return false;
  if (grant.doctorId !== doctorId) return false;
  if (grant.patientId !== patientId) return false;
  if (!grant.validFrom || !grant.validTo) return false;
  if (now < grant.validFrom) return false; // not started yet
  if (now >= grant.validTo) return false; // expired
  return true;
}

// ---------- The policy matrix ----------

export function decide(user: SessionUser, action: Action, resource: Resource, grant: Grant | null, now: Date): Decision {
  // Unverified staff can do nothing at all. (Patients are always verified.)
  if (!user.verified) {
    return deny("STAFF_UNVERIFIED", "UNVERIFIED");
  }

  switch (action) {
    case "record:read":
    case "file:read":
      return decideRecordRead(user, action, resource, grant, now);
    case "record:list":
      return decideRecordList(user, resource, grant, now);
    case "record:create:self":
      return decideOwnPatientData(user, resource);
    case "record:create:clinical":
    case "labOrder:create":
      return decideClinicalWrite(user, resource, grant, now);
    case "consent:request":
    case "patient:lookup":
      return onlyRole(user, "DOCTOR");
    case "consent:decide":
      return decideConsentDecide(user, resource);
    case "consent:list":
      return decideConsentList(user, resource);
    case "labOrder:list:lab":
    case "labResult:upload":
      return decideLabOrder(user, action, resource);
    case "prescription:lookup":
    case "prescription:dispense":
      return decidePharmacy(user, resource);
    case "institution:manage":
    case "staff:verify":
    case "audit:read:all":
      return onlyRole(user, "ADMIN");
    case "audit:read:self":
      return decideOwnPatientData(user, resource);
  }
}

// One role may do it; everyone else gets 403 FORBIDDEN.
function onlyRole(user: SessionUser, role: SessionUser["role"]): Decision {
  if (user.role === role) {
    return allow("ROLE");
  }
  return deny("FORBIDDEN", "WRONG_ROLE");
}

// Reading one record (or its file).
// Patient: own only. Doctor: author, or consent that covers the record's type.
// Lab: only files of records it uploaded itself (file:read). Everyone else: 404 (D10).
function decideRecordRead(user: SessionUser, action: Action, resource: Resource, grant: Grant | null, now: Date): Decision {
  if (resource.kind !== "record") {
    return deny("FORBIDDEN", "BAD_RESOURCE");
  }
  const record = resource.record;

  if (user.role === "PATIENT") {
    if (record.patientId === user.id) return allow("OWNER");
    return deny("NOT_FOUND", "NOT_OWNER");
  }

  if (user.role === "DOCTOR") {
    if (record.authorId === user.id) {
      return allow("AUTHOR"); // D5: a doctor can always read what they wrote
    }
    if (grant === null || !isGrantActive(grant, user.id, record.patientId, now)) {
      return deny("CONSENT_REQUIRED", "NO_ACTIVE_CONSENT");
    }
    if (!grant.scopes.includes(record.type)) {
      return deny("CONSENT_REQUIRED", "SCOPE_EXCLUDED");
    }
    return allow("CONSENT", { consentId: grant.id });
  }

  if (user.role === "LAB" && action === "file:read") {
    if (record.authorId === user.id) return allow("AUTHOR"); // its own uploads
    return deny("NOT_FOUND", "NOT_OWNER");
  }

  // Pharmacy, admin, and lab reading records: they learn nothing, not even that it exists.
  return deny("NOT_FOUND", "WRONG_ROLE");
}

// Listing a patient's records. The decision says WHICH types may be queried (allowedTypes);
// the data function must use exactly that list in its query (TRAPS §5).
// `types: []` in the request means "all types".
function decideRecordList(user: SessionUser, resource: Resource, grant: Grant | null, now: Date): Decision {
  if (resource.kind !== "patientRecords") {
    return deny("FORBIDDEN", "BAD_RESOURCE");
  }

  let requested: RecordType[] = resource.types;
  if (requested.length === 0) {
    requested = RecordType.options;
  }

  if (user.role === "PATIENT") {
    if (resource.patientId === user.id) return allow("OWNER", { allowedTypes: requested });
    return deny("NOT_FOUND", "NOT_OWNER");
  }

  if (user.role === "DOCTOR") {
    // A list always needs consent, even if the doctor wrote some of the records. Otherwise, after
    // a revoke, the viewer would show a partial list instead of "Consent required" (demo step 10).
    // Single records the doctor wrote stay readable through record:read (D5).
    if (grant === null || !isGrantActive(grant, user.id, resource.patientId, now)) {
      return deny("CONSENT_REQUIRED", "NO_ACTIVE_CONSENT");
    }
    // Only the types that were asked for AND are in the consent.
    const scopes = grant.scopes;
    const allowedTypes = requested.filter((type) => scopes.includes(type));
    return allow("CONSENT", { consentId: grant.id, allowedTypes: allowedTypes });
  }

  return deny("NOT_FOUND", "WRONG_ROLE");
}

// Things a patient does to their own data: upload a document (record:create:self),
// read who viewed their records (audit:read:self). Resource: { kind: "patient", patientId }.
function decideOwnPatientData(user: SessionUser, resource: Resource): Decision {
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

// Writing clinical records and lab orders: a doctor with an active consent of ANY scope
// for this patient (they're treating them).
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
  return allow("CONSENT", { consentId: grant.id });
}

// Approve / deny / revoke: only the patient the consent belongs to.
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

// Listing consents. Patient: their own ({ kind: "patient", patientId: self }).
// Doctor: their own requests; the data function filters by doctorId, so the resource can be any patient.
function decideConsentList(user: SessionUser, resource: Resource): Decision {
  if (user.role === "PATIENT") {
    if (resource.kind === "patient" && resource.patientId === user.id) return allow("OWNER");
    return deny("NOT_FOUND", "NOT_OWNER");
  }
  if (user.role === "DOCTOR") {
    return allow("ROLE");
  }
  return deny("FORBIDDEN", "WRONG_ROLE");
}

// Lab staff: only orders sent to an institution they work at.
// labOrder:list:lab may pass { kind: "none" } (the data function filters by user.institutionIds);
// labResult:upload must pass the order.
function decideLabOrder(user: SessionUser, action: Action, resource: Resource): Decision {
  if (user.role !== "LAB") {
    return deny("FORBIDDEN", "WRONG_ROLE");
  }
  if (resource.kind === "none" && action === "labOrder:list:lab") {
    return allow("ROLE");
  }
  if (resource.kind !== "labOrder") {
    return deny("FORBIDDEN", "BAD_RESOURCE");
  }
  // includes(), not [0]: staff can work at more than one institution.
  if (user.institutionIds.includes(resource.order.labInstitutionId)) {
    return allow("ROLE");
  }
  return deny("NOT_FOUND", "NOT_OWNER");
}

// Pharmacy: one prescription, found by its share code. Unknown or expired codes are handled by the
// data function (also NOT_FOUND). Anyone else gets 404, the same as a code that doesn't exist (TRAPS §11).
function decidePharmacy(user: SessionUser, resource: Resource): Decision {
  if (resource.kind !== "prescription") {
    return deny("FORBIDDEN", "BAD_RESOURCE");
  }
  if (user.role !== "PHARMACY") {
    return deny("NOT_FOUND", "WRONG_ROLE");
  }
  return allow("ROLE");
}

// ---------- The wrapper every data function calls ----------

export async function authorize(user: SessionUser, action: Action, resource: Resource): Promise<Decision> {
  const now = new Date(); // server time; Date objects are UTC-correct (TRAPS §6)
  const about = describeResource(resource);

  // Only doctors use consent, and only when a patient is involved.
  let grant: Grant | null = null;
  if (user.role === "DOCTOR" && user.verified && about.patientId) {
    grant = await activeGrant(about.patientId, user.id, now);
  }

  const decision = decide(user, action, resource, grant, now);

  // Audit row FIRST, before the caller runs its query. If the query fails later, the attempt is
  // still on record. Denied attempts are logged too (demo steps 9 and 11).
  let consentId: string | null = null;
  if (decision.allowed && decision.consentId) {
    consentId = decision.consentId;
  }
  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: action,
    resourceType: about.resourceType,
    resourceId: about.resourceId,
    patientId: about.patientId,
    consentId: consentId,
    outcome: decision.allowed ? "ALLOWED" : "DENIED",
    reason: decision.reason,
  });

  return decision;
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
