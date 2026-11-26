import { beforeEach, describe, expect, it, vi } from "vitest";
import { PrescriptionCreate, ShareCode } from "@/contracts/clinical";
import type { SessionUser } from "@/contracts/shared";
import {
  generateShareCode,
  SHARE_CODE_CHARS,
  writePrescription,
} from "./prescription";

vi.mock("@/server/db", () => ({
  db: {
    $transaction: vi.fn(),
  },
}));

vi.mock("@/server/auth/authorize", () => ({
  authorize: vi.fn(),
}));

import { authorize } from "@/server/auth/authorize";
import { db } from "@/server/db";

describe("prescription engine and share code", () => {
  const doctor: SessionUser = {
    id: "user-kavya",
    role: "DOCTOR",
    name: "Dr Kavya Iyer",
    verified: true,
    institutionIds: ["inst-citygen"],
  };

  const patient: SessionUser = {
    id: "user-asha",
    role: "PATIENT",
    name: "Asha Verma",
    verified: true,
    institutionIds: [],
  };

  const labUser: SessionUser = {
    id: "user-lab",
    role: "LAB",
    name: "Precision Lab Staff",
    verified: true,
    institutionIds: ["inst-precision"],
  };

  const validItem = {
    drug: "Paracetamol 650 mg",
    dose: "1 tablet",
    frequency: "Thrice daily",
    durationDays: 5,
    notes: "Take after meals",
  };

  const validPrescription: PrescriptionCreate = {
    patientId: "user-asha",
    items: [validItem],
    notes: "Follow up after 5 days",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TEST 1: generator uses only allowed characters and has length 6
  describe("generator uses only allowed characters and has length 6", () => {
    it("generates 6-character codes using only ABCDEFGHJKLMNPQRSTUVWXYZ23456789", () => {
      const allowedSet = new Set(SHARE_CODE_CHARS.split(""));
      expect(SHARE_CODE_CHARS).toHaveLength(32);

      // Disallowed chars: 0, 1, I, O
      expect(allowedSet.has("0")).toBe(false);
      expect(allowedSet.has("1")).toBe(false);
      expect(allowedSet.has("I")).toBe(false);
      expect(allowedSet.has("O")).toBe(false);

      for (let i = 0; i < 200; i++) {
        const code = generateShareCode();
        expect(code).toHaveLength(6);
        expect(ShareCode.safeParse(code).success).toBe(true);

        for (const char of code) {
          expect(allowedSet.has(char)).toBe(true);
        }
      }
    });
  });

  // TEST 2: retry after P2002 then success
  describe("retry after P2002 then success", () => {
    it("retries on unique constraint collision (P2002) and succeeds on the second attempt", async () => {
      vi.mocked(authorize).mockResolvedValue({
        allowed: true,
        reason: "CONSENT",
        consentId: "consent-kavya-asha",
      });

      // 1st attempt throws P2002; 2nd attempt succeeds
      vi.mocked(db.$transaction)
        .mockRejectedValueOnce({ code: "P2002", message: "Unique constraint failed on shareCode" })
        .mockResolvedValueOnce({
          recordId: "rec-new-rx",
          shareCode: "KAVY26",
        });

      const result = await writePrescription(doctor, validPrescription);

      expect(result).toEqual({
        recordId: "rec-new-rx",
        shareCode: "KAVY26",
      });
      expect(db.$transaction).toHaveBeenCalledTimes(2);
    });
  });

  // TEST 3: gives up after 5 tries
  describe("gives up after 5 tries", () => {
    it("gives up after 5 consecutive P2002 collisions and throws INTERNAL", async () => {
      vi.mocked(authorize).mockResolvedValue({
        allowed: true,
        reason: "CONSENT",
        consentId: "consent-kavya-asha",
      });

      vi.mocked(db.$transaction).mockRejectedValue({
        code: "P2002",
        message: "Unique constraint failed on shareCode",
      });

      await expect(writePrescription(doctor, validPrescription)).rejects.toMatchObject({
        code: "INTERNAL",
      });

      expect(db.$transaction).toHaveBeenCalledTimes(5);
    });
  });

  // TEST 4: patient or lab role gets FORBIDDEN
  describe("patient or lab role gets FORBIDDEN", () => {
    it("rejects patient calling writePrescription with FORBIDDEN", async () => {
      vi.mocked(authorize).mockResolvedValue({
        allowed: false,
        code: "FORBIDDEN",
        reason: "WRONG_ROLE",
      });

      await expect(writePrescription(patient, validPrescription)).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it("rejects lab staff calling writePrescription with FORBIDDEN", async () => {
      vi.mocked(authorize).mockResolvedValue({
        allowed: false,
        code: "FORBIDDEN",
        reason: "WRONG_ROLE",
      });

      await expect(writePrescription(labUser, validPrescription)).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      expect(db.$transaction).not.toHaveBeenCalled();
    });
  });

  // TEST 5: no consent gives CONSENT_REQUIRED and no transaction runs
  describe("no consent gives CONSENT_REQUIRED and no transaction runs", () => {
    it("returns CONSENT_REQUIRED when doctor has no active consent, and does not execute transaction", async () => {
      vi.mocked(authorize).mockResolvedValue({
        allowed: false,
        code: "CONSENT_REQUIRED",
        reason: "NO_ACTIVE_CONSENT",
      });

      await expect(writePrescription(doctor, validPrescription)).rejects.toMatchObject({
        code: "CONSENT_REQUIRED",
      });

      expect(db.$transaction).not.toHaveBeenCalled();
    });
  });

  // TEST 6: 0 and 11 drugs rejected
  describe("0 and 11 drugs rejected", () => {
    it("rejects 0 drugs (empty items array)", () => {
      const zeroItems = {
        patientId: "user-asha",
        items: [],
      };
      const parsed = PrescriptionCreate.safeParse(zeroItems);
      expect(parsed.success).toBe(false);
    });

    it("rejects 11 drugs (exceeds max of 10)", () => {
      const elevenItems = {
        patientId: "user-asha",
        items: Array.from({ length: 11 }, (_, i) => ({
          drug: `Medicine ${i + 1}`,
          dose: "1 tablet",
          frequency: "Daily",
          durationDays: 7,
        })),
      };
      const parsed = PrescriptionCreate.safeParse(elevenItems);
      expect(parsed.success).toBe(false);
    });

    it("throws when writePrescription is called with 0 or 11 drugs", async () => {
      const zeroItems = {
        patientId: "user-asha",
        items: [] as unknown as [typeof validItem],
      };
      await expect(writePrescription(doctor, zeroItems)).rejects.toThrow();
      expect(db.$transaction).not.toHaveBeenCalled();
    });
  });
});
