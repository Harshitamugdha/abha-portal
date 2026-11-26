import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEncounter, createLabOrder, createPrescription } from "./clinical";

vi.mock("@/server/auth/session", () => ({
  requireSession: vi.fn(),
}));

vi.mock("@/server/clinical/prescription", () => ({
  writePrescription: vi.fn(),
}));

vi.mock("@/server/clinical/lab-order", () => ({
  writeLabOrder: vi.fn(),
}));

vi.mock("@/server/clinical/encounter", () => ({
  writeEncounter: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { requireSession } from "@/server/auth/session";
import { writeEncounter } from "@/server/clinical/encounter";
import { writeLabOrder } from "@/server/clinical/lab-order";
import { writePrescription } from "@/server/clinical/prescription";

describe("Clinical Server Actions", () => {
  const doctor = {
    id: "user-kavya",
    role: "DOCTOR" as const,
    name: "Dr Kavya Iyer",
    verified: true,
    institutionIds: ["inst-citygen"],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createPrescription", () => {
    it("successfully creates a prescription and revalidates paths", async () => {
      vi.mocked(requireSession).mockResolvedValue(doctor);
      vi.mocked(writePrescription).mockResolvedValue({
        recordId: "rec-rx-123",
        shareCode: "KAVY23",
      });

      const result = await createPrescription({
        patientId: "user-asha",
        items: [
          {
            drug: "Amlodipine 5 mg",
            dose: "1 tablet",
            frequency: "Once daily",
            durationDays: 30,
          },
        ],
        notes: "BP control",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.recordId).toBe("rec-rx-123");
        expect(result.data.shareCode).toBe("KAVY23");
      }
    });

    it("returns VALIDATION_FAILED when input is invalid", async () => {
      vi.mocked(requireSession).mockResolvedValue(doctor);

      const result = await createPrescription({
        patientId: "user-asha",
        items: [],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_FAILED");
      }
      expect(writePrescription).not.toHaveBeenCalled();
    });
  });

  describe("createLabOrder", () => {
    it("successfully creates a lab order and revalidates paths", async () => {
      vi.mocked(requireSession).mockResolvedValue(doctor);
      vi.mocked(writeLabOrder).mockResolvedValue({
        id: "laborder-1",
        patientId: "user-asha",
        patientName: "Asha Verma",
        orderedById: "user-kavya",
        orderedByName: "Dr Kavya Iyer",
        labInstitutionId: "inst-precision",
        labInstitutionName: "Precision Diagnostics Lab",
        tests: ["HbA1c"],
        status: "PENDING",
        resultRecordId: null,
        createdAt: "2026-11-26T06:00:00.000Z",
      });

      const result = await createLabOrder({
        patientId: "user-asha",
        labInstitutionId: "inst-precision",
        tests: ["HbA1c"],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.id).toBe("laborder-1");
        expect(result.data.status).toBe("PENDING");
      }
    });

    it("returns VALIDATION_FAILED when tests list is empty", async () => {
      vi.mocked(requireSession).mockResolvedValue(doctor);

      const result = await createLabOrder({
        patientId: "user-asha",
        labInstitutionId: "inst-precision",
        tests: [],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_FAILED");
      }
      expect(writeLabOrder).not.toHaveBeenCalled();
    });
  });

  describe("createEncounter", () => {
    it("successfully creates an encounter converting IST date", async () => {
      vi.mocked(requireSession).mockResolvedValue(doctor);
      vi.mocked(writeEncounter).mockResolvedValue({
        id: "rec-enc-1",
        patientId: "user-asha",
        institutionId: "inst-citygen",
        institutionName: "City General Hospital",
        authorId: "user-kavya",
        authorName: "Dr Kavya Iyer",
        type: "ENCOUNTER",
        title: "Follow-up",
        summary: "Recovered",
        occurredAt: "2026-11-26T06:30:00.000Z",
        fileId: null,
        createdAt: "2026-11-26T06:35:00.000Z",
      });

      const result = await createEncounter({
        patientId: "user-asha",
        title: "Follow-up",
        summary: "Recovered",
        occurredAt: "2026-11-26",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.id).toBe("rec-enc-1");
        expect(result.data.title).toBe("Follow-up");
      }
    });

    it("returns VALIDATION_FAILED on empty title", async () => {
      vi.mocked(requireSession).mockResolvedValue(doctor);

      const result = await createEncounter({
        patientId: "user-asha",
        title: "",
        occurredAt: "2026-11-26",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_FAILED");
      }
      expect(writeEncounter).not.toHaveBeenCalled();
    });
  });
});
