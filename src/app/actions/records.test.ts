import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseIstDate } from "@/server/records/params";
import { uploadDocument } from "./records";

vi.mock("@/server/auth/session", () => ({
  requireSession: vi.fn(),
}));

vi.mock("@/server/records/upload", () => ({
  createDocumentRecord: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { requireSession } from "@/server/auth/session";
import { createDocumentRecord } from "@/server/records/upload";

describe("uploadDocument Server Action", () => {
  const patientUser = {
    id: "user-asha",
    role: "PATIENT" as const,
    name: "Asha Verma",
    verified: true,
    institutionIds: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("parseIstDate", () => {
    it("converts YYYY-MM-DD in IST into valid UTC ISO datetime", () => {
      const iso = parseIstDate("2026-10-28");
      // 2026-10-28T12:00:00+05:30 -> 2026-10-28T06:30:00.000Z
      expect(iso).toBe("2026-10-28T06:30:00.000Z");
    });

    it("converts YYYY-MM-DDTHH:mm into valid UTC ISO datetime", () => {
      const iso = parseIstDate("2026-10-28T14:30");
      // 14:30 IST (+5:30) -> 09:00 UTC
      expect(iso).toBe("2026-10-28T09:00:00.000Z");
    });
  });

  describe("file size validation", () => {
    it("5 MB + 1 byte fails with FILE_TOO_LARGE", async () => {
      vi.mocked(requireSession).mockResolvedValueOnce(patientUser);

      const fiveMbPlusOne = 5 * 1024 * 1024 + 1; // 5,242,881 bytes
      const bigFile = new File([new Uint8Array(fiveMbPlusOne)], "large.pdf", {
        type: "application/pdf",
      });

      const fd = new FormData();
      fd.append("title", "Large Document");
      fd.append("occurredAt", "2026-10-28");
      fd.append("institutionId", "inst-citygen");
      fd.append("file", bigFile);

      const res = await uploadDocument(fd);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe("FILE_TOO_LARGE");
        expect(res.error.message).toContain("5 MB");
      }
      expect(createDocumentRecord).not.toHaveBeenCalled();
    });

    it("exactly 5 MB passes size check", async () => {
      vi.mocked(requireSession).mockResolvedValueOnce(patientUser);
      vi.mocked(createDocumentRecord).mockResolvedValueOnce({
        id: "rec-5mb",
        patientId: "user-asha",
        institutionId: "inst-citygen",
        institutionName: "City General Hospital",
        authorId: null,
        authorName: null,
        type: "DOCUMENT",
        title: "Exact 5MB Document",
        summary: null,
        occurredAt: "2026-10-28T06:30:00.000Z",
        fileId: "file-5mb",
        createdAt: "2026-10-28T06:30:00.000Z",
        prescription: null,
      });

      const fiveMb = 5 * 1024 * 1024; // 5,242,880 bytes
      const buffer = new Uint8Array(fiveMb);
      // Valid PDF magic header: %PDF-
      buffer[0] = 0x25;
      buffer[1] = 0x50;
      buffer[2] = 0x44;
      buffer[3] = 0x46;
      buffer[4] = 0x2d;

      const exactFile = new File([buffer], "exact.pdf", {
        type: "application/pdf",
      });

      const fd = new FormData();
      fd.append("title", "Exact 5MB Document");
      fd.append("occurredAt", "2026-10-28");
      fd.append("institutionId", "inst-citygen");
      fd.append("file", exactFile);

      const res = await uploadDocument(fd);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.id).toBe("rec-5mb");
      }
      expect(createDocumentRecord).toHaveBeenCalledTimes(1);
    });
  });

  describe("mime validation and rejection", () => {
    it("rejects text file renamed .pdf", async () => {
      vi.mocked(requireSession).mockResolvedValueOnce(patientUser);

      const fakePdf = new File(
        [Buffer.from("This is plain text and not a genuine PDF document.")],
        "malicious.pdf",
        { type: "application/pdf" },
      );

      const fd = new FormData();
      fd.append("title", "Fake PDF Document");
      fd.append("occurredAt", "2026-10-28");
      fd.append("institutionId", "inst-citygen");
      fd.append("file", fakePdf);

      const res = await uploadDocument(fd);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe("VALIDATION_FAILED");
        expect(res.error.message).toContain("Only PDF, PNG, or JPEG");
      }
      expect(createDocumentRecord).not.toHaveBeenCalled();
    });

    it("rejects unauthenticated caller", async () => {
      const { ApiError } = await import("@/server/http");
      vi.mocked(requireSession).mockRejectedValueOnce(new ApiError("UNAUTHENTICATED"));

      const fd = new FormData();
      const res = await uploadDocument(fd);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe("UNAUTHENTICATED");
      }
    });
  });
});
