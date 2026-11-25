import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/server/http";

vi.mock("@/server/auth/session", () => ({
  requireSession: vi.fn(),
}));

vi.mock("@/server/clinical/lookup", () => ({
  getPatientSummary: vi.fn(),
}));

import { requireSession } from "@/server/auth/session";
import { getPatientSummary } from "@/server/clinical/lookup";
import { GET } from "./route";

describe("GET /api/v1/patients/[patientId]/summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireSession).mockRejectedValueOnce(new ApiError("UNAUTHENTICATED"));

    const req = new Request("http://localhost:3000/api/v1/patients/user-asha/summary");
    const res = await GET(req, { params: Promise.resolve({ patientId: "user-asha" }) });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });

  it("returns 403 CONSENT_REQUIRED when doctor has no active consent", async () => {
    vi.mocked(requireSession).mockResolvedValueOnce({
      id: "user-kavya",
      role: "DOCTOR",
      name: "Dr Kavya Iyer",
      verified: true,
      institutionIds: ["inst-citygen"],
    });
    vi.mocked(getPatientSummary).mockRejectedValueOnce(new ApiError("CONSENT_REQUIRED"));

    const req = new Request("http://localhost:3000/api/v1/patients/user-asha/summary");
    const res = await GET(req, { params: Promise.resolve({ patientId: "user-asha" }) });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("CONSENT_REQUIRED");
  });

  it("returns 200 with SummaryDTO when authorized", async () => {
    vi.mocked(requireSession).mockResolvedValueOnce({
      id: "user-arjun",
      role: "DOCTOR",
      name: "Dr Arjun Rao",
      verified: true,
      institutionIds: ["inst-citygen"],
    });
    const sampleSummary = {
      byInstitution: [
        {
          institutionId: "inst-sunrise",
          institutionName: "Sunrise Multispeciality",
          counts: [{ type: "LAB_REPORT" as const, count: 1 }],
          latestAt: "2026-10-23T03:30:00.000Z",
        },
      ],
    };
    vi.mocked(getPatientSummary).mockResolvedValueOnce(sampleSummary);

    const req = new Request("http://localhost:3000/api/v1/patients/user-asha/summary");
    const res = await GET(req, { params: Promise.resolve({ patientId: "user-asha" }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(sampleSummary);
  });
});
