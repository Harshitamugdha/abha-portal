import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionUser } from "@/contracts/shared";
import { approveRequest, createRequest, denyRequest, revokeGrant } from "./engine";

vi.mock("@/server/db", () => ({
  db: {
    user: { findUnique: vi.fn() },
    consentGrant: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/server/auth/authorize", () => ({
  authorize: vi.fn(),
}));

import { authorize } from "@/server/auth/authorize";
import { db } from "@/server/db";

const kavya: SessionUser = {
  id: "user-kavya",
  role: "DOCTOR",
  name: "Dr Kavya Iyer",
  verified: true,
  institutionIds: ["inst-citygen"],
};

const asha: SessionUser = {
  id: "user-asha",
  role: "PATIENT",
  name: "Asha Verma",
  verified: true,
  institutionIds: [],
  patientId: "user-asha",
};

function consentRow(status: string) {
  return {
    id: "consent-1",
    patientId: "user-asha",
    doctorId: "user-kavya",
    institutionId: "inst-citygen",
    scopes: ["PRESCRIPTION", "LAB_REPORT"],
    purpose: "Follow-up",
    durationDays: 7,
    status: status,
    requestedAt: new Date("2026-11-20T10:00:00Z"),
    decidedAt: null,
    validFrom: null,
    validTo: null,
    patient: { name: "Asha Verma" },
    doctor: { name: "Dr Kavya Iyer" },
    institution: { name: "City General Hospital" },
  };
}

const request = {
  patientId: "user-asha",
  scopes: ["PRESCRIPTION" as const, "LAB_REPORT" as const],
  purpose: "Follow-up",
  durationDays: 7,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createRequest", () => {
  it("stops before touching the database when authorize() says no", async () => {
    vi.mocked(authorize).mockResolvedValueOnce({ allowed: false, code: "STAFF_UNVERIFIED", reason: "UNVERIFIED" });

    await expect(createRequest(kavya, request)).rejects.toMatchObject({ code: "STAFF_UNVERIFIED" });
    expect(db.consentGrant.create).not.toHaveBeenCalled();
  });

  it("refuses a patient id that isn't a patient", async () => {
    vi.mocked(authorize).mockResolvedValueOnce({ allowed: true, reason: "ROLE" });
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({ id: "user-admin", role: "ADMIN" } as never);

    await expect(createRequest(kavya, { ...request, patientId: "user-admin" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("returns the open request instead of making a second one", async () => {
    vi.mocked(authorize).mockResolvedValueOnce({ allowed: true, reason: "ROLE" });
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({ id: "user-asha", role: "PATIENT" } as never);
    vi.mocked(db.consentGrant.findFirst).mockResolvedValueOnce(consentRow("REQUESTED") as never);

    const consent = await createRequest(kavya, request);
    expect(consent.id).toBe("consent-1");
    expect(db.consentGrant.create).not.toHaveBeenCalled();
  });

  it("refuses a new request while the doctor still has an active consent", async () => {
    vi.mocked(authorize).mockResolvedValueOnce({ allowed: true, reason: "ROLE" });
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({ id: "user-asha", role: "PATIENT" } as never);
    vi.mocked(db.consentGrant.findFirst).mockResolvedValueOnce(null);
    vi.mocked(db.consentGrant.findFirst).mockResolvedValueOnce(consentRow("GRANTED") as never);

    await expect(createRequest(kavya, request)).rejects.toMatchObject({ code: "CONFLICT" });
    expect(db.consentGrant.create).not.toHaveBeenCalled();
  });

  it("looks for the active consent with the D9 rule (GRANTED, validFrom <= now < validTo)", async () => {
    vi.mocked(authorize).mockResolvedValueOnce({ allowed: true, reason: "ROLE" });
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({ id: "user-asha", role: "PATIENT" } as never);
    vi.mocked(db.consentGrant.findFirst).mockResolvedValueOnce(null);
    vi.mocked(db.consentGrant.findFirst).mockResolvedValueOnce(null);
    vi.mocked(db.consentGrant.create).mockResolvedValueOnce(consentRow("REQUESTED") as never);

    await createRequest(kavya, request);

    const where = vi.mocked(db.consentGrant.findFirst).mock.calls[1][0]?.where;
    expect(where).toMatchObject({
      patientId: "user-asha",
      doctorId: "user-kavya",
      status: "GRANTED",
      validFrom: { lte: expect.any(Date) },
      validTo: { gt: expect.any(Date) },
    });
  });

  it("creates a REQUESTED consent at the doctor's institution", async () => {
    vi.mocked(authorize).mockResolvedValueOnce({ allowed: true, reason: "ROLE" });
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({ id: "user-asha", role: "PATIENT" } as never);
    vi.mocked(db.consentGrant.findFirst).mockResolvedValueOnce(null);
    vi.mocked(db.consentGrant.findFirst).mockResolvedValueOnce(null);
    vi.mocked(db.consentGrant.create).mockResolvedValueOnce(consentRow("REQUESTED") as never);

    const consent = await createRequest(kavya, request);
    expect(consent.displayStatus).toBe("REQUESTED");
    expect(db.consentGrant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ institutionId: "inst-citygen", doctorId: "user-kavya" }),
      }),
    );
  });

  it("a doctor at two institutions must say which one", async () => {
    const twoPlaces = { ...kavya, institutionIds: ["inst-citygen", "inst-sunrise"] };
    vi.mocked(authorize).mockResolvedValueOnce({ allowed: true, reason: "ROLE" });
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({ id: "user-asha", role: "PATIENT" } as never);

    await expect(createRequest(twoPlaces, request)).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
  });
});

describe("approveRequest", () => {
  it("someone who isn't the owner is refused and nothing changes", async () => {
    vi.mocked(db.consentGrant.findUnique).mockResolvedValueOnce(consentRow("REQUESTED") as never);
    vi.mocked(authorize).mockResolvedValueOnce({ allowed: false, code: "FORBIDDEN", reason: "WRONG_ROLE" });

    await expect(approveRequest(kavya, { consentId: "consent-1" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.consentGrant.updateMany).not.toHaveBeenCalled();
  });

  it("saves only the requested scopes the patient ticked (TRAPS §7)", async () => {
    vi.mocked(db.consentGrant.findUnique).mockResolvedValue(consentRow("REQUESTED") as never);
    vi.mocked(authorize).mockResolvedValueOnce({ allowed: true, reason: "OWNER" });
    vi.mocked(db.consentGrant.updateMany).mockResolvedValueOnce({ count: 1 });

    await approveRequest(asha, { consentId: "consent-1", scopes: ["LAB_REPORT", "DOCUMENT"] });

    const call = vi.mocked(db.consentGrant.updateMany).mock.calls[0][0];
    expect(call?.data).toMatchObject({ status: "GRANTED", scopes: ["LAB_REPORT"] });
    expect(call?.where).toEqual({ id: "consent-1", status: "REQUESTED" });
  });

  it("sets validTo to validFrom + durationDays", async () => {
    vi.mocked(db.consentGrant.findUnique).mockResolvedValue(consentRow("REQUESTED") as never);
    vi.mocked(authorize).mockResolvedValueOnce({ allowed: true, reason: "OWNER" });
    vi.mocked(db.consentGrant.updateMany).mockResolvedValueOnce({ count: 1 });

    await approveRequest(asha, { consentId: "consent-1" });

    const data = vi.mocked(db.consentGrant.updateMany).mock.calls[0][0]?.data as { validFrom: Date; validTo: Date };
    const days = (data.validTo.getTime() - data.validFrom.getTime()) / (24 * 60 * 60 * 1000);
    expect(days).toBe(7);
  });

  it("refuses when only unrequested scopes are ticked", async () => {
    vi.mocked(db.consentGrant.findUnique).mockResolvedValueOnce(consentRow("REQUESTED") as never);
    vi.mocked(authorize).mockResolvedValueOnce({ allowed: true, reason: "OWNER" });

    await expect(approveRequest(asha, { consentId: "consent-1", scopes: ["DOCUMENT"] })).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
    });
  });

  it("an already answered request -> CONFLICT", async () => {
    vi.mocked(db.consentGrant.findUnique).mockResolvedValueOnce(consentRow("DENIED") as never);
    vi.mocked(authorize).mockResolvedValueOnce({ allowed: true, reason: "OWNER" });

    await expect(approveRequest(asha, { consentId: "consent-1" })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("two clicks at the same moment: the second gets CONFLICT", async () => {
    vi.mocked(db.consentGrant.findUnique).mockResolvedValueOnce(consentRow("REQUESTED") as never);
    vi.mocked(authorize).mockResolvedValueOnce({ allowed: true, reason: "OWNER" });
    vi.mocked(db.consentGrant.updateMany).mockResolvedValueOnce({ count: 0 });

    await expect(approveRequest(asha, { consentId: "consent-1" })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("an unknown consent id -> NOT_FOUND", async () => {
    vi.mocked(db.consentGrant.findUnique).mockResolvedValueOnce(null);

    await expect(approveRequest(asha, { consentId: "nope" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("denyRequest and revokeGrant", () => {
  it("deny works only from REQUESTED", async () => {
    vi.mocked(db.consentGrant.findUnique).mockResolvedValueOnce(consentRow("GRANTED") as never);
    vi.mocked(authorize).mockResolvedValueOnce({ allowed: true, reason: "OWNER" });

    await expect(denyRequest(asha, "consent-1")).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("revoke works only from GRANTED", async () => {
    vi.mocked(db.consentGrant.findUnique).mockResolvedValueOnce(consentRow("REQUESTED") as never);
    vi.mocked(authorize).mockResolvedValueOnce({ allowed: true, reason: "OWNER" });

    await expect(revokeGrant(asha, "consent-1")).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("revoke sets REVOKED, guarded by status GRANTED", async () => {
    vi.mocked(db.consentGrant.findUnique).mockResolvedValue(consentRow("GRANTED") as never);
    vi.mocked(authorize).mockResolvedValueOnce({ allowed: true, reason: "OWNER" });
    vi.mocked(db.consentGrant.updateMany).mockResolvedValueOnce({ count: 1 });

    await revokeGrant(asha, "consent-1");
    expect(db.consentGrant.updateMany).toHaveBeenCalledWith({
      where: { id: "consent-1", status: "GRANTED" },
      data: { status: "REVOKED" },
    });
  });
});
