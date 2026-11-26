import { Readable } from "node:stream";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionUser } from "@/contracts/shared";
import { getFileStream } from "./stream";

vi.mock("@/server/auth/authorize", () => ({
  authorize: vi.fn(),
}));

vi.mock("@/server/db", () => ({
  db: {
    fileObject: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("./storage", () => ({
  stream: vi.fn(),
}));

import { authorize } from "@/server/auth/authorize";
import { db } from "@/server/db";
import * as storage from "./storage";

describe("getFileStream data function", () => {
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

  const sampleFileRecord = {
    id: "file-obj-1",
    key: "file-123.pdf",
    mimeType: "application/pdf",
    sizeBytes: 2048,
    record: {
      id: "rec-doc-1",
      patientId: "user-asha",
      type: "DOCUMENT" as const,
      authorId: null,
      institutionId: "inst-sunrise",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no owning record gives NOT_FOUND", async () => {
    vi.mocked(db.fileObject.findUnique).mockResolvedValueOnce(null);

    await expect(getFileStream(patientUser, "missing-file-id")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    expect(authorize).not.toHaveBeenCalled();
    expect(storage.stream).not.toHaveBeenCalled();
  });

  it("file without associated record gives NOT_FOUND", async () => {
    vi.mocked(db.fileObject.findUnique).mockResolvedValueOnce({
      id: "file-orphaned",
      key: "orphaned.pdf",
      mimeType: "application/pdf",
      sizeBytes: 100,
      record: null,
    } as never);

    await expect(getFileStream(patientUser, "file-orphaned")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    expect(authorize).not.toHaveBeenCalled();
    expect(storage.stream).not.toHaveBeenCalled();
  });

  it("a denied call never reaches stream", async () => {
    vi.mocked(db.fileObject.findUnique).mockResolvedValueOnce(sampleFileRecord as never);
    vi.mocked(authorize).mockResolvedValueOnce({
      allowed: false,
      code: "CONSENT_REQUIRED",
      reason: "NO_ACTIVE_CONSENT",
    });

    await expect(getFileStream(doctorUser, "file-obj-1")).rejects.toMatchObject({
      code: "CONSENT_REQUIRED",
    });

    expect(authorize).toHaveBeenCalledWith(doctorUser, "file:read", {
      kind: "record",
      record: {
        id: "rec-doc-1",
        patientId: "user-asha",
        type: "DOCUMENT",
        authorId: null,
        institutionId: "inst-sunrise",
      },
    });

    expect(storage.stream).not.toHaveBeenCalled();
  });

  it("returns correct Content-Type, sizeBytes, and stream when authorized", async () => {
    vi.mocked(db.fileObject.findUnique).mockResolvedValueOnce(sampleFileRecord as never);
    vi.mocked(authorize).mockResolvedValueOnce({
      allowed: true,
      reason: "OWNER",
    });

    const mockNodeStream = Readable.from(["%PDF-1.4 file content"]);
    vi.mocked(storage.stream).mockResolvedValueOnce(mockNodeStream as never);

    const result = await getFileStream(patientUser, "file-obj-1");

    expect(result.mimeType).toBe("application/pdf");
    expect(result.sizeBytes).toBe(2048);
    expect(result.stream).toBeDefined();
    expect(storage.stream).toHaveBeenCalledWith("file-123.pdf");
  });
});
