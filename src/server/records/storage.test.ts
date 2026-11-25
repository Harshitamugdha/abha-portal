import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { detectMime, getStorageDir, put, stream } from "./storage";

describe("storage and mime detection", () => {
  describe("detectMime", () => {
    it("accepts real PDF bytes", () => {
      const pdfBytes = Buffer.from("%PDF-1.4\n%test content\n%%EOF");
      expect(detectMime(pdfBytes)).toBe("application/pdf");
    });

    it("accepts real PNG bytes", () => {
      const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
      expect(detectMime(pngBytes)).toBe("image/png");
    });

    it("accepts real JPEG bytes", () => {
      const jpegBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
      expect(detectMime(jpegBytes)).toBe("image/jpeg");
    });

    it("rejects text renamed .pdf", () => {
      const fakePdf = Buffer.from("Hello, this is just plain text, not a real PDF file.");
      expect(detectMime(fakePdf)).toBeNull();
    });

    it("rejects empty or very short buffers", () => {
      expect(detectMime(Buffer.from([]))).toBeNull();
      expect(detectMime(Buffer.from([0x25, 0x50]))).toBeNull();
    });
  });

  describe("storage put/stream round trip in a temp folder", () => {
    let tempDir: string;
    const originalEnv = process.env.FILE_STORAGE_DIR;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "aabha-storage-test-"));
      process.env.FILE_STORAGE_DIR = tempDir;
    });

    afterEach(() => {
      process.env.FILE_STORAGE_DIR = originalEnv;
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("puts file and streams it back matching original content exactly", async () => {
      expect(getStorageDir()).toBe(tempDir);

      const testContent = Buffer.from("%PDF-1.4\nSample medical report document content\n%%EOF");
      const key = await put(testContent, "application/pdf");

      expect(typeof key).toBe("string");
      expect(key.endsWith(".pdf")).toBe(true);

      const readStream = await stream(key);
      const chunks: Buffer[] = [];
      for await (const chunk of readStream) {
        chunks.push(Buffer.from(chunk));
      }
      const retrievedContent = Buffer.concat(chunks);

      expect(retrievedContent).toEqual(testContent);
    });

    it("throws NOT_FOUND when streaming non-existent key", async () => {
      await expect(stream("non-existent-file.pdf")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });
});
