import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/server/http";

vi.mock("@/server/auth/session", () => ({
  requireSession: vi.fn(),
}));

vi.mock("@/server/records/list", () => ({
  listPatientRecords: vi.fn(),
}));

import { requireSession } from "@/server/auth/session";
import { listPatientRecords } from "@/server/records/list";
import { GET } from "./route";

describe("GET /api/v1/patients/[patientId]/records", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireSession).mockRejectedValueOnce(new ApiError("UNAUTHENTICATED"));

    const req = new Request("http://localhost:3000/api/v1/patients/user-asha/records");
    const res = await GET(req, { params: Promise.resolve({ patientId: "user-asha" }) });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });

  it("returns 403 when CONSENT_REQUIRED", async () => {
    vi.mocked(requireSession).mockResolvedValueOnce({
      id: "user-kavya",
      role: "DOCTOR",
      name: "Dr Kavya Iyer",
      verified: true,
      institutionIds: ["inst-citygen"],
    });
    vi.mocked(listPatientRecords).mockRejectedValueOnce(new ApiError("CONSENT_REQUIRED"));

    const req = new Request("http://localhost:3000/api/v1/patients/user-asha/records");
    const res = await GET(req, { params: Promise.resolve({ patientId: "user-asha" }) });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("CONSENT_REQUIRED");
  });

  it("returns 200 with Page<RecordDTO> when authorized", async () => {
    vi.mocked(requireSession).mockResolvedValueOnce({
      id: "user-asha",
      role: "PATIENT",
      name: "Asha Verma",
      verified: true,
      institutionIds: [],
    });
    vi.mocked(listPatientRecords).mockResolvedValueOnce({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
    });

    const req = new Request("http://localhost:3000/api/v1/patients/user-asha/records?page=1");
    const res = await GET(req, { params: Promise.resolve({ patientId: "user-asha" }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
    });
  });
});
