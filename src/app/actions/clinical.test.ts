import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPrescription } from "./clinical";

vi.mock("@/server/auth/session", () => ({
  requireSession: vi.fn(),
}));

vi.mock("@/server/clinical/prescription", () => ({
  writePrescription: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { writePrescription } from "@/server/clinical/prescription";
import { ApiError } from "@/server/http";

describe("createPrescription Server Action", () => {
  const doctorUser = {
    id: "user-kavya",
    role: "DOCTOR" as const,
    name: "Dr Kavya Iyer",
    verified: true,
    institutionIds: ["inst-citygen"],
  };

  const sampleDrug = {
    drug: "Paracetamol 650 mg",
    dose: "1 tablet",
    frequency: "Three times a day",
    durationDays: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails with VALIDATION_FAILED if input is empty or invalid", async () => {
    vi.mocked(requireSession).mockResolvedValue(doctorUser);

    const res = await createPrescription({
      patientId: "user-asha",
      items: [], // empty items
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("VALIDATION_FAILED");
    }
    expect(writePrescription).not.toHaveBeenCalled();
  });

  it("successfully creates prescription and revalidates paths", async () => {
    vi.mocked(requireSession).mockResolvedValue(doctorUser);
    vi.mocked(writePrescription).mockResolvedValue({
      recordId: "rec-new-123",
      shareCode: "KAVY23",
    });

    const res = await createPrescription({
      patientId: "user-asha",
      items: [sampleDrug],
      notes: "Follow up in 5 days",
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data).toEqual({
        recordId: "rec-new-123",
        shareCode: "KAVY23",
      });
    }

    expect(writePrescription).toHaveBeenCalledWith(doctorUser, {
      patientId: "user-asha",
      items: [sampleDrug],
      notes: "Follow up in 5 days",
    });

    expect(revalidatePath).toHaveBeenCalledWith("/doctor/patients");
    expect(revalidatePath).toHaveBeenCalledWith("/doctor/patients/user-asha");
    expect(revalidatePath).toHaveBeenCalledWith("/patient/records");
    expect(revalidatePath).toHaveBeenCalledWith("/patient");
  });

  it("handles ApiError thrown by writePrescription", async () => {
    vi.mocked(requireSession).mockResolvedValue(doctorUser);
    vi.mocked(writePrescription).mockRejectedValue(
      new ApiError("CONSENT_REQUIRED", "No active consent"),
    );

    const res = await createPrescription({
      patientId: "user-asha",
      items: [sampleDrug],
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("CONSENT_REQUIRED");
    }
  });
});
