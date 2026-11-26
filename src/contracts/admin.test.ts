import { describe, expect, it } from "vitest";
import {
  AuditEntryDTO,
  AuditQuery,
  InstitutionCreate,
  InstitutionDTO,
  InstitutionUpdate,
  ListStaffQuery,
  StaffDTO,
  VerifyStaffInput,
} from "./admin";

describe("StaffDTO", () => {
  it("accepts a valid staff member", () => {
    const doctor = {
      id: "user-neel",
      role: "DOCTOR",
      name: "Dr Neel Sharma",
      email: "neel@citygen.test",
      hprId: "HPR-9988-7766",
      verified: false,
      createdAt: "2026-11-01T10:00:00.000Z",
      institutionNames: ["City General Hospital"],
      institutionIds: ["inst-citygen"],
    };
    expect(StaffDTO.safeParse(doctor).success).toBe(true);
  });

  it("rejects staff with invalid email", () => {
    const bad = {
      id: "user-neel",
      role: "DOCTOR",
      name: "Dr Neel Sharma",
      email: "not-an-email",
      verified: false,
      createdAt: "2026-11-01T10:00:00.000Z",
      institutionIds: ["inst-citygen"],
    };
    expect(StaffDTO.safeParse(bad).success).toBe(false);
  });
});

describe("ListStaffQuery", () => {
  it("correctly parses verified false from string 'false' without coercing to true", () => {
    const parsed = ListStaffQuery.parse({ verified: "false" });
    expect(parsed.verified).toBe(false);
  });

  it("correctly parses verified true from string 'true'", () => {
    const parsed = ListStaffQuery.parse({ verified: "true" });
    expect(parsed.verified).toBe(true);
  });

  it("accepts boolean false directly", () => {
    const parsed = ListStaffQuery.parse({ verified: false });
    expect(parsed.verified).toBe(false);
  });
});

describe("VerifyStaffInput", () => {
  it("accepts valid userId", () => {
    expect(VerifyStaffInput.safeParse({ userId: "user-neel" }).success).toBe(true);
  });

  it("rejects empty userId", () => {
    expect(VerifyStaffInput.safeParse({ userId: "" }).success).toBe(false);
  });
});

describe("AuditQuery", () => {
  it("accepts query with filters and page coerced", () => {
    const q = {
      patientId: "user-asha",
      outcome: "DENIED",
      page: "2",
      pageSize: "10",
    };
    const parsed = AuditQuery.parse(q);
    expect(parsed.page).toBe(2);
    expect(parsed.outcome).toBe("DENIED");
  });

  it("rejects invalid outcome value", () => {
    expect(AuditQuery.safeParse({ outcome: "PENDING" }).success).toBe(false);
  });
});

describe("AuditEntryDTO", () => {
  it("accepts valid audit entry without clinical content", () => {
    const entry = {
      id: "aud-123",
      at: "2026-11-20T14:30:00.000Z",
      actorId: "user-kavya",
      actorRole: "DOCTOR",
      action: "record:read",
      resourceType: "HealthRecord",
      resourceId: "rec-asha-cbc",
      patientId: "user-asha",
      outcome: "DENIED",
      reason: "CONSENT_EXPIRED",
    };
    expect(AuditEntryDTO.safeParse(entry).success).toBe(true);
  });

  it("rejects invalid outcome in entry", () => {
    const bad = {
      id: "aud-123",
      at: "2026-11-20T14:30:00.000Z",
      actorId: "user-kavya",
      actorRole: "DOCTOR",
      action: "record:read",
      resourceType: "HealthRecord",
      outcome: "INVALID_OUTCOME",
    };
    expect(AuditEntryDTO.safeParse(bad).success).toBe(false);
  });
});

describe("InstitutionDTO", () => {
  it("accepts a valid institution DTO", () => {
    const inst = {
      id: "inst-citygen",
      name: "City General Hospital",
      type: "HOSPITAL",
      city: "Bengaluru",
    };
    expect(InstitutionDTO.safeParse(inst).success).toBe(true);
  });

  it("rejects an invalid institution type", () => {
    const bad = {
      id: "inst-citygen",
      name: "City General Hospital",
      type: "HOTEL",
      city: "Bengaluru",
    };
    expect(InstitutionDTO.safeParse(bad).success).toBe(false);
  });
});

describe("InstitutionCreate and Update", () => {
  it("accepts valid creation input", () => {
    const create = {
      name: "Apollo Pharmacy",
      type: "PHARMACY",
      city: "Hyderabad",
    };
    expect(InstitutionCreate.safeParse(create).success).toBe(true);
  });

  it("rejects empty name on create", () => {
    const bad = {
      name: "",
      type: "PHARMACY",
      city: "Hyderabad",
    };
    expect(InstitutionCreate.safeParse(bad).success).toBe(false);
  });

  it("accepts valid update with id", () => {
    const update = {
      id: "inst-apollo",
      name: "Apollo Pharmacy Indiranagar",
      type: "PHARMACY",
      city: "Bengaluru",
    };
    expect(InstitutionUpdate.safeParse(update).success).toBe(true);
  });
});
