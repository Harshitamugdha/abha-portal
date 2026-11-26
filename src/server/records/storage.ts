import "server-only";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ApiError } from "@/server/http";

export type AllowedMimeType = "application/pdf" | "image/png" | "image/jpeg";

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function detectMime(bytes: Uint8Array | Buffer): AllowedMimeType | null {
  if (!bytes || bytes.length < 3) {
    return null;
  }

  // PDF: %PDF- (0x25 0x50 0x44 0x46 0x2D)
  if (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  ) {
    return "application/pdf";
  }

  // PNG: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  // JPEG: 0xFF 0xD8 0xFF
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }

  return null;
}

export function getStorageDir(): string {
  return process.env.FILE_STORAGE_DIR || path.join(process.cwd(), ".uploads");
}

export function getFilePath(key: string): string {
  // Prevent directory traversal
  const safeKey = path.basename(key);
  return path.join(getStorageDir(), safeKey);
}

export async function put(buffer: Buffer | Uint8Array, mime: string): Promise<string> {
  const dir = getStorageDir();
  await fs.promises.mkdir(dir, { recursive: true });

  const ext = mime === "application/pdf" ? "pdf" : mime === "image/png" ? "png" : "jpg";
  const key = `${randomUUID()}.${ext}`;
  const filePath = path.join(dir, key);

  await fs.promises.writeFile(filePath, buffer);
  return key;
}

export async function stream(key: string): Promise<fs.ReadStream> {
  const filePath = getFilePath(key);
  try {
    await fs.promises.stat(filePath);
  } catch {
    throw new ApiError("NOT_FOUND", "File not found in storage");
  }

  return fs.createReadStream(filePath);
}
