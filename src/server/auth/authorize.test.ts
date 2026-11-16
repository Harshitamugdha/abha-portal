import { describe, expect, it } from "vitest";
import type { Role, SessionUser } from "@/contracts/shared";
import type { ConsentGrant, LabOrder, Prescription } from "@/generated/prisma/client";
import { decide, type Action, type Decision, type Grant, type Resource } from "./authorize";

// Tests for the policy matrix in CONTRACTS §3. decide() is pure, so no database is needed.

// ---------- People ----------

const asha: SessionUser = { id: "user-asha", role: "PATIENT", name: "Asha", verified: true, institutionIds: [], patientId: "user-asha" };
const kavya: SessionUser = { id: "user-kavya", role: "DOCTOR", name: "Kavya", verified: true, institutionIds: ["inst-citygen"] };
const pharmacy: SessionUser = { id: "user-pharmacy", role: "PHARMACY", name: "Pharmacy", verified: true, institutionIds: ["inst-greencross"] };
const lab: SessionUser = { id: "user-lab", role: "LAB", name: "Lab", verified: true, institutionIds: ["inst-precision"] };
const admin: SessionUser = { id: "user-admin", role: "ADMIN", name: "Admin", verified: true, institutionIds: [] };

const userForRole: Record<Role, SessionUser> = { PATIENT: asha, DOCTOR: kavya, PHARMACY: pharmacy, LAB: lab, ADMIN: admin };

// ---------- Time and consent ----------

const NOW = new Date("2026-11-16T10:00:00Z");
const HOUR = 60 * 60 * 1000;

function grant(changes: Partial<Grant> = {}): Grant {
  return {
    id: "consent-1",
    patientId: "user-asha",
    doctorId: "user-kavya",
    status: "GRANTED",
    scopes: ["PRESCRIPTION", "LAB_REPORT"], // demo step 3: prescriptions + lab reports
    validFrom: new Date(NOW.getTime() - 24 * HOUR),
    validTo: new Date(NOW.getTime() + 6 * 24 * HOUR),
    ...changes,
  };
}

// ---------- Resources ----------

const ashaLabReport: Resource = {
  kind: "record",
  record: { id: "rec-asha-cbc", patientId: "user-asha", type: "LAB_REPORT", authorId: null, institutionId: "inst-citygen" },
};
const ashaDocument: Resource = {
  kind: "record",
  record: { id: "rec-asha-discharge", patientId: "user-asha", type: "DOCUMENT", authorId: null, institutionId: "inst-sunrise" },
};
const ashaLabReportUploadedByLab: Resource = {
  kind: "record",
  record: { id: "rec-asha-new", patientId: "user-asha", type: "LAB_REPORT", authorId: "user-lab", institutionId: "inst-precision" },
};
const ashaAllRecords: Resource = { kind: "patientRecords", patientId: "user-asha", types: [] };
const ashaPatient: Resource = { kind: "patient", patientId: "user-asha" };
const nothing: Resource = { kind: "none" };

const ashaConsent: Resource = { kind: "consent", consent: { ...grant(), purpose: "Follow-up", institutionId: "inst-citygen", requestedAt: NOW, decidedAt: NOW } as ConsentGrant };

function labOrderAt(labInstitutionId: string): Resource {
  const order: LabOrder = {
    id: "laborder-asha-1",
    patientId: "user-asha",
    orderedById: "user-arjun",
    labInstitutionId: labInstitutionId,
    tests: ["HbA1c"],
    status: "PENDING",
    resultRecordId: null,
    createdAt: NOW,
  };
  return { kind: "labOrder", order: order };
}

const asha7k: Resource = {
  kind: "prescription",
  prescription: {
    recordId: "rec-asha-rx-bp",
    patientId: "user-asha",
    items: [],
    shareCode: "ASHA7K",
    dispensedAt: null,
    dispensedBy: null,
    expiresAt: new Date(NOW.getTime() + 27 * 24 * HOUR),
  } as Prescription & { patientId: string },
};

// ---------- Helpers ----------

// "ALLOW" or the error code, so the table below reads like the matrix in CONTRACTS §3.
function outcome(decision: Decision): string {
  if (decision.allowed) return "ALLOW";
  return decision.code;
}

