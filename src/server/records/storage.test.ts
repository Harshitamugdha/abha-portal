import { beforeEach, describe, expect, it, vi } from "vitest";

const files = new Map<string, Uint8Array>();

vi.mock("@/server/db", () => ({
  db: {
    storedFile: {
      create: vi.fn(async ({ data }: { data: { key: string; data: Uint8Array } }) => {
        files.set(data.key, data.data);
        return data;
      }),
      findUnique: vi.fn(async ({ where }: { where: { key: string } }) => {
        const data = files.get(where.key);
        if (!data) {
          return null;
        }
        return { key: where.key, data: data };
      }),
      deleteMany: vi.fn(async ({ where }: { where: { key: string } }) => {
        const existed = files.delete(where.key);
        return { count: existed ? 1 : 0 };
      }),
    },
  },
}));

import { detectMime, put, remove, stream } from "./storage";

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

  describe("storage put/stream round trip in the database", () => {
    beforeEach(() => {
      files.clear();
    });

    async function readAll(key: string) {
      const readStream = await stream(key);
      const chunks: Buffer[] = [];
      for await (const chunk of readStream) {
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    }

    it("puts a file and streams it back matching the original content exactly", async () => {
      const testContent = Buffer.from("%PDF-1.4 Sample medical report document content %%EOF");
      const key = await put(testContent, "application/pdf");

      expect(key.endsWith(".pdf")).toBe(true);
      expect(await readAll(key)).toEqual(testContent);
    });

    it("gives png and jpeg files the right extension", async () => {
      expect((await put(Buffer.from([1, 2, 3]), "image/png")).endsWith(".png")).toBe(true);
      expect((await put(Buffer.from([1, 2, 3]), "image/jpeg")).endsWith(".jpg")).toBe(true);
    });

    it("throws NOT_FOUND when streaming a key that doesn't exist", async () => {
      await expect(stream("non-existent-file.pdf")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("remove deletes the file, and removing a missing key doesn't throw", async () => {
      const key = await put(Buffer.from("%PDF-1.4"), "application/pdf");
      await remove(key);

      await expect(stream(key)).rejects.toMatchObject({ code: "NOT_FOUND" });
      await expect(remove(key)).resolves.toBeUndefined();
    });
  });
});
