import "server-only";
import { Readable } from "node:stream";
import type { SessionUser } from "@/contracts/shared";
import { authorize } from "@/server/auth/authorize";
import { db } from "@/server/db";
import { ApiError } from "@/server/http";
import * as storage from "./storage";

export type FileStreamResult = {
  stream: ReadableStream<Uint8Array>;
  mimeType: string;
  sizeBytes: number;
};

export async function getFileStream(
  user: SessionUser,
  fileId: string,
): Promise<FileStreamResult> {
  const file = await db.fileObject.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      key: true,
      mimeType: true,
      sizeBytes: true,
      record: {
        select: {
          id: true,
          patientId: true,
          type: true,
          authorId: true,
          institutionId: true,
        },
      },
    },
  });

  if (!file || !file.record) {
    throw new ApiError("NOT_FOUND", "File not found");
  }

  const decision = await authorize(user, "file:read", {
    kind: "record",
    record: {
      id: file.record.id,
      patientId: file.record.patientId,
      type: file.record.type,
      authorId: file.record.authorId,
      institutionId: file.record.institutionId,
    },
  });

  if (!decision.allowed) {
    throw new ApiError(decision.code);
  }

  const nodeStream = await storage.stream(file.key);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

  return {
    stream: webStream,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
  };
}
