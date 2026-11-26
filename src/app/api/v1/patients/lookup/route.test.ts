import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/server/http";

vi.mock("@/server/auth/session", () => ({
  requireSession: vi.fn(),
}));

vi.mock("@/server/clinical/lookup", () => ({
  lookupPatient: vi.fn(),
}));

import { requireSession } from "@/server/auth/session";
import { lookupPatient } from "@/server/clinical/lookup";
import { GET } from "./route";

describe("GET /api/v1/patients/lookup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireSession).mockRejectedValueOnce(new ApiError("UNAUTHENTICATED"));

    const req = new Request("http://localhost:3000/api/v1/patients/lookup?abha=91-1000-0000-0001");
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });

  it("returns 403 when patient calls lookup", async () => {
    vi.mocked(requireSession).mockResolvedValueOnce({
      id: "user-asha",
      role: "PATIENT",
      name: "Asha Verma",
      verified: true,
      institutionIds: [],
    });
    vi.mocked(lookupPatient).mockRejectedValueOnce(new ApiError("FORBIDDEN"));

    const req = new Request("http://localhost:3000/api/v1/patients/lookup?abha=91100000000002");
    const res = await GET(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("returns 200 with 3 fields for verified doctor", async () => {
    vi.mocked(requireSession).mockResolvedValueOnce({
      id: "user-kavya",
      role: "DOCTOR",
      name: "Dr Kavya Iyer",
      verified: true,
      institutionIds: ["inst-citygen"],
    });
    vi.mocked(lookupPatient).mockResolvedValueOnce({
      patientId: "user-asha",
      name: "Asha Verma",
      abhaNumberMasked: "XX-XXXX-XXXX-0001",
    });

    const req = new Request("http://localhost:3000/api/v1/patients/lookup?abha=91-1000-0000-0001");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      patientId: "user-asha",
      name: "Asha Verma",
      abhaNumberMasked: "XX-XXXX-XXXX-0001",
    });
    expect(Object.keys(body).sort()).toEqual(["abhaNumberMasked", "name", "patientId"]);
  });

  it("returns 400 when abha format is invalid", async () => {
    vi.mocked(requireSession).mockResolvedValueOnce({
      id: "user-kavya",
      role: "DOCTOR",
      name: "Dr Kavya Iyer",
      verified: true,
      institutionIds: ["inst-citygen"],
    });
    vi.mocked(lookupPatient).mockRejectedValueOnce(new ApiError("VALIDATION_FAILED"));

    const req = new Request("http://localhost:3000/api/v1/patients/lookup?abha=invalid");
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_FAILED");
  });

  it("returns 404 when patient not found", async () => {
    vi.mocked(requireSession).mockResolvedValueOnce({
      id: "user-kavya",
      role: "DOCTOR",
      name: "Dr Kavya Iyer",
      verified: true,
      institutionIds: ["inst-citygen"],
    });
    vi.mocked(lookupPatient).mockRejectedValueOnce(new ApiError("NOT_FOUND"));

    const req = new Request("http://localhost:3000/api/v1/patients/lookup?abha=91-9999-9999-9999");
    const res = await GET(req);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });
});
