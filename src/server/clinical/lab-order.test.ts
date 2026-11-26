import { beforeEach, describe, expect, it, vi } from "vitest";
import { LabOrderCreate } from "@/contracts/clinical";
import type { SessionUser } from "@/contracts/shared";
import { writeLabOrder } from "./lab-order";

vi.mock("@/server/db", () => ({
  db: {
    institution: {
      findUnique: vi.fn(),
    },
    labOrder: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/server/auth/authorize", () => ({
  authorize: vi.fn(),
}));

import { authorize } from "@/server/auth/authorize";
import { db } from "@/server/db";

describe("writeLabOrder", () => {
  const doctor: SessionUser = {
    id: "user-kavya",
    role: "DOCTOR",
    name: "Dr Kavya Iyer",
    verified: true,
    institutionIds: ["inst-citygen"],
  };

  const validOrderInput: LabOrderCreate = {
    patientId: "user-asha",
    labInstitutionId: "inst-precision",
    tests: ["HbA1c", "Lipid Profile"],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails with VALIDATION_FAILED when institution is not of type LAB", async () => {
    vi.mocked(authorize).mockResolvedValue({
      allowed: true,
      reason: "CONSENT",
      consentId: "consent-123",
    });

    vi.mocked(db.institution.findUnique).mockResolvedValue({
      id: "inst-citygen",
      name: "City General Hospital",
      type: "HOSPITAL",
    } as never);

    await expect(writeLabOrder(doctor, validOrderInput)).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
      message: "The selected institution is not a laboratory.",
    });

    expect(db.labOrder.create).not.toHaveBeenCalled();
  });

  it("fails with VALIDATION_FAILED when institution does not exist", async () => {
    vi.mocked(authorize).mockResolvedValue({
      allowed: true,
      reason: "CONSENT",
      consentId: "consent-123",
    });

    vi.mocked(db.institution.findUnique).mockResolvedValue(null);

    await expect(writeLabOrder(doctor, validOrderInput)).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
    });

    expect(db.labOrder.create).not.toHaveBeenCalled();
  });

  it("rejects 0 tests (empty array)", () => {
    const parsed = LabOrderCreate.safeParse({
      patientId: "user-asha",
      labInstitutionId: "inst-precision",
      tests: [],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects 11 tests (more than 10)", () => {
    const elevenTests = Array(11).fill("HbA1c");
    const parsed = LabOrderCreate.safeParse({
      patientId: "user-asha",
      labInstitutionId: "inst-precision",
      tests: elevenTests,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects with CONSENT_REQUIRED and writes nothing when consent is missing", async () => {
    vi.mocked(authorize).mockResolvedValue({
      allowed: false,
      code: "CONSENT_REQUIRED",
      reason: "NO_ACTIVE_CONSENT",
    });

    await expect(writeLabOrder(doctor, validOrderInput)).rejects.toMatchObject({
      code: "CONSENT_REQUIRED",
    });

    expect(db.institution.findUnique).not.toHaveBeenCalled();
    expect(db.labOrder.create).not.toHaveBeenCalled();
  });

  it("creates a lab order with status PENDING, trimmed tests, and returns LabOrderDTO", async () => {
    vi.mocked(authorize).mockResolvedValue({
      allowed: true,
      reason: "CONSENT",
      consentId: "consent-123",
    });

    vi.mocked(db.institution.findUnique).mockResolvedValue({
      id: "inst-precision",
      name: "Precision Diagnostics Lab",
      type: "LAB",
    } as never);

    const now = new Date("2026-11-26T06:00:00.000Z");
    vi.mocked(db.labOrder.create).mockResolvedValue({
      id: "laborder-new-1",
      patientId: "user-asha",
      orderedById: "user-kavya",
      labInstitutionId: "inst-precision",
      tests: ["HbA1c", "Lipid Profile"],
      status: "PENDING",
      resultRecordId: null,
      createdAt: now,
      patient: { name: "Asha Verma" },
      orderedBy: { name: "Dr Kavya Iyer" },
      labInstitution: { name: "Precision Diagnostics Lab" },
    } as never);

    const result = await writeLabOrder(doctor, {
      patientId: "user-asha",
      labInstitutionId: "inst-precision",
      tests: ["  HbA1c  ", " Lipid Profile "],
    });

    expect(result.id).toBe("laborder-new-1");
    expect(result.status).toBe("PENDING");
    expect(result.patientName).toBe("Asha Verma");
    expect(result.orderedByName).toBe("Dr Kavya Iyer");
    expect(result.labInstitutionName).toBe("Precision Diagnostics Lab");
    expect(result.tests).toEqual(["HbA1c", "Lipid Profile"]);
    expect(db.labOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "PENDING",
          tests: ["HbA1c", "Lipid Profile"],
        }),
      }),
    );
  });
});