// Doctors get their active consent; nobody else has one (authorize() only loads it for doctors).
function check(user: SessionUser, action: Action, resource: Resource): Decision {
  let doctorGrant: Grant | null = null;
  if (user.role === "DOCTOR") {
    doctorGrant = grant();
  }
  return decide(user, action, resource, doctorGrant, NOW);
}

// ---------- The matrix: one row per action, one column per role ----------

const NF = "NOT_FOUND";
const FB = "FORBIDDEN";

type Row = { action: Action; resource: Resource; PATIENT: string; DOCTOR: string; PHARMACY: string; LAB: string; ADMIN: string };

const matrix: Row[] = [
  { action: "record:read", resource: ashaLabReport, PATIENT: "ALLOW", DOCTOR: "ALLOW", PHARMACY: NF, LAB: NF, ADMIN: NF },
  { action: "record:list", resource: ashaAllRecords, PATIENT: "ALLOW", DOCTOR: "ALLOW", PHARMACY: NF, LAB: NF, ADMIN: NF },
  { action: "record:create:self", resource: ashaPatient, PATIENT: "ALLOW", DOCTOR: FB, PHARMACY: FB, LAB: FB, ADMIN: FB },
  { action: "record:create:clinical", resource: ashaPatient, PATIENT: FB, DOCTOR: "ALLOW", PHARMACY: FB, LAB: FB, ADMIN: FB },
  { action: "file:read", resource: ashaLabReportUploadedByLab, PATIENT: "ALLOW", DOCTOR: "ALLOW", PHARMACY: NF, LAB: "ALLOW", ADMIN: NF },
  { action: "consent:request", resource: ashaPatient, PATIENT: FB, DOCTOR: "ALLOW", PHARMACY: FB, LAB: FB, ADMIN: FB },
  { action: "consent:decide", resource: ashaConsent, PATIENT: "ALLOW", DOCTOR: FB, PHARMACY: FB, LAB: FB, ADMIN: FB },
  { action: "consent:list", resource: ashaPatient, PATIENT: "ALLOW", DOCTOR: "ALLOW", PHARMACY: FB, LAB: FB, ADMIN: FB },
  { action: "patient:lookup", resource: ashaPatient, PATIENT: FB, DOCTOR: "ALLOW", PHARMACY: FB, LAB: FB, ADMIN: FB },
  { action: "labOrder:create", resource: ashaPatient, PATIENT: FB, DOCTOR: "ALLOW", PHARMACY: FB, LAB: FB, ADMIN: FB },
  { action: "labOrder:list:lab", resource: nothing, PATIENT: FB, DOCTOR: FB, PHARMACY: FB, LAB: "ALLOW", ADMIN: FB },
  { action: "labResult:upload", resource: labOrderAt("inst-precision"), PATIENT: FB, DOCTOR: FB, PHARMACY: FB, LAB: "ALLOW", ADMIN: FB },
  { action: "prescription:lookup", resource: asha7k, PATIENT: NF, DOCTOR: NF, PHARMACY: "ALLOW", LAB: NF, ADMIN: NF },
  { action: "prescription:dispense", resource: asha7k, PATIENT: NF, DOCTOR: NF, PHARMACY: "ALLOW", LAB: NF, ADMIN: NF },
  { action: "institution:manage", resource: nothing, PATIENT: FB, DOCTOR: FB, PHARMACY: FB, LAB: FB, ADMIN: "ALLOW" },
  { action: "staff:verify", resource: nothing, PATIENT: FB, DOCTOR: FB, PHARMACY: FB, LAB: FB, ADMIN: "ALLOW" },
  { action: "audit:read:self", resource: ashaPatient, PATIENT: "ALLOW", DOCTOR: FB, PHARMACY: FB, LAB: FB, ADMIN: FB },
  { action: "audit:read:all", resource: nothing, PATIENT: FB, DOCTOR: FB, PHARMACY: FB, LAB: FB, ADMIN: "ALLOW" },
];

const roles: Role[] = ["PATIENT", "DOCTOR", "PHARMACY", "LAB", "ADMIN"];

describe("policy matrix (CONTRACTS §3): every cell", () => {
  for (const row of matrix) {
    for (const role of roles) {
      it(`${row.action} as ${role} -> ${row[role]}`, () => {
        expect(outcome(check(userForRole[role], row.action, row.resource))).toBe(row[role]);
      });
    }
  }
});

