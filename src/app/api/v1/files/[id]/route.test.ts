import { Readable } from "node:stream";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/server/http";

vi.mock("@/server/auth/session", () => ({
  requireSession: vi.fn(),
}));

vi.mock("@/server/records/stream", () => ({
  getFileStream: vi.fn(),
}));

import { requireSession } from "@/server/auth/session";
import { getFileStream } from "@/server/records/stream";
import { GET } from "./route";

describe("GET /api/v1/files/[id] route handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireSession).mockRejectedValueOnce(new ApiError("UNAUTHENTICATED"));

    const req = new Request("http://localhost:3000/api/v1/files/file-1");
    const res = await GET(req, { params: Promise.resolve({ id: "file-1" }) });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });

  it("returns 404 when file is not found or user is not authorized owner", async () => {
    vi.mocked(requireSession).mockResolvedValueOnce({
      id: "user-rohan",
      role: "PATIENT",
      name: "Rohan Mehta",
      verified: true,
      institutionIds: [],
    });
    vi.mocked(getFileStream).mockRejectedValueOnce(new ApiError("NOT_FOUND"));

    const req = new Request("http://localhost:3000/api/v1/files/file-asha-1");
    const res = await GET(req, { params: Promise.resolve({ id: "file-asha-1" }) });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns 403 when doctor lacks consent or scope is excluded", async () => {
    vi.mocked(requireSession).mockResolvedValueOnce({
      id: "user-kavya",
      role: "DOCTOR",
      name: "Dr Kavya Iyer",
      verified: true,
      institutionIds: ["inst-citygen"],
    });
    vi.mocked(getFileStream).mockRejectedValueOnce(new ApiError("CONSENT_REQUIRED"));

    const req = new Request("http://localhost:3000/api/v1/files/file-asha-1");
    const res = await GET(req, { params: Promise.resolve({ id: "file-asha-1" }) });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("CONSENT_REQUIRED");
  });

  it("streams file with correct Content-Type and Content-Disposition inline", async () => {
    vi.mocked(requireSession).mockResolvedValueOnce({
      id: "user-asha",
      role: "PATIENT",
      name: "Asha Verma",
      verified: true,
      institutionIds: [],
    });

    const webStream = Readable.toWeb(
      Readable.from([Buffer.from("%PDF-1.4 file content")]),
    ) as ReadableStream<Uint8Array>;
    vi.mocked(getFileStream).mockResolvedValueOnce({
      stream: webStream,
      mimeType: "application/pdf",
      sizeBytes: 23,
    });

    const req = new Request("http://localhost:3000/api/v1/files/file-asha-1");
    const res = await GET(req, { params: Promise.resolve({ id: "file-asha-1" }) });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toBe("inline");
    expect(res.headers.get("Content-Length")).toBe("23");

    const text = await res.text();
    expect(text).toBe("%PDF-1.4 file content");
  });
});
