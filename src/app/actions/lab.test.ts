import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LabOrder } from "@/generated/prisma/client";
import type { RecordDTO } from "@/contracts/records";
import type { SessionUser } from "@/contracts/shared";
import { uploadLabResult } from "./lab";

vi.mock("@/server/auth/session", () => ({
  requireSession: vi.fn(),
}));

vi.mock("@/server/auth/authorize", () => ({
  authorize: vi.fn(),
}));

vi.mock("@/server/db", () => ({
  db: {
    labOrder: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/server/lab/upload", () => ({
  uploadLabResultRecord: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { authorize } from "@/server/auth/authorize";
import { requireSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { uploadLabResultRecord } from "@/server/lab/upload";

describe("uploadLabResult Server Action", () => {
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

  const sampleRecordDTO: RecordDTO = {
    id: "rec-lab-123",
    patientId: "user-asha",
    institutionId: "inst-precision",
    institutionName: "Precision Diagnostics",
    authorId: "user-precision-desk",
    authorName: "Precision Lab Desk",
    type: "LAB_REPORT",
    title: "Lab report: HbA1c, Lipid Profile",
    summary: "HbA1c: 5.6%",
    occurredAt: "2026-10-21T09:00:00.000Z",
    fileId: "file-obj-123",
    createdAt: "2026-10-21T09:00:00.000Z",
    prescription: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("successfully uploads lab result and revalidates paths", async () => {
    vi.mocked(requireSession).mockResolvedValueOnce(labUser);
    vi.mocked(db.labOrder.findUnique).mockResolvedValueOnce(pendingOrder);
    vi.mocked(authorize).mockResolvedValueOnce({
      allowed: true,
      reason: "ROLE",
    });
    vi.mocked(uploadLabResultRecord).mockResolvedValueOnce(sampleRecordDTO);

    const pdfContent = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4
    const validFile = new File([pdfContent], "report.pdf", { type: "application/pdf" });

    const formData = new FormData();
    formData.append("orderId", "laborder-asha-1");
    formData.append("summary", "HbA1c: 5.6% within normal limits.");
    formData.append("file", validFile);

    const result = await uploadLabResult(formData);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.id).toBe("rec-lab-123");
      expect(result.data.type).toBe("LAB_REPORT");
      expect(result.data.authorId).toBe("user-precision-desk");
    }

    expect(revalidatePath).toHaveBeenCalledWith("/lab");
    expect(revalidatePath).toHaveBeenCalledWith("/patient/records");
    expect(revalidatePath).toHaveBeenCalledWith("/lab/orders/laborder-asha-1");
  });

  it("fails with VALIDATION_FAILED when summary or orderId is missing", async () => {
    vi.mocked(requireSession).mockResolvedValueOnce(labUser);

    const formData = new FormData();
    formData.append("orderId", "laborder-asha-1");
    formData.append("summary", "   "); // Empty whitespace

    const result = await uploadLabResult(formData);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_FAILED");
    }
    expect(uploadLabResultRecord).not.toHaveBeenCalled();
  });

  it("fails with NOT_FOUND when order does not exist", async () => {
    vi.mocked(requireSession).mockResolvedValueOnce(labUser);
    vi.mocked(db.labOrder.findUnique).mockResolvedValueOnce(null);

    const formData = new FormData();
    formData.append("orderId", "laborder-nonexistent");
    formData.append("summary", "Valid summary");

    const result = await uploadLabResult(formData);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  it("fails with NOT_FOUND when order belongs to another laboratory", async () => {
    vi.mocked(requireSession).mockResolvedValueOnce(labUser);
    vi.mocked(db.labOrder.findUnique).mockResolvedValueOnce({
      ...pendingOrder,
      labInstitutionId: "inst-other",
    });
    vi.mocked(authorize).mockResolvedValueOnce({
      allowed: false,
      code: "NOT_FOUND",
      reason: "NOT_OWNER",
    });

    const formData = new FormData();
    formData.append("orderId", "laborder-asha-1");
    formData.append("summary", "Valid summary");

    const result = await uploadLabResult(formData);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  it("fails with CONFLICT when order is already completed", async () => {
    vi.mocked(requireSession).mockResolvedValueOnce(labUser);
    vi.mocked(db.labOrder.findUnique).mockResolvedValueOnce({
      ...pendingOrder,
      status: "COMPLETED",
    });
    vi.mocked(authorize).mockResolvedValueOnce({
      allowed: true,
      reason: "ROLE",
    });

    const formData = new FormData();
    formData.append("orderId", "laborder-asha-1");
    formData.append("summary", "Valid summary");

    const result = await uploadLabResult(formData);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("CONFLICT");
      expect(result.error.message).toContain("already been completed");
    }
  });

  it("fails with FILE_TOO_LARGE when file exceeds 5 MB", async () => {
    vi.mocked(requireSession).mockResolvedValueOnce(labUser);
    vi.mocked(db.labOrder.findUnique).mockResolvedValueOnce(pendingOrder);
    vi.mocked(authorize).mockResolvedValueOnce({
      allowed: true,
      reason: "ROLE",
    });

    const fiveMbPlusOne = 5 * 1024 * 1024 + 1;
    const oversizedFile = new File([new Uint8Array(fiveMbPlusOne)], "oversized.pdf", {
      type: "application/pdf",
    });

    const formData = new FormData();
    formData.append("orderId", "laborder-asha-1");
    formData.append("summary", "Valid summary");
    formData.append("file", oversizedFile);

    const result = await uploadLabResult(formData);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("FILE_TOO_LARGE");
    }
  });

  it("fails with VALIDATION_FAILED when file bytes are not valid PDF/PNG/JPEG", async () => {
    vi.mocked(requireSession).mockResolvedValueOnce(labUser);
    vi.mocked(db.labOrder.findUnique).mockResolvedValueOnce(pendingOrder);
    vi.mocked(authorize).mockResolvedValueOnce({
      allowed: true,
      reason: "ROLE",
    });

    const textFile = new File(["This is plain text not a PDF"], "notes.txt", {
      type: "text/plain",
    });

    const formData = new FormData();
    formData.append("orderId", "laborder-asha-1");
    formData.append("summary", "Valid summary");
    formData.append("file", textFile);

    const result = await uploadLabResult(formData);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_FAILED");
      expect(result.error.message).toContain("Only PDF, PNG, or JPEG");
    }
  });
});
