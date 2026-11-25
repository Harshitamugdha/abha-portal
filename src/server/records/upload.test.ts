import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionUser } from "@/contracts/shared";
import { createDocumentRecord } from "./upload";

vi.mock("@/server/auth/authorize", () => ({
  authorize: vi.fn(),
}));

vi.mock("@/server/db", () => ({
  db: {
    $transaction: vi.fn(),
  },
}));

vi.mock("./storage", () => ({
  put: vi.fn(),
}));

import { authorize } from "@/server/auth/authorize";
import { db } from "@/server/db";
import * as storage from "./storage";

describe("upload data function: createDocumentRecord", () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("a non-patient gets FORBIDDEN", async () => {
    vi.mocked(authorize).mockResolvedValueOnce({
      allowed: false,
      code: "FORBIDDEN",
      reason: "WRONG_ROLE",
    });

    await expect(
      createDocumentRecord(doctorUser, {
        upload: {
          title: "Doctor attempted upload",
          occurredAt: "2026-10-28T12:00:00.000Z",
          institutionId: "inst-citygen",
        },
        buffer: Buffer.from("%PDF-1.4 test"),
        mimeType: "application/pdf",
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    expect(storage.put).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("one transaction creates both rows with authorId null and type DOCUMENT", async () => {
    vi.mocked(authorize).mockResolvedValueOnce({
      allowed: true,
      reason: "OWNER",
    });

    vi.mocked(storage.put).mockResolvedValueOnce("file-key-123.pdf");

    const mockTx = {
      fileObject: {
        create: vi.fn().mockResolvedValueOnce({
          id: "file-obj-1",
          key: "file-key-123.pdf",
          mimeType: "application/pdf",
          sizeBytes: 15,
          uploadedBy: "user-asha",
        }),
      },
      healthRecord: {
        create: vi.fn().mockResolvedValueOnce({
          id: "rec-new-doc",
          patientId: "user-asha",
          institutionId: "inst-sunrise",
          authorId: null,
          type: "DOCUMENT",
          title: "Scanned Discharge Summary",
          summary: null,
          occurredAt: new Date("2026-10-28T06:30:00.000Z"),
          fileId: "file-obj-1",
          createdAt: new Date("2026-10-28T06:30:00.000Z"),
          institution: { name: "Sunrise Multispeciality" },
          author: null,
          prescription: null,
        }),
      },
    };

    vi.mocked(db.$transaction).mockImplementationOnce(async (cb: unknown) => {
      return (cb as (tx: unknown) => Promise<unknown>)(mockTx);
    });

    const dto = await createDocumentRecord(patientUser, {
      upload: {
        title: "Scanned Discharge Summary",
        occurredAt: "2026-10-28T06:30:00.000Z",
        institutionId: "inst-sunrise",
      },
      buffer: Buffer.from("%PDF-1.4 content"),
      mimeType: "application/pdf",
    });

    expect(authorize).toHaveBeenCalledWith(patientUser, "record:create:self", {
      kind: "patient",
      patientId: "user-asha",
    });

    expect(storage.put).toHaveBeenCalledWith(Buffer.from("%PDF-1.4 content"), "application/pdf");
    expect(db.$transaction).toHaveBeenCalledTimes(1);

    expect(mockTx.fileObject.create).toHaveBeenCalledWith({
      data: {
        key: "file-key-123.pdf",
        mimeType: "application/pdf",
        sizeBytes: 16,
        uploadedBy: "user-asha",
      },
    });

    expect(mockTx.healthRecord.create).toHaveBeenCalledWith({
      data: {
        patientId: "user-asha",
        institutionId: "inst-sunrise",
        authorId: null,
        type: "DOCUMENT",
        title: "Scanned Discharge Summary",
        occurredAt: new Date("2026-10-28T06:30:00.000Z"),
        fileId: "file-obj-1",
      },
      select: expect.anything(),
    });

    expect(dto.id).toBe("rec-new-doc");
    expect(dto.authorId).toBeNull();
    expect(dto.authorName).toBeNull();
    expect(dto.type).toBe("DOCUMENT");
    expect(dto.institutionName).toBe("Sunrise Multispeciality");
  });
});