// ---------- Consent edge cases (the bugs that look like working features) ----------

describe("doctor without a usable consent", () => {
  function doctorWith(g: Grant | null, action: Action = "record:read", resource: Resource = ashaLabReport) {
    return decide(kavya, action, resource, g, NOW);
  }

  it("no consent at all -> CONSENT_REQUIRED, never an empty list (demo step 2, TRAPS §4)", () => {
    const d = doctorWith(null, "record:list", ashaAllRecords);
    expect(d).toEqual({ allowed: false, code: "CONSENT_REQUIRED", reason: "NO_ACTIVE_CONSENT" });
  });

  it("consent that ended 1 second ago is refused", () => {
    const d = doctorWith(grant({ validTo: new Date(NOW.getTime() - 1000) }));
    expect(outcome(d)).toBe("CONSENT_REQUIRED");
  });

  it("consent ending EXACTLY now is already expired (now < validTo, not <=)", () => {
    expect(outcome(doctorWith(grant({ validTo: NOW })))).toBe("CONSENT_REQUIRED");
  });

  it("consent ending 1 second from now still works", () => {
    expect(outcome(doctorWith(grant({ validTo: new Date(NOW.getTime() + 1000) })))).toBe("ALLOW");
  });

  it("consent that starts in the future is refused", () => {
    expect(outcome(doctorWith(grant({ validFrom: new Date(NOW.getTime() + HOUR) })))).toBe("CONSENT_REQUIRED");
  });

  it("revoked consent is refused (demo step 10)", () => {
    expect(outcome(doctorWith(grant({ status: "REVOKED" })))).toBe("CONSENT_REQUIRED");
  });

  it("consent still waiting for the patient is refused", () => {
    expect(outcome(doctorWith(grant({ status: "REQUESTED", validFrom: null, validTo: null })))).toBe("CONSENT_REQUIRED");
  });

  it("denied consent is refused", () => {
    expect(outcome(doctorWith(grant({ status: "DENIED" })))).toBe("CONSENT_REQUIRED");
  });

  it("consent given to a different doctor doesn't count", () => {
    expect(outcome(doctorWith(grant({ doctorId: "user-arjun" })))).toBe("CONSENT_REQUIRED");
  });

  it("consent for a different patient doesn't count", () => {
    expect(outcome(doctorWith(grant({ patientId: "user-rohan" })))).toBe("CONSENT_REQUIRED");
  });

  it("Meera's seeded consent (ended yesterday) is refused (D9)", () => {
    const meeraGrant = grant({
      patientId: "user-meera",
      scopes: ["ENCOUNTER", "PRESCRIPTION", "LAB_REPORT", "DOCUMENT"],
      validFrom: new Date(NOW.getTime() - 8 * 24 * HOUR),
      validTo: new Date(NOW.getTime() - 24 * HOUR),
    });
    const meeraRecords: Resource = { kind: "patientRecords", patientId: "user-meera", types: [] };
    expect(outcome(decide(kavya, "record:list", meeraRecords, meeraGrant, NOW))).toBe("CONSENT_REQUIRED");
  });

  it("no consent -> can't write a prescription or lab order either", () => {
    expect(outcome(doctorWith(null, "record:create:clinical", ashaPatient))).toBe("CONSENT_REQUIRED");
    expect(outcome(doctorWith(null, "labOrder:create", ashaPatient))).toBe("CONSENT_REQUIRED");
  });
});

