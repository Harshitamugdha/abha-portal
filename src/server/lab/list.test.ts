import { beforeEach, describe, expect, it, vi } from "vitest";
import { LabOrderDTO } from "@/contracts/lab";
import type { SessionUser } from "@/contracts/shared";
import { listLabOrders } from "./list";

vi.mock("@/server/db", () => ({
  db: {
    labOrder: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock("@/server/auth/authorize", () => ({
  authorize: vi.fn(),
}));

import { authorize } from "@/server/auth/authorize";
import { db } from "@/server/db";

describe("listLabOrders data function", () => {
  const labUser: SessionUser = {
    id: "user-lab",
    role: "LAB",
    name: "Precision Lab Staff",
    verified: true,
    institutionIds: ["inst-precision"],
  };

  const doctorUser: SessionUser = {
    id: "user-kavya",
    role: "DOCTOR",
    name: "Dr Kavya Iyer",
    verified: true,
    institutionIds: ["inst-citygen"],
  };

  const patientUser: SessionUser = {
    id: "user-asha",
    role: "PATIENT",
    name: "Asha Verma",
    verified: true,
    institutionIds: [],
  };

  const sampleDbRow = {
    id: "laborder-1",
    patientId: "user-asha",
    orderedById: "user-arjun",
    labInstitutionId: "inst-precision",
    tests: ["HbA1c", "Thyroid profile (T3, T4, TSH)"],
    status: "PENDING" as const,
    resultRecordId: null,
    createdAt: new Date("2026-11-24T10:00:00.000Z"),
    patient: { name: "Asha Verma" },
    orderedBy: { name: "Dr Arjun Rao" },
    labInstitution: { name: "Precision Diagnostics Lab" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: where uses the session institutionIds
  it("where uses the session institutionIds and never accepts from request", async () => {
    vi.mocked(authorize).mockResolvedValue({
      allowed: true,
      reason: "ROLE",
    });

    vi.mocked(db.labOrder.findMany).mockResolvedValue([sampleDbRow as never]);
    vi.mocked(db.labOrder.count).mockResolvedValue(1);

    // Caller attempts to supply labInstitutionId in the query parameters
    const inputWithSpoofedLab = {
      labInstitutionId: "inst-other",
      status: "PENDING",
      page: 1,
      pageSize: 10,
    };

    await listLabOrders(labUser, inputWithSpoofedLab);

    expect(db.labOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          labInstitutionId: { in: ["inst-precision"] },
          status: "PENDING",
        },
      }),
    );
    expect(db.labOrder.count).toHaveBeenCalledWith({
      where: {
        labInstitutionId: { in: ["inst-precision"] },
        status: "PENDING",
      },
    });
  });

  // Test 2: patient or doctor gets FORBIDDEN
  it("patient gets FORBIDDEN", async () => {
    vi.mocked(authorize).mockResolvedValue({
      allowed: false,
      code: "FORBIDDEN",
      reason: "WRONG_ROLE",
    });

    await expect(listLabOrders(patientUser, {})).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    expect(db.labOrder.findMany).not.toHaveBeenCalled();
  });

  it("doctor gets FORBIDDEN", async () => {
    vi.mocked(authorize).mockResolvedValue({
      allowed: false,
      code: "FORBIDDEN",
      reason: "WRONG_ROLE",
    });

    await expect(listLabOrders(doctorUser, {})).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    expect(db.labOrder.findMany).not.toHaveBeenCalled();
  });

  // Test 3: a lab user with no institutions gets an empty list
  it("a lab user with no institutions gets an empty list without querying db", async () => {
    vi.mocked(authorize).mockResolvedValue({
      allowed: true,
      reason: "ROLE",
    });

    const labWithoutInstitutions: SessionUser = {
      ...labUser,
      institutionIds: [],
    };

    const result = await listLabOrders(labWithoutInstitutions, {});

    expect(result).toEqual({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
    });
    expect(db.labOrder.findMany).not.toHaveBeenCalled();
    expect(db.labOrder.count).not.toHaveBeenCalled();
  });

  // Test 4: DTO keys exactly as the contract
  it("DTO keys exactly match contract and contain no abhaNumber, dob, or gender", async () => {
    vi.mocked(authorize).mockResolvedValue({
      allowed: true,
      reason: "ROLE",
    });

    vi.mocked(db.labOrder.findMany).mockResolvedValue([sampleDbRow as never]);
    vi.mocked(db.labOrder.count).mockResolvedValue(1);

    const result = await listLabOrders(labUser, {});

    expect(result.items).toHaveLength(1);
    const item = result.items[0];

    // Validates against Zod schema
    expect(LabOrderDTO.parse(item)).toEqual(item);

    // Verify exact expected keys
    expect(item).toEqual({
      id: "laborder-1",
      patientId: "user-asha",
      patientName: "Asha Verma",
      orderedById: "user-arjun",
      orderedByName: "Dr Arjun Rao",
      labInstitutionId: "inst-precision",
      labInstitutionName: "Precision Diagnostics Lab",
      tests: ["HbA1c", "Thyroid profile (T3, T4, TSH)"],
      status: "PENDING",
      resultRecordId: null,
      createdAt: "2026-11-24T10:00:00.000Z",
    });

    // Privacy guarantees: NO abhaNumber, dob, or gender
    const raw = item as Record<string, unknown>;
    expect(raw.abhaNumber).toBeUndefined();
    expect(raw.dob).toBeUndefined();
    expect(raw.gender).toBeUndefined();
  });
});
