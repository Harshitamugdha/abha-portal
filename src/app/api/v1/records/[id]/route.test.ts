import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/server/http";

vi.mock("@/server/auth/session", () => ({
  requireSession: vi.fn(),
}));

vi.mock("@/server/records/list", () => ({
  getRecord: vi.fn(),
}));

import { requireSession } from "@/server/auth/session";
import { getRecord } from "@/server/records/list";
import { GET } from "./route";

describe("GET /api/v1/records/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireSession).mockRejectedValueOnce(new ApiError("UNAUTHENTICATED"));

    const req = new Request("http://localhost:3000/api/v1/records/rec-1");
    const res = await GET(req, { params: Promise.resolve({ id: "rec-1" }) });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });

  it("returns 404 when record is not found or not owner", async () => {
    vi.mocked(requireSession).mockResolvedValueOnce({
      id: "user-rohan",
      role: "PATIENT",
      name: "Rohan Mehta",
      verified: true,
      institutionIds: [],
    });
    vi.mocked(getRecord).mockRejectedValueOnce(new ApiError("NOT_FOUND"));

    const req = new Request("http://localhost:3000/api/v1/records/rec-asha-cbc");
    const res = await GET(req, { params: Promise.resolve({ id: "rec-asha-cbc" }) });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns 200 with record data when authorized", async () => {
    vi.mocked(requireSession).mockResolvedValueOnce({
      id: "user-asha",
      role: "PATIENT",
      name: "Asha Verma",
      verified: true,
      institutionIds: [],
    });
    vi.mocked(getRecord).mockResolvedValueOnce({
      id: "rec-asha-cbc",
      patientId: "user-asha",
      institutionId: "inst-citygen",
      institutionName: "City General Hospital",
      authorId: null,
      authorName: null,
      type: "LAB_REPORT",
      title: "Complete blood count",
      summary: "Normal",
      occurredAt: "2026-09-17T06:00:00.000Z",
      fileId: null,
      createdAt: "2026-09-17T06:00:00.000Z",
      prescription: null,
    });

    const req = new Request("http://localhost:3000/api/v1/records/rec-asha-cbc");
    const res = await GET(req, { params: Promise.resolve({ id: "rec-asha-cbc" }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("rec-asha-cbc");
    expect(body.title).toBe("Complete blood count");
  });
});
