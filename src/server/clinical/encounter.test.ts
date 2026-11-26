import { beforeEach, describe, expect, it, vi } from "vitest";
import { EncounterCreate } from "@/contracts/clinical";
import type { SessionUser } from "@/contracts/shared";
import { parseIstDate } from "@/server/records/params";
import { writeEncounter } from "./encounter";

vi.mock("@/server/db", () => ({
  db: {
    healthRecord: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/server/auth/authorize", () => ({
  authorize: vi.fn(),
}));

import { authorize } from "@/server/auth/authorize";
import { db } from "@/server/db";

describe("writeEncounter", () => {
  const doctor: SessionUser = {
    id: "user-kavya",
    role: "DOCTOR",
    name: "Dr Kavya Iyer",
    verified: true,
    institutionIds: ["inst-citygen"],
  };

  const validEncounterInput: EncounterCreate = {
    patientId: "user-asha",
    title: "OPD Consultation",
    summary: "Follow-up for seasonal fever. Vitals stable.",
    occurredAt: "2026-11-26T06:30:00.000Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test: encounter date IST to UTC conversion
  describe("encounter date IST to UTC conversion", () => {
    it("converts YYYY-MM-DD in IST into correct UTC ISO datetime", () => {
      // IST is UTC+5:30; 12:00:00 IST -> 06:30:00 UTC
      const iso = parseIstDate("2026-11-26");
      expect(iso).toBe("2026-11-26T06:30:00.000Z");
    });

    it("converts YYYY-MM-DDTHH:mm in IST into correct UTC ISO datetime", () => {
      // 14:30 IST (+5:30) -> 09:00 UTC
      const iso = parseIstDate("2026-11-26T14:30");
      expect(iso).toBe("2026-11-26T09:00:00.000Z");
    });
  });

  it("rejects with CONSENT_REQUIRED and writes nothing when consent is missing", async () => {
    vi.mocked(authorize).mockResolvedValue({
      allowed: false,
      code: "CONSENT_REQUIRED",
      reason: "NO_ACTIVE_CONSENT",
    });

    await expect(writeEncounter(doctor, validEncounterInput)).rejects.toMatchObject({
      code: "CONSENT_REQUIRED",
    });

    expect(db.healthRecord.create).not.toHaveBeenCalled();
  });

  it("rejects empty title", () => {
    const parsed = EncounterCreate.safeParse({
      patientId: "user-asha",
      title: "   ",
      occurredAt: "2026-11-26T06:30:00.000Z",
    });
    expect(parsed.success).toBe(false);
  });

  it("creates an ENCOUNTER HealthRecord and returns RecordDTO", async () => {
    vi.mocked(authorize).mockResolvedValue({
      allowed: true,
      reason: "CONSENT",
      consentId: "consent-123",
    });

    const occurredAt = new Date("2026-11-26T06:30:00.000Z");
    const createdAt = new Date("2026-11-26T06:35:00.000Z");

    vi.mocked(db.healthRecord.create).mockResolvedValue({
      id: "rec-enc-new",
      patientId: "user-asha",
      institutionId: "inst-citygen",
      authorId: "user-kavya",
      type: "ENCOUNTER",
      title: "OPD Consultation",
      summary: "Follow-up for seasonal fever. Vitals stable.",
      occurredAt,
      fileId: null,
      createdAt,
      institution: { name: "City General Hospital" },
      author: { name: "Dr Kavya Iyer" },
      prescription: null,
    } as never);

    const result = await writeEncounter(doctor, validEncounterInput);

    expect(result.id).toBe("rec-enc-new");
    expect(result.type).toBe("ENCOUNTER");
    expect(result.title).toBe("OPD Consultation");
    expect(result.summary).toBe("Follow-up for seasonal fever. Vitals stable.");
    expect(result.institutionName).toBe("City General Hospital");
    expect(result.authorName).toBe("Dr Kavya Iyer");
    expect(result.occurredAt).toBe(occurredAt.toISOString());

    expect(db.healthRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "ENCOUNTER",
          patientId: "user-asha",
          institutionId: "inst-citygen",
          authorId: "user-kavya",
        }),
      }),
    );
  });
});
