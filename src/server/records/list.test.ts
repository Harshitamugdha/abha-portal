import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecordDTO } from "@/contracts/records";
import type { SessionUser } from "@/contracts/shared";
import { getRecord, listPatientInstitutions, listPatientRecords } from "./list";

vi.mock("@/server/db", () => ({
  db: {
    healthRecord: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/server/auth/authorize", () => ({
  authorize: vi.fn(),
}));

import { authorize } from "@/server/auth/authorize";
import { db } from "@/server/db";

describe("records list server functions", () => {
  const patientUser: SessionUser = {
    id: "user-asha",
    role: "PATIENT",
    name: "Asha Verma",
    verified: true,
    institutionIds: [],
  };

  const doctorUser: SessionUser = {
    id: "user-kavya",
    role: "DOCTOR",
    name: "Dr Kavya Iyer",
    verified: true,
    institutionIds: ["inst-citygen"],
  };

  const sampleDbRow = {
    id: "rec-1",
    patientId: "user-asha",
    institutionId: "inst-citygen",
    authorId: "user-kavya",
    type: "PRESCRIPTION" as const,
    title: "Prescription: fever",
    summary: "Paracetamol 500mg",
    occurredAt: new Date("2026-09-15T04:45:00.000Z"),
    fileId: null,
    createdAt: new Date("2026-09-15T04:45:00.000Z"),
    institution: { name: "City General Hospital", city: "Bengaluru", extraSecretField: "should_not_leak" },
    author: { name: "Dr Kavya Iyer", email: "secret@citygen.test" },
    prescription: {
      items: [{ drug: "Paracetamol", dose: "500mg", frequency: "TID", durationDays: 3 }],
      shareCode: "ASHA7K",
      dispensedAt: null,
      expiresAt: new Date("2026-09-22T04:45:00.000Z"),
      internalPharmacyNote: "Do not leak to patient",
    },
    extraInternalPrismaColumn: "hidden",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listPatientRecords", () => {
    it("query receives type in allowedTypes (partial scope)", async () => {
      vi.mocked(authorize).mockResolvedValueOnce({
        allowed: true,
        allowedTypes: ["LAB_REPORT"],
        reason: "CONSENT_ACTIVE",
      });
      vi.mocked(db.healthRecord.count).mockResolvedValueOnce(1);
      vi.mocked(db.healthRecord.findMany).mockResolvedValueOnce([
        {
          id: "rec-lab-1",
          patientId: "user-asha",
          institutionId: "inst-sunrise",
          authorId: null,
          type: "LAB_REPORT",
          title: "Lipid profile",
          summary: "Normal",
          occurredAt: new Date("2026-10-23T03:30:00.000Z"),
          fileId: null,
          createdAt: new Date("2026-10-23T03:30:00.000Z"),
          institution: { name: "Sunrise Multispeciality" },
          author: null,
          prescription: null,
        },
      ] as never);

      const res = await listPatientRecords(doctorUser, {
        patientId: "user-asha",
        page: 1,
        pageSize: 20,
      });

      expect(authorize).toHaveBeenCalledWith(doctorUser, "record:list", {
        kind: "patientRecords",
        patientId: "user-asha",
        types: [],
      });

      expect(db.healthRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            patientId: "user-asha",
            type: { in: ["LAB_REPORT"] },
          },
        }),
      );
      expect(res.items).toHaveLength(1);
      expect(res.items[0].type).toBe("LAB_REPORT");
    });

    it("count uses the same where as findMany", async () => {
      vi.mocked(authorize).mockResolvedValueOnce({
        allowed: true,
        allowedTypes: ["ENCOUNTER", "DOCUMENT"],
        reason: "SELF",
      });
      vi.mocked(db.healthRecord.count).mockResolvedValueOnce(5);
      vi.mocked(db.healthRecord.findMany).mockResolvedValueOnce([]);

      await listPatientRecords(patientUser, {
        patientId: "user-asha",
        institutionId: "inst-citygen",
        from: "2026-09-01T00:00:00.000Z",
        to: "2026-09-30T23:59:59.999Z",
        page: 1,
        pageSize: 20,
      });

      const countCall = vi.mocked(db.healthRecord.count).mock.calls[0][0];
      const findManyCall = vi.mocked(db.healthRecord.findMany).mock.calls[0][0];

      expect(countCall?.where).toBeDefined();
      expect(findManyCall?.where).toBeDefined();
      expect(countCall?.where).toEqual(findManyCall?.where);
      expect(countCall?.where).toEqual({
        patientId: "user-asha",
        type: { in: ["ENCOUNTER", "DOCUMENT"] },
        institutionId: "inst-citygen",
        occurredAt: {
          gte: new Date("2026-09-01T00:00:00.000Z"),
          lte: new Date("2026-09-30T23:59:59.999Z"),
        },
      });
    });

    it("a denied call throws CONSENT_REQUIRED and findMany is never called", async () => {
      vi.mocked(authorize).mockResolvedValueOnce({
        allowed: false,
        code: "CONSENT_REQUIRED",
        reason: "NO_ACTIVE_CONSENT",
      });

      await expect(
        listPatientRecords(doctorUser, {
          patientId: "user-asha",
          page: 1,
          pageSize: 20,
        }),
      ).rejects.toMatchObject({
        code: "CONSENT_REQUIRED",
      });

      expect(db.healthRecord.findMany).not.toHaveBeenCalled();
      expect(db.healthRecord.count).not.toHaveBeenCalled();
    });

    it("page 2 skip/take maths", async () => {
      vi.mocked(authorize).mockResolvedValueOnce({
        allowed: true,
        allowedTypes: ["ENCOUNTER", "PRESCRIPTION", "LAB_REPORT", "DOCUMENT"],
        reason: "SELF",
      });
      vi.mocked(db.healthRecord.count).mockResolvedValueOnce(35);
      vi.mocked(db.healthRecord.findMany).mockResolvedValueOnce([]);

      const res = await listPatientRecords(patientUser, {
        patientId: "user-asha",
        page: 2,
        pageSize: 20,
      });

      expect(db.healthRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
          orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
        }),
      );
      expect(res.page).toBe(2);
      expect(res.pageSize).toBe(20);
      expect(res.total).toBe(35);
    });

    it("returned objects have only DTO fields (no row spreading / no leaked internal columns)", async () => {
      vi.mocked(authorize).mockResolvedValueOnce({
        allowed: true,
        allowedTypes: ["PRESCRIPTION"],
        reason: "SELF",
      });
      vi.mocked(db.healthRecord.count).mockResolvedValueOnce(1);
      vi.mocked(db.healthRecord.findMany).mockResolvedValueOnce([sampleDbRow as never]);

      const res = await listPatientRecords(patientUser, {
        patientId: "user-asha",
        page: 1,
        pageSize: 20,
      });

      const item = res.items[0];
      // Must successfully parse against strict DTO schema
      expect(RecordDTO.parse(item)).toEqual(item);

      // Verify no leaked extra properties from the mock database row
      expect((item as Record<string, unknown>).extraInternalPrismaColumn).toBeUndefined();
      expect((item.prescription as Record<string, unknown>)?.internalPharmacyNote).toBeUndefined();

      // Verify explicit mapped fields
      expect(item.id).toBe("rec-1");
      expect(item.institutionName).toBe("City General Hospital");
      expect(item.authorName).toBe("Dr Kavya Iyer");
      expect(item.prescription?.shareCode).toBe("ASHA7K");
      expect(item.occurredAt).toBe("2026-09-15T04:45:00.000Z");
    });
  });

  describe("getRecord", () => {
    it("returns DTO when authorized", async () => {
      vi.mocked(db.healthRecord.findUnique)
        .mockResolvedValueOnce({
          id: "rec-1",
          patientId: "user-asha",
          type: "PRESCRIPTION",
          authorId: "user-kavya",
          institutionId: "inst-citygen",
        } as never)
        .mockResolvedValueOnce(sampleDbRow as never);

      vi.mocked(authorize).mockResolvedValueOnce({
        allowed: true,
        reason: "SELF",
      });

      const record = await getRecord(patientUser, "rec-1");
      expect(record.id).toBe("rec-1");
      expect(record.title).toBe("Prescription: fever");
      expect(RecordDTO.parse(record)).toEqual(record);
      expect((record as Record<string, unknown>).extraInternalPrismaColumn).toBeUndefined();
    });

    it("throws NOT_FOUND when record does not exist", async () => {
      vi.mocked(db.healthRecord.findUnique).mockResolvedValueOnce(null);

      await expect(getRecord(patientUser, "rec-nonexistent")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });

      expect(authorize).not.toHaveBeenCalled();
    });

    it("throws ApiError when access is denied", async () => {
      vi.mocked(db.healthRecord.findUnique).mockResolvedValueOnce({
        id: "rec-1",
        patientId: "user-asha",
        type: "PRESCRIPTION",
        authorId: "user-kavya",
        institutionId: "inst-citygen",
      } as never);

      vi.mocked(authorize).mockResolvedValueOnce({
        allowed: false,
        code: "CONSENT_REQUIRED",
        reason: "NO_ACTIVE_CONSENT",
      });

      await expect(getRecord(doctorUser, "rec-1")).rejects.toMatchObject({
        code: "CONSENT_REQUIRED",
      });
    });
  });

  describe("listPatientInstitutions", () => {
    it("returns sorted distinct institutions for authorized user", async () => {
      vi.mocked(authorize).mockResolvedValueOnce({
        allowed: true,
        allowedTypes: ["ENCOUNTER", "LAB_REPORT"],
        reason: "SELF",
      });

      vi.mocked(db.healthRecord.findMany).mockResolvedValueOnce([
        { institution: { id: "inst-sunrise", name: "Sunrise Multispeciality" } },
        { institution: { id: "inst-citygen", name: "City General Hospital" } },
      ] as never);

      const list = await listPatientInstitutions(patientUser, "user-asha");
      expect(list).toEqual([
        { id: "inst-citygen", name: "City General Hospital" },
        { id: "inst-sunrise", name: "Sunrise Multispeciality" },
      ]);
    });

    it("throws on deny", async () => {
      vi.mocked(authorize).mockResolvedValueOnce({
        allowed: false,
        code: "FORBIDDEN",
        reason: "DENIED",
      });

      await expect(listPatientInstitutions(doctorUser, "user-asha")).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });
});
