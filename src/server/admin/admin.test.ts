import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionUser } from "@/contracts/shared";
import {
  createInstitution,
  listInstitutions,
  listStaff,
  queryAudit,
  updateInstitution,
  verifyStaff,
} from "./admin";

vi.mock("@/server/db", () => ({
  db: {
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    institution: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/server/auth/authorize", () => ({
  authorize: vi.fn(),
}));

import { authorize } from "@/server/auth/authorize";
import { db } from "@/server/db";

describe("admin server functions", () => {
  const adminUser: SessionUser = {
    id: "user-admin",
    role: "ADMIN",
    name: "System Admin",
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listStaff", () => {
    it("lists staff members for admin", async () => {
      vi.mocked(authorize).mockResolvedValueOnce({ allowed: true, reason: "ROLE" });
      vi.mocked(db.user.count).mockResolvedValueOnce(1);
      vi.mocked(db.user.findMany).mockResolvedValueOnce([
        {
          id: "user-neel",
          role: "DOCTOR",
          name: "Dr Neel Sharma",
          email: "neel@citygen.test",
          hprId: "HPR-123",
          verified: false,
          createdAt: new Date("2026-11-01T10:00:00Z"),
          memberships: [{ institutionId: "inst-citygen", institution: { name: "City General Hospital" } }],
        },
      ] as never);

      const res = await listStaff(adminUser, { page: 1, pageSize: 20 });
      expect(res.total).toBe(1);
      expect(res.items[0].id).toBe("user-neel");
      expect(res.items[0].institutionNames).toContain("City General Hospital");
    });

    it("rejects non-admin", async () => {
      vi.mocked(authorize).mockResolvedValueOnce({ allowed: false, code: "FORBIDDEN", reason: "WRONG_ROLE" });

      await expect(listStaff(doctorUser, {})).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });

  describe("verifyStaff", () => {
    it("verifies staff successfully", async () => {
      vi.mocked(authorize).mockResolvedValueOnce({ allowed: true, reason: "ROLE" });
      vi.mocked(db.user.findUnique).mockResolvedValueOnce({
        id: "user-neel",
        verified: false,
      } as never);
      vi.mocked(db.user.update).mockResolvedValueOnce({
        id: "user-neel",
        role: "DOCTOR",
        name: "Dr Neel Sharma",
        email: "neel@citygen.test",
        hprId: "HPR-123",
        verified: true,
        createdAt: new Date("2026-11-01T10:00:00Z"),
        memberships: [{ institutionId: "inst-citygen", institution: { name: "City General Hospital" } }],
      } as never);

      const res = await verifyStaff(adminUser, "user-neel");
      expect(res.verified).toBe(true);
    });
  });

  describe("queryAudit", () => {
    it("returns audit logs without clinical content", async () => {
      vi.mocked(authorize).mockResolvedValueOnce({ allowed: true, reason: "ROLE" });
      vi.mocked(db.auditLog.count).mockResolvedValueOnce(1);
      vi.mocked(db.auditLog.findMany).mockResolvedValueOnce([
        {
          id: "aud-1",
          at: new Date("2026-11-20T10:00:00Z"),
          actorId: "user-kavya",
          actorRole: "DOCTOR",
          action: "record:read",
          resourceType: "HealthRecord",
          resourceId: "rec-asha-cbc",
          patientId: "user-asha",
          outcome: "DENIED",
          reason: "CONSENT_EXPIRED",
        },
      ] as never);

      const res = await queryAudit(adminUser, { outcome: "DENIED" });
      expect(res.items.length).toBe(1);
      expect(res.items[0].outcome).toBe("DENIED");
      expect(res.items[0].reason).toBe("CONSENT_EXPIRED");
    });
  });

  describe("institutions", () => {
    it("creates, updates and lists institutions", async () => {
      vi.mocked(authorize).mockResolvedValue({ allowed: true, reason: "ROLE" });
      vi.mocked(db.institution.create).mockResolvedValueOnce({
        id: "inst-apollo",
        name: "Apollo Clinic",
        type: "HOSPITAL",
        city: "Hyderabad",
      } as never);

      const created = await createInstitution(adminUser, {
        name: "Apollo Clinic",
        type: "HOSPITAL",
        city: "Hyderabad",
      });
      expect(created.name).toBe("Apollo Clinic");

      vi.mocked(db.institution.findUnique).mockResolvedValueOnce({
        id: "inst-apollo",
        name: "Apollo Clinic",
        type: "HOSPITAL",
        city: "Hyderabad",
      } as never);

      vi.mocked(db.institution.update).mockResolvedValueOnce({
        id: "inst-apollo",
        name: "Apollo Clinic Banjara",
        type: "HOSPITAL",
        city: "Hyderabad",
      } as never);

      const updated = await updateInstitution(adminUser, {
        id: "inst-apollo",
        name: "Apollo Clinic Banjara",
        type: "HOSPITAL",
        city: "Hyderabad",
      });
      expect(updated.name).toBe("Apollo Clinic Banjara");

      vi.mocked(db.institution.findMany).mockResolvedValueOnce([updated] as never);
      const list = await listInstitutions(adminUser);
      expect(list.length).toBe(1);
    });

    it("returns NOT_FOUND when updating an unknown institution id", async () => {
      vi.mocked(authorize).mockResolvedValue({ allowed: true, reason: "ROLE" });
      vi.mocked(db.institution.findUnique).mockResolvedValueOnce(null);

      await expect(
        updateInstitution(adminUser, {
          id: "inst-nonexistent",
          name: "Fake",
          type: "HOSPITAL",
          city: "Delhi",
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });
});
