import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionUser } from "@/contracts/shared";
import { dispensePrescription, lookupPrescription } from "./pharmacy";

vi.mock("@/server/db", () => ({
  db: {
    prescription: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/server/auth/authorize", () => ({
  authorize: vi.fn(),
}));

import { authorize } from "@/server/auth/authorize";
import { db } from "@/server/db";

describe("pharmacy server functions", () => {
  const pharmacyUser: SessionUser = {
    id: "user-counter",
    role: "PHARMACY",
    name: "Green Cross Counter",
    verified: true,
    institutionIds: ["inst-greencross"],
  };

  const doctorUser: SessionUser = {
    id: "user-kavya",
    role: "DOCTOR",
    name: "Dr Kavya Iyer",
    verified: true,
    institutionIds: ["inst-citygen"],
  };

  const mockPrescriptionRow = {
    recordId: "rec-asha-rx",
    shareCode: "ASHA7K",
    items: [
      { drug: "Amlodipine 5 mg", dose: "1 tablet", frequency: "Once a day", durationDays: 30 },
    ],
    dispensedAt: null,
    dispensedBy: null,
    expiresAt: new Date(Date.now() + 86400000 * 10),
    record: {
      patientId: "user-asha",
      occurredAt: new Date("2026-10-21T09:30:00Z"),
      patient: { id: "user-asha", name: "Asha Sharma" },
      author: { name: "Dr Kavya Iyer" },
      institution: { name: "City General Hospital" },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("looks up prescription ASHA7K successfully", async () => {
    vi.mocked(db.prescription.findUnique).mockResolvedValueOnce(mockPrescriptionRow as never);
    vi.mocked(authorize).mockResolvedValueOnce({ allowed: true, reason: "ROLE" });

    const rx = await lookupPrescription(pharmacyUser, "ASHA7K");
    expect(rx.recordId).toBe("rec-asha-rx");
    expect(rx.patientName).toBe("Asha Sharma");
    expect(rx.items.length).toBe(1);
    expect(rx.issuedBy).toContain("Dr Kavya Iyer");
    expect(rx.dispensedAt).toBeNull();
  });

  it("throws NOT_FOUND for unknown share code", async () => {
    vi.mocked(db.prescription.findUnique).mockResolvedValueOnce(null);

    await expect(lookupPrescription(pharmacyUser, "UNKNOWN99")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("throws NOT_FOUND for expired prescription (TRAPS §11)", async () => {
    const expiredRow = {
      ...mockPrescriptionRow,
      expiresAt: new Date(Date.now() - 10000),
    };
    vi.mocked(db.prescription.findUnique).mockResolvedValueOnce(expiredRow as never);

    await expect(lookupPrescription(pharmacyUser, "ASHA7K")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("refuses lookup from unauthorized user with deny code", async () => {
    vi.mocked(db.prescription.findUnique).mockResolvedValueOnce(mockPrescriptionRow as never);
    vi.mocked(authorize).mockResolvedValueOnce({ allowed: false, code: "NOT_FOUND", reason: "WRONG_ROLE" });

    await expect(lookupPrescription(doctorUser, "ASHA7K")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("dispenses prescription and updates record", async () => {
    vi.mocked(db.prescription.findUnique).mockResolvedValueOnce(mockPrescriptionRow as never);
    vi.mocked(authorize).mockResolvedValueOnce({ allowed: true, reason: "ROLE" });
    vi.mocked(db.prescription.update).mockResolvedValueOnce({} as never);

    const dispensed = await dispensePrescription(pharmacyUser, "rec-asha-rx");
    expect(dispensed.dispensedAt).not.toBeNull();
    expect(db.prescription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { recordId: "rec-asha-rx" },
      }),
    );
  });

  it("rejects double dispense with CONFLICT", async () => {
    const alreadyDispensedRow = {
      ...mockPrescriptionRow,
      dispensedAt: new Date("2026-11-20T10:00:00Z"),
    };
    vi.mocked(db.prescription.findUnique).mockResolvedValueOnce(alreadyDispensedRow as never);

    await expect(dispensePrescription(pharmacyUser, "rec-asha-rx")).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
});
