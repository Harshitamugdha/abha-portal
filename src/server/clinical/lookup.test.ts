import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionUser } from "@/contracts/shared";
import { ApiError } from "@/server/http";
import { getPatientHeader, getPatientSummary, lookupPatient } from "./lookup";

vi.mock("@/server/db", () => ({
  db: {
    abhaProfile: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    healthRecord: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/server/auth/authorize", () => ({
  authorize: vi.fn(),
}));

import { authorize } from "@/server/auth/authorize";
import { db } from "@/server/db";

describe("clinical lookup and summary", () => {
  const doctor: SessionUser = {
    id: "user-kavya",
    role: "DOCTOR",
    name: "Dr Kavya Iyer",
    verified: true,
    institutionIds: ["inst-citygen"],
  };

  const unverifiedDoctor: SessionUser = {
    id: "user-neel",
    role: "DOCTOR",
    name: "Dr Neel",
    verified: false,
    institutionIds: ["inst-lakeside"],
  };

  const patient: SessionUser = {
    id: "user-asha",
    role: "PATIENT",
    name: "Asha Verma",
    verified: true,
    institutionIds: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("lookupPatient", () => {
    it("a number with hyphens, without, and an uppercase address find the same patient", async () => {
      vi.mocked(authorize).mockResolvedValue({
        allowed: true,
        reason: "ROLE",
      });

      vi.mocked(db.abhaProfile.findUnique).mockResolvedValue({
        userId: "user-asha",
        abhaNumber: "91100000000001",
        abhaAddress: "asha.verma@abdm",
        mobileLast4: "0001",
        dob: new Date("1990-01-01"),
        gender: "F",
        user: {
          id: "user-asha",
          name: "Asha Verma",
          role: "PATIENT",
        },
      } as never);

      // 1. Hyphenated number
      const resHyphens = await lookupPatient(doctor, "91-1000-0000-0001");
      expect(resHyphens).toEqual({
        patientId: "user-asha",
        name: "Asha Verma",
        abhaNumberMasked: "XX-XXXX-XXXX-0001",
      });
      expect(db.abhaProfile.findUnique).toHaveBeenCalledWith({
        where: { abhaNumber: "91100000000001" },
        include: { user: { select: { id: true, name: true, role: true } } },
      });

      // 2. Unhyphenated number
      const resPlain = await lookupPatient(doctor, "91100000000001");
      expect(resPlain).toEqual({
        patientId: "user-asha",
        name: "Asha Verma",
        abhaNumberMasked: "XX-XXXX-XXXX-0001",
      });

      // 3. Uppercase address
      const resAddr = await lookupPatient(doctor, "Asha.Verma@ABDM");
      expect(resAddr).toEqual({
        patientId: "user-asha",
        name: "Asha Verma",
        abhaNumberMasked: "XX-XXXX-XXXX-0001",
      });
      expect(db.abhaProfile.findUnique).toHaveBeenCalledWith({
        where: { abhaAddress: "asha.verma@abdm" },
        include: { user: { select: { id: true, name: true, role: true } } },
      });
    });

    it("returned keys are exactly patientId, name, abhaNumberMasked", async () => {
      vi.mocked(authorize).mockResolvedValue({
        allowed: true,
        reason: "ROLE",
      });

      vi.mocked(db.abhaProfile.findUnique).mockResolvedValue({
        userId: "user-asha",
        abhaNumber: "91100000000001",
        abhaAddress: "asha.verma@abdm",
        mobileLast4: "0001",
        dob: new Date("1990-01-01"),
        gender: "F",
        user: {
          id: "user-asha",
          name: "Asha Verma",
          role: "PATIENT",
        },
      } as never);

      const res = await lookupPatient(doctor, "91-1000-0000-0001");
      const keys = Object.keys(res).sort();
      expect(keys).toEqual(["abhaNumberMasked", "name", "patientId"]);
    });

    it("patient role gets FORBIDDEN even for an unknown ABHA", async () => {
      vi.mocked(authorize).mockResolvedValue({
        allowed: false,
        code: "FORBIDDEN",
        reason: "WRONG_ROLE",
      });

      await expect(lookupPatient(patient, "91-9999-9999-9999")).rejects.toThrow(ApiError);
      await expect(lookupPatient(patient, "91-9999-9999-9999")).rejects.toMatchObject({
        code: "FORBIDDEN",
      });

      // Ensure DB lookup was never reached
      expect(db.abhaProfile.findUnique).not.toHaveBeenCalled();
    });

    it("patient role gets FORBIDDEN even for invalid garbage input", async () => {
      vi.mocked(authorize).mockResolvedValue({
        allowed: false,
        code: "FORBIDDEN",
        reason: "WRONG_ROLE",
      });

      await expect(lookupPatient(patient, "invalid-garbage-123")).rejects.toMatchObject({
        code: "FORBIDDEN",
      });

      expect(db.abhaProfile.findUnique).not.toHaveBeenCalled();
    });

    it("unverified doctor gets STAFF_UNVERIFIED", async () => {
      vi.mocked(authorize).mockResolvedValue({
        allowed: false,
        code: "STAFF_UNVERIFIED",
        reason: "UNVERIFIED",
      });

      await expect(lookupPatient(unverifiedDoctor, "91-1000-0000-0001")).rejects.toThrow(ApiError);
      await expect(lookupPatient(unverifiedDoctor, "91-1000-0000-0001")).rejects.toMatchObject({
        code: "STAFF_UNVERIFIED",
      });
    });

    it("invalid ABHA format by doctor throws VALIDATION_FAILED", async () => {
      await expect(lookupPatient(doctor, "invalid-text")).rejects.toThrow(ApiError);
      await expect(lookupPatient(doctor, "invalid-text")).rejects.toMatchObject({
        code: "VALIDATION_FAILED",
      });
    });

    it("unknown ABHA by doctor throws NOT_FOUND", async () => {
      vi.mocked(db.abhaProfile.findUnique).mockResolvedValue(null);

      await expect(lookupPatient(doctor, "91-9999-9999-9999")).rejects.toThrow(ApiError);
      await expect(lookupPatient(doctor, "91-9999-9999-9999")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("getPatientHeader", () => {
    it("returns patient header with exact 3 keys", async () => {
      vi.mocked(authorize).mockResolvedValue({
        allowed: true,
        reason: "ROLE",
      });

      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: "user-asha",
        name: "Asha Verma",
        role: "PATIENT",
        abha: {
          abhaNumber: "91100000000001",
        },
      } as never);

      const res = await getPatientHeader(doctor, "user-asha");
      expect(res).toEqual({
        patientId: "user-asha",
        name: "Asha Verma",
        abhaNumberMasked: "XX-XXXX-XXXX-0001",
      });
      expect(Object.keys(res).sort()).toEqual(["abhaNumberMasked", "name", "patientId"]);
    });

    it("patient role gets FORBIDDEN", async () => {
      vi.mocked(authorize).mockResolvedValue({
        allowed: false,
        code: "FORBIDDEN",
        reason: "WRONG_ROLE",
      });

      await expect(getPatientHeader(patient, "user-asha")).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      expect(db.user.findUnique).not.toHaveBeenCalled();
    });

    it("unknown patient id throws NOT_FOUND", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      await expect(getPatientHeader(doctor, "nonexistent-user")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("getPatientSummary", () => {
    it("summary counts only allowed types", async () => {
      vi.mocked(authorize).mockResolvedValue({
        allowed: true,
        reason: "CONSENT",
        consentId: "cg-1",
        allowedTypes: ["LAB_REPORT"],
      });

      vi.mocked(db.healthRecord.findMany).mockResolvedValue([
        {
          institutionId: "inst-sunrise",
          type: "LAB_REPORT",
          occurredAt: new Date("2026-10-23T03:30:00.000Z"),
          institution: {
            id: "inst-sunrise",
            name: "Sunrise Multispeciality",
          },
        },
        {
          institutionId: "inst-sunrise",
          type: "LAB_REPORT",
          occurredAt: new Date("2026-09-17T06:00:00.000Z"),
          institution: {
            id: "inst-sunrise",
            name: "Sunrise Multispeciality",
          },
        },
      ] as never);

      const summary = await getPatientSummary(doctor, "user-asha");

      expect(db.healthRecord.findMany).toHaveBeenCalledWith({
        where: {
          patientId: "user-asha",
          type: { in: ["LAB_REPORT"] },
        },
        select: {
          institutionId: true,
          type: true,
          occurredAt: true,
          institution: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
      });

      expect(summary).toEqual({
        byInstitution: [
          {
            institutionId: "inst-sunrise",
            institutionName: "Sunrise Multispeciality",
            counts: [{ type: "LAB_REPORT", count: 2 }],
            latestAt: "2026-10-23T03:30:00.000Z",
          },
        ],
      });
    });

    it("throws CONSENT_REQUIRED when doctor has no active consent", async () => {
      vi.mocked(authorize).mockResolvedValue({
        allowed: false,
        code: "CONSENT_REQUIRED",
        reason: "NO_ACTIVE_CONSENT",
      });

      await expect(getPatientSummary(doctor, "user-asha")).rejects.toMatchObject({
        code: "CONSENT_REQUIRED",
      });

      expect(db.healthRecord.findMany).not.toHaveBeenCalled();
    });

    it("returns empty byInstitution when allowedTypes is empty", async () => {
      vi.mocked(authorize).mockResolvedValue({
        allowed: true,
        reason: "CONSENT",
        consentId: "cg-1",
        allowedTypes: [],
      });

      const summary = await getPatientSummary(doctor, "user-asha");
      expect(summary).toEqual({ byInstitution: [] });
      expect(db.healthRecord.findMany).not.toHaveBeenCalled();
    });
  });
});
