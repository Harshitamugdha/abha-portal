import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionUser } from "@/contracts/shared";
import { authorize } from "./authorize";

vi.mock("@/server/audit/write", () => ({
  writeAudit: vi.fn(),
}));

vi.mock("@/server/consent/engine", () => ({
  activeGrant: vi.fn(),
}));

import { writeAudit } from "@/server/audit/write";
import { activeGrant } from "@/server/consent/engine";

const kavya: SessionUser = {
  id: "user-kavya",
  role: "DOCTOR",
  name: "Dr Kavya Iyer",
  verified: true,
  institutionIds: ["inst-citygen"],
};

const admin: SessionUser = {
  id: "user-admin",
  role: "ADMIN",
  name: "Admin",
  verified: true,
  institutionIds: [],
};

const ashaRecords = { kind: "patientRecords" as const, patientId: "user-asha", types: [] };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("authorize() wrapper", () => {
  it("writes one audit row for a denied read, and returns the decision instead of throwing", async () => {
    vi.mocked(activeGrant).mockResolvedValueOnce(null);

    const decision = await authorize(kavya, "record:list", ashaRecords);

    expect(decision).toMatchObject({ allowed: false, code: "CONSENT_REQUIRED" });
    expect(writeAudit).toHaveBeenCalledTimes(1);
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "user-kavya",
        action: "record:list",
        patientId: "user-asha",
        outcome: "DENIED",
        reason: "NO_ACTIVE_CONSENT",
        consentId: null,
      }),
    );
  });

  it("an allowed read records which consent was used", async () => {
    const now = Date.now();
    vi.mocked(activeGrant).mockResolvedValueOnce({
      id: "consent-1",
      patientId: "user-asha",
      doctorId: "user-kavya",
      status: "GRANTED",
      scopes: ["LAB_REPORT"],
      validFrom: new Date(now - 1000),
      validTo: new Date(now + 60_000),
    } as never);

    const decision = await authorize(kavya, "record:list", ashaRecords);

    expect(decision.allowed).toBe(true);
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ outcome: "ALLOWED", consentId: "consent-1" }));
  });

  it("only looks up a consent for doctors", async () => {
    await authorize(admin, "record:list", ashaRecords);
    expect(activeGrant).not.toHaveBeenCalled();
  });

  it("if the audit row can't be written, the call fails instead of allowing silently", async () => {
    vi.mocked(writeAudit).mockRejectedValueOnce(new Error("database down"));

    await expect(authorize(admin, "staff:verify", { kind: "none" })).rejects.toThrow("database down");
  });
});
