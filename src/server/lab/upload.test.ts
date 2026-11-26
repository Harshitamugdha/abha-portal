import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LabOrder } from "@/generated/prisma/client";
import type { SessionUser } from "@/contracts/shared";
import { uploadLabResultRecord } from "./upload";

vi.mock("@/server/auth/authorize", () => ({
  authorize: vi.fn(),
}));

vi.mock("@/server/db", () => ({
  db: {
    labOrder: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/server/records/storage", () => ({
  put: vi.fn(),
  getFilePath: vi.fn().mockReturnValue("/mock/path/file.pdf"),
  MAX_FILE_SIZE: 5 * 1024 * 1024,
}));

vi.mock("node:fs", () => ({
  default: {
    promises: {
      unlink: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

import fs from "node:fs";
import { authorize } from "@/server/auth/authorize";
import { db } from "@/server/db";
import * as storage from "@/server/records/storage";

describe("uploadLabResultRecord", () => {
  const labUser: SessionUser = {
    id: "user-precision-desk",
    role: "LAB",
    name: "Precision Lab Desk",
    verified: true,
    institutionIds: ["inst-precision"],
  };

  const pendingOrder: LabOrder = {
    id: "laborder-asha-1",
    patientId: "user-asha",
    orderedById: "user-arjun",
    labInstitutionId: "inst-precision",
    tests: ["HbA1c", "Lipid Profile"],
    status: "PENDING",
    resultRecordId: null,
    createdAt: new Date("2026-10-20T10:00:00.000Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("another lab's order gives NOT_FOUND", async () => {
    vi.mocked(db.labOrder.findUnique).mockResolvedValueOnce(pendingOrder);
    vi.mocked(authorize).mockResolvedValueOnce({
      allowed: false,
      code: "NOT_FOUND",
      reason: "NOT_OWNER",
    });

    const differentLabUser: SessionUser = {
      id: "user-other-lab",
      role: "LAB",
      name: "Other Lab Desk",
      verified: true,
      institutionIds: ["inst-other"],
    };

    await expect(
      uploadLabResultRecord(differentLabUser, {
        orderId: "laborder-asha-1",
        summary: "HbA1c: 5.6% normal",
        buffer: Buffer.from("%PDF-1.4 test"),
        mimeType: "application/pdf",
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    expect(storage.put).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("a second upload gives CONFLICT when order is already completed", async () => {
    const completedOrder: LabOrder = {
      ...pendingOrder,
      status: "COMPLETED",
      resultRecordId: "rec-existing-1",
    };

    vi.mocked(db.labOrder.findUnique).mockResolvedValueOnce(completedOrder);
    vi.mocked(authorize).mockResolvedValueOnce({
      allowed: true,
      reason: "ROLE",
    });

    await expect(
      uploadLabResultRecord(labUser, {
        orderId: "laborder-asha-1",
        summary: "Second upload attempt",
        buffer: Buffer.from("%PDF-1.4 test"),
        mimeType: "application/pdf",
      }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });

    expect(storage.put).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("a second upload gives CONFLICT when atomic updateMany finds 0 rows", async () => {
    vi.mocked(db.labOrder.findUnique).mockResolvedValueOnce(pendingOrder);
    vi.mocked(authorize).mockResolvedValueOnce({
      allowed: true,
      reason: "ROLE",
    });
    vi.mocked(storage.put).mockResolvedValueOnce("file-key-1.pdf");

    const mockTx = {
      labOrder: {
        updateMany: vi.fn().mockResolvedValueOnce({ count: 0 }),
      },
      fileObject: {
        create: vi.fn(),
      },
      healthRecord: {
        create: vi.fn(),
      },
    };

    vi.mocked(db.$transaction).mockImplementationOnce(async (cb: unknown) => {
      return (cb as (tx: unknown) => Promise<unknown>)(mockTx);
    });

    await expect(
      uploadLabResultRecord(labUser, {
        orderId: "laborder-asha-1",
        summary: "Race condition attempt",
        buffer: Buffer.from("%PDF-1.4 test"),
        mimeType: "application/pdf",
      }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });

    expect(mockTx.fileObject.create).not.toHaveBeenCalled();
    expect(mockTx.healthRecord.create).not.toHaveBeenCalled();
  });

  it("if a step inside the transaction fails nothing is saved", async () => {
    vi.mocked(db.labOrder.findUnique).mockResolvedValueOnce(pendingOrder);
    vi.mocked(authorize).mockResolvedValueOnce({
      allowed: true,
      reason: "ROLE",
    });
    vi.mocked(storage.put).mockResolvedValueOnce("file-key-failed.pdf");

    const mockTx = {
      labOrder: {
        updateMany: vi.fn().mockResolvedValueOnce({ count: 1 }),
      },
      fileObject: {
        create: vi.fn().mockRejectedValueOnce(new Error("Database disk full")),
      },
      healthRecord: {
        create: vi.fn(),
      },
    };

    vi.mocked(db.$transaction).mockImplementationOnce(async (cb: unknown) => {
      return (cb as (tx: unknown) => Promise<unknown>)(mockTx);
    });

    await expect(
      uploadLabResultRecord(labUser, {
        orderId: "laborder-asha-1",
        summary: "Failing step",
        buffer: Buffer.from("%PDF-1.4 test"),
        mimeType: "application/pdf",
      }),
    ).rejects.toThrow("Database disk full");

    expect(fs.promises.unlink).toHaveBeenCalledWith("/mock/path/file.pdf");
    expect(mockTx.healthRecord.create).not.toHaveBeenCalled();
  });

  it("the record has the right authorId and institutionId", async () => {
    vi.mocked(db.labOrder.findUnique).mockResolvedValueOnce(pendingOrder);
    vi.mocked(authorize).mockResolvedValueOnce({
      allowed: true,
      reason: "ROLE",
    });
    vi.mocked(storage.put).mockResolvedValueOnce("file-key-success.pdf");

    const mockTx = {
      labOrder: {
        updateMany: vi.fn().mockResolvedValueOnce({ count: 1 }),
        update: vi.fn().mockResolvedValueOnce({
          ...pendingOrder,
          status: "COMPLETED",
          resultRecordId: "rec-lab-123",
        }),
      },
      fileObject: {
        create: vi.fn().mockResolvedValueOnce({
          id: "file-obj-123",
          key: "file-key-success.pdf",
          mimeType: "application/pdf",
          sizeBytes: 13,
          uploadedBy: labUser.id,
        }),
      },
      healthRecord: {
        create: vi.fn().mockResolvedValueOnce({
          id: "rec-lab-123",
          patientId: "user-asha",
          institutionId: "inst-precision",
          authorId: labUser.id,
          type: "LAB_REPORT",
          title: "Lab report: HbA1c, Lipid Profile",
          summary: "HbA1c: 5.6% within normal limits.",
          occurredAt: new Date("2026-10-21T09:00:00.000Z"),
          fileId: "file-obj-123",
          createdAt: new Date("2026-10-21T09:00:00.000Z"),
          institution: { name: "Precision Diagnostics" },
          author: { name: "Precision Lab Desk" },
          prescription: null,
        }),
      },
    };

    vi.mocked(db.$transaction).mockImplementationOnce(async (cb: unknown) => {
      return (cb as (tx: unknown) => Promise<unknown>)(mockTx);
    });

    const record = await uploadLabResultRecord(labUser, {
      orderId: "laborder-asha-1",
      summary: "HbA1c: 5.6% within normal limits.",
      buffer: Buffer.from("%PDF-1.4 test"),
      mimeType: "application/pdf",
    });

    expect(mockTx.labOrder.updateMany).toHaveBeenCalledWith({
      where: {
        id: "laborder-asha-1",
        status: "PENDING",
      },
      data: {
        status: "COMPLETED",
      },
    });

    expect(mockTx.fileObject.create).toHaveBeenCalledWith({
      data: {
        key: "file-key-success.pdf",
        mimeType: "application/pdf",
        sizeBytes: 13,
        uploadedBy: labUser.id,
      },
    });

    expect(mockTx.healthRecord.create).toHaveBeenCalledWith({
      data: {
        patientId: "user-asha",
        institutionId: "inst-precision",
        authorId: labUser.id,
        type: "LAB_REPORT",
        title: "Lab report: HbA1c, Lipid Profile",
        summary: "HbA1c: 5.6% within normal limits.",
        occurredAt: expect.any(Date),
        fileId: "file-obj-123",
      },
      select: expect.anything(),
    });

    expect(mockTx.labOrder.update).toHaveBeenCalledWith({
      where: { id: "laborder-asha-1" },
      data: {
        resultRecordId: "rec-lab-123",
      },
    });

    expect(record.id).toBe("rec-lab-123");
    expect(record.authorId).toBe(labUser.id);
    expect(record.institutionId).toBe("inst-precision");
    expect(record.type).toBe("LAB_REPORT");
    expect(record.summary).toBe("HbA1c: 5.6% within normal limits.");
  });
});