describe("scopes (demo step 5)", () => {
  it("a record type outside the consent -> CONSENT_REQUIRED / SCOPE_EXCLUDED", () => {
    const d = decide(kavya, "record:read", ashaDocument, grant(), NOW);
    expect(d).toEqual({ allowed: false, code: "CONSENT_REQUIRED", reason: "SCOPE_EXCLUDED" });
  });

  it("a list is limited to the consented types (documents left out)", () => {
    const d = decide(kavya, "record:list", ashaAllRecords, grant(), NOW);
    expect(d).toEqual({ allowed: true, reason: "CONSENT", consentId: "consent-1", allowedTypes: ["PRESCRIPTION", "LAB_REPORT"] });
  });

  it("asking only for an excluded type gives an empty allowed list, not extra types", () => {
    const onlyDocuments: Resource = { kind: "patientRecords", patientId: "user-asha", types: ["DOCUMENT"] };
    const d = decide(kavya, "record:list", onlyDocuments, grant(), NOW);
    expect(d.allowed && d.allowedTypes).toEqual([]);
  });

  it("a patient listing their own records gets every type", () => {
    const d = decide(asha, "record:list", ashaAllRecords, null, NOW);
    expect(d.allowed && d.allowedTypes).toEqual(["ENCOUNTER", "PRESCRIPTION", "LAB_REPORT", "DOCUMENT"]);
  });

  it("an allowed read names the consent it used (for the audit log)", () => {
    const d = decide(kavya, "record:read", ashaLabReport, grant(), NOW);
    expect(d).toEqual({ allowed: true, reason: "CONSENT", consentId: "consent-1", allowedTypes: undefined });
  });
});

describe("author access (D5)", () => {
  const writtenByKavya: Resource = {
    kind: "record",
    record: { id: "rec-new-rx", patientId: "user-asha", type: "PRESCRIPTION", authorId: "user-kavya", institutionId: "inst-citygen" },
  };

  it("a doctor can read a record they wrote with no consent at all", () => {
    expect(decide(kavya, "record:read", writtenByKavya, null, NOW)).toMatchObject({ allowed: true, reason: "AUTHOR" });
  });

  it("but listing the patient's records still needs consent (so step 10 shows 'Consent required')", () => {
    expect(outcome(decide(kavya, "record:list", ashaAllRecords, null, NOW))).toBe("CONSENT_REQUIRED");
  });
});

describe("other people's things", () => {
  it("a patient can't read another patient's record (404, not 403)", () => {
    const rohan: SessionUser = { ...asha, id: "user-rohan", patientId: "user-rohan" };
    expect(decide(rohan, "record:read", ashaLabReport, null, NOW)).toMatchObject({ allowed: false, code: "NOT_FOUND" });
  });

  it("a patient can't approve someone else's consent", () => {
    const rohan: SessionUser = { ...asha, id: "user-rohan", patientId: "user-rohan" };
    expect(outcome(decide(rohan, "consent:decide", ashaConsent, null, NOW))).toBe("NOT_FOUND");
  });

  it("lab staff asking for another lab's order -> NOT_FOUND", () => {
    expect(outcome(decide(lab, "labResult:upload", labOrderAt("inst-other-lab"), null, NOW))).toBe("NOT_FOUND");
  });

  it("lab staff at two institutions can use orders from either (includes, not [0])", () => {
    const twoLabs: SessionUser = { ...lab, institutionIds: ["inst-other-lab", "inst-precision"] };
    expect(outcome(decide(twoLabs, "labResult:upload", labOrderAt("inst-precision"), null, NOW))).toBe("ALLOW");
  });

  it("lab staff can't open files they didn't upload", () => {
    expect(outcome(decide(lab, "file:read", ashaLabReport, null, NOW))).toBe("NOT_FOUND");
  });

  it("admin opening a record gets 404 (demo step 11)", () => {
    expect(decide(admin, "record:read", ashaLabReport, null, NOW)).toMatchObject({ allowed: false, code: "NOT_FOUND" });
  });
});

describe("unverified staff", () => {
  const neel: SessionUser = { id: "user-neel", role: "DOCTOR", name: "Neel", verified: false, institutionIds: ["inst-lakeside"] };

  it("an unverified doctor can't even look up a patient", () => {
    expect(decide(neel, "patient:lookup", ashaPatient, null, NOW)).toEqual({
      allowed: false,
      code: "STAFF_UNVERIFIED",
      reason: "UNVERIFIED",
    });
  });

  it("an unverified doctor is refused even with a valid consent", () => {
    const neelGrant = grant({ doctorId: "user-neel" });
    expect(outcome(decide(neel, "record:read", ashaLabReport, neelGrant, NOW))).toBe("STAFF_UNVERIFIED");
  });
});

describe("caller mistakes fail closed", () => {
  it("the wrong kind of resource is denied, not allowed", () => {
    expect(decide(kavya, "record:read", ashaPatient, grant(), NOW)).toEqual({
      allowed: false,
      code: "FORBIDDEN",
      reason: "BAD_RESOURCE",
    });
  });
});
